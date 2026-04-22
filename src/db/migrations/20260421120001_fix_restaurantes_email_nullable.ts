import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("restaurantes", (table) => {
    table.string("email", 100).nullable().alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("restaurantes", (table) => {
    table.string("email", 100).notNullable().alter();
  });
}
