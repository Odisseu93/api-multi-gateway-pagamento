# Modelagem do Banco de Dados — API Multi-Gateway de Pagamento

## Visão Geral

O banco de dados foi estruturado para suportar todos os requisitos do **Nível 3**, contemplando:
- Sistema de autenticação com controle de acesso por **roles** (ADMIN, MANAGER, FINANCE, USER)
- Gerenciamento modular de múltiplos **gateways de pagamento** com prioridade configurável
- Cadastro de **clientes** e **produtos** — todo cliente é obrigatoriamente um usuário do sistema
- **Transações** compostas por múltiplos produtos e quantidades
- Histórico de **reembolsos** rastreáveis por transação

---

## Diagrama Entidade-Relacionamento (ERD)

```
┌──────────────────────┐          ┌──────────────────────────────┐
│        users         │          │           gateways            │
├──────────────────────┤          ├──────────────────────────────┤
│ id (PK, BIGINT, AI)  │──────┐   │ id (PK, BIGINT, AI)          │
│ name (VARCHAR 100)   │      │   │ name (VARCHAR 100)           │
│ email (VARCHAR 150)  │      │   │ type (VARCHAR 50)            │
│ password (VARCHAR)   │      │   │ is_active (BOOLEAN)          │
│ role (ENUM)          │      │   │ priority (INT)               │
│ created_at           │      │   │ credentials (JSON)           │
│ updated_at           │      │   │ created_at                   │
│ deleted_at           │      │   │ updated_at                   │
└──────────────────────┘      │   └──────────────────────────────┘
                              │ 1:1
                              ▼
                                              │
                                              │ 1
                                              ▼ N
┌──────────────────────┐          ┌──────────────────────────────┐
│       clients        │          │         transactions          │
├──────────────────────┤          ├──────────────────────────────┤
│ id (PK, BIGINT, AI)  │◄────────►│ id (PK, BIGINT, AI)          │
│ user_id (FK → users) │  1    N  │ client_id (FK → clients)     │
│ name (VARCHAR 100)   │          │ gateway_id (FK → gateways)   │
│ email (VARCHAR 150)  │          │ external_id (VARCHAR 100)    │
│ created_at           │          │ status (ENUM)                │
│ updated_at           │          │ amount (BIGINT)              │
└──────────────────────┘          │ card_last_numbers (CHAR 4)   │
                                  │ created_at                   │
                                  │ updated_at                   │
                                  └──────────────────────────────┘
                                              │
                          ┌───────────────────┼──────────────────────┐
                          │ 1                 │ 1                    │
                          ▼ N                 ▼ 1                    │
┌──────────────────────────────┐  ┌──────────────────────────────┐   │
│     transaction_products     │  │          refunds             │   │
├──────────────────────────────┤  ├──────────────────────────────┤   │
│ id (PK, BIGINT, AI)          │  │ id (PK, BIGINT, AI)          │   │
│ transaction_id (FK)          │  │ transaction_id (FK)          │◄──┘
│ product_id (FK → products)   │  │ external_id (VARCHAR 100)    │
│ quantity (INT)               │  │ status (ENUM)                │
│ unit_amount (BIGINT)         │  │ amount (BIGINT)              │
│ created_at                   │  │ created_at                   │
└──────────────────────────────┘  └──────────────────────────────┘
              │
              │ N
              ▼ 1
┌──────────────────────┐
│       products       │
├──────────────────────┤
│ id (PK, BIGINT, AI)  │
│ name (VARCHAR 100)   │
│ amount (BIGINT)      │
│ created_at           │
│ updated_at           │
│ deleted_at           │
└──────────────────────┘
```

---

## Tabelas Detalhadas

### `users` — Usuários do sistema (administrativo)

