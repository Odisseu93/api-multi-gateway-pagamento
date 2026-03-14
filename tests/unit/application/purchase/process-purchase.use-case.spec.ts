import { test } from '@japa/runner'
import { InMemoryDatabase } from '#infrastructure/database/in-memory/in-memory-database'
import { InMemoryProductRepository } from '#infrastructure/repositories/in-memory/in-memory-product.repository'
import { InMemoryClientRepository } from '#infrastructure/repositories/in-memory/in-memory-client.repository'
import { InMemoryGatewayRepository } from '#infrastructure/repositories/in-memory/in-memory-gateway.repository'
import { InMemoryTransactionRepository } from '#infrastructure/repositories/in-memory/in-memory-transaction.repository'
import { ProcessPurchaseUseCase } from '#application/use-cases/purchase/process-purchase.use-case'
import { Money } from '#domain/value-objects/money.vo'
import type {
  IPaymentGatewayAdapter,
  ChargeInput,
  ChargeOutput,
} from '#infrastructure/gateways/contracts/i-payment-gateway.adapter'

// ── Fake Gateway Adapter ──────────────────────────────────────────────────────

function makeSuccessAdapter(externalId = 'ext-001'): IPaymentGatewayAdapter {
  return {
    async charge(_input: ChargeInput): Promise<ChargeOutput> {
      return { externalId, status: 'paid' }
    },
    async refund(_externalId: string): Promise<boolean> {
      return true
    },
  }
}

function makeFailAdapter(): IPaymentGatewayAdapter {
  return {
    async charge(_input: ChargeInput): Promise<ChargeOutput> {
      return { externalId: '', status: 'failed' }
    },
    async refund(_externalId: string): Promise<boolean> {
      return false
    },
  }
}

// ── Fake Gateway Adapter Factory ──────────────────────────────────────────────

