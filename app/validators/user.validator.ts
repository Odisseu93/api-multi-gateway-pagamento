import vine from '@vinejs/vine'
import { Role } from '#domain/enums/role.enum'

export const createUserValidator = vine.create(
  vine.object({
    name: vine.string().trim().minLength(2).maxLength(255),
    email: vine.string().email().trim(),
    password: vine.string().minLength(8),
    role: vine.enum(Object.values(Role)),
  })
)

export const updateUserValidator = vine.create(
  vine.object({
    name: vine.string().trim().minLength(2).maxLength(255).optional(),
    email: vine.string().email().trim().optional(),
    password: vine.string().minLength(8).optional(),
    role: vine.enum(Object.values(Role)).optional(),
  })
)
