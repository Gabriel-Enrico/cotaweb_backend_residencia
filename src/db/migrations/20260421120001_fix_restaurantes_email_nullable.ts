import type { Knex } from "knex";

/**
 * Bug Fix: torna a coluna 'email' nullable na tabela restaurantes.
 * A migration original definia email como notNullable, mas o service
 * e as rotas tratam email como campo opcional, causando erro de NOT NULL
 * ao criar um restaurante sem email.
 */
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
