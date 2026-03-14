import vine from '@vinejs/vine'

export const signupValidator = vine.create(
  vine.object({
    name: vine.string().trim().minLength(2).maxLength(255),
    email: vine.string().email().trim(),
    password: vine.string().minLength(8),
  })
)
