# TODO - API Multi-Gateway de Pagamentos (Nivel 3)

Checklist de desenvolvimento completo seguindo as regras do projeto (Clean Architecture + DDD + SOLID + TDD).

> **Convenção TDD:** o teste deve ser escrito **antes** da implementação. Cada item marcado de teste (`test`) deve preceder o item de implementação (`feat`) correspondente.

---

## 1. Setup do Projeto

- [x] **chore(config):** Inicializar projeto AdonisJS (última versão LTS) com TypeScript
  - `npm init adonisjs@latest . -- --kit=api`
- [x] **chore(config):** Configurar `tsconfig.json` (`strict: true`, `esModuleInterop: true`, path aliases)
- [x] **chore(config):** Instalar e configurar ESLint (`@typescript-eslint/recommended`) + Prettier
  - `eslint.config.js` via `@adonisjs/eslint-config`, `prettier` via `@adonisjs/prettier-config`
  - Scripts no `package.json`: `lint`, `lint:fix`, `format`, `typecheck`
- [x] **chore(config):** Criar `.env.example` com todas as variáveis de ambiente necessárias
  - `NODE_ENV`, `PORT`, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_DATABASE`
  - `GATEWAY_1_URL`, `GATEWAY_2_URL`
  - `GATEWAY_1_EMAIL`, `GATEWAY_1_TOKEN`
  - `GATEWAY_2_AUTH_TOKEN`, `GATEWAY_2_AUTH_SECRET`
- [x] **chore(config):** Configurar `@adonisjs/auth` (token guard — `auth_access_tokens`)
- [x] **chore(config):** Configurar `@adonisjs/lucid` com MySQL
- [x] **chore(config):** Criar `.gitignore` e `.dockerignore` adequados

---

## 2. Infraestrutura – Docker

- [x] **chore(docker):** Criar `Dockerfile` multi-stage (builder + production) com Node Alpine
- [x] **chore(docker):** Criar `docker-compose.yml` com os serviços:
  - `db` — MySQL 8 com healthcheck e volume de persistência
  - `api` — build da aplicação; `depends_on: db (service_healthy)`; migrations no startup
  - `gateways-mock` — imagem `matheusprotzen/gateways-mock` (com autenticação, sem `REMOVE_AUTH`)
- [x] **chore(docker):** Validar que `docker compose up --build` sobe os 3 serviços corretamente
- [x] **chore(docker):** Validar que Gateway 1 responde em `http://localhost:3001` e Gateway 2 em `http://localhost:3002`

---

## 3. Banco de Dados – Migrations e Seeds

> Ordem de criação: `users` → `auth_access_tokens` → `gateways` → `clients` → `products` → `transactions` → `transaction_products`

- [x] **chore(db):** Migration `create_users_table`
  - Colunas: `id`, `full_name`, `email` (UNIQUE), `password`, `role` (VARCHAR 20, DEFAULT 'USER'), `created_at`, `updated_at`
- [x] **chore(db):** Migration `create_auth_access_tokens_table`
  - Colunas: `id`, `tokenable_id` (FK → users ON DELETE CASCADE), `type`, `name`, `hash` (UNIQUE), `abilities`, `created_at`, `updated_at`, `last_used_at`, `expires_at`
- [x] **chore(db):** Migration `create_gateways_table`
  - Colunas: `id`, `name`, `slug` (UNIQUE), `is_active` (DEFAULT true), `priority` (UNIQUE), `created_at`, `updated_at`
- [x] **chore(db):** Migration `create_clients_table`
  - Colunas: `id`, `user_id` (FK → users.id, UNIQUE — relação 1:1 obrigatória), `name`, `email` (UNIQUE), `created_at`, `updated_at`, `deleted_at`
  - Todo cliente precisa ser um usuário; registro criado automaticamente na primeira compra de um `role = USER`
- [x] **chore(db):** Migration `create_products_table`
  - Colunas: `id`, `name`, `amount` (INT UNSIGNED — centavos), `is_active` (DEFAULT true), `created_at`, `updated_at`
- [x] **chore(db):** Migration `create_transactions_table`
  - Colunas: `id`, `client_id` (FK), `gateway_id` (FK, NULLABLE), `external_id`, `status` (VARCHAR 20), `total_amount` (INT UNSIGNED), `card_last_numbers` (VARCHAR 10), `created_at`, `updated_at`
  - Índices: `client_id`, `gateway_id`, `external_id`, `status`, `created_at`
- [x] **chore(db):** Migration `create_transaction_products_table`
  - Colunas: `id`, `transaction_id` (FK → transactions ON DELETE CASCADE), `product_id` (FK), `quantity` (INT UNSIGNED), `unit_amount` (INT UNSIGNED — snapshot), `created_at`, `updated_at`
  - Índice: `(transaction_id, product_id)`
