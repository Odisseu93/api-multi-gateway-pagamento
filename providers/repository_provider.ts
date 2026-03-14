import type { ApplicationService } from '@adonisjs/core/types'
import { LucidUserRepository } from '#infrastructure/repositories/lucid/lucid-user.repository'
import { LucidGatewayRepository } from '#infrastructure/repositories/lucid/lucid-gateway.repository'
import { LucidClientRepository } from '#infrastructure/repositories/lucid/lucid-client.repository'
import { LucidProductRepository } from '#infrastructure/repositories/lucid/lucid-product.repository'
import { LucidTransactionRepository } from '#infrastructure/repositories/lucid/lucid-transaction.repository'
import { LucidRefundRepository } from '#infrastructure/repositories/lucid/lucid-refund.repository'

/**
 * Repository Provider
 *
 * Binds all Lucid repository implementations into AdonisJS's IoC container
 * using their concrete classes as keys. This allows use cases to be resolved
 * via dependency injection by requesting the concrete implementation class.
 *
 * To inject a repository in a use case or controller:
 *   constructor(private userRepo: LucidUserRepository) {}
 *   (and register the use case/controller resolution in a container.make() call)
 */
export default class RepositoryProvider {
  constructor(protected app: ApplicationService) {}

  register() {
    this.app.container.bind(LucidUserRepository, async () => new LucidUserRepository())
    this.app.container.bind(LucidGatewayRepository, async () => new LucidGatewayRepository())
    this.app.container.bind(LucidClientRepository, async () => new LucidClientRepository())
    this.app.container.bind(LucidProductRepository, async () => new LucidProductRepository())
    this.app.container.bind(
      LucidTransactionRepository,
      async () => new LucidTransactionRepository()
    )
    this.app.container.bind(LucidRefundRepository, async () => new LucidRefundRepository())
  }
}
