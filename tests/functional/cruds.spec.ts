import { test } from '@japa/runner'
import { TestHelper } from './test_helper.js'
import User from '#models/user'
import Product from '#models/product'

test.group('CRUD Operations (Integration)', (group) => {
  group.each.setup(async () => {
    await TestHelper.manualTruncate()
  })

  // Users CRUD (Admin/Manager)
  test('ADMIN can create, update and soft-delete a user', async ({ client, assert }) => {
    const admin = await TestHelper.createAdmin()
    const authHeader = await TestHelper.getAuthHeader(client, admin)

    // Create
    const createResponse = await client.post('/api/v1/users').headers(authHeader).json({
      name: 'New User',
      email: 'newuser@example.com',
      password: 'password123',
      role: 'USER',
    })
    createResponse.assertStatus(201)
    const userId = createResponse.body().data.id

    // Update
    const updateResponse = await client.put(`/api/v1/users/${userId}`).headers(authHeader).json({
      name: 'Updated Name',
    })
    updateResponse.assertStatus(200)

    // Destroy (Soft Delete)
    const deleteResponse = await client.delete(`/api/v1/users/${userId}`).headers(authHeader)
    deleteResponse.assertStatus(204)

    // Verify it's soft-deleted
    const user = await User.findOrFail(userId)
    assert.isNotNull(user.deletedAt)
  })

  // Products CRUD (Admin/Manager/Finance)
  test('FINANCE can create and update products', async ({ client }) => {
    const finance = await TestHelper.createFinance()
    const authHeader = await TestHelper.getAuthHeader(client, finance)

    // Create
    const createResponse = await client.post('/api/v1/products').headers(authHeader).json({
      name: 'Integration Product',
      amount: 4500,
      isActive: true,
    })
    createResponse.assertStatus(201)
    const productId = createResponse.body().data.id

    // Update
    await (
      await client.put(`/api/v1/products/${productId}`).headers(authHeader).json({
        amount: 5000,
      })
    ).assertStatus(200)

    // Check soft-delete requires ADMIN/MANAGER (FINANCE only has GET/POST/PUT in routes.ts use logic)
    // Wait, let's check routes.ts for product destroy role
    // .delete('/:id', [() => import('#controllers/product_controller'), 'destroy'])
    // .use(middleware.roles({ roles: [Role.ADMIN, Role.MANAGER] }))

    await (
      await client.delete(`/api/v1/products/${productId}`).headers(authHeader)
    ).assertStatus(403)
  })

  test('MANAGER can soft-delete a product', async ({ client, assert }) => {
    const manager = await TestHelper.createManager()
    const authHeader = await TestHelper.getAuthHeader(client, manager)
    const product = await TestHelper.createProduct()

    await (
      await client.delete(`/api/v1/products/${product.id}`).headers(authHeader)
    ).assertStatus(204)

    const p = await Product.findOrFail(product.id)
    assert.isNotNull(p.deletedAt)
  })

  // Gateways (Admin only)
  test('ADMIN can toggle gateway status and change priority', async ({ client, assert }) => {
    const admin = await TestHelper.createAdmin()
    const authHeader = await TestHelper.getAuthHeader(client, admin)
    const gateway = await TestHelper.createGateway({ isActive: true, priority: 10 })

    // Toggle
    await (
      await client.patch(`/api/v1/gateways/${gateway.id}/toggle`).headers(authHeader)
    ).assertStatus(200)
    await gateway.refresh()
    assert.isFalse(Boolean(gateway.isActive))

    // Priority
    await (
      await client.patch(`/api/v1/gateways/${gateway.id}/priority`).headers(authHeader).json({
        priority: 5,
      })
    ).assertStatus(200)
    await gateway.refresh()
    assert.equal(gateway.priority, 5)
  })
})
