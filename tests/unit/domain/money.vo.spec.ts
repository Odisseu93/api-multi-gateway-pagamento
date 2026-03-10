import { test } from '@japa/runner'
import { Money } from '#domain/value-objects/money.vo'

test.group('Money Value Object', () => {
  test('should create Money with a valid integer value in cents', ({ assert }) => {
    const money = Money.fromCents(1000)
    assert.equal(money.cents, 1000)
  })

  test('should allow zero as a valid amount', ({ assert }) => {
    const money = Money.fromCents(0)
    assert.equal(money.cents, 0)
  })

  test('should reject negative values', ({ assert }) => {
    assert.throws(() => Money.fromCents(-1), 'Money amount must be a non-negative integer')
  })

  test('should reject non-integer values', ({ assert }) => {
    assert.throws(() => Money.fromCents(10.5), 'Money amount must be a non-negative integer')
  })

  test('should add two Money values correctly', ({ assert }) => {
    const a = Money.fromCents(500)
    const b = Money.fromCents(300)
    const result = a.add(b)
    assert.equal(result.cents, 800)
  })

  test('should multiply by quantity correctly', ({ assert }) => {
    const price = Money.fromCents(4990)
    const result = price.multiply(3)
    assert.equal(result.cents, 14970)
  })

  test('should compare equal values as equal', ({ assert }) => {
    const a = Money.fromCents(1000)
    const b = Money.fromCents(1000)
    assert.isTrue(a.equals(b))
  })

  test('should compare different values as not equal', ({ assert }) => {
    const a = Money.fromCents(1000)
    const b = Money.fromCents(2000)
    assert.isFalse(a.equals(b))
  })

  test('should be immutable — add returns a new instance', ({ assert }) => {
    const a = Money.fromCents(500)
    const b = Money.fromCents(300)
    const result = a.add(b)
    assert.notStrictEqual(result, a)
    assert.notStrictEqual(result, b)
    assert.equal(a.cents, 500)
    assert.equal(b.cents, 300)
  })
})
