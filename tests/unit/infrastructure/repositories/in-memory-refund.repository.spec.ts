import { test } from '@japa/runner'
import { InMemoryDatabase } from '#infrastructure/database/in-memory/in-memory-database'
import { InMemoryRefundRepository } from '#infrastructure/repositories/in-memory/in-memory-refund.repository'
import { RefundStatus } from '#domain/enums/refund-status.enum'
import { Money } from '#domain/value-objects/money.vo'
import type { CreateRefundData } from '#domain/repositories/i-refund.repository'

const makeRefundData = (overrides: Partial<CreateRefundData> = {}): CreateRefundData => ({
  transactionId: overrides.transactionId ?? 1,
  // Use 'in' check so explicitly passing null is preserved
  externalId: 'externalId' in overrides ? overrides.externalId! : 'ref-ext-001',
  status: overrides.status ?? RefundStatus.REQUESTED,
  amount: overrides.amount ?? Money.fromCents(5000),
})

test.group('InMemoryRefundRepository', (group) => {
  let db: InMemoryDatabase
  let repo: InMemoryRefundRepository

  group.each.setup(() => {
    db = new InMemoryDatabase()
    repo = new InMemoryRefundRepository(db)
  })

  // ──────────────────────────────────────────────────────────────────────────
  // create
  // ──────────────────────────────────────────────────────────────────────────

  test('create() deve retornar o refund com id atribuído e dados corretos', async ({ assert }) => {
    const refund = await repo.create(makeRefundData())

    assert.equal(refund.id, 1)
    assert.equal(refund.transactionId, 1)
    assert.equal(refund.externalId, 'ref-ext-001')
    assert.equal(refund.status, RefundStatus.REQUESTED)
    assert.equal(refund.amount.cents, 5000)
    assert.instanceOf(refund.createdAt, Date)
  })

  test('create() deve aceitar externalId nulo', async ({ assert }) => {
    const refund = await repo.create(makeRefundData({ externalId: null }))

    assert.isNull(refund.externalId)
  })

  test('create() deve gerar ids incrementais', async ({ assert }) => {
    const r1 = await repo.create(makeRefundData({ transactionId: 1 }))
    const r2 = await repo.create(makeRefundData({ transactionId: 2 }))

    assert.equal(r1.id, 1)
    assert.equal(r2.id, 2)
  })

  // ──────────────────────────────────────────────────────────────────────────
  // findById
  // ──────────────────────────────────────────────────────────────────────────

  test('findById() deve retornar o refund correto', async ({ assert }) => {
    const created = await repo.create(makeRefundData())
    const found = await repo.findById(created.id!)

    assert.equal(found?.id, created.id)
    assert.equal(found?.status, RefundStatus.REQUESTED)
  })

  test('findById() deve retornar null para id inexistente', async ({ assert }) => {
    assert.isNull(await repo.findById(999))
  })

  // ──────────────────────────────────────────────────────────────────────────
  // findByTransactionId
  // ──────────────────────────────────────────────────────────────────────────

  test('findByTransactionId() deve retornar todos os refunds da transação', async ({ assert }) => {
    await repo.create(makeRefundData({ transactionId: 10 }))
    await repo.create(makeRefundData({ transactionId: 10 }))
    await repo.create(makeRefundData({ transactionId: 20 }))

    const refunds = await repo.findByTransactionId(10)
    assert.lengthOf(refunds, 2)
    assert.isTrue(refunds.every((r) => r.transactionId === 10))
  })

  test('findByTransactionId() deve retornar array vazio para transação sem refunds', async ({
    assert,
  }) => {
    assert.isEmpty(await repo.findByTransactionId(999))
  })

  // ──────────────────────────────────────────────────────────────────────────
  // updateStatus
  // ──────────────────────────────────────────────────────────────────────────

  test('updateStatus() deve mudar o status para approved', async ({ assert }) => {
    const refund = await repo.create(makeRefundData())
    const updated = await repo.updateStatus(refund.id!, RefundStatus.APPROVED)

    assert.equal(updated.status, RefundStatus.APPROVED)
  })

  test('updateStatus() deve mudar o status para failed', async ({ assert }) => {
    const refund = await repo.create(makeRefundData())
    const updated = await repo.updateStatus(refund.id!, RefundStatus.FAILED)

    assert.equal(updated.status, RefundStatus.FAILED)
  })

  test('updateStatus() deve atualizar o externalId quando fornecido', async ({ assert }) => {
    const refund = await repo.create(makeRefundData({ externalId: null }))
    const updated = await repo.updateStatus(refund.id!, RefundStatus.APPROVED, 'ref-ext-confirmed')

    assert.equal(updated.externalId, 'ref-ext-confirmed')
    assert.equal(updated.status, RefundStatus.APPROVED)
  })

  test('updateStatus() deve lançar erro para id inexistente', async ({ assert }) => {
    await assert.rejects(
      () => repo.updateStatus(999, RefundStatus.APPROVED),
      /not found/i
    )
  })
})
