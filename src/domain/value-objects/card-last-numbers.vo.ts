export class CardLastNumbers {
  public readonly value: string

  private constructor(value: string) {
    this.value = value
  }

  static fromString(digits: string): CardLastNumbers {
    if (!/^\d{4}$/.test(digits)) {
      throw new Error('Card last numbers must be exactly 4 digits')
    }
    return new CardLastNumbers(digits)
  }

  static fromFullCardNumber(cardNumber: string): CardLastNumbers {
    const digitsOnly = cardNumber.replace(/\D/g, '')
    if (digitsOnly.length < 4) {
      throw new Error('Card number must have at least 4 digits')
    }
    return new CardLastNumbers(digitsOnly.slice(-4))
  }

  equals(other: CardLastNumbers): boolean {
    return this.value === other.value
  }
}
