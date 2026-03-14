import type {
  IPaymentGatewayAdapter,
  ChargeInput,
  ChargeOutput,
} from '#infrastructure/gateways/contracts/i-payment-gateway.adapter'
import { AppError } from '#shared/errors/app-error'
import env from '#start/env'
import { type IHttpClient } from '#infrastructure/http/client/contracts/i-http-client'

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

  constructor(private readonly httpClient: IHttpClient) {
    this.baseUrl = env.get('GATEWAY_1_URL')
  }
  private async login(): Promise<void> {
    const response = await this.httpClient.post(
      `${this.baseUrl}/login`,
      {
        email: env.get('GATEWAY_1_EMAIL'),
        token: env.get('GATEWAY_1_TOKEN').release(),
      },
      {
        headers: { 'Content-Type': 'application/json' },
      }
    )

    const data = response.data as Gateway1LoginResponse
    if (!data?.token) {
      throw new AppError('Failed to authenticate with Gateway 1', 502, 'GATEWAY_1_AUTH_ERROR')
    }

    this.bearerToken = data.token
  }

  private async ensureAuthenticated(): Promise<void> {
    if (!this.bearerToken) {
      await this.login()
    }
  }

  async charge(input: ChargeInput): Promise<ChargeOutput> {
    await this.ensureAuthenticated()

    try {
      const response = await this.httpClient.post(
        `${this.baseUrl}/transactions`,
        {
          amount: input.amount.cents,
          name: input.name,
          email: input.email,
          cardNumber: input.cardNumber,
          cvv: input.cvv,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.bearerToken}`,
          },
        }
      )

      const data = response.data as Gateway1ChargeResponse

      if (!data?.id) {
        return { externalId: '', status: 'failed' }
      }

      return {
        externalId: data.id,
        status: 'paid',
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        // Token expired? Re-login once and retry
        await this.login()
        return this.charge(input)
      }
      return { externalId: '', status: 'failed' }
    }
  }

  async refund(externalId: string): Promise<boolean> {
    await this.ensureAuthenticated()

    try {
      const response = await this.httpClient.post(
        `${this.baseUrl}/transactions/${externalId}/charge_back`,
        null,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.bearerToken}`,
          },
        }
      )

      // Gateway 1 returns 201 Created for charge back
      return (
        response?.status === 201 ||
        response?.status === 200 ||
        response?.data?.ok === true ||
        !!response?.data?.id
      )
    } catch (error: any) {
      if (error.response?.status === 401) {
        await this.login()
        return this.refund(externalId)
      }
      return false
    }
  }
}
