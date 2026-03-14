import type { IClientRepository } from '#domain/repositories/i-client.repository'
import type { ClientEntity } from '#domain/entities/client.entity'

export class ListClientsUseCase {
  constructor(private readonly clientRepository: IClientRepository) {}

  async execute(): Promise<ClientEntity[]> {
    return this.clientRepository.findAll()
  }
}
