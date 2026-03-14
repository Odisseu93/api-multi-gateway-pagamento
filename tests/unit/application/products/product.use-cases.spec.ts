import { test } from '@japa/runner'
import { InMemoryDatabase } from '#infrastructure/database/in-memory/in-memory-database'
import { InMemoryProductRepository } from '#infrastructure/repositories/in-memory/in-memory-product.repository'
import { CreateProductUseCase } from '#application/use-cases/products/create-product.use-case'
import { UpdateProductUseCase } from '#application/use-cases/products/update-product.use-case'
import { DeleteProductUseCase } from '#application/use-cases/products/delete-product.use-case'
import { ListProductsUseCase } from '#application/use-cases/products/list-products.use-case'
import { GetProductUseCase } from '#application/use-cases/products/get-product.use-case'

test.group('Product Use Cases', (group) => {
  let db: InMemoryDatabase
  let productRepo: InMemoryProductRepository

  group.each.setup(() => {
    db = new InMemoryDatabase()
    productRepo = new InMemoryProductRepository(db)
  })

  group.each.teardown(() => {
    db.clearAll()
  })

  // ── CreateProductUseCase ───────────────────────────────────────────────────

  test('CreateProductUseCase: should create a product', async ({ assert }) => {
    const useCase = new CreateProductUseCase(productRepo)
    const product = await useCase.execute({ name: 'Widget', amount: 1500 })

    assert.equal(product.name, 'Widget')
    assert.equal(product.amount.cents, 1500)
    assert.isTrue(product.isActive)
    assert.isDefined(product.id)
  })

  test('CreateProductUseCase: should throw when amount is negative', async ({ assert }) => {
    const useCase = new CreateProductUseCase(productRepo)
    await assert.rejects(() => useCase.execute({ name: 'Bad', amount: -1 }), /non-negative/i)
  })

  // ── UpdateProductUseCase ───────────────────────────────────────────────────

  test('UpdateProductUseCase: should update product name and amount', async ({ assert }) => {
    const createUseCase = new CreateProductUseCase(productRepo)
    const created = await createUseCase.execute({ name: 'Widget', amount: 1500 })

    const updateUseCase = new UpdateProductUseCase(productRepo)
    const updated = await updateUseCase.execute(created.id!, { name: 'Gadget', amount: 2000 })

    assert.equal(updated.name, 'Gadget')
    assert.equal(updated.amount.cents, 2000)
  })

  test('UpdateProductUseCase: should throw 404 when product not found', async ({ assert }) => {
    const useCase = new UpdateProductUseCase(productRepo)
    await assert.rejects(() => useCase.execute(9999, { name: 'Ghost' }), /not found/i)
  })

  // ── DeleteProductUseCase ───────────────────────────────────────────────────

  test('DeleteProductUseCase: should delete an existing product', async ({ assert }) => {
    const createUseCase = new CreateProductUseCase(productRepo)
    const created = await createUseCase.execute({ name: 'Widget', amount: 1500 })

    const deleteUseCase = new DeleteProductUseCase(productRepo)
    await deleteUseCase.execute(created.id!)

    const found = await productRepo.findById(created.id!)
    assert.isNull(found)
  })

  test('DeleteProductUseCase: should throw 404 when product not found', async ({ assert }) => {
    const useCase = new DeleteProductUseCase(productRepo)
    await assert.rejects(() => useCase.execute(9999), /not found/i)
  })

  // ── ListProductsUseCase ────────────────────────────────────────────────────

  test('ListProductsUseCase: should return all products', async ({ assert }) => {
    const createUseCase = new CreateProductUseCase(productRepo)
    await createUseCase.execute({ name: 'A', amount: 100 })
    await createUseCase.execute({ name: 'B', amount: 200 })

    const listUseCase = new ListProductsUseCase(productRepo)
    const products = await listUseCase.execute()
    assert.lengthOf(products, 2)
  })

  // ── GetProductUseCase ──────────────────────────────────────────────────────

  test('GetProductUseCase: should return product by id', async ({ assert }) => {
    const createUseCase = new CreateProductUseCase(productRepo)
    const created = await createUseCase.execute({ name: 'Widget', amount: 1500 })

    const getUseCase = new GetProductUseCase(productRepo)
    const found = await getUseCase.execute(created.id!)
    assert.equal(found.name, 'Widget')
  })

  test('GetProductUseCase: should throw 404 when product not found', async ({ assert }) => {
    const useCase = new GetProductUseCase(productRepo)
    await assert.rejects(() => useCase.execute(9999), /not found/i)
  })
})
