import { test } from '@japa/runner'
import { InMemoryDatabase } from '#infrastructure/database/in-memory/in-memory-database'
import { InMemoryUserRepository } from '#infrastructure/repositories/in-memory/in-memory-user.repository'
import { Role } from '#domain/enums/role.enum'
import { UserEntity } from '#domain/entities/user.entity'

const makeUser = (overrides: Partial<{ name: string; email: string; password: string; role: Role }> = {}): UserEntity => {
  return new UserEntity({
    name: overrides.name ?? 'John Doe',
    email: overrides.email ?? 'john@example.com',
    password: overrides.password ?? 'hashed_password',
    role: overrides.role ?? Role.USER,
  })
}

test.group('InMemoryUserRepository', (group) => {
  let db: InMemoryDatabase
  let repo: InMemoryUserRepository

  group.each.setup(() => {
    db = new InMemoryDatabase()
    repo = new InMemoryUserRepository(db)
  })

  // ──────────────────────────────────────────────────────────────────────────
  // create
  // ──────────────────────────────────────────────────────────────────────────

  test('create() deve retornar o usuário com id atribuído', async ({ assert }) => {
    const user = await repo.create(makeUser())

    assert.equal(user.id, 1)
    assert.equal(user.name, 'John Doe')
    assert.equal(user.email, 'john@example.com')
    assert.equal(user.role, Role.USER)
    assert.instanceOf(user.createdAt, Date)
    assert.isNull(user.updatedAt)
    assert.isNull(user.deletedAt)
  })

  test('create() deve incrementar o id para cada novo usuário', async ({ assert }) => {
    const u1 = await repo.create(makeUser({ email: 'a@test.com' }))
    const u2 = await repo.create(makeUser({ email: 'b@test.com' }))

    assert.equal(u1.id, 1)
    assert.equal(u2.id, 2)
  })

  // ──────────────────────────────────────────────────────────────────────────
  // findById
  // ──────────────────────────────────────────────────────────────────────────

  test('findById() deve retornar o usuário correspondente', async ({ assert }) => {
    const created = await repo.create(makeUser())
    const found = await repo.findById(created.id!)

    assert.equal(found?.id, created.id)
    assert.equal(found?.email, created.email)
  })

  test('findById() deve retornar null quando não encontrado', async ({ assert }) => {
    const result = await repo.findById(999)
    assert.isNull(result)
  })

  // ──────────────────────────────────────────────────────────────────────────
  // findByEmail
  // ──────────────────────────────────────────────────────────────────────────

  test('findByEmail() deve retornar o usuário com o email informado', async ({ assert }) => {
    await repo.create(makeUser({ email: 'alice@test.com' }))
    await repo.create(makeUser({ email: 'bob@test.com' }))

    const user = await repo.findByEmail('bob@test.com')
    assert.equal(user?.email, 'bob@test.com')
  })

  test('findByEmail() deve retornar null para email inexistente', async ({ assert }) => {
    const result = await repo.findByEmail('ghost@test.com')
    assert.isNull(result)
  })

  // ──────────────────────────────────────────────────────────────────────────
  // findAll
  // ──────────────────────────────────────────────────────────────────────────

  test('findAll() deve retornar todos os usuários criados', async ({ assert }) => {
    await repo.create(makeUser({ email: 'a@test.com' }))
    await repo.create(makeUser({ email: 'b@test.com' }))

    const users = await repo.findAll()
    assert.lengthOf(users, 2)
  })

  test('findAll() deve retornar array vazio quando não há usuários', async ({ assert }) => {
    const users = await repo.findAll()
    assert.isEmpty(users)
  })

  // ──────────────────────────────────────────────────────────────────────────
  // update
  // ──────────────────────────────────────────────────────────────────────────

  test('update() deve modificar os campos informados', async ({ assert }) => {
    const user = await repo.create(makeUser())
    const updated = await repo.update(user.id!, { name: 'Jane Doe', role: Role.ADMIN })

    assert.equal(updated.name, 'Jane Doe')
    assert.equal(updated.role, Role.ADMIN)
    assert.equal(updated.email, 'john@example.com') // campo não alterado
  })

  test('update() deve lançar erro para id inexistente', async ({ assert }) => {
    await assert.rejects(
      () => repo.update(999, { name: 'Ghost' }),
      /not found/i
    )
  })

  // ──────────────────────────────────────────────────────────────────────────
  // delete
  // ──────────────────────────────────────────────────────────────────────────

  test('delete() deve remover o usuário da lista', async ({ assert }) => {
    const user = await repo.create(makeUser())
    await repo.delete(user.id!)

    const all = await repo.findAll()
    assert.isEmpty(all)
  })

  test('delete() deve lançar erro para id inexistente', async ({ assert }) => {
    await assert.rejects(
      () => repo.delete(999),
      /not found/i
    )
  })
})
