import { test } from '@japa/runner'
import { InMemoryDatabase } from '#infrastructure/database/in-memory/in-memory-database'
import { InMemoryTransactionRepository } from '#infrastructure/repositories/in-memory/in-memory-transaction.repository'
import { TransactionStatus } from '#domain/enums/transaction-status.enum'
import type { CreateTransactionData } from '#domain/repositories/i-transaction.repository'

const makeTransactionData = (
  overrides: Partial<CreateTransactionData> = {}
): CreateTransactionData => ({
  clientId: overrides.clientId ?? 1,
  // Use 'in' check so that explicitly passing null is preserved (not replaced by ??)
  gatewayId: 'gatewayId' in overrides ? overrides.gatewayId! : 1,
  externalId: 'externalId' in overrides ? overrides.externalId! : 'ext-001',
  status: overrides.status ?? TransactionStatus.PAID,
  amount: overrides.amount ?? 5000,
  cardLastNumbers: overrides.cardLastNumbers ?? '4242',
  products: overrides.products ?? [
    { productId: 1, quantity: 2, unitAmount: 1000 },
    { productId: 2, quantity: 1, unitAmount: 3000 },
  ],
})

test.group('InMemoryTransactionRepository', (group) => {
  let db: InMemoryDatabase
  let repo: InMemoryTransactionRepository

  group.each.setup(() => {
    db = new InMemoryDatabase()
    repo = new InMemoryTransactionRepository(db)
  })

  // ──────────────────────────────────────────────────────────────────────────
  // create
  // ──────────────────────────────────────────────────────────────────────────

  test('create() deve retornar a transação com id e dados corretos', async ({ assert }) => {
    const transaction = await repo.create(makeTransactionData())

    assert.equal(transaction.id, 1)
    assert.equal(transaction.clientId, 1)
    assert.equal(transaction.gatewayId, 1)
    assert.equal(transaction.externalId, 'ext-001')
    assert.equal(transaction.status, TransactionStatus.PAID)
    assert.equal(transaction.amount.cents, 5000)
    assert.equal(transaction.cardLastNumbers, '4242')
    assert.instanceOf(transaction.createdAt, Date)
  })

  test('create() deve persistir os transaction_products no banco em memória', async ({ assert }) => {
    await repo.create(makeTransactionData())

    const products = db.findAll<{ id: number; transactionId: number; productId: number; quantity: number; unitAmount: any }>('transaction_products')

    assert.lengthOf(products, 2)
    assert.equal(products[0].productId, 1)
    assert.equal(products[0].quantity, 2)
    assert.equal(products[0].unitAmount.cents, 1000)
    assert.equal(products[1].productId, 2)
    assert.equal(products[1].unitAmount.cents, 3000)
  })

  test('create() deve aceitar gatewayId nulo (transação pendente)', async ({ assert }) => {
    const transaction = await repo.create(
      makeTransactionData({ gatewayId: null, externalId: null, status: TransactionStatus.PENDING })
    )

    assert.isNull(transaction.gatewayId)
    assert.isNull(transaction.externalId)
    assert.equal(transaction.status, TransactionStatus.PENDING)
  })

  // ──────────────────────────────────────────────────────────────────────────
  // findById
  // ──────────────────────────────────────────────────────────────────────────

  test('findById() deve retornar a transação correta', async ({ assert }) => {
    const created = await repo.create(makeTransactionData())
    const found = await repo.findById(created.id!)

    assert.equal(found?.id, created.id)
    assert.equal(found?.cardLastNumbers, '4242')
  })

  test('findById() deve retornar null para id inexistente', async ({ assert }) => {
    assert.isNull(await repo.findById(999))
  })

  // ──────────────────────────────────────────────────────────────────────────
  // findByIdWithProducts
  // ──────────────────────────────────────────────────────────────────────────

  test('findByIdWithProducts() deve retornar a transação com seus produtos', async ({ assert }) => {
    const created = await repo.create(makeTransactionData())
    const result = await repo.findByIdWithProducts(created.id!)

    assert.isNotNull(result)
    assert.equal(result!.transaction.id, created.id)
    assert.lengthOf(result!.products, 2)
  })

  test('findByIdWithProducts() deve retornar null para id inexistente', async ({ assert }) => {
    assert.isNull(await repo.findByIdWithProducts(999))
  })

  test('findByIdWithProducts() não deve misturar produtos de transações diferentes', async ({ assert }) => {
    const t1 = await repo.create(
      makeTransactionData({ clientId: 1, products: [{ productId: 10, quantity: 1, unitAmount: 500 }] })
    )
    const t2 = await repo.create(
      makeTransactionData({ clientId: 2, products: [{ productId: 20, quantity: 3, unitAmount: 200 }] })
    )

    const result1 = await repo.findByIdWithProducts(t1.id!)
    const result2 = await repo.findByIdWithProducts(t2.id!)

    assert.lengthOf(result1!.products, 1)
    assert.equal(result1!.products[0].productId, 10)

    assert.lengthOf(result2!.products, 1)
    assert.equal(result2!.products[0].productId, 20)
  })

  // ──────────────────────────────────────────────────────────────────────────
  // findAll
  // ──────────────────────────────────────────────────────────────────────────

  test('findAll() deve retornar todas as transações', async ({ assert }) => {
    await repo.create(makeTransactionData({ clientId: 1 }))
    await repo.create(makeTransactionData({ clientId: 2 }))

    const all = await repo.findAll()
    assert.lengthOf(all, 2)
  })

  test('findAll() deve retornar array vazio', async ({ assert }) => {
    assert.isEmpty(await repo.findAll())
  })

  // ──────────────────────────────────────────────────────────────────────────
  // findByClientId
  // ──────────────────────────────────────────────────────────────────────────

  test('findByClientId() deve retornar somente as transações do client informado', async ({ assert }) => {
    await repo.create(makeTransactionData({ clientId: 1 }))
    await repo.create(makeTransactionData({ clientId: 1 }))
    await repo.create(makeTransactionData({ clientId: 2 }))

    const transactions = await repo.findByClientId(1)
    assert.lengthOf(transactions, 2)
    assert.isTrue(transactions.every((t) => t.clientId === 1))
  })

  test('findByClientId() deve retornar array vazio para client sem transações', async ({ assert }) => {
    assert.isEmpty(await repo.findByClientId(999))
  })

  // ──────────────────────────────────────────────────────────────────────────
  // updateStatus
  // ──────────────────────────────────────────────────────────────────────────

  test('updateStatus() deve mudar o status da transação', async ({ assert }) => {
    const transaction = await repo.create(makeTransactionData({ status: TransactionStatus.PENDING }))
    const updated = await repo.updateStatus(transaction.id!, TransactionStatus.PAID)

    assert.equal(updated.status, TransactionStatus.PAID)
  })

  test('updateStatus() deve atualizar gatewayId e externalId quando fornecidos', async ({ assert }) => {
    const transaction = await repo.create(
      makeTransactionData({ status: TransactionStatus.PENDING, gatewayId: null, externalId: null })
    )
    const updated = await repo.updateStatus(transaction.id!, TransactionStatus.PAID, 2, 'ext-999')

    assert.equal(updated.status, TransactionStatus.PAID)
    assert.equal(updated.gatewayId, 2)
    assert.equal(updated.externalId, 'ext-999')
  })

  test('updateStatus() deve marcar como refunded', async ({ assert }) => {
    const transaction = await repo.create(makeTransactionData())
    const updated = await repo.updateStatus(transaction.id!, TransactionStatus.REFUNDED)

    assert.equal(updated.status, TransactionStatus.REFUNDED)
  })

  test('updateStatus() deve lançar erro para id inexistente', async ({ assert }) => {
    await assert.rejects(
      () => repo.updateStatus(999, TransactionStatus.PAID),
      /not found/i
    )
  })
})
