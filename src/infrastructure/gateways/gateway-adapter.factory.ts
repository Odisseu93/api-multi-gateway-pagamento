import type { IPaymentGatewayAdapter } from '#infrastructure/gateways/contracts/i-payment-gateway.adapter'
import { Gateway1Adapter } from '#infrastructure/gateways/adapters/gateway1.adapter'
import { Gateway2Adapter } from '#infrastructure/gateways/adapters/gateway2.adapter'
import { AppError } from '#shared/errors/app-error'

/**
 * Factory that resolves the correct IPaymentGatewayAdapter by the gateway `type` slug.
 *
 * The `type` column in the gateways table must match the keys registered here.
 * Adding a new gateway only requires:
 *   1. Creating a new adapter class implementing IPaymentGatewayAdapter
 *   2. Registering it here with a new type key
 */
export class GatewayAdapterFactory {
  private static readonly adapters: Record<string, () => IPaymentGatewayAdapter> = {
    gateway_1: () => new Gateway1Adapter(),
    gateway_2: () => new Gateway2Adapter(),
  }

  static create(type: string): IPaymentGatewayAdapter {
    const factory = GatewayAdapterFactory.adapters[type]

    if (!factory) {
      throw new AppError(
        `No adapter found for gateway type "${type}"`,
        500,
        'GATEWAY_ADAPTER_NOT_FOUND'
      )
    }

    return factory()
  }

  /**
   * Returns all registered gateway type slugs.
   * Useful for seeding or validation.
   */
  static registeredTypes(): string[] {
    return Object.keys(GatewayAdapterFactory.adapters)
  }
}
