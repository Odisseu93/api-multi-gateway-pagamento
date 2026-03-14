import type { ProductRepository } from '#domain/repositories/product.repository'
import type { ClientRepository } from '#domain/repositories/client.repository'
import type { GatewayRepository } from '#domain/repositories/gateway.repository'
import type { TransactionRepository } from '#domain/repositories/transaction.repository'
import type { PaymentGatewayAdapter } from '#infrastructure/gateways/contracts/payment_gateway.adapter'
import type { PurchaseInputDto, PurchaseOutputDto } from '#application/dtos/purchase.dto'
import { AppError } from '#shared/errors/app_error'
import { Money } from '#domain/value-objects/money.vo'

interface GatewayAdapterFactory {
  create(type: string): PaymentGatewayAdapter
}

export class ProcessPurchaseUseCase {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly clientRepository: ClientRepository,
    private readonly gatewayRepository: GatewayRepository,
    private readonly transactionRepository: TransactionRepository,
    private readonly adapterFactory: GatewayAdapterFactory
  ) {}

  async execute(input: PurchaseInputDto): Promise<PurchaseOutputDto> {
    // ── 1. Consolidate and validate products ──────────────────────────────────
    const consolidatedItems = input.items.reduce(
      (acc, current) => {
        const existing = acc.find((item) => item.productId === current.productId)
        if (existing) {
          existing.quantity += current.quantity
        } else {
          acc.push({ ...current })
        }
        return acc
      },
      [] as typeof input.items
    )

    const uniqueProductIds = consolidatedItems.map((i) => i.productId)
    const products = await this.productRepository.findByIds(uniqueProductIds)

    if (products.length !== uniqueProductIds.length) {
      throw new AppError('One or more products not found', 400, 'PRODUCTS_NOT_FOUND')
    }

    // ── 2. Calculate total amount (back-end, never trust front-end amounts) ───
    let totalCents = 0
    const lineItems: Array<{ productId: number; quantity: number; unitAmount: number }> = []

    for (const item of consolidatedItems) {
      const product = products.find((p) => p.id === item.productId)!

      if (!product.isActive) {
        throw new AppError(
          `Product '${product.name}' is not available`,
          400,
          'PRODUCT_NOT_AVAILABLE'
        )
      }

      const lineTotal = product.amount.multiply(item.quantity)
      totalCents += lineTotal.cents
      lineItems.push({
        productId: item.productId,
        quantity: item.quantity,
        unitAmount: product.amount.cents,
      })
    }

    const totalAmount = Money.fromCents(totalCents)

    // ── 3. Extract last 4 digits of card ──────────────────────────────────────
    const cardLastNumbers = input.card.number.replace(/\s/g, '').slice(-4)

    // ── 4. Resolve or create client ───────────────────────────────────────────
    let client = await this.clientRepository.findByEmail(input.client.email)

    if (!client) {
      try {
        client = await this.clientRepository.create({
          name: input.client.name,
          email: input.client.email,
        })
      } catch (error) {
        // Handle possible race condition: another request created the client simultaneously
        client = await this.clientRepository.findByEmail(input.client.email)
        if (!client) throw error
      }
    }

    // ── 5. Load active gateways ordered by priority ───────────────────────────
    const gateways = await this.gatewayRepository.findAllActiveOrderedByPriority()

    if (gateways.length === 0) {
      throw new AppError('No active payment gateways available', 503, 'NO_GATEWAYS_AVAILABLE')
    }

    // ── 6. Attempt charge in priority order ───────────────────────────────────
    let chosenGateway = gateways[0]
    let chargeResult: { externalId: string; status: string } | null = null

    for (const gateway of gateways) {
      const adapter = this.adapterFactory.create(gateway.type)

      const result = await adapter.charge({
        amount: totalAmount,
        name: input.client.name,
        email: input.client.email,
        cardNumber: input.card.number,
        cvv: input.card.cvv,
      })

      if (result.status !== 'failed') {
        chargeResult = result
        chosenGateway = gateway
        break
      }
    }

    if (!chargeResult || chargeResult.status === 'failed') {
      throw new AppError(
        'All payment gateways failed to process the transaction',
        502,
        'ALL_GATEWAYS_FAILED'
      )
    }

    // ── 7. Persist transaction with products snapshot ─────────────────────────
    const transaction = await this.transactionRepository.create({
      clientId: client.id!,
      gatewayId: chosenGateway.id ?? null,
      externalId: chargeResult.externalId || null,
      status: chargeResult.status,
      amount: totalAmount.cents,
      cardLastNumbers,
      products: lineItems,
    })

    return {
      transactionId: transaction.id!,
      externalId: transaction.externalId,
      status: transaction.status,
      gatewayId: transaction.gatewayId,
      totalAmount: totalAmount.cents,
      cardLastNumbers,
    }
  }
}
