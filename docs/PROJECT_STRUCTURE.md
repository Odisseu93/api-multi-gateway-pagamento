# Estrutura do Projeto – API Multi-Gateway de Pagamentos

Documentação da estrutura de pastas do projeto, combinando as convenções do **AdonisJS 6 LTS** com a arquitetura **Clean Architecture + DDD + SOLID** definida nas regras do projeto.

---

## Visão Geral

O projeto é dividido em duas grandes camadas:

1. **Convenções do AdonisJS** — pastas obrigatórias do framework (`app/`, `config/`, `database/`, `start/`, `bin/`, `providers/`, `tests/`).
2. **Clean Architecture** — pasta `src/` com `domain/`, `application/`, `infrastructure/` e `shared/` para isolar as regras de negócio do framework.

A separação permite que o núcleo da aplicação (domain + application) **não tenha dependência do AdonisJS**, facilitando testes unitários puros e a adição de novos gateways.

---

## Estrutura de Pastas

```
api-multi-gateway-pagamento/
│
├── .adonisjs/                        # Gerado automaticamente pelo Adonis (não editar)
│   ├── client/                       # Cliente Tuyau (tipagem de rotas)
│   └── server/
│       ├── controllers.ts            # Índice de controllers (gerado pelo indexEntities)
│       ├── events.ts
│       ├── listeners.ts
│       └── routes.d.ts
│
├── .agent/
│   └── rules/                        # Regras do projeto (language, arch, TypeScript, TDD...)
│
├── app/                              # Camada HTTP do AdonisJS (Infrastructure → HTTP)
│   ├── controllers/                  # Controllers HTTP: recebem Request, delegam ao UseCase
│   │   ├── auth_controller.ts         # POST /api/v1/auth/login
│   │   ├── purchase_controller.ts     # POST /api/v1/transactions (compra)
│   │   ├── user_controller.ts         # CRUD /api/v1/users
│   │   ├── product_controller.ts      # CRUD /api/v1/products
│   │   ├── gateway_controller.ts      # PATCH toggle e priority /api/v1/gateways
│   │   ├── client_controller.ts       # GET /api/v1/clients
│   │   └── transaction_controller.ts  # GET e POST refund /api/v1/transactions
│   │
│   ├── middleware/                   # Middlewares HTTP do AdonisJS
│   │   ├── auth_middleware.ts         # Valida token e injeta usuário na request
│   │   ├── authorization_middleware.ts # Valida role do usuário (retorna 403 se não permitido)
│   │   ├── container_bindings_middleware.ts
│   │   ├── force_json_response_middleware.ts
│   │   └── silent_auth_middleware.ts
│   │
│   ├── validators/                   # VineJS validators (body/query de cada rota)
│   │   ├── auth_validator.ts
│   │   ├── purchase_validator.ts
│   │   ├── user_validator.ts
│   │   ├── product_validator.ts
│   │   └── gateway_validator.ts
│   │
│   ├── exceptions/
│   │   └── handler.ts                # ExceptionHandler global: mapeia erros para JSON padronizado
│   │
│   ├── models/                       # Lucid ORM Models (Infrastructure → Database)
│   │   ├── user.ts
│   │   ├── gateway.ts
│   │   ├── client.ts
│   │   ├── product.ts
│   │   ├── transaction.ts
│   │   └── transaction_product.ts
│   │
│   └── transformers/                 # Transformers de saída (serialização de models para DTO)
│       └── user_transformer.ts
│
├── bin/                              # Entrypoints do AdonisJS (não editar)
│   ├── console.ts                    # Entrypoint do Ace CLI
│   ├── server.ts                     # Entrypoint do servidor HTTP
│   └── test.ts                       # Entrypoint do runner de testes (Japa)
│
├── config/                           # Configurações dos módulos do AdonisJS
│   ├── app.ts                        # Configurações gerais (appKey, logger, etc.)
│   ├── auth.ts                       # Guard de autenticação (token via auth_access_tokens)
│   ├── bodyparser.ts
│   ├── cors.ts
│   ├── database.ts                   # Conexão MySQL via Lucid
│   ├── encryption.ts
│   ├── hash.ts                       # Configuração do bcrypt (hashing de senhas)
│   ├── logger.ts                     # Pino logger
│   ├── session.ts
│   └── shield.ts
│
├── database/                         # Banco de dados – migrations e seeds
│   ├── migrations/                   # Migrations em ordem de dependência
│   │   ├── xxxx_create_users_table.ts
│   │   ├── xxxx_create_access_tokens_table.ts
│   │   ├── xxxx_create_gateways_table.ts
│   │   ├── xxxx_create_clients_table.ts
│   │   ├── xxxx_create_products_table.ts
│   │   ├── xxxx_create_transactions_table.ts
│   │   └── xxxx_create_transaction_products_table.ts
│   └── seeders/
│       └── main_seeder.ts            # Usuário admin + gateways iniciais
│
├── docs/                             # Documentação do projeto
│   ├── BRIEFING.md                   # Briefing original do teste
│   ├── DATABASE_MODEL.md             # Modelagem do banco de dados
│   ├── PROJECT_STRUCTURE.md          # Este arquivo
│   └── DATABASE_MODELING.md          # Modelagem detalhada com ERD
│
├── providers/                        # Service Providers customizados do AdonisJS
│   └── api_provider.ts              # Registro dos Use Cases e Repositories no container de DI
│
├── src/                              # Clean Architecture — núcleo da aplicação
│   │
│   ├── domain/                       # Camada de domínio (zero dependências externas)
│   │   ├── entities/                 # Entidades ricas de domínio
│   │   │   ├── user.entity.ts
│   │   │   ├── gateway.entity.ts
│   │   │   ├── client.entity.ts
│   │   │   ├── product.entity.ts
│   │   │   ├── transaction.entity.ts
│   │   │   └── transaction-product.entity.ts
│   │   │
│   │   ├── value-objects/            # Objetos de valor imutáveis
│   │   │   ├── money.vo.ts           # Encapsula valor em centavos
│   │   │   └── card-last-numbers.vo.ts
│   │   │
│   │   ├── enums/                    # Enums de domínio
│   │   │   ├── role.enum.ts          # ADMIN | MANAGER | FINANCE | USER
│   │   │   └── transaction-status.enum.ts # pending | completed | failed | refunded
│   │   │
│   │   └── repositories/             # Interfaces (Ports) dos repositórios
│   │       ├── i-user.repository.ts
│   │       ├── i-gateway.repository.ts
│   │       ├── i-client.repository.ts
│   │       ├── i-product.repository.ts
│   │       └── i-transaction.repository.ts
│   │
│   ├── application/                  # Camada de aplicação — orquestração dos use cases
│   │   ├── use-cases/
│   │   │   ├── auth/
│   │   │   │   └── login.use-case.ts
│   │   │   ├── users/
│   │   │   │   ├── create-user.use-case.ts
│   │   │   │   ├── update-user.use-case.ts
│   │   │   │   ├── delete-user.use-case.ts
│   │   │   │   ├── list-users.use-case.ts
│   │   │   │   └── get-user.use-case.ts
│   │   │   ├── products/
│   │   │   │   ├── create-product.use-case.ts
│   │   │   │   ├── update-product.use-case.ts
│   │   │   │   ├── delete-product.use-case.ts
│   │   │   │   ├── list-products.use-case.ts
│   │   │   │   └── get-product.use-case.ts
│   │   │   ├── gateways/
│   │   │   │   ├── toggle-gateway.use-case.ts
│   │   │   │   └── update-gateway-priority.use-case.ts
│   │   │   ├── purchases/
│   │   │   │   └── process-purchase.use-case.ts  # núcleo: cálculo, retry, persistência
│   │   │   ├── clients/
│   │   │   │   ├── list-clients.use-case.ts
│   │   │   │   └── get-client.use-case.ts
│   │   │   └── transactions/
│   │   │       ├── list-transactions.use-case.ts
│   │   │       ├── get-transaction.use-case.ts
│   │   │       └── refund-transaction.use-case.ts
│   │   │
│   │   └── dtos/                     # DTOs de entrada e saída por domínio
│   │       ├── auth.dto.ts
│   │       ├── user.dto.ts
│   │       ├── product.dto.ts
│   │       ├── gateway.dto.ts
│   │       ├── client.dto.ts
│   │       ├── purchase.dto.ts
│   │       └── transaction.dto.ts
│   │
│   ├── infrastructure/               # Implementações concretas (adaptadores)
│   │   ├── database/
│   │   │   └── repositories/         # Implementações dos repositórios usando Lucid
│   │   │       ├── lucid-user.repository.ts
│   │   │       ├── lucid-gateway.repository.ts
│   │   │       ├── lucid-client.repository.ts
│   │   │       ├── lucid-product.repository.ts
│   │   │       └── lucid-transaction.repository.ts
│   │   │
│   │   └── gateways/                 # Adaptadores das APIs externas de pagamento
│   │       ├── contracts/
│   │       │   └── i-payment-gateway.adapter.ts  # Interface: charge(), refund()
│   │       └── adapters/
│   │           ├── gateway1.adapter.ts    # Bearer token auth → POST /transactions
│   │           ├── gateway2.adapter.ts    # Header auth → POST /transacoes
│   │           └── gateway-adapter.factory.ts # Resolve adapter pelo slug do gateway
│   │
│   └── shared/                       # Utilitários transversais
│       └── errors/
│           ├── app-error.ts          # Classe base de erros da aplicação
│           ├── not-found.error.ts
│           ├── unauthorized.error.ts
│           ├── forbidden.error.ts
│           └── conflict.error.ts
│
├── start/                            # Preloads do AdonisJS (carregados no boot)
│   ├── routes.ts                     # Definição de todas as rotas (pública e privadas)
│   ├── kernel.ts                     # Registro de middlewares globais e nomeados
│   ├── env.ts                        # Validação das variáveis de ambiente via Env.create()
│   └── validator.ts                  # Customizações globais do VineJS
│
├── tests/                            # Suítes de testes (Japa — runner nativo do AdonisJS)
│   ├── bootstrap.ts                  # Configuração do ambiente de teste
│   ├── unit/                         # Testes unitários ao lado de cada módulo testado
│   │   ├── domain/
│   │   │   ├── money.vo.spec.ts
│   │   │   └── transaction.entity.spec.ts
│   │   └── application/
│   │       ├── process-purchase.use-case.spec.ts
│   │       ├── refund-transaction.use-case.spec.ts
│   │       └── ...
│   ├── functional/                   # Testes de integração HTTP (Japa apiClient)
│   │   ├── auth.spec.ts
│   │   ├── purchase.spec.ts
│   │   ├── users.spec.ts
│   │   ├── products.spec.ts
│   │   ├── gateways.spec.ts
│   │   ├── clients.spec.ts
│   │   └── transactions.spec.ts
│   └── factories/                    # Fábricas de dados reutilizáveis nos testes
│       ├── user.factory.ts
│       ├── product.factory.ts
│       ├── gateway.factory.ts
│       ├── client.factory.ts
│       └── transaction.factory.ts
│
├── tmp/                              # Arquivos temporários (ex.: SQLite em dev)
│   └── .gitkeep
│
├── .env.example                      # Template de variáveis de ambiente
├── .gitignore
├── .editorconfig
├── .prettierignore
├── ace.js                            # Entrypoint do CLI Ace
├── adonisrc.ts                       # Configuração principal do AdonisJS
├── docker-compose.yml                # MySQL + API + mock dos gateways
├── Dockerfile                        # Build multi-stage (builder + production)
├── eslint.config.js                  # ESLint com @typescript-eslint/recommended
├── package.json                      # Scripts, imports (subpath aliases) e dependências
├── tsconfig.json                     # Configuração TypeScript (extends @adonisjs/tsconfig)
├── TODO.md                           # Checklist de desenvolvimento
└── README.md                         # Documentação principal do projeto
```

