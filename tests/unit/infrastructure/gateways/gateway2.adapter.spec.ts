import { test } from '@japa/runner'
import { Gateway2Adapter } from '#infrastructure/gateways/adapters/gateway2.adapter'
import { Money } from '#domain/value-objects/money.vo'
import type { ChargeInput } from '#infrastructure/gateways/contracts/i-payment-gateway.adapter'
import { httpClientMock } from '#tests/mocks/http-client.mock'

function makeChargeInput(overrides: Partial<ChargeInput> = {}): ChargeInput {
  return {
    amount: overrides.amount ?? Money.fromCents(2500),
    name: overrides.name ?? 'Test User',
    email: overrides.email ?? 'test@example.com',
    cardNumber: overrides.cardNumber ?? '5569000000006063',
    cvv: overrides.cvv ?? '010',
  }
}

test.group('Gateway2Adapter', () => {
  // ──────────────────────────────────────────────────────────────────────────
  // charge()
  // ──────────────────────────────────────────────────────────────────────────

  test('charge() should return externalId and status "paid" on success', async ({
    assert,
  }) => {
    const httpMock = httpClientMock([{ data: { ok: true, id: 'gw2-ext-456', status: 'approved' } }])

    const adapter = new Gateway2Adapter(httpMock)
    const result = await adapter.charge(makeChargeInput())

    assert.equal(result.externalId, 'gw2-ext-456')
    assert.equal(result.status, 'paid')
  })

  test('charge() should return status "failed" when the gateway returns an error', async ({
    assert,
  }) => {
    const httpMock = httpClientMock([{ data: { ok: false, error: 'cartão inválido' } }])

    const adapter = new Gateway2Adapter(httpMock)
    const result = await adapter.charge(makeChargeInput())

    assert.equal(result.status, 'failed')
    assert.equal(result.externalId, '')
  })

  test('charge() should not make a login call (stateless)', async ({ assert }) => {
    const httpMock = httpClientMock([{ data: { ok: true, id: 'gw2-ext', status: 'approved' } }])

    const adapter = new Gateway2Adapter(httpMock)
    await adapter.charge(makeChargeInput())

    // Only 1 call for charge (no login step)
    assert.equal(httpMock.getCallCount(), 1)
  })

  // ──────────────────────────────────────────────────────────────────────────
  // refund()
  // ──────────────────────────────────────────────────────────────────────────

  test('refund() should return true when the gateway confirms the refund', async ({ assert }) => {
    const httpMock = httpClientMock([{ data: { ok: true, body: {} } }])

    const adapter = new Gateway2Adapter(httpMock)
    const result = await adapter.refund('gw2-ext-456')

    assert.isTrue(result)
  })

  test('refund() should return false when the gateway rejects the refund', async ({ assert }) => {
    const httpMock = httpClientMock([{ data: { ok: false, error: 'not found' } }])

    const adapter = new Gateway2Adapter(httpMock)
    const result = await adapter.refund('gw2-ext-456')

    assert.isFalse(result)
  })
})
