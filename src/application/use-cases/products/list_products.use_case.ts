import type { IProductRepository } from '#domain/repositories/i-product.repository'
import type { ProductEntity } from '#domain/entities/product.entity'

export class ListProductsUseCase {
  constructor(private readonly productRepository: IProductRepository) {}

  async execute(): Promise<ProductEntity[]> {
    return this.productRepository.findAll()
  }
}
