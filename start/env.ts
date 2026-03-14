/*
|--------------------------------------------------------------------------
| Environment variables service
|--------------------------------------------------------------------------
|
| The `Env.create` method creates an instance of the Env service. The
| service validates the environment variables and also cast values
| to JavaScript data types.
|
*/

import { Env } from '@adonisjs/core/env'

export default await Env.create(new URL('../', import.meta.url), {
  // Node
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  PORT: Env.schema.number(),
  HOST: Env.schema.string({ format: 'host' }),
  LOG_LEVEL: Env.schema.string(),
  SESSION_DRIVER: Env.schema.enum(['cookie', 'database', 'memory'] as const),

  // App
  APP_KEY: Env.schema.secret(),
  APP_URL: Env.schema.string({ format: 'url', tld: false }),

  // Database (MySQL)
  DB_HOST: Env.schema.string({ format: 'host' }),
  DB_PORT: Env.schema.number(),
  DB_USER: Env.schema.string(),
  DB_PASSWORD: Env.schema.string(),
  DB_DATABASE: Env.schema.string(),

  // Gateway 1 — Bearer token auth
  GATEWAY_1_URL: Env.schema.string({ format: 'url', tld: false }),
  GATEWAY_1_EMAIL: Env.schema.string(),
  GATEWAY_1_TOKEN: Env.schema.secret(),

  // Gateway 2 — Header auth
  GATEWAY_2_URL: Env.schema.string({ format: 'url', tld: false }),
  GATEWAY_2_AUTH_TOKEN: Env.schema.secret(),
  GATEWAY_2_AUTH_SECRET: Env.schema.secret(),

  /*
  |----------------------------------------------------------
  | Variables for configuring the limiter package
  |----------------------------------------------------------
  */
  LIMITER_STORE: Env.schema.enum(['database', 'memory'] as const),
})
