# TODO – API Multi-Gateway de Pagamentos (Nível 3)

Checklist de desenvolvimento completo seguindo as regras do projeto (Clean Architecture + DDD + SOLID + TDD).

> **Convenção TDD:** o teste deve ser escrito **antes** da implementação. Cada item marcado de teste (`test`) deve preceder o item de implementação (`feat`) correspondente.

---

## 1. Setup do Projeto

- [x] **chore(config):** Inicializar projeto AdonisJS (última versão LTS) com TypeScript
  - `npm init adonisjs@latest . -- --kit=api`
- [ ] **chore(config):** Configurar `tsconfig.json` (`strict: true`, `esModuleInterop: true`, path aliases)
- [ ] **chore(config):** Instalar e configurar ESLint (`@typescript-eslint/recommended`) + Prettier
  - `.eslintrc.json`, `.prettierrc`
  - Scripts no `package.json`: `lint`, `lint:fix`, `format`, `typecheck`
- [ ] **chore(config):** Criar `.env.example` com todas as variáveis de ambiente necessárias
  - `NODE_ENV`, `PORT`, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_DATABASE`
  - `GATEWAY_1_URL`, `GATEWAY_2_URL`
  - `GATEWAY_1_EMAIL`, `GATEWAY_1_TOKEN`
  - `GATEWAY_2_AUTH_TOKEN`, `GATEWAY_2_AUTH_SECRET`
- [ ] **chore(config):** Configurar `@adonisjs/auth` (token guard — `auth_access_tokens`)
- [ ] **chore(config):** Configurar `@adonisjs/lucid` com MySQL
- [ ] **chore(config):** Criar `.gitignore` e `.dockerignore` adequados

---

## 2. Infraestrutura – Docker

- [ ] **chore(docker):** Criar `Dockerfile` multi-stage (builder + production) com Node Alpine
- [ ] **chore(docker):** Criar `docker-compose.yml` com os serviços:
  - `db` — MySQL 8 com healthcheck e volume de persistência
  - `api` — build da aplicação; `depends_on: db (service_healthy)`; migrations no startup
  - `gateways-mock` — imagem `matheusprotzen/gateways-mock` (com autenticação, sem `REMOVE_AUTH`)
- [ ] **chore(docker):** Validar que `docker compose up --build` sobe os 3 serviços corretamente
- [ ] **chore(docker):** Validar que Gateway 1 responde em `http://localhost:3001` e Gateway 2 em `http://localhost:3002`

---

## 3. Banco de Dados – Migrations e Seeds

> Ordem de criação: `users` → `auth_access_tokens` → `gateways` → `clients` → `products` → `transactions` → `transaction_products`

- [ ] **chore(db):** Migration `create_users_table`
  - Colunas: `id`, `full_name`, `email` (UNIQUE), `password`, `role` (VARCHAR 20, DEFAULT 'USER'), `created_at`, `updated_at`
- [ ] **chore(db):** Migration `create_auth_access_tokens_table`
  - Colunas: `id`, `tokenable_id` (FK → users ON DELETE CASCADE), `type`, `name`, `hash` (UNIQUE), `abilities`, `created_at`, `updated_at`, `last_used_at`, `expires_at`
- [ ] **chore(db):** Migration `create_gateways_table`
  - Colunas: `id`, `name`, `slug` (UNIQUE), `is_active` (DEFAULT true), `priority` (UNIQUE), `created_at`, `updated_at`
- [ ] **chore(db):** Migration `create_clients_table`
  - Colunas: `id`, `user_id` (FK → users.id, UNIQUE — relação 1:1 obrigatória), `name`, `email` (UNIQUE), `created_at`, `updated_at`, `deleted_at`
  - Todo cliente precisa ser um usuário; registro criado automaticamente na primeira compra de um `role = USER`
- [ ] **chore(db):** Migration `create_products_table`
  - Colunas: `id`, `name`, `amount` (INT UNSIGNED — centavos), `is_active` (DEFAULT true), `created_at`, `updated_at`
- [ ] **chore(db):** Migration `create_transactions_table`
  - Colunas: `id`, `client_id` (FK), `gateway_id` (FK, NULLABLE), `external_id`, `status` (VARCHAR 20), `total_amount` (INT UNSIGNED), `card_last_numbers` (VARCHAR 10), `created_at`, `updated_at`
  - Índices: `client_id`, `gateway_id`, `external_id`, `status`, `created_at`
- [ ] **chore(db):** Migration `create_transaction_products_table`
  - Colunas: `id`, `transaction_id` (FK → transactions ON DELETE CASCADE), `product_id` (FK), `quantity` (INT UNSIGNED), `unit_amount` (INT UNSIGNED — snapshot), `created_at`, `updated_at`
  - Índice: `(transaction_id, product_id)`
