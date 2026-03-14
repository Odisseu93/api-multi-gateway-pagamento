import type { TransactionRepository } from '#domain/repositories/transaction.repository'
import type { TransactionEntity } from '#domain/entities/transaction.entity'

export class ListTransactionsUseCase {
  constructor(private readonly transactionRepository: TransactionRepository) {}

  async execute(): Promise<TransactionEntity[]> {
    return this.transactionRepository.findAll()
  }
}
