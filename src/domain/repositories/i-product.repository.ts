import type { ProductEntity } from '#domain/entities/product.entity'

export interface IProductRepository {
  findById(id: number): Promise<ProductEntity | null>
  findByIds(ids: number[]): Promise<ProductEntity[]>
  findAll(): Promise<ProductEntity[]>
  create(product: Omit<ProductEntity, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>): Promise<ProductEntity>
  update(id: number, data: Partial<Pick<ProductEntity, 'name' | 'amount' | 'isActive'>>): Promise<ProductEntity>
  delete(id: number): Promise<void>
}
