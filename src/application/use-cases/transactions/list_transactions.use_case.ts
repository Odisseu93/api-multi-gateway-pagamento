import type { ITransactionRepository } from '#domain/repositories/i-transaction.repository'
import type { TransactionEntity } from '#domain/entities/transaction.entity'

export class ListTransactionsUseCase {
  constructor(private readonly transactionRepository: ITransactionRepository) {}

  async execute(): Promise<TransactionEntity[]> {
    return this.transactionRepository.findAll()
  }
}
