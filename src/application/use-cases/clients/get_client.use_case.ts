import type { IClientRepository } from '#domain/repositories/i-client.repository'
import type { ITransactionRepository } from '#domain/repositories/i-transaction.repository'
import type { ClientEntity } from '#domain/entities/client.entity'
import type { TransactionEntity } from '#domain/entities/transaction.entity'
import { NotFoundError } from '#shared/errors/not-found.error'

export interface GetClientResult {
  client: ClientEntity
  transactions: TransactionEntity[]
}

export class GetClientUseCase {
  constructor(
    private readonly clientRepository: IClientRepository,
    private readonly transactionRepository: ITransactionRepository
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
