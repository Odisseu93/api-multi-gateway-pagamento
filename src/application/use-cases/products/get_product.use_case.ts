import type { ProductRepository } from '#domain/repositories/product.repository'
import type { ProductEntity } from '#domain/entities/product.entity'
import { NotFoundError } from '#shared/errors/not_found_error'

export class GetProductUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(id: number): Promise<ProductEntity> {
    const product = await this.productRepository.findById(id)
    if (!product) {
      throw new NotFoundError('Product', id)
    }
    return product
  }
}
