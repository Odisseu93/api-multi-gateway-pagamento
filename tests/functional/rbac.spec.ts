import { test } from '@japa/runner'
import { TestHelper } from './test_helper.js'

test.group('RBAC (Integration)', (group) => {
  group.each.setup(async () => {
    await TestHelper.manualTruncate()
  })
  test('ADMIN can access gateway management', async ({ client }) => {
    const admin = await TestHelper.createAdmin()
    const authHeader = await TestHelper.getAuthHeader(client, admin)

    const response = await client.get('/api/v1/gateways').headers(authHeader)
    response.assertStatus(200)
  })

  test('MANAGER cannot access gateway management', async ({ client }) => {
    const manager = await TestHelper.createManager()
    const authHeader = await TestHelper.getAuthHeader(client, manager)

    const response = await client.get('/api/v1/gateways').headers(authHeader)
    response.assertStatus(403) // Forbidden
  })

  test('MANAGER can manage users', async ({ client }) => {
    const manager = await TestHelper.createManager()
    const authHeader = await TestHelper.getAuthHeader(client, manager)

    const response = await client.get('/api/v1/users').headers(authHeader)
    response.assertStatus(200)
  })

  test('FINANCE can manage products but not users', async ({ client }) => {
    const finance = await TestHelper.createFinance()
    const authHeader = await TestHelper.getAuthHeader(client, finance)

    // Can access products
    const productResponse = await client.get('/api/v1/products').headers(authHeader)
    productResponse.assertStatus(200)

    // Cannot access users
    const userResponse = await client.get('/api/v1/users').headers(authHeader)
    userResponse.assertStatus(403)
  })

  test('USER cannot manage products or users', async ({ client }) => {
    const user = await TestHelper.createUser()
    const authHeader = await TestHelper.getAuthHeader(client, user)

    await (await client.get('/api/v1/products').headers(authHeader)).assertStatus(403)
    await (await client.get('/api/v1/users').headers(authHeader)).assertStatus(403)
  })

  test('FINANCE can access refunds', async ({ client }) => {
    const finance = await TestHelper.createFinance()
    const authHeader = await TestHelper.getAuthHeader(client, finance)

    const response = await client.get('/api/v1/refunds').headers(authHeader)
    response.assertStatus(200)
  })

  test('USER can see transactions and clients (as specified in routes)', async ({ client }) => {
    const user = await TestHelper.createUser()
    const authHeader = await TestHelper.getAuthHeader(client, user)

    await (await client.get('/api/v1/transactions').headers(authHeader)).assertStatus(200)
    await (await client.get('/api/v1/clients').headers(authHeader)).assertStatus(200)
  })

  test('unauthenticated request returns 401', async ({ client }) => {
    const response = await client.get('/api/v1/gateways')
    response.assertStatus(401)
  })
})
