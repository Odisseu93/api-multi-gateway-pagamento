import { test } from '@japa/runner'
import { InMemoryDatabase } from '#infrastructure/database/in-memory/in-memory-database'
import { InMemoryUserRepository } from '#infrastructure/repositories/in-memory/in-memory-user.repository'
import { Role } from '#domain/enums/role.enum'
import { CreateUserUseCase } from '#application/use-cases/users/create-user.use-case'
import { UpdateUserUseCase } from '#application/use-cases/users/update-user.use-case'
import { DeleteUserUseCase } from '#application/use-cases/users/delete-user.use-case'
import { ListUsersUseCase } from '#application/use-cases/users/list-users.use-case'
import { GetUserUseCase } from '#application/use-cases/users/get-user.use-case'

test.group('User Use Cases', (group) => {
  let db: InMemoryDatabase
  let userRepo: InMemoryUserRepository

  group.each.setup(() => {
    db = new InMemoryDatabase()
    userRepo = new InMemoryUserRepository(db)
  })

  group.each.teardown(() => {
    db.clearAll()
  })

  // ── CreateUserUseCase ──────────────────────────────────────────────────────

  test('CreateUserUseCase: should create a user', async ({ assert }) => {
    const useCase = new CreateUserUseCase(userRepo)
    const user = await useCase.execute({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'plain123',
      role: Role.USER,
    })

    assert.equal(user.name, 'Alice')
    assert.equal(user.email, 'alice@example.com')
    assert.equal(user.password, 'plain123')
    assert.equal(user.role, Role.USER)
    assert.isDefined(user.id)
  })

  test('CreateUserUseCase: should throw 409 when email already exists', async ({ assert }) => {
    const useCase = new CreateUserUseCase(userRepo)
    await useCase.execute({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'plain123',
      role: Role.USER,
    })

    await assert.rejects(
      () =>
        useCase.execute({
          name: 'Alice 2',
          email: 'alice@example.com',
          password: 'other',
          role: Role.USER,
        }),
      /already.*use/i
    )
  })

  // ── UpdateUserUseCase ──────────────────────────────────────────────────────

  test('UpdateUserUseCase: should update user name', async ({ assert }) => {
    const createUseCase = new CreateUserUseCase(userRepo)
    const created = await createUseCase.execute({
      name: 'Bob',
      email: 'bob@example.com',
      password: 'pw',
      role: Role.USER,
    })

    const updateUseCase = new UpdateUserUseCase(userRepo)
    const updated = await updateUseCase.execute(created.id!, { name: 'Robert' })

    assert.equal(updated.name, 'Robert')
    assert.equal(updated.email, 'bob@example.com')
  })

  test('UpdateUserUseCase: should update password', async ({ assert }) => {
    const createUseCase = new CreateUserUseCase(userRepo)
    const created = await createUseCase.execute({
      name: 'Bob',
      email: 'bob@example.com',
      password: 'pw',
      role: Role.USER,
    })

    const updateUseCase = new UpdateUserUseCase(userRepo)
    const updated = await updateUseCase.execute(created.id!, { password: 'newpassword' })

    assert.equal(updated.password, 'newpassword')
  })

  test('UpdateUserUseCase: should throw 404 when user not found', async ({ assert }) => {
    const useCase = new UpdateUserUseCase(userRepo)
    await assert.rejects(() => useCase.execute(9999, { name: 'Ghost' }), /not found/i)
  })

  // ── DeleteUserUseCase ──────────────────────────────────────────────────────

  test('DeleteUserUseCase: should delete an existing user when requested by ADMIN', async ({
    assert,
  }) => {
    const createUseCase = new CreateUserUseCase(userRepo)
    const created = await createUseCase.execute({
      name: 'Carol',
      email: 'carol@example.com',
      password: 'pw',
      role: Role.USER,
    })

    const deleteUseCase = new DeleteUserUseCase(userRepo)
    // ADMIN deleting USER
    await deleteUseCase.execute(created.id!, 999, Role.ADMIN)

    const found = await userRepo.findById(created.id!)
    assert.isNull(found)
  })

  test('DeleteUserUseCase: should allow MANAGER to delete a USER', async ({ assert }) => {
    const createUseCase = new CreateUserUseCase(userRepo)
    const target = await createUseCase.execute({
      name: 'Target',
      email: 'target@example.com',
      password: 'pw',
      role: Role.USER,
    })

    const deleteUseCase = new DeleteUserUseCase(userRepo)
    await deleteUseCase.execute(target.id!, 888, Role.MANAGER)

    const found = await userRepo.findById(target.id!)
    assert.isNull(found)
  })

  test('DeleteUserUseCase: should throw 403 when user tries to delete themselves', async ({
    assert,
  }) => {
    const useCase = new DeleteUserUseCase(userRepo)
    await assert.rejects(() => useCase.execute(1, 1, Role.ADMIN), /cannot delete your own account/i)
  })

  test('DeleteUserUseCase: should throw 403 when MANAGER tries to delete an ADMIN', async ({
    assert,
  }) => {
    const createUseCase = new CreateUserUseCase(userRepo)
    const admin = await createUseCase.execute({
      name: 'Admin',
      email: 'admin-to-del@example.com',
      password: 'pw',
      role: Role.ADMIN,
    })

    const deleteUseCase = new DeleteUserUseCase(userRepo)
    await assert.rejects(
      () => deleteUseCase.execute(admin.id!, 777, Role.MANAGER),
      /MANAGER cannot delete an ADMIN/i
    )
  })

  test('DeleteUserUseCase: should throw 404 when user not found (as ADMIN)', async ({ assert }) => {
    const useCase = new DeleteUserUseCase(userRepo)
    await assert.rejects(() => useCase.execute(9999, 1, Role.ADMIN), /not found/i)
  })

  // ── ListUsersUseCase ───────────────────────────────────────────────────────

  test('ListUsersUseCase: should return all users', async ({ assert }) => {
    const createUseCase = new CreateUserUseCase(userRepo)
    await createUseCase.execute({ name: 'A', email: 'a@a.com', password: 'pw', role: Role.USER })
    await createUseCase.execute({ name: 'B', email: 'b@b.com', password: 'pw', role: Role.ADMIN })

    const listUseCase = new ListUsersUseCase(userRepo)
    const users = await listUseCase.execute()

    assert.lengthOf(users, 2)
  })

  // ── GetUserUseCase ─────────────────────────────────────────────────────────

  test('GetUserUseCase: should return user by id', async ({ assert }) => {
    const createUseCase = new CreateUserUseCase(userRepo)
    const created = await createUseCase.execute({
      name: 'Dave',
      email: 'dave@example.com',
      password: 'pw',
      role: Role.MANAGER,
    })

    const getUseCase = new GetUserUseCase(userRepo)
    const found = await getUseCase.execute(created.id!)

    assert.equal(found.email, 'dave@example.com')
  })

  test('GetUserUseCase: should throw 404 when user not found', async ({ assert }) => {
    const useCase = new GetUserUseCase(userRepo)
    await assert.rejects(() => useCase.execute(9999), /not found/i)
  })
})
