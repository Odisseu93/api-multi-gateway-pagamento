import { test } from '@japa/runner'
import { TransactionEntity } from '#domain/entities/transaction.entity'
import { TransactionProductEntity } from '#domain/entities/transaction_product.entity'
import { TransactionStatus } from '#domain/enums/transaction_status.enum'
import { Money } from '#domain/value-objects/money.vo'

test.group('Transaction Entity', () => {
  test('canBeRefunded() should return true for paid transactions', ({ assert }) => {
    const transaction = new TransactionEntity({
      id: 1,
      clientId: 1,
      gatewayId: 1,
      externalId: 'ext-123',
      status: TransactionStatus.PAID,
      amount: Money.fromCents(10000),
      cardLastNumbers: '6063',
      createdAt: new Date(),
    })
    assert.isTrue(transaction.canBeRefunded())
  })

  test('canBeRefunded() should return false for pending transactions', ({ assert }) => {
    const transaction = new TransactionEntity({
      id: 2,
      clientId: 1,
      gatewayId: null,
      externalId: null,
      status: TransactionStatus.PENDING,
      amount: Money.fromCents(5000),
      cardLastNumbers: '1234',
      createdAt: new Date(),
    })
    assert.isFalse(transaction.canBeRefunded())
  })

  test('canBeRefunded() should return false for failed transactions', ({ assert }) => {
    const transaction = new TransactionEntity({
      id: 3,
      clientId: 1,
      gatewayId: null,
      externalId: null,
      status: TransactionStatus.FAILED,
      amount: Money.fromCents(5000),
      cardLastNumbers: '1234',
      createdAt: new Date(),
    })
    assert.isFalse(transaction.canBeRefunded())
  })

  test('canBeRefunded() should return false for already refunded transactions', ({ assert }) => {
    const transaction = new TransactionEntity({
      id: 4,
      clientId: 1,
      gatewayId: 1,
      externalId: 'ext-456',
      status: TransactionStatus.REFUNDED,
      amount: Money.fromCents(5000),
      cardLastNumbers: '1234',
      createdAt: new Date(),
    })
    assert.isFalse(transaction.canBeRefunded())
  })

  test('calculateTotalAmount() should sum product amounts correctly', ({ assert }) => {
    const products: TransactionProductEntity[] = [
      new TransactionProductEntity({
        id: 1,
        transactionId: 1,
        productId: 10,
        quantity: 2,
        unitAmount: Money.fromCents(4990),
        createdAt: new Date(),
      }),
      new TransactionProductEntity({
        id: 2,
        transactionId: 1,
        productId: 20,
        quantity: 1,
        unitAmount: Money.fromCents(9990),
        createdAt: new Date(),
      }),
    ]

    // (2 × 4990) + (1 × 9990) = 9980 + 9990 = 19970
    const total = TransactionEntity.calculateTotalAmount(products)
    assert.equal(total.cents, 19970)
  })

  test('calculateTotalAmount() should return zero for empty products', ({ assert }) => {
    const total = TransactionEntity.calculateTotalAmount([])
    assert.equal(total.cents, 0)
  })
})
