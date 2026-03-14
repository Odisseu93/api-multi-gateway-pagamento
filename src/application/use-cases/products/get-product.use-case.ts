import type { IProductRepository } from '#domain/repositories/i-product.repository'
import type { ProductEntity } from '#domain/entities/product.entity'
import { NotFoundError } from '#shared/errors/not-found.error'

export class GetProductUseCase {
  constructor(private readonly productRepository: IProductRepository) {}

  async execute(id: number): Promise<ProductEntity> {
    const product = await this.productRepository.findById(id)
    if (!product) {
      throw new NotFoundError('Product', id)
    }
    return product
  }
}