- [x] **chore(db):** Migration `create_refunds_table`
  - Colunas: `id`, `transaction_id` (FK → transactions), `external_id`, `status` (VARCHAR 20), `amount` (INT UNSIGNED), `created_at`
- [x] **chore(db):** Criar Seeder com dados iniciais:
  - Usuário ADMIN padrão
  - Gateway 1 (slug: `gateway_1`, priority: 1, is_active: true)
  - Gateway 2 (slug: `gateway_2`, priority: 2, is_active: true)

---

## 4. Domínio – Entidades, Value Objects e Interfaces

- [x] **feat(domain):** Entidade `User`
- [x] **feat(domain):** Entidade `Gateway`
- [x] **feat(domain):** Entidade `Client`
- [x] **feat(domain):** Entidade `Product`
- [x] **feat(domain):** Entidade `Transaction`
- [x] **feat(domain):** Entidade `TransactionProduct`
- [x] **feat(domain):** Entidade `Refund`
- [x] **feat(domain):** Value Object `Money` (valor em centavos, imutável)
- [x] **feat(domain):** Value Object `CardLastNumbers` (validação e extração dos 4 últimos dígitos)
- [x] **feat(domain):** Enum `Role` (`ADMIN`, `MANAGER`, `FINANCE`, `USER`)
- [x] **feat(domain):** Enum `TransactionStatus` (`pending`, `paid`, `failed`, `refunded`)
- [x] **feat(domain):** Enum `RefundStatus` (`requested`, `approved`, `failed`)
- [x] **feat(domain):** Interface `UserRepository`
- [x] **feat(domain):** Interface `GatewayRepository`
- [x] **feat(domain):** Interface `ClientRepository`
- [x] **feat(domain):** Interface `ProductRepository`
- [x] **feat(domain):** Interface `TransactionRepository`
- [x] **feat(domain):** Interface `RefundRepository` (`findById`, `findByTransactionId`, `create`, `updateStatus`)
- [x] **feat(domain):** Interface `PaymentGatewayAdapter` (`charge()`, `refund()`)

---

## 5. Infrastructure – In-Memory Repositories (para testes)

> Banco em memória puro TypeScript (`InMemoryDatabase`) + implementações das interfaces de domínio.
> Usados exclusivamente nos testes unitários de use cases.

- [x] **feat(infra):** `InMemoryDatabase` — store genérico com auto-increment, insert, findById, findMany, update, delete e clearAll
- [x] **feat(infra/test):** Implementar `InMemoryUserRepository` implementando `UserRepository`
- [x] **feat(infra/test):** Implementar `InMemoryGatewayRepository` implementando `GatewayRepository`
- [x] **feat(infra/test):** Implementar `InMemoryClientRepository` implementando `ClientRepository`
- [x] **feat(infra/test):** Implementar `InMemoryProductRepository` implementando `ProductRepository`
- [x] **feat(infra/test):** Implementar `InMemoryTransactionRepository` implementando `TransactionRepository`
- [x] **feat(infra/test):** Implementar `InMemoryRefundRepository` implementando `RefundRepository`
- [x] **test(infra):** Testes unitários do `InMemoryUserRepository`
- [x] **test(infra):** Testes unitários do `InMemoryGatewayRepository`
- [x] **test(infra):** Testes unitários do `InMemoryClientRepository`
- [x] **test(infra):** Testes unitários do `InMemoryProductRepository`
- [x] **test(infra):** Testes unitários do `InMemoryTransactionRepository`
- [x] **test(infra):** Testes unitários do `InMemoryRefundRepository`

---

## 6. Infrastructure – Lucid Models e Repositories

- [x] **feat(infra):** Lucid Model `User` (relação `hasMany` com `AccessToken`)
- [x] **feat(infra):** Lucid Model `Gateway`
- [x] **feat(infra):** Lucid Model `Client` (relação `hasMany` com `Transaction`)
- [x] **feat(infra):** Lucid Model `Product`
- [x] **feat(infra):** Lucid Model `Transaction` (relações: `belongsTo(Client)`, `belongsTo(Gateway)`, `hasMany(TransactionProduct)`)
- [x] **feat(infra):** Lucid Model `TransactionProduct` (relações: `belongsTo(Transaction)`, `belongsTo(Product)`)
- [x] **feat(infra):** Implementar `LucidUserRepository` implementando `UserRepository`
- [x] **feat(infra):** Implementar `LucidGatewayRepository` implementando `GatewayRepository`
- [x] **feat(infra):** Implementar `LucidClientRepository` implementando `ClientRepository`
- [x] **feat(infra):** Implementar `LucidProductRepository` implementando `ProductRepository`
- [x] **feat(infra):** Implementar `LucidTransactionRepository` implementando `TransactionRepository`
- [x] **feat(infra):** Implementar `LucidRefundRepository` implementando `RefundRepository`
- [x] **feat(infra):** Registrar repos no container de DI do AdonisJS (`RepositoryProvider`)

