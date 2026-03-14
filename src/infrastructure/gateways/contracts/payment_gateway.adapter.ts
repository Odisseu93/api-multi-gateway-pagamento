import { type Money } from '#domain/value-objects/money.vo'

export interface ChargeInput {
  amount: Money
  name: string
  email: string
  cardNumber: string
  cvv: string
  expiryMonth?: number
  expiryYear?: number
}

export interface ChargeOutput {
  externalId: string
  status: 'paid' | 'failed'
}

export interface IPaymentGatewayAdapter {
  charge(input: ChargeInput): Promise<ChargeOutput>
  refund(externalId: string): Promise<boolean>
}
