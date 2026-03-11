import { test } from '@japa/runner'
import { InMemoryDatabase } from '#infrastructure/database/in-memory/in-memory-database'
import { InMemoryProductRepository } from '#infrastructure/repositories/in-memory/in-memory-product.repository'
import { Money } from '#domain/value-objects/money.vo'

const makeProduct = (overrides: { name?: string; amountCents?: number; isActive?: boolean } = {}) => ({
  name: overrides.name ?? 'Produto A',
  amount: Money.fromCents(overrides.amountCents ?? 1000),
  isActive: overrides.isActive ?? true,
})

test.group('InMemoryProductRepository', (group) => {
  let db: InMemoryDatabase
  let repo: InMemoryProductRepository

  group.each.setup(() => {
    db = new InMemoryDatabase()
    repo = new InMemoryProductRepository(db)
  })

  // ──────────────────────────────────────────────────────────────────────────
  // create
  // ──────────────────────────────────────────────────────────────────────────

  test('create() deve retornar produto com id e timestamps', async ({ assert }) => {
    const product = await repo.create(makeProduct())

    assert.equal(product.id, 1)
    assert.equal(product.name, 'Produto A')
    assert.equal(product.amount.cents, 1000)
    assert.isTrue(product.isActive)
    assert.instanceOf(product.createdAt, Date)
  })

  test('create() deve gerar ids incrementais', async ({ assert }) => {
    const p1 = await repo.create(makeProduct({ name: 'P1' }))
    const p2 = await repo.create(makeProduct({ name: 'P2' }))

    assert.equal(p1.id, 1)
    assert.equal(p2.id, 2)
  })

  // ──────────────────────────────────────────────────────────────────────────
  // findById
  // ──────────────────────────────────────────────────────────────────────────

  test('findById() deve retornar o produto correto', async ({ assert }) => {
    const product = await repo.create(makeProduct())
    const found = await repo.findById(product.id!)

    assert.equal(found?.id, product.id)
    assert.equal(found?.name, 'Produto A')
  })

  test('findById() deve retornar null para id inexistente', async ({ assert }) => {
    assert.isNull(await repo.findById(999))
  })

  // ──────────────────────────────────────────────────────────────────────────
  // findByIds
  // ──────────────────────────────────────────────────────────────────────────

  test('findByIds() deve retornar apenas os produtos com os ids informados', async ({ assert }) => {
    const p1 = await repo.create(makeProduct({ name: 'P1' }))
    const p2 = await repo.create(makeProduct({ name: 'P2' }))
    await repo.create(makeProduct({ name: 'P3' }))

    const found = await repo.findByIds([p1.id!, p2.id!])
    assert.lengthOf(found, 2)
    assert.isTrue(found.some((p) => p.name === 'P1'))
    assert.isTrue(found.some((p) => p.name === 'P2'))
  })

  test('findByIds() deve retornar array vazio para ids inexistentes', async ({ assert }) => {
    assert.isEmpty(await repo.findByIds([999, 1000]))
  })

  // ──────────────────────────────────────────────────────────────────────────
  // findAll
  // ──────────────────────────────────────────────────────────────────────────

  test('findAll() deve retornar todos os produtos', async ({ assert }) => {
    await repo.create(makeProduct({ name: 'P1' }))
    await repo.create(makeProduct({ name: 'P2' }))

    const all = await repo.findAll()
    assert.lengthOf(all, 2)
  })

  test('findAll() deve retornar array vazio', async ({ assert }) => {
    assert.isEmpty(await repo.findAll())
  })

  // ──────────────────────────────────────────────────────────────────────────
  // update
  // ──────────────────────────────────────────────────────────────────────────

  test('update() deve atualizar name e amount', async ({ assert }) => {
    const product = await repo.create(makeProduct())
    const updated = await repo.update(product.id!, {
      name: 'Produto Atualizado',
      amount: Money.fromCents(2500),
    })

    assert.equal(updated.name, 'Produto Atualizado')
    assert.equal(updated.amount.cents, 2500)
  })

  test('update() deve desativar o produto', async ({ assert }) => {
    const product = await repo.create(makeProduct())
    const updated = await repo.update(product.id!, { isActive: false })

    assert.isFalse(updated.isActive)
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

  test('delete() deve remover o produto', async ({ assert }) => {
    const product = await repo.create(makeProduct())
    await repo.delete(product.id!)

    assert.isEmpty(await repo.findAll())
  })

  test('delete() deve lançar erro para id inexistente', async ({ assert }) => {
    await assert.rejects(
      () => repo.delete(999),
      /not found/i
    )
  })
})