---

## 7. Infrastructure – Gateway Adapters

- [x] **feat(gateways):** Implementar `Gateway1Adapter` implementando `PaymentGatewayAdapter`
  - Login via `POST /login` (email + token); armazenar Bearer token para as chamadas seguintes
  - `charge()` → `POST /transactions` (amount, name, email, cardNumber, cvv)
  - `refund()` → `POST /transactions/:id/charge_back`
- [x] **feat(gateways):** Implementar `Gateway2Adapter` implementando `PaymentGatewayAdapter`
  - Autenticação via headers `Gateway-Auth-Token` e `Gateway-Auth-Secret`
  - `charge()` → `POST /transacoes` (valor, nome, email, numeroCartao, cvv)
  - `refund()` → `POST /transacoes/reembolso` ({ id })
- [x] **feat(gateways):** Implementar `GatewayAdapterFactory` — resolve adapter pelo `slug` do gateway
- [x] **feat(gateways):** Registrar adapters no container de DI

---

## 8. Application – DTOs

- [x] **feat(application):** `LoginInputDto`, `LoginOutputDto`
- [x] **feat(application):** `PurchaseInputDto` (lista de `{ productId, quantity }` + dados do cartão + dados do cliente), `PurchaseOutputDto`
- [x] **feat(application):** `RefundInputDto`, `RefundOutputDto`
- [x] **feat(application):** `CreateUserInputDto`, `UpdateUserInputDto`, `UserOutputDto`
- [x] **feat(application):** `CreateProductInputDto`, `UpdateProductInputDto`, `ProductOutputDto`
- [x] **feat(application):** `ClientOutputDto` (com lista de transações no detalhe)
- [x] **feat(application):** `TransactionOutputDto` (com produtos)
- [x] **feat(application):** `GatewayOutputDto`

---

## 9. Application – Use Cases (TDD: escrever o teste antes da implementação)

### 9.1 Autenticação

- [x] **test(application):** Testes unitários para `LoginUseCase`
  - Cenários: credenciais válidas, email não encontrado, senha incorreta
- [x] **feat(application):** Implementar `LoginUseCase` (valida credenciais → gera token via `@adonisjs/auth`)

### 9.2 Usuários

- [x] **test(application):** Testes unitários para `CreateUserUseCase`, `UpdateUserUseCase`, `DeleteUserUseCase`, `ListUsersUseCase`, `GetUserUseCase`
- [x] **feat(application):** Implementar `CreateUserUseCase` (hash da senha com `@adonisjs/hash`)
- [x] **feat(application):** Implementar `UpdateUserUseCase`
- [x] **feat(application):** Implementar `DeleteUserUseCase`
- [x] **feat(application):** Implementar `ListUsersUseCase`
- [x] **feat(application):** Implementar `GetUserUseCase`

### 9.3 Produtos

- [x] **test(application):** Testes unitários para CRUD de produtos
- [x] **feat(application):** Implementar `CreateProductUseCase`
- [x] **feat(application):** Implementar `UpdateProductUseCase`
- [x] **feat(application):** Implementar `DeleteProductUseCase`
- [x] **feat(application):** Implementar `ListProductsUseCase`
- [x] **feat(application):** Implementar `GetProductUseCase`

### 9.4 Gateways

- [x] **test(application):** Testes unitários para `ToggleGatewayUseCase`, `UpdateGatewayPriorityUseCase`
- [x] **feat(application):** Implementar `ToggleGatewayUseCase` (ativar/desativar)
- [x] **feat(application):** Implementar `UpdateGatewayPriorityUseCase` (troca de prioridade entre gateways)

### 9.5 Compra / Pagamento (Core)

- [x] **test(application):** Testes unitários para `ProcessPurchaseUseCase`
  - Cenário: cobra no gateway de maior prioridade quando tem sucesso
  - Cenário: tenta segundo gateway quando o primeiro falha
  - Cenário: retorna erro quando todos os gateways falham
  - Cenário: calcula `totalAmount` corretamente a partir de `(unit_amount × quantity)` de cada produto
  - Cenário: cria/rerusa client por email
  - Cenário: salva snapshot `unit_amount` em `transaction_products`
  - Cenário: persiste apenas os últimos 4 dígitos do cartão
