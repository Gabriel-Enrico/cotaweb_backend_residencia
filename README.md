Backend completo em **Node.js + Fastify + Knex + PostgreSQL + TypeScript** para gestão de clientes, contratos, cobranças e exportação Excel.

---

## 📦 Stack

- **Runtime:** Node.js + TypeScript
- **Framework:** Fastify
- **ORM/Query Builder:** Knex
- **Banco:** PostgreSQL
- **Exportação:** ExcelJS

---

## 🚀 Como rodar

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
# Edite o .env com suas credenciais do PostgreSQL
```

### 3. Criar o banco no PostgreSQL

```sql
CREATE DATABASE bee_fibra;
```

### 4. Rodar as migrations

```bash
npm run migrate
```

### 5. (Opcional) Rodar seeds com dados de exemplo

```bash
npm run seed
```

### 6. Iniciar em desenvolvimento

```bash
npm run dev
```

### 7. Build para produção

```bash
npm run build
npm start
```

---

## 🗄️ Estrutura do banco

```
clientes
  id, nome, telefone, email, cpf, status, created_at, updated_at

contratos
  id, cliente_id (FK), numero_contrato, valor_mensalidade, valor_divida,
  data_vencimento, data_inicio, data_cancelamento, status, plano, observacoes

cobrancas
  id, contrato_id (FK), cliente_id (FK), valor, data_vencimento,
  data_pagamento, valor_pago, status, forma_pagamento, observacoes
```

---

## 📡 Endpoints

### Clientes

| Método | Rota                      | Descrição                                        |
| ------ | ------------------------- | ------------------------------------------------ |
| GET    | `/clientes`               | Listar (filtros: status, nome, cpf, page, limit) |
| GET    | `/clientes/inadimplentes` | Resumo de inadimplentes com dívidas              |
| GET    | `/clientes/:id`           | Buscar por ID                                    |
| POST   | `/clientes`               | Criar cliente                                    |
| PUT    | `/clientes/:id`           | Atualizar cliente                                |
| DELETE | `/clientes/:id`           | Deletar cliente                                  |

### Contratos

| Método | Rota                               | Descrição                     |
| ------ | ---------------------------------- | ----------------------------- |
| GET    | `/contratos`                       | Listar todos (page, limit)    |
| GET    | `/contratos/:id`                   | Buscar por ID                 |
| GET    | `/contratos/cliente/:clienteId`    | Contratos de um cliente       |
| POST   | `/contratos`                       | Criar contrato                |
| PUT    | `/contratos/:id`                   | Atualizar contrato            |
| POST   | `/contratos/:id/recalcular-divida` | Recalcular dívida do contrato |

### Cobranças

| Método | Rota                       | Descrição                                                                |
| ------ | -------------------------- | ------------------------------------------------------------------------ |
| GET    | `/cobrancas`               | Listar (filtros: cliente_id, contrato_id, status, data_inicio, data_fim) |
| GET    | `/cobrancas/resumo`        | Dashboard financeiro                                                     |
| GET    | `/cobrancas/:id`           | Buscar por ID                                                            |
| POST   | `/cobrancas`               | Criar cobrança                                                           |
| PATCH  | `/cobrancas/:id/pagamento` | Registrar pagamento / atualizar status                                   |

### Exportação Excel

| Método | Rota                      | Descrição                          |
| ------ | ------------------------- | ---------------------------------- |
| GET    | `/exportar/clientes`      | Baixar .xlsx com todos os clientes |
| GET    | `/exportar/inadimplentes` | Baixar .xlsx apenas inadimplentes  |

---

## 📝 Exemplos de requisição

### Criar cliente

```bash
curl -X POST http://localhost:3000/clientes \
  -H "Content-Type: application/json" \
  -d '{"nome":"João Silva","telefone":"11999990001","cpf":"111.111.111-11","email":"joao@email.com"}'
```

### Registrar pagamento

```bash
curl -X PATCH http://localhost:3000/cobrancas/1/pagamento \
  -H "Content-Type: application/json" \
  -d '{"status":"pago","forma_pagamento":"PIX","valor_pago":129.90}'
```

### Listar inadimplentes

```bash
curl http://localhost:3000/clientes?status=inadimplente
```

### Baixar Excel de inadimplentes

```bash
curl http://localhost:3000/exportar/inadimplentes --output inadimplentes.xlsx
```
