import type { IPaymentGatewayAdapter, ChargeInput, ChargeOutput } from '#infrastructure/gateways/contracts/i-payment-gateway.adapter'
import { AppError } from '#shared/errors/app-error'
import env from '#start/env'

interface Gateway1ChargeResponse {
  id: string
  status?: string
}

interface Gateway1LoginResponse {
  token: string
}

/**
 * Adapter for Gateway 1 (http://localhost:3001).
 *
 * Auth flow: POST /login with { email, token } → receives Bearer token.
 * The Bearer token is cached per-instance and re-fetched on the first request.
 *
 * charge() → POST /transactions
 * refund() → POST /transactions/:id/charge_back
 */
export class Gateway1Adapter implements IPaymentGatewayAdapter {
  private baseUrl: string
  private bearerToken: string | null = null

  constructor() {
    this.baseUrl = env.get('GATEWAY_1_URL')
  }

  private async login(): Promise<void> {
    const response = await fetch(`${this.baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: env.get('GATEWAY_1_EMAIL'),
        token: env.get('GATEWAY_1_TOKEN').release(),
      }),
    })

    if (!response.ok) {
      throw new AppError(
        'Failed to authenticate with Gateway 1',
        502,
        'GATEWAY_1_AUTH_ERROR'
      )
    }

    const data = (await response.json()) as Gateway1LoginResponse
    this.bearerToken = data.token
  }

  private async ensureAuthenticated(): Promise<void> {
    if (!this.bearerToken) {
      await this.login()
    }
  }

  async charge(input: ChargeInput): Promise<ChargeOutput> {
    await this.ensureAuthenticated()

    const response = await fetch(`${this.baseUrl}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.bearerToken}`,
      },
      body: JSON.stringify({
        amount: input.amount.cents,
        name: input.name,
        email: input.email,
        cardNumber: input.cardNumber,
        cvv: input.cvv,
      }),
    })

    if (!response.ok) {
      return { externalId: '', status: 'failed' }
    }

    const data = (await response.json()) as Gateway1ChargeResponse

    return {
      externalId: data.id,
      status: 'paid',
    }
  }

  async refund(externalId: string): Promise<boolean> {
    await this.ensureAuthenticated()

    const response = await fetch(`${this.baseUrl}/transactions/${externalId}/charge_back`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.bearerToken}`,
      },
    })

    return response.ok
  }
}
