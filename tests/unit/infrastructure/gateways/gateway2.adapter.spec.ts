import { test } from '@japa/runner'
import { Gateway2Adapter } from '#infrastructure/gateways/adapters/gateway2.adapter'
import { Money } from '#domain/value-objects/money.vo'
import type { ChargeInput } from '#infrastructure/gateways/contracts/i-payment-gateway.adapter'

function makeChargeInput(overrides: Partial<ChargeInput> = {}): ChargeInput {
  return {
    amount: overrides.amount ?? Money.fromCents(2500),
    name: overrides.name ?? 'Test User',
    email: overrides.email ?? 'test@example.com',
    cardNumber: overrides.cardNumber ?? '5569000000006063',
    cvv: overrides.cvv ?? '010',
  }
}

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

test.group('Gateway2Adapter', (group) => {
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
    globalThis.fetch = mockFetch([{ ok: true, body: { id: 'gw2-ext-456', status: 'approved' } }])

    const adapter = new Gateway2Adapter()
    const result = await adapter.charge(makeChargeInput())

    assert.equal(result.externalId, 'gw2-ext-456')
    assert.equal(result.status, 'paid')
  })

  test('charge() should return status "failed" when the gateway returns an error', async ({
    assert,
  }) => {
    globalThis.fetch = mockFetch([{ ok: false, body: { error: 'cartão inválido' } }])

    const adapter = new Gateway2Adapter()
    const result = await adapter.charge(makeChargeInput())

    assert.equal(result.status, 'failed')
    assert.equal(result.externalId, '')
  })

  test('charge() should not make a login call (stateless)', async ({ assert }) => {
    let fetchCallCount = 0
    globalThis.fetch = async (_url: string | URL | Request, _init?: RequestInit) => {
      fetchCallCount++
      return new Response(JSON.stringify({ id: 'gw2-ext', status: 'approved' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const adapter = new Gateway2Adapter()
    await adapter.charge(makeChargeInput())

    // Only 1 call for charge (no login step)
    assert.equal(fetchCallCount, 1)
  })

  // ──────────────────────────────────────────────────────────────────────────
  // refund()
  // ──────────────────────────────────────────────────────────────────────────

  test('refund() should return true when the gateway confirms the refund', async ({ assert }) => {
    globalThis.fetch = mockFetch([{ ok: true, body: {} }])

    const adapter = new Gateway2Adapter()
    const result = await adapter.refund('gw2-ext-456')

    assert.isTrue(result)
  })

  test('refund() should return false when the gateway rejects the refund', async ({ assert }) => {
    globalThis.fetch = mockFetch([{ ok: false, body: { error: 'not found' } }])

    const adapter = new Gateway2Adapter()
    const result = await adapter.refund('gw2-ext-456')

    assert.isFalse(result)
  })
})
