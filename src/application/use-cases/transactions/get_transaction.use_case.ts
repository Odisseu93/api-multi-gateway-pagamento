import type { ITransactionRepository } from '#domain/repositories/i-transaction.repository'
import type { TransactionEntity } from '#domain/entities/transaction.entity'
import type { TransactionProductEntity } from '#domain/entities/transaction-product.entity'
import { NotFoundError } from '#shared/errors/not-found.error'

export interface GetTransactionResult {
  transaction: TransactionEntity
  products: TransactionProductEntity[]
}

export class GetTransactionUseCase {
  constructor(private readonly transactionRepository: ITransactionRepository) {}

  async execute(id: number): Promise<GetTransactionResult> {
    const result = await this.transactionRepository.findByIdWithProducts(id)
    if (!result) {
      throw new NotFoundError('Transaction', id)
    }
    return result
  }
}
