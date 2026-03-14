import { test } from '@japa/runner'
import { InMemoryDatabase } from '#infrastructure/database/in-memory/in_memory_database'
import { InMemoryClientRepository } from '#infrastructure/repositories/in-memory/in_memory_client.repository'
import { InMemoryTransactionRepository } from '#infrastructure/repositories/in-memory/in_memory_transaction.repository'
import { ListClientsUseCase } from '#application/use-cases/clients/list_clients.use_case'
import { GetClientUseCase } from '#application/use-cases/clients/get_client.use_case'
import { Money } from '#domain/value-objects/money.vo'
import { TransactionStatus } from '#domain/enums/transaction_status.enum'

test.group('Client Use Cases', (group) => {
  let db: InMemoryDatabase
  let clientRepo: InMemoryClientRepository
  let transactionRepo: InMemoryTransactionRepository

  group.each.setup(async () => {
    db = new InMemoryDatabase()
    clientRepo = new InMemoryClientRepository(db)
    transactionRepo = new InMemoryTransactionRepository(db)

    // Seed a client
    db.insert('clients', {
      name: 'Alice',
      email: 'alice@example.com',
      createdAt: new Date(),
      updatedAt: null,
      deletedAt: null,
    })

    // Seed a transaction for the client
    db.insert('transactions', {
      clientId: 1,
      gatewayId: 1,
      externalId: 'ext-001',
      status: TransactionStatus.PAID,
      amount: Money.fromCents(2000),
      cardLastNumbers: '1111',
      createdAt: new Date(),
      updatedAt: null,
    })
  })

  group.each.teardown(() => {
    db.clearAll()
  })

  test('ListClientsUseCase: should return all clients', async ({ assert }) => {
    const useCase = new ListClientsUseCase(clientRepo)
    const clients = await useCase.execute()
    assert.lengthOf(clients, 1)
    assert.equal(clients[0].email, 'alice@example.com')
  })

  test('GetClientUseCase: should return client with transactions', async ({ assert }) => {
    const useCase = new GetClientUseCase(clientRepo, transactionRepo)
    const result = await useCase.execute(1)

    assert.equal(result.client.email, 'alice@example.com')
    assert.lengthOf(result.transactions, 1)
    assert.equal(result.transactions[0].externalId, 'ext-001')
  })

  test('GetClientUseCase: should throw 404 when client not found', async ({ assert }) => {
    const useCase = new GetClientUseCase(clientRepo, transactionRepo)
    await assert.rejects(() => useCase.execute(9999), /not found/i)
  })
})

test.group('Transaction Use Cases', (group) => {
  let db: InMemoryDatabase
  let transactionRepo: InMemoryTransactionRepository

  group.each.setup(async () => {
    db = new InMemoryDatabase()
    transactionRepo = new InMemoryTransactionRepository(db)

    db.insert('transactions', {
      clientId: 1,
      gatewayId: 1,
      externalId: 'ext-001',
      status: TransactionStatus.PAID,
      amount: Money.fromCents(2000),
      cardLastNumbers: '1111',
      createdAt: new Date(),
      updatedAt: null,
    })
  })

  group.each.teardown(() => {
    db.clearAll()
  })

  test('ListTransactionsUseCase: should return all transactions', async ({ assert }) => {
    const { ListTransactionsUseCase } =
      await import('#application/use-cases/transactions/list_transactions.use_case')
    const useCase = new ListTransactionsUseCase(transactionRepo)
    const txs = await useCase.execute()
    assert.lengthOf(txs, 1)
  })

  test('GetTransactionUseCase: should return transaction with products', async ({ assert }) => {
    const { GetTransactionUseCase } =
      await import('#application/use-cases/transactions/get_transaction.use_case')
    const useCase = new GetTransactionUseCase(transactionRepo)
    const result = await useCase.execute(1)
    assert.equal(result.transaction.externalId, 'ext-001')
    assert.isArray(result.products)
  })

  test('GetTransactionUseCase: should throw 404 when not found', async ({ assert }) => {
    const { GetTransactionUseCase } =
      await import('#application/use-cases/transactions/get_transaction.use_case')
    const useCase = new GetTransactionUseCase(transactionRepo)
    await assert.rejects(() => useCase.execute(9999), /not found/i)
  })
})