| Coluna       | Tipo                                        | Restrições               | Descrição                            |
|--------------|---------------------------------------------|--------------------------|--------------------------------------|
| `id`         | `BIGINT UNSIGNED`                           | PK, AUTO_INCREMENT       | Identificador único                  |
| `name`       | `VARCHAR(100)`                              | NOT NULL                 | Nome completo do usuário             |
| `email`      | `VARCHAR(150)`                              | NOT NULL, UNIQUE         | E-mail (usado no login)              |
| `password`   | `VARCHAR(255)`                              | NOT NULL                 | Senha hasheada (bcrypt)              |
| `role`       | `ENUM('ADMIN','MANAGER','FINANCE','USER')`  | NOT NULL, DEFAULT 'USER' | Papel/nível de acesso                |
| `created_at` | `TIMESTAMP`                                 | NOT NULL, DEFAULT NOW    | Data de criação                      |
| `updated_at` | `TIMESTAMP`                                 | NOT NULL                 | Data da última atualização           |
| `deleted_at` | `TIMESTAMP`                                 | NULL                     | Soft delete                          |

**Roles e permissões:**
| Role      | Permissões                                                                 |
|-----------|----------------------------------------------------------------------------|
| `ADMIN`   | Acesso total — gerenciar usuários, produtos, gateways, reembolso, compras  |
| `MANAGER` | Gerenciar produtos e usuários                                              |
| `FINANCE` | Gerenciar produtos e realizar reembolso de compras                         |
| `USER`    | Realizar compras e consultar transações próprias                           |

---

### `gateways` — Gateways de pagamento

| Coluna        | Tipo           | Restrições         | Descrição                                              |
|---------------|----------------|--------------------|--------------------------------------------------------|
| `id`          | `BIGINT UNSIGNED` | PK, AUTO_INCREMENT | Identificador único                                 |
| `name`        | `VARCHAR(100)` | NOT NULL           | Nome do gateway (ex: "Gateway 1")                      |
| `type`        | `VARCHAR(50)`  | NOT NULL           | Identificador interno do tipo (ex: `gateway1`, `gateway2`) |
| `is_active`   | `BOOLEAN`      | NOT NULL, DEFAULT TRUE | Indica se está habilitado para uso                  |
| `priority`    | `INT UNSIGNED` | NOT NULL           | Ordem de tentativa (1 = maior prioridade)              |
| `credentials` | `JSON`         | NULL               | Credenciais de autenticação (token, secret etc.)       |
| `created_at`  | `TIMESTAMP`    | NOT NULL           | Data de criação                                        |
| `updated_at`  | `TIMESTAMP`    | NOT NULL           | Data da última atualização                             |

> **Nota:** O campo `credentials` armazena as credenciais de cada gateway de forma flexível (ex: `{"token": "...", "secret": "..."}` para o Gateway 2 ou `{"email": "...", "token": "..."}` para o Gateway 1). Esses dados devem ser criptografados em nível de aplicação antes do armazenamento.

> **Nota:** O campo `priority` deve ter um índice `UNIQUE` para garantir que dois gateways não tenham a mesma prioridade ao mesmo tempo.

---

### `clients` — Clientes (compradores)

| Coluna       | Tipo              | Restrições                          | Descrição                                    |
|--------------|-------------------|-------------------------------------|----------------------------------------------|
| `id`         | `BIGINT UNSIGNED` | PK, AUTO_INCREMENT                  | Identificador único                          |
| `user_id`    | `BIGINT UNSIGNED` | NOT NULL, UNIQUE, FK → users.id     | Usuário do sistema vinculado a este cliente  |
| `name`       | `VARCHAR(100)`    | NOT NULL                            | Nome completo do cliente                     |
| `email`      | `VARCHAR(150)`    | NOT NULL, UNIQUE                    | E-mail do cliente (espelhado de `users`)     |
| `created_at` | `TIMESTAMP`       | NOT NULL                            | Data de criação                              |
| `updated_at` | `TIMESTAMP`       | NOT NULL                            | Data da última atualização                   |
| `deleted_at` | `TIMESTAMP`       | NULL                                | Soft delete                                  |

