import type { HttpContext } from '@adonisjs/core/http'
import { createProductValidator, updateProductValidator } from '#validators/product.validator'
import { CreateProductUseCase } from '#application/use-cases/products/create-product.use-case'
import { UpdateProductUseCase } from '#application/use-cases/products/update-product.use-case'
import { DeleteProductUseCase } from '#application/use-cases/products/delete-product.use-case'
import { ListProductsUseCase } from '#application/use-cases/products/list-products.use-case'
import { GetProductUseCase } from '#application/use-cases/products/get-product.use-case'
import { LucidProductRepository } from '#infrastructure/repositories/lucid/lucid-product.repository'

export default class ProductController {
  /** GET /api/v1/products */
  async index({ response }: HttpContext) {
    const useCase = new ListProductsUseCase(new LucidProductRepository())

    const products = await useCase.execute()
    return response.ok({ success: true, data: products })
  }

  /** GET /api/v1/products/:id */
  async show({ params, response }: HttpContext) {
    const useCase = new GetProductUseCase(new LucidProductRepository())

    const product = await useCase.execute(Number(params.id))
    return response.ok({ success: true, data: product })
  }

  /** POST /api/v1/products */
  async store({ request, response }: HttpContext) {
    const input = await request.validateUsing(createProductValidator)
    const useCase = new CreateProductUseCase(new LucidProductRepository())

    const product = await useCase.execute(input)
    return response.created({ success: true, data: product })
  }

  /** PUT /api/v1/products/:id */
  async update({ params, request, response }: HttpContext) {
    const input = await request.validateUsing(updateProductValidator)
    const useCase = new UpdateProductUseCase(new LucidProductRepository())

    const product = await useCase.execute(Number(params.id), input as any)
    return response.ok({ success: true, data: product })
  }

  /** DELETE /api/v1/products/:id */
  async destroy({ params, response }: HttpContext) {
    const useCase = new DeleteProductUseCase(new LucidProductRepository())
    
    await useCase.execute(Number(params.id))
    return response.noContent()
  }
}
