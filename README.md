# API Multi-Gateway de Pagamentos

API robusta para processamento de pagamentos com multiplos gateways, failover automatico e controle de acesso baseado em funcoes (RBAC).

## Visao Geral e Decisoes Arquiteturais

| Tecnologia             | Finalidade           | Justificativa                                                                              |
| :--------------------- | :------------------- | :----------------------------------------------------------------------------------------- |
| **AdonisJS 6**         | Framework Backend    | Framework Node.js opinado, resiliente e focado em produtividade.                           |
| **Lucid ORM**          | Persistencia (MySQL) | Manipulacao eficiente de dados com suporte a migrations e relacionamentos.                 |
| **VineJS**             | Validacao            | Biblioteca de alto desempenho para validacao de esquemas e protecao de dados.              |
| **Clean Architecture** | Arquitetura          | Separacao de preocupacoes (Domain, Application, Infrastructure) para facilitar manutencao. |
| **Docker**             | Containerizacao      | Garante paridade entre ambientes de desenvolvimento e producao.                            |
| **TDD**                | Metodologia          | Desenvolvimento guiado por testes para garantir confiabilidade nos fluxos criticos.        |

## Documentacao Complementar

- [Modelagem do Banco de Dados](docs/DATABASE_MODELING.md)
- [Estrutura do Projeto](docs/PROJECT_STRUCTURE.md)
- [Colecao Postman](docs/postman/API%20de%20Pagamentos%20Multi-Gateway.postman_collection.json)

## URLs de Acesso

- **Health Check**: `http://localhost:3333/health`
- **API Base**: `http://localhost:3333/api/v1`

## Pre-requisitos

- Node.js v20 ou superior
- Docker e Docker Compose
- npm (gerenciador de pacotes)

## Variaveis de Ambiente

As variaveis de ambiente devem ser configuradas em um arquivo `.env`. Veja o arquivo `.env.example` para referencia.

| Variavel               | Obrigatoria | Descricao                                                  |
| :--------------------- | :---------- | :--------------------------------------------------------- |
| `NODE_ENV`             | Sim         | Ambiente de execucao (`development`, `production`, `test`) |
| `PORT`                 | Sim         | Porta do servidor da API (padrao 3333)                     |
| `DB_HOST`              | Sim         | Host do banco de dados MySQL                               |
| `DB_DATABASE`          | Sim         | Nome do banco de dados principal                           |
| `GATEWAY_1_TOKEN`      | Sim         | Token de autenticacao para o Gateway 1                     |
| `GATEWAY_2_AUTH_TOKEN` | Sim         | Token de autenticacao para o Gateway 2                     |

## Como rodar com Docker

Para rodar o projeto utilizando Docker, execute os comandos abaixo na **pasta raiz** do projeto:

```bash
# Sobe os containers e constroi a imagem
docker compose up --build

# Em outro terminal (ou se rodou com -d), execute os seeders para popular o banco
docker compose exec api node build/ace.js db:seed
```

> [!NOTE]
> Certifique-se de que o arquivo `.env` ja foi criado a partir do `.env.example` antes de subir os containers.

### Local (Manual)

> [!WARNING]
> Ao rodar localmente (fora do Docker), voce precisara de uma alternativa para o serviço `gateways-mock`. Este serviço simula as APIs externas dos gateways nas portas `3001` e `3002`.

1. Instale as dependencias: `npm install`
2. Configure o banco de dados MySQL local.
3. Execute as migrations e seeders: `node ace migration:run && node ace db:seed`
4. Inicie em modo dev: `npm run dev`

## Testes

### Requisitos para Testes Funcionais

Os testes funcionais (integracao) exigem um banco de dados MySQL ativo.

- **Docker**: Se estiver usando Docker, execute `docker compose exec api node ace test functional`.
- **Local**: Certifique-se de que o banco definido no `.env.test` para testes (geralmente com sufixo `_test`) esteja criado.

Comandos:

```bash
# Todos os testes
node ace test

# Apenas Funcionais
node ace test functional

# Apenas Unitarios
node ace test unit
```

## Referencia da API

