import vine from '@vinejs/vine'

export const loginValidator = vine.create(
  vine.object({
    email: vine.string().email().trim(),
    password: vine.string().minLength(8),
  })
)
