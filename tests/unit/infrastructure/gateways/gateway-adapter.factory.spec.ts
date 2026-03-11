import { test } from '@japa/runner'
import { GatewayAdapterFactory } from '#infrastructure/gateways/gateway-adapter.factory'
import { Gateway1Adapter } from '#infrastructure/gateways/adapters/gateway1.adapter'
import { Gateway2Adapter } from '#infrastructure/gateways/adapters/gateway2.adapter'

test.group('GatewayAdapterFactory', () => {
  test('create() should return Gateway1Adapter for type "gateway_1"', ({ assert }) => {
    const adapter = GatewayAdapterFactory.create('gateway_1')
    assert.instanceOf(adapter, Gateway1Adapter)
  })

  test('create() should return Gateway2Adapter for type "gateway_2"', ({ assert }) => {
    const adapter = GatewayAdapterFactory.create('gateway_2')
    assert.instanceOf(adapter, Gateway2Adapter)
  })

  test('create() should throw AppError for unknown type', ({ assert }) => {
    assert.throws(
      () => GatewayAdapterFactory.create('unknown_gateway'),
      /No adapter found for gateway type "unknown_gateway"/i
    )
  })

  test('registeredTypes() should return all registered types', ({ assert }) => {
    const types = GatewayAdapterFactory.registeredTypes()
    assert.includeMembers(types, ['gateway_1', 'gateway_2'])
  })

  test('create() should return independent instances on each call', ({ assert }) => {
    const a = GatewayAdapterFactory.create('gateway_1')
    const b = GatewayAdapterFactory.create('gateway_1')
    assert.notStrictEqual(a, b)
  })
})