A documentação interativa da API pode ser acessada via Swagger/Scalar:
- **Swagger/Scalar UI**: [http://localhost:3333/docs](http://localhost:3333/docs)
- **OpenAPI Spec (YAML)**: [http://localhost:3333/openapi.yaml](http://localhost:3333/openapi.yaml)

### Lista de Endpoints

> para facilitar a visualizacao dos endpoints, utilize o Swagger acima ou a colecao do postman disponivel em:
> [docs/postman/API de Pagamentos Multi-Gateway.postman_collection.json](./docs/postman/API%20de%20Pagamentos%20Multi-Gateway.postman_collection.json)

##### Autenticacao

| Metodo   | URL             | Descricao        | Auth | Permissoes (Roles) | Payload (JSON)        |
| :------- | :-------------- | :--------------- | :--- | :----------------- | :-------------------- |
| **POST** | `/api/v1/login` | Login no sistema | Nao  | Publico            | `{ email, password }` |

#### Transacoes & Compras

| Metodo   | URL                               | Descricao                | Auth | Permissoes (Roles) | Payload (JSON)                                                                         |
| :------- | :-------------------------------- | :----------------------- | :--- | :----------------- | :------------------------------------------------------------------------------------- |
| **POST** | `/api/v1/transactions`            | Criar Transacao (Compra) | Nao  | Publico            | `{ client: { name, email }, items: [{ productId, quantity }], card: { number, cvv } }` |
| **GET**  | `/api/v1/transactions`            | Listar Transacoes        | Sim  | Todos (RBAC)       | -                                                                                      |
| **GET**  | `/api/v1/transactions/:id`        | Ver Detalhes             | Sim  | Todos (RBAC)       | -                                                                                      |
| **POST** | `/api/v1/transactions/:id/refund` | Realizar Reembolso       | Sim  | ADMIN, FINANCE     | -                                                                                      |

#### Gateways

| Metodo    | URL                             | Descricao            | Auth | Permissoes (Roles) | Payload (JSON)         |
| :-------- | :------------------------------ | :------------------- | :--- | :----------------- | :--------------------- |
| **GET**   | `/api/v1/gateways`              | Listar Gateways      | Sim  | ADMIN              | -                      |
| **GET**   | `/api/v1/gateways/:id`          | Buscar Gateway       | Sim  | ADMIN              | -                      |
| **PATCH** | `/api/v1/gateways/:id/toggle`   | Alternar Status      | Sim  | ADMIN              | -                      |
| **PATCH** | `/api/v1/gateways/:id/priority` | Atualizar Prioridade | Sim  | ADMIN              | `{ priority: number }` |

#### Usuarios

| Metodo     | URL                 | Descricao       | Auth | Permissoes (Roles) | Payload (JSON)                        |
| :--------- | :------------------ | :-------------- | :--- | :----------------- | :------------------------------------ |
| **GET**    | `/api/v1/users`     | Listar Usuarios | Sim  | ADMIN, MANAGER     | -                                     |
| **POST**   | `/api/v1/users`     | Criar Usuario   | Sim  | ADMIN, MANAGER     | `{ name, email, password, role }`     |
| **GET**    | `/api/v1/users/:id` | Buscar Usuario  | Sim  | ADMIN, MANAGER     | -                                     |
| **PUT**    | `/api/v1/users/:id` | Editar Usuario  | Sim  | ADMIN, MANAGER     | `{ name?, email?, password?, role? }` |
| **DELETE** | `/api/v1/users/:id` | Excluir Usuario | Sim  | ADMIN              | -                                     |

#### Produtos

| Metodo     | URL                    | Descricao       | Auth | Permissoes (Roles)      | Payload (JSON)                  |
| :--------- | :--------------------- | :-------------- | :--- | :---------------------- | :------------------------------ |
| **GET**    | `/api/v1/products`     | Listar Produtos | Sim  | ADMIN, MANAGER, FINANCE | -                               |
| **POST**   | `/api/v1/products`     | Criar Produto   | Sim  | ADMIN, MANAGER, FINANCE | `{ name, amount }`              |
| **GET**    | `/api/v1/products/:id` | Buscar Produto  | Sim  | ADMIN, MANAGER, FINANCE | -                               |
| **PUT**    | `/api/v1/products/:id` | Editar Produto  | Sim  | ADMIN, MANAGER, FINANCE | `{ name?, amount?, isActive? }` |
| **DELETE** | `/api/v1/products/:id` | Excluir Produto | Sim  | ADMIN, MANAGER          | -                               |

#### Clientes & Reembolsos

| Metodo  | URL                   | Descricao         | Auth | Permissoes (Roles) | Payload (JSON) |
| :------ | :-------------------- | :---------------- | :--- | :----------------- | :------------- |
| **GET** | `/api/v1/clients`     | Listar Clientes   | Sim  | Todos (RBAC)       | -              |
| **GET** | `/api/v1/clients/:id` | Buscar Cliente    | Sim  | Todos (RBAC)       | -              |
| **GET** | `/api/v1/refunds`     | Listar Reembolsos | Sim  | Todos (RBAC)       | -              |
| **GET** | `/api/v1/refunds/:id` | Buscar Reembolso  | Sim  | Todos (RBAC)       | -              |

---

### Detalhes de Validacao (Schemas)

#### 1. Autenticacao (`POST /api/v1/login`)

- `email`: String (formato email, obrigatorio)
- `password`: String (min 8 caracteres, obrigatorio)

#### 2. Compra (`POST /api/v1/transactions`)

- `client`: Objeto `{ name: string, email: string }`
- `items`: Array de `{ productId: number, quantity: number }` (min 1 item)
- `card`: Objeto `{ number: string (13-19 digitos), cvv: string (3-4 digitos) }`

#### 3. Usuario (`POST /api/v1/users` | `PUT /api/v1/users/:id`)

- `name`: String (2-255 caracteres)
- `email`: String (email valido)
- `password`: String (min 8 caracteres)
- `role`: Enum (`ADMIN`, `MANAGER`, `FINANCE`, `USER`)

#### 4. Produto (`POST /api/v1/products` | `PUT /api/v1/products/:id`)

- `name`: String (2-255 caracteres)
- `amount`: Number (centavos, positivo, inteiro)
- `isActive`: Boolean (apenas no Update)

#### 5. Gateway (`PATCH /api/v1/gateways/:id/priority`)

- `priority`: Number (positivo, inteiro)

---

### Exemplos Completos (Principais Fluxos)

#### 1. Autenticacao (`POST /api/v1/login`)

**Request Body:**

```json
{
  "email": "admin@betalent.tech",
  "password": "password123"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "user": { "id": 1, "name": "Admin", "email": "admin@betalent.tech", "role": "ADMIN" },
    "token": "oa_..."
  }
}
```

#### 2. Criar Transacao (`POST /api/v1/transactions`)

**Request Body:**

```json
{
  "client": { "name": "Joao Silva", "email": "joao@example.com" },
  "items": [{ "productId": 1, "quantity": 2 }],
  "card": { "number": "1234567812345678", "cvv": "123" }
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "transactionId": 105,
    "status": "paid",
    "totalAmount": 10000
  }
}
```

#### 3. Reembolso (`POST /api/v1/transactions/:id/refund`)

**Response (200 OK):**

```json
{
  "success": true,
  "data": { "status": "refunded", "transactionId": 1 }
}
```

#### 4. Gerenciamento de Gateway (`PATCH /api/v1/gateways/:id/priority`)

**Request Body:**

```json
{ "priority": 1 }
```

**Response (200 OK):**

```json
{ "success": true, "data": { "id": 1, "priority": 1 } }
```

> **Nota:** Para todos os outros endpoints, consulte a [Colecao Postman](docs/postman/API%20de%20Pagamentos%20Multi-Gateway.postman_collection.json) que contem exemplos completos de request e response para cada funcionalidade.

### Estrutura de Pastas

```text
├── app/                  # Infraestrutura AdonisJS (Controllers, Models, Middlewares)
├── database/             # Migrations e Seeders
├── docs/                 # Documentacao tecnica e Postman
├── src/
│   ├── domain/           # Entidades, Value Objects e Interfaces (Business Rules)
│   ├── application/      # Use Cases e DTOs (Orquestracao)
│   ├── infrastructure/   # Implementacoes de Repositorios e Adapters de Gateway
│   └── shared/           # Erros globais e Utilitarios
├── tests/                # Testes Unitarios e Funcionais (Japa)
└── README.md
```
