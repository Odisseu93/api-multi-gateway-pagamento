export class Money {
  public readonly cents: number

  private constructor(cents: number) {
    this.cents = cents
  }

  static fromCents(cents: number): Money {
    if (!Number.isInteger(cents) || cents < 0) {
      throw new Error('Money amount must be a non-negative integer')
    }
    return new Money(cents)
  }

  add(other: Money): Money {
    return Money.fromCents(this.cents + other.cents)
  }

  multiply(quantity: number): Money {
    if (!Number.isInteger(quantity) || quantity < 0) {
      throw new Error('Quantity must be a non-negative integer')
    }
    return Money.fromCents(this.cents * quantity)
  }

  equals(other: Money): boolean {
    return this.cents === other.cents
  }
}
