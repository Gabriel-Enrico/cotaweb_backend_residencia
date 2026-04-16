import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("itens", (table) => {
    table.decimal("quantidade", 10, 2).notNullable().defaultTo(0);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("itens", (table) => {
    table.dropColumn("quantidade");
  });
}
