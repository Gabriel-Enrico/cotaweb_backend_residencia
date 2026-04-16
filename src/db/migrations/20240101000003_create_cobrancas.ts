import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("cobrancas", (table) => {
    table.increments("id").primary();
    table
      .integer("contrato_id")
      .notNullable()
      .references("id")
      .inTable("contratos")
      .onDelete("CASCADE");
    table
      .integer("cliente_id")
      .notNullable()
      .references("id")
      .inTable("clientes")
      .onDelete("CASCADE");
    table.decimal("valor", 10, 2).notNullable();
    table.date("data_vencimento").notNullable();
    table.date("data_pagamento").nullable();
    table.decimal("valor_pago", 10, 2).nullable();
    table
      .enum("status", ["pendente", "pago", "vencido", "negociando", "cancelado"])
      .notNullable()
      .defaultTo("pendente");
    table.string("forma_pagamento", 50).nullable();
    table.text("observacoes").nullable();
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("cobrancas");
}
