import type { IPaymentGatewayAdapter, ChargeInput, ChargeOutput } from '#infrastructure/gateways/contracts/i-payment-gateway.adapter'
import env from '#start/env'

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

  constructor() {
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
    const response = await fetch(`${this.baseUrl}/transacoes`, {
      method: 'POST',
      headers: this.authHeaders(),
      body: JSON.stringify({
        valor: input.amount.cents,
        nome: input.name,
        email: input.email,
        numeroCartao: input.cardNumber,
        cvv: input.cvv,
      }),
    })

    if (!response.ok) {
      return { externalId: '', status: 'failed' }
    }

    const data = (await response.json()) as Gateway2ChargeResponse

    return {
      externalId: data.id,
      status: 'paid',
    }
  }

  async refund(externalId: string): Promise<boolean> {
    const response = await fetch(`${this.baseUrl}/transacoes/reembolso`, {
      method: 'POST',
      headers: this.authHeaders(),
      body: JSON.stringify({ id: externalId }),
    })

    return response.ok
  }
}
