import type { IProductRepository } from '#domain/repositories/i-product.repository'
import { NotFoundError } from '#shared/errors/not-found.error'

export class DeleteProductUseCase {
  constructor(private readonly productRepository: IProductRepository) {}

  async execute(id: number): Promise<void> {
    const existing = await this.productRepository.findById(id)
    if (!existing) {
      throw new NotFoundError('Product', id)
    }
    await this.productRepository.delete(id)
  }
}
