# Estrutura do Projeto - API Multi-Gateway de Pagamentos

Documentacao da estrutura de pastas do projeto, combinando as convencoes do AdonisJS 6 LTS com a arquitetura Clean Architecture + DDD + SOLID definida nas regras do projeto.

---

## Visao Geral

O projeto e dividido em duas grandes camadas:

1. **Convencoes do AdonisJS** - pastas obrigatorias do framework (app/, config/, database/, start/, bin/, providers/, tests/).
2. **Clean Architecture** - pasta src/ com domain/, application/, infrastructure/ e shared/ para isolar as regras de negocio do framework.

A separacao permite que o nucleo da aplicacao (domain + application) nao tenha dependencia do AdonisJS, facilitando testes unitarios puros e a adicao de novos gateways.

---

## Estrutura de Pastas

```
api-multi-gateway-pagamento/
│
├── .adonisjs/                        # Gerado automaticamente pelo Adonis (nao editar)
│   ├── client/                       # Cliente Tuyau (tipagem de rotas)
│   └── server/
│       ├── controllers.ts            # Indice de controllers
│       ├── events.ts
│       ├── listeners.ts
│       └── routes.d.ts
│
├── app/                              # Camada HTTP do AdonisJS (Infrastructure -> HTTP)
│   ├── controllers/                  # Controllers HTTP: recebem Request, delegam ao UseCase
│   │   ├── auth_controller.ts
│   │   ├── purchase_controller.ts
│   │   ├── user_controller.ts
│   │   ├── product_controller.ts
│   │   ├── gateway_controller.ts
│   │   ├── client_controller.ts
│   │   ├── transaction_controller.ts
│   │   └── refund_controller.ts
│   │
│   ├── middleware/                   # Middlewares HTTP do AdonisJS
│   │   ├── auth_middleware.ts
│   │   ├── roles_authorization_middleware.ts
│   │   └── ...
│   │
│   ├── validators/                   # VineJS validators
│   │   ├── auth.validator.ts
│   │   ├── purchase.validator.ts
│   │   └── ...
│   │
│   ├── models/                       # Lucid ORM Models (Infrastructure -> Database)
│   │   ├── user.ts
│   │   ├── gateway.ts
│   │   ├── client.ts
│   │   ├── product.ts
│   │   ├── transaction.ts
│   │   └── transaction_product.ts
│   │
│   └── exceptions/
│       └── handler.ts                # ExceptionHandler global
│
├── bin/                              # Entrypoints do AdonisJS
├── config/                           # Configuracoes dos modulos do AdonisJS
│   ├── database.ts                   # Conexoes MySQL (incluindo configuracao de teste)
│   └── ...
│
├── database/                         # Banco de dados - migrations e seeds
│   ├── migrations/
│   └── seeders/
│
├── docs/                             # Documentacao do projeto
│   ├── BRIEFING.md
│   ├── DATABASE_MODELING.md
│   └── PROJECT_STRUCTURE.md
│
├── src/                              # Clean Architecture - nucleo da aplicacao
│   ├── domain/                       # Entidades, Value Objects e Interfaces
│   ├── application/                  # Use Cases e DTOs
│   ├── infrastructure/               # Repositorios Lucid e Adapters de Gateway
│   └── shared/                       # Erros e Utils
│
├── tests/                            # Suites de teste (Japa)
│   ├── unit/                         # Testes unitarios
│   ├── functional/                   # Testes de integracao HTTP
│   └── helper/                       # Utilitarios de teste (TestHelper.ts)
│
├── docker-compose.yml                # MySQL + API + Gateways Mock
├── Dockerfile                        # Build do container
├── TODO.md                           # Checklist de progresso
└── README.md                         # Documentacao principal
```

---

## Fluxo de uma Requisicao

```
HTTP Request
    │
    ▼
[start/routes.ts]           Roteamento do AdonisJS
    │
    ▼
[app/middleware/]           Auth -> Roles Authorization
    │
    ▼
[app/validators/]           VineJS valida dados
    │
    ▼
[app/controllers/]          Chama o Use Case
    │
    ▼
[src/application/use-cases/] Orquestracao
    │          │
    │          ├──► [src/domain/]          Entities + VOs
    │          ├──► [src/infrastructure/]  Persistence + Adapters
    │
    ▼
[app/controllers/]          Formata resposta JSON
    │
    ▼
HTTP Response
```

---

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

domain ←──────── application ←──────── infrastructure
(nenhuma (importa só (importa domain,
dependência domain e application e
externa) shared) shared)
↑
app/ (HTTP layer)
importa application
e shared via DI

````

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
````

---

## Referências

- [AdonisJS 6 — Documentação Oficial](https://docs.adonisjs.com)
- [Lucid ORM](https://lucid.adonisjs.com)
- [VineJS](https://vinejs.dev)
- [Japa (Test Runner)](https://japa.dev)
- [Regra de Arquitetura](.agent/rules/02-arquitetura.mdc)
- [Modelagem do Banco](docs/DATABASE_MODELING.md)
