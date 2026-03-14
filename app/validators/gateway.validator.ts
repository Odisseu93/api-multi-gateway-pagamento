import vine from '@vinejs/vine'

export const gatewayPriorityValidator = vine.create(
  vine.object({
    priority: vine.number().positive().withoutDecimals(),
  })
)

export const gatewayIdValidator = vine.create(
  vine.object({
    id: vine.number().positive().withoutDecimals(),
  })
)
