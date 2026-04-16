import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("fornecedores", (table) => {
    table.increments("id").primary();
    table.integer("restaurante_id").notNullable().references("id").inTable("restaurantes").onDelete("CASCADE");
    table.string("nome", 100).notNullable();
    table.string("telefone", 20).notNullable();
    table.string("email", 100).nullable();
    table.string("cnpj", 18).nullable();
    table.string("contato_nome", 100).nullable();
    table.boolean("ativo").notNullable().defaultTo(true);
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("fornecedores");
}