- [ ] **chore(db):** Criar Seeder com dados iniciais:
  - Usuário ADMIN padrão
  - Gateway 1 (slug: `gateway_1`, priority: 1, is_active: true)
  - Gateway 2 (slug: `gateway_2`, priority: 2, is_active: true)

---

## 4. Domínio – Entidades, Value Objects e Interfaces

- [ ] **feat(domain):** Entidade `User` (`id`, `fullName`, `email`, `password`, `role`)
- [ ] **feat(domain):** Entidade `Gateway` (`id`, `name`, `slug`, `isActive`, `priority`)
- [ ] **feat(domain):** Entidade `Client` (`id`, `name`, `email`)
- [ ] **feat(domain):** Entidade `Product` (`id`, `name`, `amount`, `isActive`)
- [ ] **feat(domain):** Entidade `Transaction` (`id`, `clientId`, `gatewayId`, `externalId`, `status`, `totalAmount`, `cardLastNumbers`)
- [ ] **feat(domain):** Entidade `TransactionProduct` (`transactionId`, `productId`, `quantity`, `unitAmount`)
- [ ] **feat(domain):** Value Object `Money` (valor em centavos, imutável)
- [ ] **feat(domain):** Enum `Role` (`ADMIN`, `MANAGER`, `FINANCE`, `USER`)
- [ ] **feat(domain):** Enum `TransactionStatus` (`pending`, `completed`, `failed`, `refunded`)
- [ ] **feat(domain):** Interface `IUserRepository`
- [ ] **feat(domain):** Interface `IGatewayRepository`
- [ ] **feat(domain):** Interface `IClientRepository`
- [ ] **feat(domain):** Interface `IProductRepository`
- [ ] **feat(domain):** Interface `ITransactionRepository`
- [ ] **feat(domain):** Interface `IPaymentGatewayAdapter` (`charge()`, `refund()`)

---

## 5. Infrastructure – Lucid Models e Repositories

- [ ] **feat(infra):** Lucid Model `User` (relação `hasMany` com `AccessToken`)
- [ ] **feat(infra):** Lucid Model `Gateway`
- [ ] **feat(infra):** Lucid Model `Client` (relação `hasMany` com `Transaction`)
- [ ] **feat(infra):** Lucid Model `Product`
- [ ] **feat(infra):** Lucid Model `Transaction` (relações: `belongsTo(Client)`, `belongsTo(Gateway)`, `hasMany(TransactionProduct)`)
- [ ] **feat(infra):** Lucid Model `TransactionProduct` (relações: `belongsTo(Transaction)`, `belongsTo(Product)`)
- [ ] **feat(infra):** Implementar `LucidUserRepository` implementando `IUserRepository`
- [ ] **feat(infra):** Implementar `LucidGatewayRepository` implementando `IGatewayRepository`
- [ ] **feat(infra):** Implementar `LucidClientRepository` implementando `IClientRepository`
- [ ] **feat(infra):** Implementar `LucidProductRepository` implementando `IProductRepository`
- [ ] **feat(infra):** Implementar `LucidTransactionRepository` implementando `ITransactionRepository`
- [ ] **feat(infra):** Registrar repos no container de DI do AdonisJS

---

## 6. Infrastructure – Gateway Adapters

- [ ] **feat(gateways):** Implementar `Gateway1Adapter` implementando `IPaymentGatewayAdapter`
  - Login via `POST /login` (email + token); armazenar Bearer token para as chamadas seguintes
  - `charge()` → `POST /transactions` (amount, name, email, cardNumber, cvv)
  - `refund()` → `POST /transactions/:id/charge_back`
- [ ] **feat(gateways):** Implementar `Gateway2Adapter` implementando `IPaymentGatewayAdapter`
  - Autenticação via headers `Gateway-Auth-Token` e `Gateway-Auth-Secret`
  - `charge()` → `POST /transacoes` (valor, nome, email, numeroCartao, cvv)
  - `refund()` → `POST /transacoes/reembolso` ({ id })
- [ ] **feat(gateways):** Implementar `GatewayAdapterFactory` — resolve adapter pelo `slug` do gateway
- [ ] **feat(gateways):** Registrar adapters no container de DI

---

## 7. Application – DTOs

