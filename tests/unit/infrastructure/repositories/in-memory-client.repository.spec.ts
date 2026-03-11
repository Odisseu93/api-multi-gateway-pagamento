import { test } from '@japa/runner'
import { InMemoryDatabase } from '#infrastructure/database/in-memory/in-memory-database'
import { InMemoryClientRepository } from '#infrastructure/repositories/in-memory/in-memory-client.repository'
import type { ClientEntity } from '#domain/entities/client.entity'

const makeClient = (
  overrides: Partial<Omit<ClientEntity, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>> = {}
) => ({
  userId: overrides.userId ?? 1,
  name: overrides.name ?? 'Alice Smith',
  email: overrides.email ?? 'alice@example.com',
})

test.group('InMemoryClientRepository', (group) => {
  let db: InMemoryDatabase
  let repo: InMemoryClientRepository

  group.each.setup(() => {
    db = new InMemoryDatabase()
    repo = new InMemoryClientRepository(db)
  })

  // ──────────────────────────────────────────────────────────────────────────
  // create
  // ──────────────────────────────────────────────────────────────────────────

  test('create() should return the client with an assigned id', async ({ assert }) => {
    const client = await repo.create(makeClient())

    assert.equal(client.id, 1)
    assert.equal(client.name, 'Alice Smith')
    assert.equal(client.email, 'alice@example.com')
    assert.equal(client.userId, 1)
    assert.instanceOf(client.createdAt, Date)
    assert.isNull(client.deletedAt)
  })

  test('create() should generate incremental ids', async ({ assert }) => {
    const c1 = await repo.create(makeClient({ email: 'c1@test.com', userId: 1 }))
    const c2 = await repo.create(makeClient({ email: 'c2@test.com', userId: 2 }))

    assert.equal(c1.id, 1)
    assert.equal(c2.id, 2)
  })

  // ──────────────────────────────────────────────────────────────────────────
  // findById
  // ──────────────────────────────────────────────────────────────────────────

  test('findById() should return the correct client', async ({ assert }) => {
    const client = await repo.create(makeClient())
    const found = await repo.findById(client.id!)

    assert.equal(found?.id, client.id)
  })

  test('findById() should return null for a non-existent id', async ({ assert }) => {
    assert.isNull(await repo.findById(999))
  })

  // ──────────────────────────────────────────────────────────────────────────
  // findByEmail
  // ──────────────────────────────────────────────────────────────────────────

  test('findByEmail() should find the client by email', async ({ assert }) => {
    await repo.create(makeClient({ email: 'x@test.com', userId: 1 }))
    await repo.create(makeClient({ email: 'y@test.com', userId: 2 }))

    const found = await repo.findByEmail('y@test.com')
    assert.equal(found?.email, 'y@test.com')
    assert.equal(found?.userId, 2)
  })

  test('findByEmail() should return null for an unknown email', async ({ assert }) => {
    assert.isNull(await repo.findByEmail('ghost@test.com'))
  })

  // ──────────────────────────────────────────────────────────────────────────
  // findByUserId
  // ──────────────────────────────────────────────────────────────────────────

  test('findByUserId() should find the client by userId', async ({ assert }) => {
    await repo.create(makeClient({ email: 'a@test.com', userId: 10 }))
    await repo.create(makeClient({ email: 'b@test.com', userId: 20 }))

    const found = await repo.findByUserId(20)
    assert.equal(found?.userId, 20)
  })

  test('findByUserId() should return null for a non-existent userId', async ({ assert }) => {
    assert.isNull(await repo.findByUserId(999))
  })

  // ──────────────────────────────────────────────────────────────────────────
  // findAll
  // ──────────────────────────────────────────────────────────────────────────

  test('findAll() should return all clients', async ({ assert }) => {
    await repo.create(makeClient({ email: 'a@test.com', userId: 1 }))
    await repo.create(makeClient({ email: 'b@test.com', userId: 2 }))
    await repo.create(makeClient({ email: 'c@test.com', userId: 3 }))

    const all = await repo.findAll()
    assert.lengthOf(all, 3)
  })

  test('findAll() should return an empty array when there are no clients', async ({ assert }) => {
    assert.isEmpty(await repo.findAll())
  })
})
