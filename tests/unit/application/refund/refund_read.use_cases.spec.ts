import { test } from '@japa/runner'
import { InMemoryDatabase } from '#infrastructure/database/in-memory/in_memory_database'
import { InMemoryRefundRepository } from '#infrastructure/repositories/in-memory/in_memory_refund.repository'
import { ListRefundsUseCase } from '#application/use-cases/refund/list_refunds.use_case'
import { GetRefundUseCase } from '#application/use-cases/refund/get_refund.use_case'
import { RefundStatus } from '#domain/enums/refund_status.enum'
import { Money } from '#domain/value-objects/money.vo'

test.group('Refund Use Cases (Read-only)', (group) => {
  let db: InMemoryDatabase
  let refundRepo: InMemoryRefundRepository

  group.each.setup(() => {
    db = new InMemoryDatabase()
    refundRepo = new InMemoryRefundRepository(db)
  })

  test('ListRefundsUseCase: should return all refunds', async ({ assert }) => {
    await refundRepo.create({
      transactionId: 1,
      externalId: 'ext-1',
      status: RefundStatus.APPROVED,
      amount: Money.fromCents(100),
    })

    const useCase = new ListRefundsUseCase(refundRepo)
    const result = await useCase.execute()

    assert.lengthOf(result, 1)
    assert.equal(result[0].externalId, 'ext-1')
  })

  test('GetRefundUseCase: should return a refund by id', async ({ assert }) => {
    const created = await refundRepo.create({
      transactionId: 1,
      externalId: 'ext-find',
      status: RefundStatus.APPROVED,
      amount: Money.fromCents(100),
    })

    const useCase = new GetRefundUseCase(refundRepo)
    const result = await useCase.execute(created.id!)

    assert.equal(result.externalId, 'ext-find')
  })

  test('GetRefundUseCase: should throw 404 when refund not found', async ({ assert }) => {
    const useCase = new GetRefundUseCase(refundRepo)
    await assert.rejects(() => useCase.execute(999), /Refund not found/i)
  })
})
