import { test } from '@japa/runner'
import { CardLastNumbers } from '#domain/value-objects/card-last-numbers.vo'

test.group('CardLastNumbers Value Object', () => {
  test('should create with exactly 4 digits', ({ assert }) => {
    const card = CardLastNumbers.fromString('6063')
    assert.equal(card.value, '6063')
  })

  test('should extract last 4 digits from a full card number', ({ assert }) => {
    const card = CardLastNumbers.fromFullCardNumber('5569000000006063')
    assert.equal(card.value, '6063')
  })

  test('should reject string with less than 4 characters', ({ assert }) => {
    assert.throws(
      () => CardLastNumbers.fromString('123'),
      'Card last numbers must be exactly 4 digits'
    )
  })

  test('should reject string with more than 4 characters', ({ assert }) => {
    assert.throws(
      () => CardLastNumbers.fromString('12345'),
      'Card last numbers must be exactly 4 digits'
    )
  })

  test('should reject string containing non-digit characters', ({ assert }) => {
    assert.throws(
      () => CardLastNumbers.fromString('12ab'),
      'Card last numbers must be exactly 4 digits'
    )
  })

  test('should reject full card number shorter than 4 digits', ({ assert }) => {
    assert.throws(
      () => CardLastNumbers.fromFullCardNumber('123'),
      'Card number must have at least 4 digits'
    )
  })

  test('should compare equal values as equal', ({ assert }) => {
    const a = CardLastNumbers.fromString('6063')
    const b = CardLastNumbers.fromString('6063')
    assert.isTrue(a.equals(b))
  })

  test('should compare different values as not equal', ({ assert }) => {
    const a = CardLastNumbers.fromString('6063')
    const b = CardLastNumbers.fromString('1234')
    assert.isFalse(a.equals(b))
  })
})