- [ ] **feat(application):** `LoginInputDto`, `LoginOutputDto`
- [ ] **feat(application):** `PurchaseInputDto` (lista de `{ productId, quantity }` + dados do cartão + dados do cliente), `PurchaseOutputDto`
- [ ] **feat(application):** `RefundInputDto`, `RefundOutputDto`
- [ ] **feat(application):** `CreateUserInputDto`, `UpdateUserInputDto`, `UserOutputDto`
- [ ] **feat(application):** `CreateProductInputDto`, `UpdateProductInputDto`, `ProductOutputDto`
- [ ] **feat(application):** `ClientOutputDto` (com lista de transações no detalhe)
- [ ] **feat(application):** `TransactionOutputDto` (com produtos)
- [ ] **feat(application):** `GatewayOutputDto`

---

## 8. Application – Use Cases (TDD: escrever o teste antes da implementação)

### 8.1 Autenticação
- [ ] **test(application):** Testes unitários para `LoginUseCase`
  - Cenários: credenciais válidas, email não encontrado, senha incorreta
- [ ] **feat(application):** Implementar `LoginUseCase` (valida credenciais → gera token via `@adonisjs/auth`)

### 8.2 Usuários
- [ ] **test(application):** Testes unitários para `CreateUserUseCase`, `UpdateUserUseCase`, `DeleteUserUseCase`, `ListUsersUseCase`, `GetUserUseCase`
- [ ] **feat(application):** Implementar `CreateUserUseCase` (hash da senha com `@adonisjs/hash`)
- [ ] **feat(application):** Implementar `UpdateUserUseCase`
- [ ] **feat(application):** Implementar `DeleteUserUseCase`
- [ ] **feat(application):** Implementar `ListUsersUseCase`
- [ ] **feat(application):** Implementar `GetUserUseCase`

### 8.3 Produtos
- [ ] **test(application):** Testes unitários para CRUD de produtos
- [ ] **feat(application):** Implementar `CreateProductUseCase`
- [ ] **feat(application):** Implementar `UpdateProductUseCase`
- [ ] **feat(application):** Implementar `DeleteProductUseCase`
- [ ] **feat(application):** Implementar `ListProductsUseCase`
- [ ] **feat(application):** Implementar `GetProductUseCase`

### 8.4 Gateways
- [ ] **test(application):** Testes unitários para `ToggleGatewayUseCase`, `UpdateGatewayPriorityUseCase`
- [ ] **feat(application):** Implementar `ToggleGatewayUseCase` (ativar/desativar)
- [ ] **feat(application):** Implementar `UpdateGatewayPriorityUseCase` (troca de prioridade entre gateways)

### 8.5 Compra / Pagamento (核心)
- [ ] **test(application):** Testes unitários para `ProcessPurchaseUseCase`
  - Cenário: cobra no gateway de maior prioridade quando tem sucesso
  - Cenário: tenta segundo gateway quando o primeiro falha
  - Cenário: retorna erro quando todos os gateways falham
  - Cenário: calcula `totalAmount` corretamente a partir de `(unit_amount × quantity)` de cada produto
  - Cenário: cria/rerusa client por email
  - Cenário: salva snapshot `unit_amount` em `transaction_products`
  - Cenário: persiste apenas os últimos 4 dígitos do cartão
- [ ] **feat(application):** Implementar `ProcessPurchaseUseCase`
  - Buscar produtos do DB e calcular valor total no back-end
  - Criar/reusar client pelo email
  - Carregar gateways ativos ordenados por priority
  - Tentar `adapter.charge()` em ordem; parar no primeiro sucesso
  - Persistir transação e transaction_products com snapshot de preço
  - Se todos falharem, retornar erro adequado

### 8.6 Clientes
- [ ] **test(application):** Testes unitários para `ListClientsUseCase`, `GetClientUseCase`
- [ ] **feat(application):** Implementar `ListClientsUseCase`
- [ ] **feat(application):** Implementar `GetClientUseCase` (detalhe + todas as suas transações)

### 8.7 Transações
- [ ] **test(application):** Testes unitários para `ListTransactionsUseCase`, `GetTransactionUseCase`
- [ ] **feat(application):** Implementar `ListTransactionsUseCase`
- [ ] **feat(application):** Implementar `GetTransactionUseCase`

### 8.8 Reembolso
- [ ] **test(application):** Testes unitários para `RefundTransactionUseCase`
  - Cenário: reembolso bem-sucedido → status = `refunded`
  - Cenário: transação já reembolsada → erro de conflito (409)
  - Cenário: transação não encontrada → 404
  - Cenário: gateway retorna erro → mapear para erro adequado
- [ ] **feat(application):** Implementar `RefundTransactionUseCase`
  - Validar que transação existe e está em status `completed`
  - Chamar `adapter.refund()` do gateway que processou
  - Atualizar status da transação para `refunded`

---

## 9. Infrastructure – HTTP (Controllers, Middlewares, Rotas)

