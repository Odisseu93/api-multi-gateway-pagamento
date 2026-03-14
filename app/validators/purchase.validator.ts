import vine from '@vinejs/vine'

export const purchaseValidator = vine.create(
  vine.object({
    client: vine.object({
      name: vine.string().trim().minLength(2).maxLength(255),
      email: vine.string().email().trim(),
    }),
    items: vine
      .array(
        vine.object({
          productId: vine.number().positive().withoutDecimals(),
          quantity: vine.number().positive().withoutDecimals(),
        })
      )
      .minLength(1),
    card: vine.object({
      number: vine.string().trim().minLength(13).maxLength(19),
      cvv: vine.string().trim().minLength(3).maxLength(4),
    }),
  })
)