function makeAdapterFactory(map: Record<string, IPaymentGatewayAdapter>): {
  create: (type: string) => IPaymentGatewayAdapter
} {
  return { create: (type: string) => map[type] }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

test.group('ProcessPurchaseUseCase', (group) => {
  let db: InMemoryDatabase
  let productRepo: InMemoryProductRepository
  let clientRepo: InMemoryClientRepository
  let gatewayRepo: InMemoryGatewayRepository
  let transactionRepo: InMemoryTransactionRepository

  group.each.setup(async () => {
    db = new InMemoryDatabase()
    productRepo = new InMemoryProductRepository(db)
    clientRepo = new InMemoryClientRepository(db)
    gatewayRepo = new InMemoryGatewayRepository(db)
    transactionRepo = new InMemoryTransactionRepository(db)

    // Seed products
    db.insert('products', {
      name: 'Widget',
      amount: Money.fromCents(1000),
      isActive: true,
      createdAt: new Date(),
      updatedAt: null,
      deletedAt: null,
    })
    db.insert('products', {
      name: 'Gadget',
      amount: Money.fromCents(2000),
      isActive: true,
      createdAt: new Date(),
      updatedAt: null,
      deletedAt: null,
    })

    // Seed gateways (priority 1 tried first)
    db.insert('gateways', {
      name: 'Gateway 1',
      type: 'gateway_1',
      isActive: true,
      priority: 1,
      createdAt: new Date(),
      updatedAt: null,
    })
    db.insert('gateways', {
      name: 'Gateway 2',
      type: 'gateway_2',
      isActive: true,
      priority: 2,
      createdAt: new Date(),
      updatedAt: null,
    })
  })

  group.each.teardown(() => {
    db.clearAll()
  })

  function buildUseCase(adapterFactory: { create: (type: string) => IPaymentGatewayAdapter }) {
    return new ProcessPurchaseUseCase(
      productRepo,
      clientRepo,
      gatewayRepo,
      transactionRepo,
      adapterFactory
    )
  }

  const defaultInput = {
    client: { name: 'John Doe', email: 'john@example.com' },
    items: [{ productId: 1, quantity: 2 }],
    card: { number: '4111111111111111', cvv: '123' },
  }

  // ── Scenario 1: charges first (highest-priority) gateway on success ─────────

  test('should charge the gateway with the highest priority when it succeeds', async ({
    assert,
  }) => {
    const factory = makeAdapterFactory({
      gateway_1: makeSuccessAdapter('gw1-ext'),
      gateway_2: makeSuccessAdapter('gw2-ext'),
    })

    const useCase = buildUseCase(factory)
    const result = await useCase.execute(defaultInput)

    // Gateway 1 (priority=1) should have been used
    assert.equal(result.externalId, 'gw1-ext')
    assert.equal(result.status, 'paid')
  })

  // ── Scenario 2: falls back to second gateway when first fails ─────────────

  test('should fallback to second gateway when first fails', async ({ assert }) => {
    const factory = makeAdapterFactory({
      gateway_1: makeFailAdapter(),
      gateway_2: makeSuccessAdapter('gw2-ext'),
    })
    const useCase = buildUseCase(factory)
    const result = await useCase.execute(defaultInput)

    assert.equal(result.externalId, 'gw2-ext')
    assert.equal(result.status, 'paid')
  })

  // ── Scenario 3: error when all gateways fail ──────────────────────────────

  test('should throw AppError when all gateways fail', async ({ assert }) => {
    const factory = makeAdapterFactory({
      gateway_1: makeFailAdapter(),
      gateway_2: makeFailAdapter(),
    })
    const useCase = buildUseCase(factory)

    await assert.rejects(() => useCase.execute(defaultInput), /gateway/i)
  })

  // ── Scenario 4: totalAmount calculated correctly ───────────────────────────

  test('should calculate totalAmount correctly from unit_amount × quantity', async ({ assert }) => {
    const factory = makeAdapterFactory({
      gateway_1: makeSuccessAdapter(),
      gateway_2: makeSuccessAdapter(),
    })
    const useCase = buildUseCase(factory)

    // 2 × Widget (1000) + 1 × Gadget (2000) = 4000
    const result = await useCase.execute({
      client: { name: 'John Doe', email: 'john@example.com' },
      items: [
        { productId: 1, quantity: 2 },
        { productId: 2, quantity: 1 },
      ],
      card: { number: '4111111111111111', cvv: '123' },
    })

    assert.equal(result.totalAmount, 4000)
  })

  // ── Scenario 5: creates client if not exists; reuses if already exists ─────

  test('should reuse existing client when email matches', async ({ assert }) => {
    const factory = makeAdapterFactory({ gateway_1: makeSuccessAdapter() })
    const useCase = buildUseCase(factory)

    await useCase.execute(defaultInput)
    await useCase.execute(defaultInput)

    const allClients = await clientRepo.findAll()
    assert.lengthOf(allClients, 1) // should NOT have created a second client
  })

  test('should create a new client when email does not exist yet', async ({ assert }) => {
    const factory = makeAdapterFactory({ gateway_1: makeSuccessAdapter() })
    const useCase = buildUseCase(factory)

    await useCase.execute({
      client: { name: 'Jane', email: 'jane@example.com' },
      items: [{ productId: 1, quantity: 1 }],
      card: { number: '4111111111111111', cvv: '123' },
    })

    const client = await clientRepo.findByEmail('jane@example.com')
    assert.isNotNull(client)
  })

  // ── Scenario 6: saves snapshot of unit_amount in transaction_products ──────

  test('should save the unit_amount snapshot in transaction_products', async ({ assert }) => {
    const factory = makeAdapterFactory({ gateway_1: makeSuccessAdapter() })
    const useCase = buildUseCase(factory)

    const result = await useCase.execute(defaultInput)

    const txWithProducts = await transactionRepo.findByIdWithProducts(result.transactionId)
    assert.isNotNull(txWithProducts)
    assert.lengthOf(txWithProducts!.products, 1)
    assert.equal(txWithProducts!.products[0].unitAmount.cents, 1000) // Widget = 1000 cents
  })

  // ── Scenario 7: persists only last 4 digits of card ──────────────────────

  test('should persist only the last 4 digits of the card number', async ({ assert }) => {
    const factory = makeAdapterFactory({ gateway_1: makeSuccessAdapter() })
    const useCase = buildUseCase(factory)

    const result = await useCase.execute(defaultInput)
    const tx = await transactionRepo.findById(result.transactionId)

    assert.equal(tx!.cardLastNumbers, '1111')
  })
})