> **Nota:** A relação `users → clients` é **1:1** obrigatória pelo lado do cliente — todo cliente precisa ser um usuário, mas nem todo usuário precisa ser um cliente (ex.: ADMIN e MANAGER não realizam compras). O registro em `clients` é criado automaticamente no primeiro momento em que um usuário (`role = USER`) realiza uma compra.

> **Nota:** O campo `email` em `clients` replica o e-mail de `users` para facilitar consultas históricas, mesmo se o e-mail do usuário for alterado no futuro.

---

### `products` — Produtos disponíveis para compra

| Coluna       | Tipo              | Restrições         | Descrição                              |
|--------------|-------------------|--------------------|----------------------------------------|
| `id`         | `BIGINT UNSIGNED` | PK, AUTO_INCREMENT | Identificador único                    |
| `name`       | `VARCHAR(100)`    | NOT NULL           | Nome do produto                        |
| `amount`     | `BIGINT UNSIGNED` | NOT NULL           | Preço do produto em centavos           |
| `created_at` | `TIMESTAMP`       | NOT NULL           | Data de criação                        |
| `updated_at` | `TIMESTAMP`       | NOT NULL           | Data da última atualização             |
| `deleted_at` | `TIMESTAMP`       | NULL               | Soft delete                            |

> **Nota:** O valor `amount` é armazenado em **centavos** (inteiro) para evitar problemas de precisão com ponto flutuante.

---

### `transactions` — Transações de pagamento

| Coluna             | Tipo                                           | Restrições         | Descrição                                          |
|--------------------|------------------------------------------------|--------------------|----------------------------------------------------|
| `id`               | `BIGINT UNSIGNED`                              | PK, AUTO_INCREMENT | Identificador único                                |
| `client_id`        | `BIGINT UNSIGNED`                              | FK → clients.id    | Cliente que realizou a compra                      |
| `gateway_id`       | `BIGINT UNSIGNED`                              | FK → gateways.id   | Gateway que processou o pagamento com sucesso      |
| `external_id`      | `VARCHAR(100)`                                 | NULL               | ID da transação no sistema do gateway              |
| `status`           | `ENUM('pending','paid','failed','refunded')`   | NOT NULL           | Status atual da transação                          |
| `amount`           | `BIGINT UNSIGNED`                              | NOT NULL           | Valor total da transação em centavos               |
| `card_last_numbers`| `CHAR(4)`                                      | NOT NULL           | Últimos 4 dígitos do cartão (dados sensíveis)      |
| `created_at`       | `TIMESTAMP`                                    | NOT NULL           | Data de criação                                    |
| `updated_at`       | `TIMESTAMP`                                    | NOT NULL           | Data da última atualização                         |

> **Nota:** O `amount` da transação é calculado no back-end a partir dos produtos e quantidades selecionados, nunca recebido diretamente do cliente.

---

### `transaction_products` — Produtos de uma transação (tabela pivot)

| Coluna           | Tipo              | Restrições              | Descrição                                  |
|------------------|-------------------|-------------------------|--------------------------------------------|
| `id`             | `BIGINT UNSIGNED` | PK, AUTO_INCREMENT      | Identificador único                        |
| `transaction_id` | `BIGINT UNSIGNED` | FK → transactions.id    | Transação à qual o item pertence           |
| `product_id`     | `BIGINT UNSIGNED` | FK → products.id        | Produto comprado                           |
| `quantity`       | `INT UNSIGNED`    | NOT NULL                | Quantidade do produto nesta transação      |
| `unit_amount`    | `BIGINT UNSIGNED` | NOT NULL                | Preço unitário no momento da compra        |
| `created_at`     | `TIMESTAMP`       | NOT NULL                | Data de criação                            |

> **Nota:** `unit_amount` registra o preço do produto **no momento da compra** (snapshot), garantindo rastreabilidade histórica mesmo que o preço do produto seja alterado posteriormente.

