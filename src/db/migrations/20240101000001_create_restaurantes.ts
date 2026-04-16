import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable('restaurantes', (table) => {
        table.increments('id').primary();
        table.string('nome', 100).notNullable();
        table.string('telefone', 15).notNullable();
        table.string('email', 100).notNullable().unique();
        table.string('cnpj', 18).nullable().unique();
        table.string('responsavel', 100).nullable;
        table
            .enum('status', ['degustacao', 'ativo', 'suspenso', 'cancelado'])
            .notNullable()
            .defaultTo('degustacao')
        table.timestamp('degustacao_inicio').notNullable();
        table.timestamp('degustacao_fim').nullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
    })
}


export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable('restaurantes');
}

