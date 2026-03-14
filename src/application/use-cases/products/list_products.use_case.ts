import type { ProductRepository } from '#domain/repositories/product.repository'
import type { ProductEntity } from '#domain/entities/product.entity'

export class ListProductsUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(): Promise<ProductEntity[]> {
    return this.productRepository.findAll()
  }
}
