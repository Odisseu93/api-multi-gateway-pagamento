import type { TransactionRepository } from '#domain/repositories/transaction.repository'
import type { TransactionEntity } from '#domain/entities/transaction.entity'
import type { TransactionProductEntity } from '#domain/entities/transaction_product.entity'
import { NotFoundError } from '#shared/errors/not_found_error'

export interface GetTransactionResult {
  transaction: TransactionEntity
  products: TransactionProductEntity[]
}

export class GetTransactionUseCase {
  constructor(private readonly transactionRepository: TransactionRepository) {}

  async execute(id: number): Promise<GetTransactionResult> {
    const result = await this.transactionRepository.findByIdWithProducts(id)
    if (!result) {
      throw new NotFoundError('Transaction', id)
    }
    return result
  }
}
