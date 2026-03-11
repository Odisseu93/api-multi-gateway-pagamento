import { test } from '@japa/runner'
import { InMemoryDatabase } from '#infrastructure/database/in-memory/in-memory-database'
import { InMemoryGatewayRepository } from '#infrastructure/repositories/in-memory/in-memory-gateway.repository'
import type { GatewayEntity } from '#domain/entities/gateway.entity'

const makeGateway = (
  overrides: Partial<Omit<GatewayEntity, 'id' | 'createdAt' | 'updatedAt'>> = {}
) => ({
  name: overrides.name ?? 'Gateway 1',
  type: overrides.type ?? 'gateway_1',
  isActive: overrides.isActive ?? true,
  priority: overrides.priority ?? 1,
  credentials: overrides.credentials ?? null,
})

test.group('InMemoryGatewayRepository', (group) => {
  let db: InMemoryDatabase
  let repo: InMemoryGatewayRepository

  group.each.setup(() => {
    db = new InMemoryDatabase()
    repo = new InMemoryGatewayRepository(db)
  })

  // ──────────────────────────────────────────────────────────────────────────
  // seed helper
  // ──────────────────────────────────────────────────────────────────────────

  async function seed() {
    const gw1 = db.insert<GatewayEntity & { id: number }>('gateways', {
      ...makeGateway({ type: 'gateway_1', priority: 1, isActive: true }),
      createdAt: new Date(),
      updatedAt: null,
    } as any)

    const gw2 = db.insert<GatewayEntity & { id: number }>('gateways', {
      ...makeGateway({ name: 'Gateway 2', type: 'gateway_2', priority: 2, isActive: true }),
      createdAt: new Date(),
      updatedAt: null,
    } as any)

    const gw3 = db.insert<GatewayEntity & { id: number }>('gateways', {
      ...makeGateway({ name: 'Gateway 3', type: 'gateway_3', priority: 3, isActive: false }),
      createdAt: new Date(),
      updatedAt: null,
    } as any)

    return { gw1, gw2, gw3 }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // findById
  // ──────────────────────────────────────────────────────────────────────────

  test('findById() should return the correct gateway', async ({ assert }) => {
    const { gw1 } = await seed()
    const found = await repo.findById(gw1.id)

    assert.equal(found?.id, gw1.id)
    assert.equal(found?.type, 'gateway_1')
  })

  test('findById() should return null for a non-existent id', async ({ assert }) => {
    assert.isNull(await repo.findById(999))
  })

  // ──────────────────────────────────────────────────────────────────────────
  // findByType
  // ──────────────────────────────────────────────────────────────────────────

  test('findByType() should return the gateway by type', async ({ assert }) => {
    await seed()
    const found = await repo.findByType('gateway_2')

    assert.equal(found?.type, 'gateway_2')
    assert.equal(found?.priority, 2)
  })

  test('findByType() should return null for an unknown type', async ({ assert }) => {
    assert.isNull(await repo.findByType('unknown'))
  })

  // ──────────────────────────────────────────────────────────────────────────
  // findAllActiveOrderedByPriority
  // ──────────────────────────────────────────────────────────────────────────

  test('findAllActiveOrderedByPriority() should return only active gateways ordered by priority', async ({
    assert,
  }) => {
    await seed()
    const actives = await repo.findAllActiveOrderedByPriority()

    // gw3 is inactive and should not appear
    assert.lengthOf(actives, 2)
    assert.equal(actives[0].priority, 1)
    assert.equal(actives[1].priority, 2)
  })

  test('findAllActiveOrderedByPriority() should return an empty array when all gateways are inactive', async ({
    assert,
  }) => {
    db.insert<GatewayEntity & { id: number }>('gateways', {
      ...makeGateway({ isActive: false }),
      createdAt: new Date(),
      updatedAt: null,
    } as any)

    const actives = await repo.findAllActiveOrderedByPriority()
    assert.isEmpty(actives)
  })

  // ──────────────────────────────────────────────────────────────────────────
  // update
  // ──────────────────────────────────────────────────────────────────────────

  test('update() isActive should deactivate the gateway', async ({ assert }) => {
    const { gw1 } = await seed()
    const updated = await repo.update(gw1.id, { isActive: false })

    assert.isFalse(updated.isActive)
  })

  test('update() priority should change the priority', async ({ assert }) => {
    const { gw2 } = await seed()
    const updated = await repo.update(gw2.id, { priority: 99 })

    assert.equal(updated.priority, 99)
  })

  test('update() should throw an error for a non-existent id', async ({ assert }) => {
    await assert.rejects(
      () => repo.update(999, { isActive: false }),
      /not found/i
    )
  })
})
