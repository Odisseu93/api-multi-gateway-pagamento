import type { ProductRepository } from '#domain/repositories/product.repository'
import type { ProductEntity } from '#domain/entities/product.entity'
import type { CreateProductInputDto } from '#application/dtos/product.dto'
import { Money } from '#domain/value-objects/money.vo'

export class CreateProductUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(input: CreateProductInputDto): Promise<ProductEntity> {
    return this.productRepository.create({
      name: input.name,
      amount: Money.fromCents(input.amount),
      isActive: true,
    })
  }
}
