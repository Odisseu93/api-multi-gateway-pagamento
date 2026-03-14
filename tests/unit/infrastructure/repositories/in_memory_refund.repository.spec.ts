import { test } from '@japa/runner'
import { InMemoryDatabase } from '#infrastructure/database/in-memory/in_memory_database'
import { InMemoryRefundRepository } from '#infrastructure/repositories/in-memory/in_memory_refund.repository'
import { RefundStatus } from '#domain/enums/refund_status.enum'
import { Money } from '#domain/value-objects/money.vo'
import type { CreateRefundData } from '#domain/repositories/refund.repository'

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

  test('create() should return the refund with an assigned id and correct data', async ({
    assert,
  }) => {
    const refund = await repo.create(makeRefundData())

    assert.equal(refund.id, 1)
    assert.equal(refund.transactionId, 1)
    assert.equal(refund.externalId, 'ref-ext-001')
    assert.equal(refund.status, RefundStatus.REQUESTED)
    assert.equal(refund.amount.cents, 5000)
    assert.instanceOf(refund.createdAt, Date)
  })

  test('create() should accept a null externalId', async ({ assert }) => {
    const refund = await repo.create(makeRefundData({ externalId: null }))

    assert.isNull(refund.externalId)
  })

  test('create() should generate incremental ids', async ({ assert }) => {
    const r1 = await repo.create(makeRefundData({ transactionId: 1 }))
    const r2 = await repo.create(makeRefundData({ transactionId: 2 }))

    assert.equal(r1.id, 1)
    assert.equal(r2.id, 2)
  })

  // ──────────────────────────────────────────────────────────────────────────
  // findById
  // ──────────────────────────────────────────────────────────────────────────

  test('findById() should return the correct refund', async ({ assert }) => {
    const created = await repo.create(makeRefundData())
    const found = await repo.findById(created.id!)

    assert.equal(found?.id, created.id)
    assert.equal(found?.status, RefundStatus.REQUESTED)
  })

  test('findById() should return null for a non-existent id', async ({ assert }) => {
    assert.isNull(await repo.findById(999))
  })

  // ──────────────────────────────────────────────────────────────────────────
  // findByTransactionId
  // ──────────────────────────────────────────────────────────────────────────

  test('findByTransactionId() should return all refunds for the transaction', async ({
    assert,
  }) => {
    await repo.create(makeRefundData({ transactionId: 10 }))
    await repo.create(makeRefundData({ transactionId: 10 }))
    await repo.create(makeRefundData({ transactionId: 20 }))

    const refunds = await repo.findByTransactionId(10)
    assert.lengthOf(refunds, 2)
    assert.isTrue(refunds.every((r) => r.transactionId === 10))
  })

  test('findByTransactionId() should return an empty array for a transaction with no refunds', async ({
    assert,
  }) => {
    assert.isEmpty(await repo.findByTransactionId(999))
  })

  // ──────────────────────────────────────────────────────────────────────────
  // findAll
  // ──────────────────────────────────────────────────────────────────────────

  test('findAll() should return all refunds', async ({ assert }) => {
    await repo.create(makeRefundData({ transactionId: 10 }))
    await repo.create(makeRefundData({ transactionId: 20 }))
    await repo.create(makeRefundData({ transactionId: 30 }))

    const all = await repo.findAll()
    assert.lengthOf(all, 3)
  })

  // ──────────────────────────────────────────────────────────────────────────
  // updateStatus
  // ──────────────────────────────────────────────────────────────────────────

  test('updateStatus() should change the status to approved', async ({ assert }) => {
    const refund = await repo.create(makeRefundData())
    const updated = await repo.updateStatus(refund.id!, RefundStatus.APPROVED)

    assert.equal(updated.status, RefundStatus.APPROVED)
  })

  test('updateStatus() should change the status to failed', async ({ assert }) => {
    const refund = await repo.create(makeRefundData())
    const updated = await repo.updateStatus(refund.id!, RefundStatus.FAILED)

    assert.equal(updated.status, RefundStatus.FAILED)
  })

  test('updateStatus() should update the externalId when provided', async ({ assert }) => {
    const refund = await repo.create(makeRefundData({ externalId: null }))
    const updated = await repo.updateStatus(refund.id!, RefundStatus.APPROVED, 'ref-ext-confirmed')

    assert.equal(updated.externalId, 'ref-ext-confirmed')
    assert.equal(updated.status, RefundStatus.APPROVED)
  })

  test('updateStatus() should throw an error for a non-existent id', async ({ assert }) => {
    await assert.rejects(() => repo.updateStatus(999, RefundStatus.APPROVED), /not found/i)
  })
})
