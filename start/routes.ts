/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'
import { Role } from '#domain/enums/role.enum'

// ── Health check ──────────────────────────────────────────────────────────────
router.get('/health', () => ({ status: 'ok' }))

// ── API v1 ─────────────────────────────────────────────────────────────────────
router
  .group(() => {
    // ── Public routes (no auth required) ────────────────────────────────────
    router.post('/login', [() => import('#controllers/auth_controller'), 'store']).as('auth.login')

    router
      .post('/transactions', [() => import('#controllers/purchase_controller'), 'store'])
      .as('transactions.store')

    // ── Admin-only: Gateway management ────────────────────────────────────────
    router
      .group(() => {
        router
          .get('/', [() => import('#controllers/gateway_controller'), 'index'])
          .as('gateways.index')
        router
          .get('/:id', [() => import('#controllers/gateway_controller'), 'show'])
          .as('gateways.show')

        router
          .patch('/:id/toggle', [() => import('#controllers/gateway_controller'), 'toggle'])
          .as('gateways.toggle')

        router
          .patch('/:id/priority', [
            () => import('#controllers/gateway_controller'),
            'updatePriority',
          ])
          .as('gateways.updatePriority')
      })
      .prefix('/gateways')
      .use([middleware.auth(), middleware.roles({ roles: [Role.ADMIN] })])

    // ── User management (ADMIN, MANAGER) ─────────────────────────────────────
    router
      .group(() => {
        router.get('/', [() => import('#controllers/user_controller'), 'index']).as('users.index')
        router.get('/:id', [() => import('#controllers/user_controller'), 'show']).as('users.show')
        router.post('/', [() => import('#controllers/user_controller'), 'store']).as('users.store')
        router
          .put('/:id', [() => import('#controllers/user_controller'), 'update'])
          .as('users.update')
        router
          .delete('/:id', [() => import('#controllers/user_controller'), 'destroy'])
          .as('users.destroy')
          .use(middleware.roles({ roles: [Role.ADMIN, Role.MANAGER] }))
      })
      .prefix('/users')
      .use([middleware.auth(), middleware.roles({ roles: [Role.ADMIN, Role.MANAGER] })])

    // ── Product management (ADMIN, MANAGER, FINANCE) ──────────────────────────
    router
      .group(() => {
        router
          .get('/', [() => import('#controllers/product_controller'), 'index'])
          .as('products.index')
        router
          .get('/:id', [() => import('#controllers/product_controller'), 'show'])
          .as('products.show')
        router
          .post('/', [() => import('#controllers/product_controller'), 'store'])
          .as('products.store')
        router
          .put('/:id', [() => import('#controllers/product_controller'), 'update'])
          .as('products.update')
        router
          .delete('/:id', [() => import('#controllers/product_controller'), 'destroy'])
          .as('products.destroy')
          .use(middleware.roles({ roles: [Role.ADMIN, Role.MANAGER] }))
      })
      .prefix('/products')
      .use([
        middleware.auth(),
        middleware.roles({ roles: [Role.ADMIN, Role.MANAGER, Role.FINANCE] }),
      ])

    // ── Clients (ADMIN, MANAGER, FINANCE) ─────────────────────────────────────
    router
      .group(() => {
        router
          .get('/', [() => import('#controllers/client_controller'), 'index'])
          .as('clients.index')
        router
          .get('/:id', [() => import('#controllers/client_controller'), 'show'])
          .as('clients.show')
      })
      .prefix('/clients')
      .use([
        middleware.auth(),
        middleware.roles({
          roles: [Role.ADMIN, Role.MANAGER, Role.FINANCE, Role.USER],
        }),
      ])

    // ── Transactions (ADMIN, MANAGER, FINANCE) + Refund (ADMIN, FINANCE) ──────
    router
      .group(() => {
        router
          .get('/', [() => import('#controllers/transaction_controller'), 'index'])
          .as('transactions.index')
        router
          .get('/:id', [() => import('#controllers/transaction_controller'), 'show'])
          .as('transactions.show')
        router
          .post('/:id/refund', [() => import('#controllers/transaction_controller'), 'refund'])
          .as('transactions.refund')
          .use(middleware.roles({ roles: [Role.ADMIN, Role.FINANCE] }))
      })
      .prefix('/transactions')
      .use([
        middleware.auth(),
        middleware.roles({
          roles: [Role.ADMIN, Role.MANAGER, Role.FINANCE, Role.USER],
        }),
      ])

    // ── Refunds (Read: ADMIN, MANAGER, FINANCE, USER) ──────────────────────────
    router
      .group(() => {
        router
          .get('/', [() => import('#controllers/refund_controller'), 'index'])
          .as('refunds.index')
        router
          .get('/:id', [() => import('#controllers/refund_controller'), 'show'])
          .as('refunds.show')
      })
      .prefix('/refunds')
      .use([
        middleware.auth(),
        middleware.roles({
          roles: [Role.ADMIN, Role.MANAGER, Role.FINANCE, Role.USER],
        }),
      ])
  })
  .prefix('/api/v1')
