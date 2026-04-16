import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("contratos", (table) => {
    table.increments("id").primary();
    table
      .integer("cliente_id")
      .notNullable()
      .references("id")
      .inTable("clientes")
      .onDelete("CASCADE");
    table.string("numero_contrato", 50).notNullable().unique();
    table.decimal("valor_mensalidade", 10, 2).notNullable();
    table.decimal("valor_divida", 10, 2).notNullable().defaultTo(0);
    table.date("data_vencimento").notNullable();
    table.date("data_inicio").notNullable();
    table.date("data_cancelamento").nullable();
    table
      .enum("status", ["ativo", "suspenso", "cancelado"])
      .notNullable()
      .defaultTo("ativo");
    table.string("plano", 100).nullable();
    table.text("observacoes").nullable();
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("contratos");
}
