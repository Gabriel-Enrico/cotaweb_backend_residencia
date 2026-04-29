# CotaWeb Backend — Formulário de Residência

API backend construída com **Fastify + TypeScript**, usando **Knex** como query builder e **PostgreSQL** como banco de dados (via Docker).

---

## Pré-requisitos

Instale estes programas **antes** de começar:

| Ferramenta | Versão mínima | Para que serve |
|---|---|---|
| [Node.js](https://nodejs.org/) | 18+ | Rodar o JavaScript/TypeScript |
| [Docker](https://docs.docker.com/get-docker/) | 20+ | Subir o banco PostgreSQL |
| [Docker Compose](https://docs.docker.com/compose/install/) | v2+ | Orquestrar o container do banco |
| [Git](https://git-scm.com/) | qualquer | Clonar o repositório |

> **Dica:** No Ubuntu/Debian, rode:
> ```bash
> sudo apt update && sudo apt install -y nodejs npm docker.io docker-compose git
> ```

---

## Passo a passo — primeira vez

### 1. Clonar o repositório

```bash
git clone <URL_DO_REPOSITÓRIO>
cd formulario_cotaweb_backend
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar as variáveis de ambiente

Copie o arquivo de exemplo e preencha com as suas credenciais:

```bash
cp .env.example .env
```

Edite o `.env` com os valores corretos para o seu ambiente (host, porta, nome do banco, usuário e senha).

### 4. Subir o banco de dados (PostgreSQL via Docker)

```bash
docker compose up -d
```

Isso cria um container PostgreSQL acessível em `localhost:5435`.

> **Verificar se o banco subiu:**
> ```bash
> docker compose ps
> ```
> O container `db_formulario` deve estar com status `Up`.

### 5. Rodar as migrations (criar as tabelas)

```bash
npm run migrate
```

### 6. (Opcional) Popular o banco com dados iniciais

```bash
# Todos os seeds
npm run seed

# Ou apenas os dados do CotaWeb
npm run seed:cotaweb
```

### 7. Iniciar o servidor em modo desenvolvimento

```bash
npm run dev
```

A API estará disponível em **http://localhost:3000**.

> **Health check:** acesse http://localhost:3000/health — deve retornar `{ "status": "ok" }`.

---

## Resumo dos comandos do dia a dia

| Comando | O que faz |
|---|---|
| `docker compose up -d` | Sobe o banco de dados |
| `docker compose down` | Para o banco de dados |
| `npm run dev` | Inicia o servidor em modo dev (com hot-reload) |
| `npm run build` | Compila TypeScript para JavaScript (pasta `dist/`) |
| `npm start` | Roda a versão compilada (produção) |
| `npm run migrate` | Roda as migrations pendentes |
| `npm run migrate:rollback` | Desfaz a última migration |
| `npm run seed` | Popula o banco com dados iniciais |
| `npm run seed:cotaweb` | Popula apenas os dados do CotaWeb |

---

## Estrutura do projeto

```
formulario_cotaweb_backend/
├── docker-compose.yaml      # Container PostgreSQL
├── package.json
├── tsconfig.json
├── .env                      # Variáveis de ambiente (NÃO commitar)
├── .env.example              # Modelo do .env
├── frontend/                 # Frontend estático (HTML/CSS/JS)
│   ├── index.html
│   ├── style.css
│   └── app.js
└── src/
    ├── server.ts             # Ponto de entrada do Fastify
    ├── db/
    │   ├── connection.ts     # Conexão com o banco
    │   ├── knexfile.ts       # Configuração do Knex
    │   ├── migrations/       # Migrations (estrutura das tabelas)
    │   └── seeds/            # Seeds (dados iniciais)
    ├── routes/               # Rotas da API
    ├── services/             # Lógica de negócio
    ├── schemas/              # Validações com Zod
    ├── types/                # Tipos TypeScript
    └── utils/                # Utilitários
```

---

## Frontend

O frontend fica na pasta `frontend/` e é composto por arquivos estáticos. Para usá-lo, basta abrir o arquivo `frontend/index.html` diretamente no navegador, ou servi-lo com qualquer servidor HTTP simples:

```bash
# Opção 1: extensão Live Server do VS Code

# Opção 2: via npx
npx -y serve frontend
```

---

## Em outra máquina (resumo rápido)

```bash
# 1. Clonar
git clone <URL_DO_REPOSITÓRIO>
cd formulario_cotaweb_backend

# 2. Instalar dependências
npm install

# 3. Configurar ambiente
cp .env.example .env

# 4. Subir o banco
docker compose up -d

# 5. Criar tabelas
npm run migrate

# 6. (Opcional) Popular dados
npm run seed

# 7. Rodar
npm run dev
```

---

## Solução de problemas

| Problema | Solução |
|---|---|
| `ECONNREFUSED` ao rodar migrate/dev | O Docker não está rodando. Execute `docker compose up -d` primeiro. |
| Porta 5435 já em uso | Pare o outro processo ou mude `DB_PORT` no `.env` e no `docker-compose.yaml`. |
| `npm run dev` falha com erro de TypeScript | Rode `npm install` novamente para garantir que as dependências estão atualizadas. |
| Container não sobe | Verifique com `docker compose logs db` para ver os logs do PostgreSQL. |
