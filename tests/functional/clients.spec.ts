import { test } from '@japa/runner'
import { TestHelper } from './test_helper.js'

test.group('Clients (Integration)', (group) => {
  group.each.setup(async () => {
    await TestHelper.manualTruncate()
  })

  test('MANAGER can list all clients', async ({ client, assert }) => {
    const manager = await TestHelper.createManager()
    const authHeader = await TestHelper.getAuthHeader(client, manager)

    // Clients are created automatically upon purchase
    await TestHelper.createGateway()
    const product = await TestHelper.createProduct()
    await client.post('/api/v1/transactions').json({
      items: [{ productId: product.id, quantity: 1 }],
      client: { name: 'Client One', email: 'client1@example.com' },
      card: { number: '1234123412341234', cvv: '123' },
    })

    const response = await client.get('/api/v1/clients').headers(authHeader)

    response.assertStatus(200)
    assert.isArray(response.body().data)
    assert.lengthOf(response.body().data, 1)
    assert.equal(response.body().data[0].email, 'client1@example.com')
  })

  test('MANAGER can show client details with transactions', async ({ client, assert }) => {
    const manager = await TestHelper.createManager()
    const authHeader = await TestHelper.getAuthHeader(client, manager)

    await TestHelper.createGateway()
    const product = await TestHelper.createProduct()
    
    // First purchase
    await client.post('/api/v1/transactions').json({
      items: [{ productId: product.id, quantity: 1 }],
      client: { name: 'Client Two', email: 'client2@example.com' },
      card: { number: '1234123412341234', cvv: '123' },
    })

    // Get client id from list
    const listResponse = await client.get('/api/v1/clients').headers(authHeader)
    const clientId = listResponse.body().data[0].id

    const response = await client.get(`/api/v1/clients/${clientId}`).headers(authHeader)

    response.assertStatus(200)
    assert.equal(response.body().data.client.id, clientId)
    assert.exists(response.body().data.transactions)
    assert.lengthOf(response.body().data.transactions, 1)
  })
})
