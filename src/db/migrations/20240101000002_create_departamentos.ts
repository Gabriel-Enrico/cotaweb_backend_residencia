import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable('departamentos', (table) => {
        table.increments('id').primary();
        table.integer('restaurante_id').notNullable().references('id').inTable('restaurantes').onDelete('CASCADE');
        table.string('nome', 100).notNullable();
        table.string('descricao', 255).nullable()
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
    })
}


export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable('departamentos');
}