---

## Fluxo de uma Requisição

```
HTTP Request
    │
    ▼
[start/routes.ts]           Roteamento do AdonisJS
    │
    ▼
[app/middleware/]           auth_middleware → authorization_middleware
    │
    ▼
[app/validators/]           VineJS valida body/query (400/422 em caso de erro)
    │
    ▼
[app/controllers/]          Recebe input validado, chama o UseCase
    │
    ▼
[src/application/use-cases/]   Orquestra regras de negócio
    │          │
    │          ├──► [src/domain/]                  Entidades + Value Objects
    │          ├──► [src/infrastructure/database/]  Repositórios Lucid
    │          └──► [src/infrastructure/gateways/]  Adapters Gateway 1 / 2
    │
    ▼
[app/controllers/]          Formata resposta JSON { success, data } → response.created/ok
    │
    ▼
HTTP Response
```

---

## Subpath Imports (Aliases)

O AdonisJS 6 usa **Node.js Subpath Imports** (`#`) em vez de `paths` do `tsconfig.json`. Os aliases disponíveis são definidos em `package.json` → `"imports"`:

| Alias | Aponta para | Finalidade |
|-------|-------------|------------|
| `#controllers/*` | `./app/controllers/*.js` | Controllers HTTP |
| `#models/*` | `./app/models/*.js` | Lucid Models |
| `#middleware/*` | `./app/middleware/*.js` | Middlewares |
| `#validators/*` | `./app/validators/*.js` | VineJS validators |
| `#services/*` | `./app/services/*.js` | Services do Adonis |
| `#providers/*` | `./providers/*.js` | Service Providers |
| `#config/*` | `./config/*.js` | Configurações |
| `#start/*` | `./start/*.js` | Preloads |
| `#tests/*` | `./tests/*.js` | Utilitários de teste |
| `#generated/*` | `./.adonisjs/server/*.js` | Gerado pelo framework |

