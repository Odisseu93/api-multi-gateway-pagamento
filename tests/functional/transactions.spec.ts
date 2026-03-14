import { test } from '@japa/runner'
import { TestHelper } from './test_helper.js'
import Transaction from '#models/transaction'

test.group('Transactions (Integration)', (group) => {
  group.each.setup(async () => {
    await TestHelper.manualTruncate()
  })

  test('ADMIN can list all transactions', async ({ client, assert }) => {
    const admin = await TestHelper.createAdmin()
    const authHeader = await TestHelper.getAuthHeader(client, admin)

    // Create a transaction via API
    await TestHelper.createGateway()
    const product = await TestHelper.createProduct()
    await client.post('/api/v1/transactions').json({
      items: [{ productId: product.id, quantity: 1 }],
      client: { name: 'John Doe', email: 'john@example.com' },
      card: { number: '1234123412341234', cvv: '123' },
    })

    const response = await client.get('/api/v1/transactions').headers(authHeader)

    response.assertStatus(200)
    assert.isArray(response.body().data)
    assert.lengthOf(response.body().data, 1)
  })

  test('ADMIN can show transaction details', async ({ client, assert }) => {
    const admin = await TestHelper.createAdmin()
    const authHeader = await TestHelper.getAuthHeader(client, admin)

    await TestHelper.createGateway()
    const product = await TestHelper.createProduct()
    const createResponse = await client.post('/api/v1/transactions').json({
      items: [{ productId: product.id, quantity: 1 }],
      client: { name: 'John Doe', email: 'john@example.com' },
      card: { number: '1234123412341234', cvv: '123' },
    })

    const transactionId = createResponse.body().data.transactionId
    const response = await client.get(`/api/v1/transactions/${transactionId}`).headers(authHeader)

    response.assertStatus(200)
    assert.equal(response.body().data.transaction.id, transactionId)
    assert.exists(response.body().data.products)
  })

  test('FINANCE can refund a transaction', async ({ client, assert }) => {
    const finance = await TestHelper.createFinance()
    const authHeader = await TestHelper.getAuthHeader(client, finance)

    // Create a paid transaction
    await TestHelper.createGateway()
    const product = await TestHelper.createProduct()
    const createResponse = await client.post('/api/v1/transactions').json({
      items: [{ productId: product.id, quantity: 1 }],
      client: { name: 'John Doe', email: 'john@example.com' },
      card: { number: '1234123412341234', cvv: '123' },
    })

    const transactionId = createResponse.body().data.transactionId

    // Refund
    const response = await client.post(`/api/v1/transactions/${transactionId}/refund`).headers(authHeader)

    response.assertStatus(200)
    assert.equal(response.body().data.status, 'refunded')

    // Verify DB
    const transaction = await Transaction.findOrFail(transactionId)
    assert.equal(transaction.status, 'refunded')
  })
})
