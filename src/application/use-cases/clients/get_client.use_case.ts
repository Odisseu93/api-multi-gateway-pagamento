import type { ClientRepository } from '#domain/repositories/client.repository'
import type { TransactionRepository } from '#domain/repositories/transaction.repository'
import type { ClientEntity } from '#domain/entities/client.entity'
import type { TransactionEntity } from '#domain/entities/transaction.entity'
import { NotFoundError } from '#shared/errors/not_found_error'

export interface GetClientResult {
  client: ClientEntity
  transactions: TransactionEntity[]
}

export class GetClientUseCase {
  constructor(
    private readonly clientRepository: ClientRepository,
    private readonly transactionRepository: TransactionRepository
  ) {}

  async execute(id: number): Promise<GetClientResult> {
    const client = await this.clientRepository.findById(id)
    if (!client) {
      throw new NotFoundError('Client', id)
    }

    const transactions = await this.transactionRepository.findByClientId(id)

    return { client, transactions }
  }
}
