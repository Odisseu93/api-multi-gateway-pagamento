import { test } from '@japa/runner'
import { Gateway1Adapter } from '#infrastructure/gateways/adapters/gateway1.adapter'
import { Money } from '#domain/value-objects/money.vo'
import type { ChargeInput } from '#infrastructure/gateways/contracts/i-payment-gateway.adapter'

function makeChargeInput(overrides: Partial<ChargeInput> = {}): ChargeInput {
  return {
    amount: overrides.amount ?? Money.fromCents(1000),
    name: overrides.name ?? 'Test User',
    email: overrides.email ?? 'test@example.com',
    cardNumber: overrides.cardNumber ?? '5569000000006063',
    cvv: overrides.cvv ?? '010',
  }
}

// Helper to build a mock Response object
function mockFetch(responses: Array<{ ok: boolean; body: unknown }>) {
  let callCount = 0
  return async (_url: string | URL | Request, _init?: RequestInit): Promise<Response> => {
    const resp = responses[callCount] ?? responses[responses.length - 1]
    callCount++
    return new Response(JSON.stringify(resp.body), {
      status: resp.ok ? 200 : 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

test.group('Gateway1Adapter', (group) => {
  let originalFetch: typeof fetch

  group.each.setup(() => {
    originalFetch = globalThis.fetch
  })

  group.each.teardown(() => {
    globalThis.fetch = originalFetch
  })

  // ──────────────────────────────────────────────────────────────────────────
  // charge()
  // ──────────────────────────────────────────────────────────────────────────

  test('charge() should return externalId and status "paid" on success', async ({
    assert,
  }) => {
    // First call: login → Second call: charge
    globalThis.fetch = mockFetch([
      { ok: true, body: { token: 'fake-bearer-token' } },
      { ok: true, body: { id: 'ext-123', status: 'paid' } },
    ])

    const adapter = new Gateway1Adapter()
    const result = await adapter.charge(makeChargeInput())

    assert.equal(result.externalId, 'ext-123')
    assert.equal(result.status, 'paid')
  })

  test('charge() should return status "failed" when the gateway returns an error', async ({
    assert,
  }) => {
    // Login OK, charge fails
    globalThis.fetch = mockFetch([
      { ok: true, body: { token: 'fake-bearer-token' } },
      { ok: false, body: { error: 'invalid card' } },
    ])

    const adapter = new Gateway1Adapter()
    const result = await adapter.charge(makeChargeInput())

    assert.equal(result.status, 'failed')
    assert.equal(result.externalId, '')
  })

  test('charge() should throw AppError when login fails', async ({ assert }) => {
    globalThis.fetch = mockFetch([{ ok: false, body: { error: 'unauthorized' } }])

    const adapter = new Gateway1Adapter()
    await assert.rejects(
      () => adapter.charge(makeChargeInput()),
      /Failed to authenticate with Gateway 1/i
    )
  })

  test('charge() should reuse the bearer token on subsequent calls', async ({ assert }) => {
    let fetchCallCount = 0
    globalThis.fetch = async (_url: string | URL | Request, _init?: RequestInit) => {
      fetchCallCount++
      const body =
        fetchCallCount === 1
          ? { token: 'cached-token' }
          : { id: `ext-${fetchCallCount}`, status: 'paid' }
      return new Response(JSON.stringify(body), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const adapter = new Gateway1Adapter()
    await adapter.charge(makeChargeInput()) // login + charge = 2 calls
    await adapter.charge(makeChargeInput()) // only charge = 1 call (token cached)

    // Total fetch calls: 1 (login) + 1 (charge) + 1 (charge) = 3
    assert.equal(fetchCallCount, 3)
  })

  // ──────────────────────────────────────────────────────────────────────────
  // refund()
  // ──────────────────────────────────────────────────────────────────────────

  test('refund() should return true when the gateway confirms the refund', async ({ assert }) => {
    globalThis.fetch = mockFetch([
      { ok: true, body: { token: 'fake-token' } },
      { ok: true, body: {} },
    ])

    const adapter = new Gateway1Adapter()
    const result = await adapter.refund('ext-123')

    assert.isTrue(result)
  })

  test('refund() should return false when the gateway rejects the refund', async ({ assert }) => {
    globalThis.fetch = mockFetch([
      { ok: true, body: { token: 'fake-token' } },
      { ok: false, body: { error: 'already refunded' } },
    ])

    const adapter = new Gateway1Adapter()
    const result = await adapter.refund('ext-123')

    assert.isFalse(result)
  })
})