---

### `refunds` — Reembolsos de transações

| Coluna           | Tipo                              | Restrições           | Descrição                                      |
|------------------|-----------------------------------|----------------------|------------------------------------------------|
| `id`             | `BIGINT UNSIGNED`                 | PK, AUTO_INCREMENT   | Identificador único                            |
| `transaction_id` | `BIGINT UNSIGNED`                 | FK → transactions.id | Transação que foi reembolsada                  |
| `external_id`    | `VARCHAR(100)`                    | NULL                 | ID do reembolso no sistema do gateway          |
| `status`         | `ENUM('requested','approved','failed')` | NOT NULL       | Status do reembolso                            |
| `amount`         | `BIGINT UNSIGNED`                 | NOT NULL             | Valor reembolsado em centavos                  |
| `created_at`     | `TIMESTAMP`                       | NOT NULL             | Data de criação                                |

---

## Índices

| Tabela                  | Coluna(s)           | Tipo    | Motivo                                                       |
|-------------------------|---------------------|---------|--------------------------------------------------------------|
| `users`                 | `email`             | UNIQUE  | Unicidade + login rápido                                     |
| `users`                 | `role`              | INDEX   | Filtragem por role                                           |
| `gateways`              | `priority`          | UNIQUE  | Garantir prioridades únicas                                  |
| `gateways`              | `is_active`         | INDEX   | Filtragem rápida de gateways ativos                          |
| `clients`               | `user_id`           | UNIQUE  | Garante relação 1:1 com `users`                              |
| `clients`               | `email`             | UNIQUE  | Unicidade + lookup por e-mail                                |
| `transactions`          | `client_id`         | INDEX   | Listagem de compras por cliente                              |
| `transactions`          | `gateway_id`        | INDEX   | Relatórios por gateway                                       |
| `transactions`          | `status`            | INDEX   | Filtragem por status                                         |
| `transaction_products`  | `transaction_id`    | INDEX   | Listagem de itens por transação                              |
| `transaction_products`  | `product_id`        | INDEX   | Produtos mais comprados (analytics)                          |
| `refunds`               | `transaction_id`    | INDEX   | Consulta de reembolso por transação                          |

---

## Fluxo de uma Transação

```
Cliente envia: [produtos + quantidades + dados do cartão]
        │
        ▼
Back-end calcula o amount total
        │
        ▼
Tenta Gateway com menor priority (prioridade 1)
        │
   ┌────┴────────────────┐
   │ Sucesso             │ Falha
   ▼                     ▼
Salva transação      Tenta próximo
com status='paid'    gateway ativo
   │
   ▼
Cria transaction_products (snapshot de produtos/preços)
   │
   ▼
Retorna sucesso ao cliente
```

---

## Decisões de Design

| Decisão | Justificativa |
|---------|---------------|
| `amount` em centavos (`BIGINT`) | Evita erros de arredondamento com `FLOAT`/`DECIMAL` em operações financeiras |
| `unit_amount` em `transaction_products` | Snapshot histórico do preço para rastreabilidade, mesmo após edições de produto |
| `credentials` como `JSON` em `gateways` | Permite suportar diferentes formatos de autenticação por gateway sem alterar o schema |
| Soft delete (`deleted_at`) | Preserva histórico de usuários, clientes e produtos mesmo após exclusão lógica |
| Tabela `refunds` separada | Centraliza o histórico de reembolsos e permite múltiplas tentativas rastreáveis |
| `status` como `ENUM` em `transactions` | Restringe valores inválidos a nível de banco, garantindo integridade dos dados |
| `clients.user_id` (FK → users, UNIQUE) | Garante que todo cliente é obrigatoriamente um usuário; índice UNIQUE impõe relação 1:1 no banco |
| `clients.email` duplicado | Facilita consultas históricas de compras por e-mail sem JOIN em `users`, mesmo após eventual alteração de e-mail do usuário |
