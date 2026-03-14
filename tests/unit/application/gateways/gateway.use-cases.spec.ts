import { test } from '@japa/runner'
import { InMemoryDatabase } from '#infrastructure/database/in-memory/in_memory_database'
import { InMemoryGatewayRepository } from '#infrastructure/repositories/in-memory/in_memory_gateway.repository'
import { GetGatewayUseCase } from '#application/use-cases/gateways/get_gateway.use_case'
import { ListGatewaysUseCase } from '#application/use-cases/gateways/list_gateways.use_case'
import { UpdateGatewayPriorityUseCase } from '#application/use-cases/gateways/update_gateway_priority.use_case'

test.group('Gateway Use Cases', (group) => {
  let db: InMemoryDatabase
  let gatewayRepo: InMemoryGatewayRepository

  group.each.setup(() => {
    db = new InMemoryDatabase()
    gatewayRepo = new InMemoryGatewayRepository(db)
  })

  group.each.teardown(() => {
    db.clearAll()
  })

  // ── GetGatewayUseCase ──────────────────────────────────────────────────────

  test('GetGatewayUseCase: should return a gateway by id', async ({ assert }) => {
    // Seed database
    db.insert('gateways', {
      name: 'Gateway 1',
      type: 'gateway_1',
      isActive: true,
      priority: 1,
    })

    const useCase = new GetGatewayUseCase(gatewayRepo)
    const gateway = await useCase.execute(1)

    assert.equal(gateway.id, 1)
    assert.equal(gateway.name, 'Gateway 1')
    assert.equal(gateway.type, 'gateway_1')
  })

  test('GetGatewayUseCase: should throw NotFoundError when gateway does not exist', async ({
    assert,
  }) => {
    const useCase = new GetGatewayUseCase(gatewayRepo)

    await assert.rejects(() => useCase.execute(999), /Gateway.*not found/i)
  })

  // ── ListGatewaysUseCase ────────────────────────────────────────────────────

  test('ListGatewaysUseCase: should return all active gateways ordered by priority', async ({
    assert,
  }) => {
    // Seed database with multiple gateways
    // (insert assigns IDs 1, 2, 3 automatically)
    db.insert('gateways', {
      name: 'Gateway B',
      type: 'gateway_b',
      isActive: true,
      priority: 2,
    })
    db.insert('gateways', {
      name: 'Gateway A',
      type: 'gateway_a',
      isActive: true,
      priority: 1,
    })
    db.insert('gateways', {
      name: 'Gateway Inactive',
      type: 'gateway_inactive',
      isActive: false,
      priority: 3,
    })

    const useCase = new ListGatewaysUseCase(gatewayRepo)
    const gateways = await useCase.execute()

    assert.lengthOf(gateways, 2)
    assert.equal(gateways[0].name, 'Gateway A') // priority 1
    assert.equal(gateways[1].name, 'Gateway B') // priority 2
    assert.isTrue(gateways.every((g) => g.isActive))
  })

  // ── UpdateGatewayPriorityUseCase ───────────────────────────────────────────

  test('UpdateGatewayPriorityUseCase: should swap priorities even with inactive gateways', async ({
    assert,
  }) => {
    // Gateway 1: Active, Priority 1
    db.insert('gateways', {
      name: 'Gateway 1',
      type: 'gateway_1',
      isActive: true,
      priority: 1,
    })
    // Gateway 2: Inactive, Priority 2
    db.insert('gateways', {
      name: 'Gateway 2',
      type: 'gateway_2',
      isActive: false,
      priority: 2,
    })

    const useCase = new UpdateGatewayPriorityUseCase(gatewayRepo)
    const result = await useCase.execute(1, 2)

    assert.equal(result.updatedGateway.id, 1)
    assert.equal(result.updatedGateway.priority, 2)
    assert.equal(result.swappedGateway?.id, 2)
    assert.equal(result.swappedGateway?.priority, 1)
  })
})
