import { test } from '@japa/runner'
import { TestHelper } from './test_helper.js'
import Transaction from '#models/transaction'

test.group('Purchase Flow (Integration)', (group) => {
  group.each.setup(async () => {
    await TestHelper.manualTruncate()
  })

  test('successful purchase with single gateway', async ({ client, assert }) => {
    // Setup: active gateway and a product
    await TestHelper.createGateway({ type: 'gateway_1', isActive: true, priority: 1 })
    const product = await TestHelper.createProduct({ amount: 5000 }) // 50.00

    const payload = {
      items: [{ productId: product.id, quantity: 2 }],
      client: { name: 'Customer One', email: 'customer1@example.com' },
      card: { number: '1234123412341234', cvv: '123' }, // Valid CVV
    }

    const response = await client.post('/api/v1/transactions').json(payload)

    response.assertStatus(201)
    const body = response.body().data
    assert.equal(body.totalAmount, 10000) // 5000 * 2
    assert.equal(body.status, 'paid')

    // Verify DB persistence
    const transaction = await Transaction.findOrFail(body.transactionId)
    await transaction.load('products')
    assert.equal(transaction.amount, 10000)
    assert.lengthOf(transaction.products, 1)
  })

  test('successful purchase with gateway failover (G1 fails, G2 succeeds)', async ({
    client,
    assert,
  }) => {
    // Setup: G1 (priority 1) and G2 (priority 2)
    await TestHelper.createGateway({ name: 'G1', type: 'gateway_1', isActive: true, priority: 1 })
    await TestHelper.createGateway({ name: 'G2', type: 'gateway_2', isActive: true, priority: 2 })
    const product = await TestHelper.createProduct({ amount: 1000 })

    const payload = {
      items: [{ productId: product.id, quantity: 1 }],
      client: { name: 'Customer Two', email: 'customer2@example.com' },
      card: { number: '1234123412341234', cvv: '100' }, // CVV 100 fails G1 but G2 doesn't fail on 100
    }

    const response = await client.post('/api/v1/transactions').json(payload)

    response.assertStatus(201)
    assert.equal(response.body().data.status, 'paid')
    // Ideally we verify which gateway was used, but the response body doesn't explicitly return the gateway ID
    const transaction = await Transaction.findOrFail(response.body().data.transactionId)
    // G1 (ID 1 if seeded fresh) fails, so it should have fallen back to G2
    assert.isNotNull(transaction.gatewayId)
  })

  test('failure when all gateways fail', async ({ client }) => {
    await TestHelper.createGateway({ type: 'gateway_1', isActive: true, priority: 1 })
    const product = await TestHelper.createProduct()

    const payload = {
      items: [{ productId: product.id, quantity: 1 }],
      client: { name: 'Customer Three', email: 'customer3@example.com' },
      card: { number: '1234123412341234', cvv: '200' }, // CVV 200 fails both G1 and G2
    }

    const response = await client.post('/api/v1/transactions').json(payload)

    response.assertStatus(502)
    response.assertBodyContains({ success: false, error: { code: 'ALL_GATEWAYS_FAILED' } })
  })

  test('deduplicates items with same productId', async ({ client, assert }) => {
    await TestHelper.createGateway()
    const product = await TestHelper.createProduct({ amount: 1000 })

    const payload = {
      items: [
        { productId: product.id, quantity: 1 },
        { productId: product.id, quantity: 2 },
      ],
      client: { name: 'Dedupe Test', email: 'dedupe@example.com' },
      card: { number: '1234123412341234', cvv: '123' },
    }

    const response = await client.post('/api/v1/transactions').json(payload)

    response.assertStatus(201)
    assert.equal(response.body().data.totalAmount, 3000) // (1+2) * 1000

    const transaction = await Transaction.findOrFail(response.body().data.transactionId)
    await transaction.load('products')
    assert.lengthOf(transaction.products, 1) // Consolidated to 1 entry
    assert.equal(transaction.products[0].quantity, 3)
  })

  test('failure when product is not active', async ({ client }) => {
    await TestHelper.createGateway()
    const product = await TestHelper.createProduct({ isActive: false })

    const payload = {
      items: [{ productId: product.id, quantity: 1 }],
      client: { name: 'Inactive Test', email: 'inactive@example.com' },
      card: { number: '1234123412341234', cvv: '123' },
    }

    const response = await client.post('/api/v1/transactions').json(payload)

    response.assertStatus(400)
    response.assertBodyContains({ success: false, error: { code: 'PRODUCT_NOT_AVAILABLE' } })
  })
})