- [x] **feat(application):** Implementar `ProcessPurchaseUseCase`
  - Buscar produtos do DB e calcular valor total no back-end
  - Criar/reusar client pelo email
  - Carregar gateways ativos ordenados por priority
  - Tentar `adapter.charge()` em ordem; parar no primeiro sucesso
  - Persistir transação e transaction_products com snapshot de preço
  - Se todos falharem, retornar erro adequado

### 9.6 Clientes

- [x] **test(application):** Testes unitários para `ListClientsUseCase`, `GetClientUseCase`
- [x] **feat(application):** Implementar `ListClientsUseCase`
- [x] **feat(application):** Implementar `GetClientUseCase` (detalhe + todas as suas transações)

### 9.7 Transações

- [x] **test(application):** Testes unitários para `ListTransactionsUseCase`, `GetTransactionUseCase`
- [x] **feat(application):** Implementar `ListTransactionsUseCase`
- [x] **feat(application):** Implementar `GetTransactionUseCase`

### 9.8 Reembolso

- [x] **test(application):** Testes unitários para `RefundTransactionUseCase`
  - Cenário: reembolso bem-sucedido → status = `refunded`
  - Cenário: transação já reembolsada → erro de conflito (409)
  - Cenário: transação não encontrada → 404
  - Cenário: gateway retorna erro → mapear para erro adequado
- [x] **feat(application):** Implementar `RefundTransactionUseCase`
  - Validar que transação existe e está em status `completed`
  - Chamar `adapter.refund()` do gateway que processou
  - Atualizar status da transação para `refunded`

---

## 10. Infrastructure – HTTP (Controllers, Middlewares, Rotas)

### 10.1 Middlewares

- [x] **feat(http):** Middleware `AuthMiddleware` — valida token e injeta usuário na request
- [x] **feat(http):** Middleware `AuthorizationMiddleware` (role guard) — verifica role do usuário; retorna 403 se não autorizado
- [x] **feat(http):** `ExceptionHandler` global — mapeia `AppError`, `ValidationError`, `AuthenticationError`, erros não tratados para JSON padronizado `{ success, error: { code, message } }`

### 10.2 Validators (VineJS)

- [x] **feat(http):** `LoginValidator`
- [x] **feat(http):** `PurchaseValidator` (array de `{ productId, quantity }`, dados do cartão, dados do cliente)
- [x] **feat(http):** `CreateUserValidator`, `UpdateUserValidator`
- [x] **feat(http):** `CreateProductValidator`, `UpdateProductValidator`
- [x] **feat(http):** `GatewayPriorityValidator`

### 10.3 Controllers

- [x] **feat(http):** `AuthController` (`store` — login)
- [x] **feat(http):** `PurchaseController` (`store` — realizar compra)
- [x] **feat(http):** `UserController` (`index`, `show`, `store`, `update`, `destroy`)
- [x] **feat(http):** `ProductController` (`index`, `show`, `store`, `update`, `destroy`)
- [x] **feat(http):** `GatewayController` (`update` toggle ativo, `update` prioridade)
- [x] **feat(http):** `ClientController` (`index`, `show`)
- [x] **feat(http):** `TransactionController` (`index`, `show`, `refund`)

### 10.4 Rotas (`start/routes.ts`)

- [x] **feat(http):** Rotas Públicas:
  - `POST /api/v1/login`
  - `POST /api/v1/transactions` (compra)
- [x] **feat(http):** Rotas Privadas (autenticadas):
  - `PATCH /api/v1/gateways/:id/toggle` — ADMIN
  - `PATCH /api/v1/gateways/:id/priority` — ADMIN
  - `GET /api/v1/users` — ADMIN, MANAGER
  - `GET /api/v1/users/:id` — ADMIN, MANAGER
  - `POST /api/v1/users` — ADMIN, MANAGER
  - `PUT /api/v1/users/:id` — ADMIN, MANAGER
  - `DELETE /api/v1/users/:id` — ADMIN
  - `GET /api/v1/products` — ADMIN, MANAGER, FINANCE
  - `GET /api/v1/products/:id` — ADMIN, MANAGER, FINANCE
  - `POST /api/v1/products` — ADMIN, MANAGER, FINANCE
  - `PUT /api/v1/products/:id` — ADMIN, MANAGER, FINANCE
  - `DELETE /api/v1/products/:id` — ADMIN, MANAGER
  - `GET /api/v1/clients` — ADMIN, MANAGER, FINANCE
  - `GET /api/v1/clients/:id` — ADMIN, MANAGER, FINANCE
  - `GET /api/v1/transactions` — ADMIN, MANAGER, FINANCE
  - `GET /api/v1/transactions/:id` — ADMIN, MANAGER, FINANCE
  - `POST /api/v1/transactions/:id/refund` — ADMIN, FINANCE

