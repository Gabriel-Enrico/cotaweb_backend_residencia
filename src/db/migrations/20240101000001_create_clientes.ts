import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("clientes", (table) => {
    table.increments("id").primary();
    table.string("nome", 100).notNullable();
    table.string("telefone", 20).notNullable();
    table.string("email", 100).nullable();
    table.string("cpf", 14).notNullable().unique();
    table
      .enum("status", ["novo", "ativo", "inadimplente", "negociando", "pago", "cancelado"])
      .notNullable()
      .defaultTo("novo");
    table.timestamps(true, true); // created_at e updated_at automáticos
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("clientes");
}
