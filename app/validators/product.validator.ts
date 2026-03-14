import vine from '@vinejs/vine'

export const createProductValidator = vine.create(
  vine.object({
    name: vine.string().trim().minLength(2).maxLength(255),
    /** Amount in cents (positive integer) */
    amount: vine.number().positive().withoutDecimals(),
  })
)

export const updateProductValidator = vine.create(
  vine.object({
    name: vine.string().trim().minLength(2).maxLength(255).optional(),
    amount: vine.number().positive().withoutDecimals().optional(),
    isActive: vine.boolean().optional(),
  })
)
