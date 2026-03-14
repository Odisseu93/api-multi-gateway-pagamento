import type { ClientRepository } from '#domain/repositories/client.repository'
import type { ClientEntity } from '#domain/entities/client.entity'

export class ListClientsUseCase {
  constructor(private readonly clientRepository: ClientRepository) {}

  async execute(): Promise<ClientEntity[]> {
    return this.clientRepository.findAll()
  }
}
