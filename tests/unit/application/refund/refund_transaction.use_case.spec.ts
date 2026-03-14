import { test } from '@japa/runner'
import { InMemoryDatabase } from '#infrastructure/database/in-memory/in_memory_database'
import { InMemoryTransactionRepository } from '#infrastructure/repositories/in-memory/in_memory_transaction.repository'
import { InMemoryRefundRepository } from '#infrastructure/repositories/in-memory/in_memory_refund.repository'
import { InMemoryGatewayRepository } from '#infrastructure/repositories/in-memory/in_memory_gateway.repository'
import { RefundTransactionUseCase } from '#application/use-cases/refund/refund_transaction.use_case'
import { Money } from '#domain/value-objects/money.vo'
import { TransactionStatus } from '#domain/enums/transaction_status.enum'
import type {
  PaymentGatewayAdapter,
  ChargeInput,
  ChargeOutput,
} from '#infrastructure/gateways/contracts/payment_gateway.adapter'

const successRefundAdapter: PaymentGatewayAdapter = {
  async charge(_i: ChargeInput): Promise<ChargeOutput> {
    return { externalId: '', status: 'paid' }
  },
  async refund(_id: string): Promise<boolean> {
    return true
  },
}

const failRefundAdapter: PaymentGatewayAdapter = {
  async charge(_i: ChargeInput): Promise<ChargeOutput> {
    return { externalId: '', status: 'paid' }
  },
  async refund(_id: string): Promise<boolean> {
    return false
  },
}

const adapterFactory = (adapter: PaymentGatewayAdapter) => ({
  create: (_type: string) => adapter,
})

test.group('RefundTransactionUseCase', (group) => {
  let db: InMemoryDatabase
  let transactionRepo: InMemoryTransactionRepository
  let refundRepo: InMemoryRefundRepository
  let gatewayRepo: InMemoryGatewayRepository

  group.each.setup(async () => {
    db = new InMemoryDatabase()
    transactionRepo = new InMemoryTransactionRepository(db)
    refundRepo = new InMemoryRefundRepository(db)
    gatewayRepo = new InMemoryGatewayRepository(db)

    // Seed a gateway
    db.insert('gateways', {
      name: 'Gateway 1',
      type: 'gateway_1',
      isActive: true,
      priority: 1,
      createdAt: new Date(),
      updatedAt: null,
    })

    // Seed a PAID transaction (eligible for refund)
    db.insert('transactions', {
      clientId: 1,
      gatewayId: 1,
      externalId: 'ext-001',
      status: TransactionStatus.PAID,
      amount: Money.fromCents(5000),
      cardLastNumbers: '1111',
      createdAt: new Date(),
      updatedAt: null,
    })

    // Seed an already-refunded transaction
    db.insert('transactions', {
      clientId: 1,
      gatewayId: 1,
      externalId: 'ext-002',
      status: TransactionStatus.REFUNDED,
      amount: Money.fromCents(3000),
      cardLastNumbers: '2222',
      createdAt: new Date(),
      updatedAt: null,
    })
  })

  group.each.teardown(() => {
    db.clearAll()
  })

  // ── Scenario 1: successful refund ─────────────────────────────────────────

  test('should refund a paid transaction and update its status to refunded', async ({ assert }) => {
    const useCase = new RefundTransactionUseCase(
      transactionRepo,
      refundRepo,
      gatewayRepo,
      adapterFactory(successRefundAdapter)
    )

    const result = await useCase.execute(1)

    assert.equal(result.status, 'refunded')
    assert.equal(result.transactionId, 1)

    const tx = await transactionRepo.findById(1)
    assert.equal(tx!.status, TransactionStatus.REFUNDED)
  })

  // ── Scenario 2: already refunded → conflict 409 ───────────────────────────

  test('should throw 409 when transaction is already refunded', async ({ assert }) => {
    const useCase = new RefundTransactionUseCase(
      transactionRepo,
      refundRepo,
      gatewayRepo,
      adapterFactory(successRefundAdapter)
    )

    await assert.rejects(() => useCase.execute(2), /already refunded/i)
  })

  // ── Scenario 3: transaction not found → 404 ───────────────────────────────

  test('should throw 404 when transaction not found', async ({ assert }) => {
    const useCase = new RefundTransactionUseCase(
      transactionRepo,
      refundRepo,
      gatewayRepo,
      adapterFactory(successRefundAdapter)
    )

    await assert.rejects(() => useCase.execute(9999), /not found/i)
  })

  // ── Scenario 4: gateway returns error ────────────────────────────────────

  test('should throw AppError when the gateway refund call fails', async ({ assert }) => {
    const useCase = new RefundTransactionUseCase(
      transactionRepo,
      refundRepo,
      gatewayRepo,
      adapterFactory(failRefundAdapter)
    )

    await assert.rejects(() => useCase.execute(1), /refund.*failed|gateway/i)
  })
})
