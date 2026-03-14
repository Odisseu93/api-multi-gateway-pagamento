import { test } from '@japa/runner'
import { Gateway1Adapter } from '#infrastructure/gateways/adapters/gateway1.adapter'
import { Money } from '#domain/value-objects/money.vo'
import type { ChargeInput } from '#infrastructure/gateways/contracts/i-payment-gateway.adapter'
import { httpClientMock } from '#tests/mocks/http-client.mock'

function makeChargeInput(overrides: Partial<ChargeInput> = {}): ChargeInput {
  return {
    amount: overrides.amount ?? Money.fromCents(1000),
    name: overrides.name ?? 'Test User',
    email: overrides.email ?? 'test@example.com',
    cardNumber: overrides.cardNumber ?? '5569000000006063',
    cvv: overrides.cvv ?? '010',
  }
}

test.group('Gateway1Adapter', () => {
  // ──────────────────────────────────────────────────────────────────────────
  // charge()
  // ──────────────────────────────────────────────────────────────────────────

  test('charge() should return externalId and status "paid" on success', async ({ assert }) => {
    // First call: login → Second call: charge
    const httpMock = httpClientMock([
      { data: { ok: true, token: 'fake-bearer-token' } },
      { data: { ok: true, id: 'ext-123', status: 'paid' } },
    ])

    const adapter = new Gateway1Adapter(httpMock)
    const result = await adapter.charge(makeChargeInput())

    assert.equal(result.externalId, 'ext-123')
    assert.equal(result.status, 'paid')
  })

  test('charge() should return status "failed" when the gateway returns an error', async ({
    assert,
  }) => {
    // Login OK, charge fails
    const httpMock = httpClientMock([
      { data: { ok: true, token: 'fake-bearer-token' } },
      { data: { ok: false, error: 'invalid card' } },
    ])

    const adapter = new Gateway1Adapter(httpMock)
    const result = await adapter.charge(makeChargeInput())

    assert.equal(result.status, 'failed')
    assert.equal(result.externalId, '')
  })

  test('charge() should throw AppError when login fails', async ({ assert }) => {
    const httpMock = httpClientMock([{ data: { ok: false, error: 'unauthorized' } }])

    const adapter = new Gateway1Adapter(httpMock)
    await assert.rejects(
      () => adapter.charge(makeChargeInput()),
      /Failed to authenticate with Gateway 1/i
    )
  })

  test('charge() should reuse the bearer token on subsequent calls', async ({ assert }) => {
    const httpMock = httpClientMock([
      { data: { ok: true, token: 'cached-token' } },
      { data: { ok: true, id: 'ext-1', status: 'paid' } },
      { data: { ok: true, id: 'ext-2', status: 'paid' } },
    ])

    const adapter = new Gateway1Adapter(httpMock)
    await adapter.charge(makeChargeInput()) // login + charge = 2 calls
    await adapter.charge(makeChargeInput()) // only charge = 1 call (token cached)

    // Total post calls: 1 (login) + 1 (charge) + 1 (charge) = 3
    assert.equal(httpMock.getCallCount(), 3)
  })

  // ──────────────────────────────────────────────────────────────────────────
  // refund()
  // ──────────────────────────────────────────────────────────────────────────

  test('refund() should return true when the gateway confirms the refund', async ({ assert }) => {
    const httpMock = httpClientMock([
      { data: { ok: true, token: 'fake-token' } },
      { data: { ok: true, body: {} } },
    ])

    const adapter = new Gateway1Adapter(httpMock)
    const result = await adapter.refund('ext-123')

    assert.isTrue(result)
  })

  test('refund() should return false when the gateway rejects the refund', async ({ assert }) => {
    const httpMock = httpClientMock([
      { data: { ok: true, token: 'fake-token' } },
      { data: { ok: false, error: 'already refunded' } },
    ])

    const adapter = new Gateway1Adapter(httpMock)
    const result = await adapter.refund('ext-123')

    assert.isFalse(result)
  })
})
