import { BaseModel, column, beforeSave } from '@adonisjs/lucid/orm'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { type AccessToken, DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import { DateTime } from 'luxon'

export default class User extends compose(
  BaseModel,
  withAuthFinder(() => hash as any)
) {
  static table = 'users'

  @beforeSave()
  public static async hashPassword(user: any) {
    if (user.password && !user.password.startsWith('$argon2')) {
      user.password = await hash.make(user.password)
    }
  }

  static accessTokens = DbAccessTokensProvider.forModel(User)
  declare currentAccessToken?: AccessToken

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare email: string

  @column({ serializeAs: null })
  declare password: string

  @column()
  declare name: string

  @column()
  declare role: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @column.dateTime()
  declare deletedAt: DateTime | null

  get initials() {
    const [first, last] = this.name ? this.name.split(' ') : this.email.split('@')
    if (first && last) {
      return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
    }
    return `${first.slice(0, 2)}`.toUpperCase()
  }
}