---

## 11. Testes de Integração / Http

- [x] **test(http):** Testes de integração para rotas de autenticação
  - `POST /api/v1/login` → 200 com token; 401/422 em cenários de erro
- [x] **test(http):** Testes de integração para rotas de compra
  - `POST /api/v1/transactions` → 201; 400 produtos inválidos
- [x] **test(http):** Testes de integração para CRUD de usuários com validação de roles
  - 401 sem token; 403 role incorreta; 201/200/204 com role correta
- [x] **test(http):** Testes de integração para CRUD de produtos com validação de roles
- [x] **test(http):** Testes de integração para gerenciamento de gateways (toggle, prioridade)
- [x] **test(http):** Testes de integração para listagem e detalhe de clientes
- [x] **test(http):** Testes de integração para listagem, detalhe e reembolso de transações
- [x] **test(http):** Testes de integração para adapters dos gateways (usando mock HTTP — nock ou msw)
  - Gateway 1: login, charge com sucesso, charge com erro, refund
  - Gateway 2: charge com sucesso, charge com erro, refund

---

## 12. Documentação

### 12.1 README.md

- [x] **docs:** Criar `README.md` contendo:
  - [x] Título + descrição do projeto
  - [x] Tabela de URLs (local e produção): `/health`, `/docs`, `/swagger`
  - [x] Tabela de decisões arquiteturais (AdonisJS, Lucid, VineJS, Clean Arch, Docker, TDD)
  - [x] Pré-requisitos (Node.js versão, Docker, Docker Compose)
  - [x] Tabela de variáveis de ambiente (nome, obrigatória, descrição, padrão)
  - [x] Instalação e execução com Docker (passo a passo)
  - [x] Instalação e execução local sem Docker da aplicação
  - [x] Comandos de testes (`npm test`, `npm run test:coverage`)
  - [x] Tabela completa de endpoints com `curl` de exemplo por rota
  - [x] Estrutura de pastas resumida

### 12.2 API Docs (`/docs`)

- [ ] **docs:** Implementar página `/docs` (HTML servido via rota ou Swagger UI / Scalar / Redoc)
  - [ ] Visão geral da API (multi-gateway, retry, roles)
  - [ ] Arquitetura / fluxo de pagamento (HTTP → Controller → UseCase → Adapter → Gateway)
  - [ ] Quick Start com exemplos de `curl`
  - [ ] Variáveis de ambiente
  - [ ] Modelo de dados (tabelas/schemas)
  - [ ] Tabela de códigos de erro padronizados
  - [ ] API Reference por endpoint (body, params, respostas por status code)
  - [ ] Playground interativo ("Try it")

### 12.3 OpenAPI / Swagger

- [ ] **docs:** Gerar especificação OpenAPI 3.0 (YAML ou JSON)
- [ ] **docs:** Expor Swagger UI em `/swagger`

---

## 13. Qualidade e Finalização

- [ ] **chore:** Verificar que `npm run lint` passa sem erros em todos os arquivos
- [ ] **chore:** Verificar que `npx tsc --noEmit` (typecheck) passa sem erros
- [ ] **chore:** Verificar que `npm run build` conclui sem erros
- [ ] **chore:** Verificar que todos os testes passam (`npm test`)
- [ ] **chore:** Verificar cobertura de testes ≥ 80% em use cases e domínio (`npm run test:coverage`)
- [ ] **chore:** Verificar que `docker compose up --build` sobe os 3 serviços e a API responde em `/health`
- [ ] **chore:** Validar fluxo completo manualmente (login → compra → listar cliente → detalhe da transação → reembolso) usando Collection Postman/Insomnia
- [ ] **chore:** Validar fallback de gateway (desativar gateway 1 e confirmar que gateway 2 processa a compra)
- [ ] **chore:** Validar regras de roles para todas as rotas protegidas (401, 403, 200/201)
- [ ] **chore:** Publicar repositório no GitHub e garantir que `git clone` + `docker compose up --build` funciona do zero

---

## Referências

- [AdonisJS Docs](https://docs.adonisjs.com)
- [Lucid ORM](https://lucid.adonisjs.com)
- [VineJS](https://vinejs.dev)
- [Briefing do Teste](docs/BRIEFING.md)
- [Modelagem do Banco](docs/DATABASE_MODEL.md)
- Collection Postman/Insomnia disponível no briefing