### 9.1 Middlewares
- [ ] **feat(http):** Middleware `AuthMiddleware` — valida token e injeta usuário na request
- [ ] **feat(http):** Middleware `AuthorizationMiddleware` (role guard) — verifica role do usuário; retorna 403 se não autorizado
- [ ] **feat(http):** `ExceptionHandler` global — mapeia `AppError`, `ValidationError`, `AuthenticationError`, erros não tratados para JSON padronizado `{ success, error: { code, message } }`

### 9.2 Validators (VineJS)
- [ ] **feat(http):** `LoginValidator`
- [ ] **feat(http):** `PurchaseValidator` (array de `{ productId, quantity }`, dados do cartão, dados do cliente)
- [ ] **feat(http):** `CreateUserValidator`, `UpdateUserValidator`
- [ ] **feat(http):** `CreateProductValidator`, `UpdateProductValidator`
- [ ] **feat(http):** `GatewayPriorityValidator`

### 9.3 Controllers
- [ ] **feat(http):** `AuthController` (`store` — login)
- [ ] **feat(http):** `PurchaseController` (`store` — realizar compra)
- [ ] **feat(http):** `UserController` (`index`, `show`, `store`, `update`, `destroy`)
- [ ] **feat(http):** `ProductController` (`index`, `show`, `store`, `update`, `destroy`)
- [ ] **feat(http):** `GatewayController` (`update` toggle ativo, `update` prioridade)
- [ ] **feat(http):** `ClientController` (`index`, `show`)
- [ ] **feat(http):** `TransactionController` (`index`, `show`, `refund`)

### 9.4 Rotas (`start/routes.ts`)
- [ ] **feat(http):** Rotas Públicas:
  - `POST /api/v1/login`
  - `POST /api/v1/transactions` (compra)
- [ ] **feat(http):** Rotas Privadas (autenticadas):
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

## 10. Testes de Integração / Http

- [ ] **test(http):** Testes de integração para rotas de autenticação
  - `POST /api/v1/login` → 200 com token; 401/422 em cenários de erro
- [ ] **test(http):** Testes de integração para rotas de compra
  - `POST /api/v1/transactions` → 201; 400 produtos inválidos
- [ ] **test(http):** Testes de integração para CRUD de usuários com validação de roles
  - 401 sem token; 403 role incorreta; 201/200/204 com role correta
- [ ] **test(http):** Testes de integração para CRUD de produtos com validação de roles
- [ ] **test(http):** Testes de integração para gerenciamento de gateways (toggle, prioridade)
- [ ] **test(http):** Testes de integração para listagem e detalhe de clientes
- [ ] **test(http):** Testes de integração para listagem, detalhe e reembolso de transações
- [ ] **test(http):** Testes de integração para adapters dos gateways (usando mock HTTP — nock ou msw)
  - Gateway 1: login, charge com sucesso, charge com erro, refund
  - Gateway 2: charge com sucesso, charge com erro, refund

---

## 11. Documentação

### 11.1 README.md
- [ ] **docs:** Criar `README.md` contendo:
  - [ ] Título + descrição do projeto
  - [ ] Tabela de URLs (local e produção): `/health`, `/docs`, `/swagger`
  - [ ] Tabela de decisões arquiteturais (AdonisJS, Lucid, VineJS, Clean Arch, Docker, TDD)
  - [ ] Pré-requisitos (Node.js versão, Docker, Docker Compose)
  - [ ] Tabela de variáveis de ambiente (nome, obrigatória, descrição, padrão)
  - [ ] Instalação e execução com Docker (passo a passo)
  - [ ] Instalação e execução local sem Docker da aplicação
  - [ ] Comandos de testes (`npm test`, `npm run test:coverage`)
  - [ ] Tabela completa de endpoints com `curl` de exemplo por rota
  - [ ] Estrutura de pastas resumida

### 11.2 API Docs (`/docs`)
- [ ] **docs:** Implementar página `/docs` (HTML servido via rota ou Swagger UI / Scalar / Redoc)
  - [ ] Visão geral da API (multi-gateway, retry, roles)
  - [ ] Arquitetura / fluxo de pagamento (HTTP → Controller → UseCase → Adapter → Gateway)
  - [ ] Quick Start com exemplos de `curl`
  - [ ] Variáveis de ambiente
  - [ ] Modelo de dados (tabelas/schemas)
  - [ ] Tabela de códigos de erro padronizados
  - [ ] API Reference por endpoint (body, params, respostas por status code)
  - [ ] Playground interativo ("Try it")

### 11.3 OpenAPI / Swagger
- [ ] **docs:** Gerar especificação OpenAPI 3.0 (YAML ou JSON)
- [ ] **docs:** Expor Swagger UI em `/swagger`

---

## 12. Qualidade e Finalização

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
