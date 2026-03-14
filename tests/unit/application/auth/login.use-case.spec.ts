import { test } from '@japa/runner'
import { InMemoryDatabase } from '#infrastructure/database/in-memory/in-memory-database'
import { InMemoryUserRepository } from '#infrastructure/repositories/in-memory/in-memory-user.repository'
import { Role } from '#domain/enums/role.enum'
import { LoginUseCase } from '#application/use-cases/auth/login.use-case'

// Minimal hash service double — stores passwords in plaintext for tests
const fakeHash = {
  async make(value: string) {
    return `hashed:${value}`
  },
  async verify(hashedValue: string, plainValue: string) {
    return hashedValue === `hashed:${plainValue}`
  },
}

test.group('LoginUseCase', (group) => {
  let db: InMemoryDatabase
  let userRepo: InMemoryUserRepository
  let useCase: LoginUseCase

  group.each.setup(async () => {
    db = new InMemoryDatabase()
    userRepo = new InMemoryUserRepository(db)
    useCase = new LoginUseCase(userRepo, fakeHash)

    // Seed a user
    await userRepo.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: await fakeHash.make('secret123'),
      role: Role.ADMIN,
    })
  })

  group.each.teardown(() => {
    db.clearAll()
  })

  test('should return a token when credentials are valid', async ({ assert }) => {
    const result = await useCase.execute({ email: 'admin@example.com', password: 'secret123' })

    assert.isString(result.token)
    assert.equal(result.type, 'bearer')
  })

  test('should throw 401 when email is not found', async ({ assert }) => {
    await assert.rejects(
      () => useCase.execute({ email: 'notfound@example.com', password: 'secret123' }),
      /invalid credentials/i
    )
  })

  test('should throw 401 when password is incorrect', async ({ assert }) => {
    await assert.rejects(
      () => useCase.execute({ email: 'admin@example.com', password: 'wrongpw' }),
      /invalid credentials/i
    )
  })
})
