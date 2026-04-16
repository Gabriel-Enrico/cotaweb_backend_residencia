import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("itens", (table) => {
    table.increments("id").primary();
    table.integer("restaurante_id").notNullable().references("id").inTable("restaurantes").onDelete("CASCADE");
    table.integer("departamento_id").nullable().references("id").inTable("departamentos").onDelete("SET NULL");
    table.string("produto", 100).notNullable();
    table.string("unidade", 30).notNullable().defaultTo("un");
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("itens");
}
