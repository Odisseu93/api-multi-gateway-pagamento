import type {
  IPaymentGatewayAdapter,
  ChargeInput,
  ChargeOutput,
} from '#infrastructure/gateways/contracts/i-payment-gateway.adapter'
import env from '#start/env'
import { IHttpClient } from '#infrastructure/http/client/contracts/i-http-client'

interface Gateway2ChargeResponse {
  id: string
  status?: string
}

/**
 * Adapter for Gateway 2 (http://localhost:3002).
 *
 * Auth: static headers `Gateway-Auth-Token` and `Gateway-Auth-Secret` sent on every request.
 *
 * charge() → POST /transacoes (Portuguese field names: valor, nome, numeroCartao)
 * refund() → POST /transacoes/reembolso with body { id: externalId }
 */
export class Gateway2Adapter implements IPaymentGatewayAdapter {
  private baseUrl: string

  constructor(private readonly httpClient: IHttpClient) {
    this.baseUrl = env.get('GATEWAY_2_URL')
  }

  private authHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Gateway-Auth-Token': env.get('GATEWAY_2_AUTH_TOKEN').release(),
      'Gateway-Auth-Secret': env.get('GATEWAY_2_AUTH_SECRET').release(),
    }
  }

  async charge(input: ChargeInput): Promise<ChargeOutput> {
    const response = await this.httpClient.post(
      `${this.baseUrl}/transacoes`,
      {
        valor: input.amount.cents,
        nome: input.name,
        email: input.email,
        numeroCartao: input.cardNumber,
        cvv: input.cvv,
      },
      {
        headers: this.authHeaders(),
      }
    )

    const data = response.data as Gateway2ChargeResponse
    if (!data?.id) {
      return { externalId: '', status: 'failed' }
    }

    return {
      externalId: data.id,
      status: 'paid',
    }
  }

  async refund(externalId: string): Promise<boolean> {

    const response = await this.httpClient.post(
      `${this.baseUrl}/transacoes/reembolso`,
      {
        id: externalId,
      },
      {
        headers: this.authHeaders(),
      }
    )

    if (!response?.data?.ok) {
      return false
    }

    return true
  }
}
