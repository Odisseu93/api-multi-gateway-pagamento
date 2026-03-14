import { test } from '@japa/runner'
import { TestHelper } from './test_helper.js'

test.group('Auth (Integration)', (group) => {
  group.each.setup(async () => {
    await TestHelper.manualTruncate()
  })
  // Reset database or use transactions if needed
  // group.each.setup(async () => { ... })

  test('login success with valid credentials', async ({ client, assert }) => {
    const user = await TestHelper.createUser({ email: 'auth-success@example.com' })

    const response = await client.post('/api/v1/login').json({
      email: user.email,
      password: 'password123',
    })

    response.assertStatus(200)
    const body = response.body()
    assert.properties(body.data, ['user', 'token'])
    assert.equal(body.data.user.email, user.email)
    assert.notExists(body.data.user.password)
  })

  test('login failure with invalid credentials', async ({ client }) => {
    await TestHelper.createUser({ email: 'auth-fail@example.com' })

    const response = await client.post('/api/v1/login').json({
      email: 'auth-fail@example.com',
      password: 'wrong-password',
    })

    response.assertStatus(401) // Updated to 401
    response.assertBodyContains({ success: false, error: { code: 'UNAUTHENTICATED' } })
  })

  test('login failure with non-existent email', async ({ client }) => {
    const response = await client.post('/api/v1/login').json({
      email: 'non-existent@example.com',
      password: 'some-password',
    })

    response.assertStatus(401)
    response.assertBodyContains({ success: false, error: { code: 'UNAUTHENTICATED' } })
  })

  test('validation error for missing email', async ({ client }) => {
    const response = await client.post('/api/v1/login').json({
      password: 'some-password',
    })

    response.assertStatus(422)
  })
})
