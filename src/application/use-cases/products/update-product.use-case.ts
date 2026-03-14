import type { IProductRepository } from '#domain/repositories/i-product.repository'
import type { ProductEntity } from '#domain/entities/product.entity'
import type { UpdateProductInputDto } from '#application/dtos/product.dto'
import { NotFoundError } from '#shared/errors/not-found.error'
import { Money } from '#domain/value-objects/money.vo'

type ProductUpdateData = {
  name?: string
  amount?: ReturnType<typeof Money.fromCents>
  isActive?: boolean
}

export class UpdateProductUseCase {
  constructor(private readonly productRepository: IProductRepository) {}

  async execute(id: number, input: UpdateProductInputDto): Promise<ProductEntity> {
    const existing = await this.productRepository.findById(id)
    if (!existing) {
      throw new NotFoundError('Product', id)
    }

    const updateData: ProductUpdateData = {}
    if (input.name !== undefined) updateData.name = input.name
    if (input.amount !== undefined) updateData.amount = Money.fromCents(input.amount)
    if (input.isActive !== undefined) updateData.isActive = input.isActive

    return this.productRepository.update(id, updateData)
  }
}