> **Para a Clean Architecture (`src/`)**, adicionar ao `package.json`:

```json
{
  "imports": {
    "#domain/*": "./src/domain/*.js",
    "#application/*": "./src/application/*.js",
    "#infrastructure/*": "./src/infrastructure/*.js",
    "#shared/*": "./src/shared/*.js"
  }
}
```

---

## Regras de Dependência (Clean Architecture)

```
domain  ←────────  application  ←────────  infrastructure
  (nenhuma           (importa só             (importa domain,
  dependência         domain e                application e
  externa)            shared)                 shared)
                                                    ↑
                                              app/ (HTTP layer)
                                              importa application
                                              e shared via DI
```

- **`domain/`** — nunca importa de `application`, `infrastructure`, `app/` ou pacotes externos.
- **`application/`** — importa apenas de `domain/` e `shared/`.
- **`infrastructure/`** — importa de `application/`, `domain/` e `shared/`; usa Lucid e axios/fetch.
- **`app/controllers/`** — importa use cases via injeção de dependência (container do AdonisJS); nunca importa repositórios diretamente.

---

## Suítes de Teste (Japa)

Configuradas em `adonisrc.ts`:

| Suite | Glob | Timeout |
|-------|------|---------|
| `unit` | `tests/unit/**/*.spec.{ts,js}` | 2 000 ms |
| `functional` | `tests/functional/**/*.spec.{ts,js}` | 30 000 ms |

**Comandos:**

```bash
node ace test           # Roda todas as suítes
node ace test unit      # Apenas testes unitários
node ace test functional # Apenas testes de integração
npm run test            # Alias para node ace test
```

---

## Referências

- [AdonisJS 6 — Documentação Oficial](https://docs.adonisjs.com)
- [Lucid ORM](https://lucid.adonisjs.com)
- [VineJS](https://vinejs.dev)
- [Japa (Test Runner)](https://japa.dev)
- [Regra de Arquitetura](.agent/rules/02-arquitetura.mdc)
- [Modelagem do Banco](docs/DATABASE_MODEL.md)
