import type { ITransactionRepository } from '#domain/repositories/i-transaction.repository'
import type { IRefundRepository } from '#domain/repositories/i-refund.repository'
import type { IGatewayRepository } from '#domain/repositories/i-gateway.repository'
import type { IPaymentGatewayAdapter } from '#infrastructure/gateways/contracts/i-payment-gateway.adapter'
import type { RefundOutputDto } from '#application/dtos/refund.dto'
import { AppError } from '#shared/errors/app-error'
import { NotFoundError } from '#shared/errors/not-found.error'
import { ConflictError } from '#shared/errors/conflict.error'
import { RefundStatus } from '#domain/enums/refund-status.enum'
import { TransactionStatus } from '#domain/enums/transaction-status.enum'

interface GatewayAdapterFactory {
  create(type: string): IPaymentGatewayAdapter
}

export class RefundTransactionUseCase {
  constructor(
    private readonly transactionRepository: ITransactionRepository,
    private readonly refundRepository: IRefundRepository,
    private readonly gatewayRepository: IGatewayRepository,
    private readonly adapterFactory: GatewayAdapterFactory
  ) {}

  async execute(transactionId: number): Promise<RefundOutputDto> {
    // ── 1. Load transaction ────────────────────────────────────────────────
    const tx = await this.transactionRepository.findById(transactionId)
    if (!tx) {
      throw new NotFoundError('Transaction', transactionId)
    }

    // ── 2. Check it can be refunded ────────────────────────────────────────
    if (tx.status === TransactionStatus.REFUNDED) {
      throw new ConflictError('Transaction is already refunded')
    }

    if (tx.status !== TransactionStatus.PAID) {
      throw new AppError(
        `Transaction cannot be refunded in status '${tx.status}'`,
        409,
        'TRANSACTION_NOT_REFUNDABLE'
      )
    }

    // ── 3. Resolve the gateway adapter ────────────────────────────────────
    if (!tx.gatewayId || !tx.externalId) {
      throw new AppError(
        'Transaction has no associated gateway or external ID',
        422,
        'MISSING_GATEWAY_INFO'
      )
    }

    const gateway = await this.gatewayRepository.findById(tx.gatewayId)
    if (!gateway) {
      throw new NotFoundError('Gateway', tx.gatewayId)
    }

    const adapter = this.adapterFactory.create(gateway.type)

    // ── 4. Call gateway refund ────────────────────────────────────────────
    const success = await adapter.refund(tx.externalId)

    if (!success) {
      // Record a failed refund attempt
      await this.refundRepository.create({
        transactionId,
        externalId: null,
        status: RefundStatus.FAILED,
        amount: tx.amount,
      })

      throw new AppError(
        'Gateway refund call failed',
        502,
        'GATEWAY_REFUND_FAILED'
      )
    }

    // ── 5. Persist approved refund and update transaction status ──────────
    const refund = await this.refundRepository.create({
      transactionId,
      externalId: tx.externalId,
      status: RefundStatus.APPROVED,
      amount: tx.amount,
    })

    await this.transactionRepository.updateStatus(transactionId, TransactionStatus.REFUNDED)

    return {
      transactionId,
      refundId: refund.id ?? null,
      status: 'refunded',
      amount: tx.amount.cents,
    }
  }
}
