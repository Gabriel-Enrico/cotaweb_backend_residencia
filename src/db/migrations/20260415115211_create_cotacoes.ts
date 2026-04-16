import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Cabeçalho da cotação
  await knex.schema.createTable("cotacoes", (table) => {
    table.increments("id").primary();
    table.integer("restaurante_id").notNullable().references("id").inTable("restaurantes").onDelete("CASCADE");
    table.string("titulo", 150).nullable(); // ex: "Compras semana 20/04"
    table
      .enum("status", ["rascunho", "enviada", "respondida", "finalizada", "cancelada"])
      .notNullable()
      .defaultTo("rascunho");
    table.text("observacoes").nullable();
    table.timestamp("enviada_em").nullable();
    table.timestamp("finalizada_em").nullable();
    table.timestamps(true, true);
  });

  // Itens que compõem a cotação (lista de compras)
  await knex.schema.createTable("cotacao_itens", (table) => {
    table.increments("id").primary();
    table.integer("cotacao_id").notNullable().references("id").inTable("cotacoes").onDelete("CASCADE");
    table.integer("item_id").nullable().references("id").inTable("itens").onDelete("SET NULL");
    table.string("produto", 100).notNullable(); // desnormalizado para histórico
    table.string("unidade", 30).notNullable().defaultTo("un");
    table.decimal("quantidade", 10, 2).notNullable();
    table.timestamps(true, true);
  });

  // Relação entre cotação e fornecedores convidados
  await knex.schema.createTable("cotacao_fornecedores", (table) => {
    table.increments("id").primary();
    table.integer("cotacao_id").notNullable().references("id").inTable("cotacoes").onDelete("CASCADE");
    table.integer("fornecedor_id").notNullable().references("id").inTable("fornecedores").onDelete("CASCADE");
    table.string("token_resposta", 64).notNullable().unique(); // token único para o link do form
    table
      .enum("status", ["aguardando", "respondido", "recusado"])
      .notNullable()
      .defaultTo("aguardando");
    table.timestamp("respondido_em").nullable();
    table.timestamps(true, true);
  });

  // Respostas de preço por fornecedor, por item
  await knex.schema.createTable("cotacao_respostas", (table) => {
    table.increments("id").primary();
    table.integer("cotacao_fornecedor_id").notNullable().references("id").inTable("cotacao_fornecedores").onDelete("CASCADE");
    table.integer("cotacao_item_id").notNullable().references("id").inTable("cotacao_itens").onDelete("CASCADE");
    table.decimal("preco_unitario", 10, 2).notNullable();
    table.boolean("disponivel").notNullable().defaultTo(true);
    table.string("observacao", 255).nullable();
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("cotacao_respostas");
  await knex.schema.dropTableIfExists("cotacao_fornecedores");
  await knex.schema.dropTableIfExists("cotacao_itens");
  await knex.schema.dropTableIfExists("cotacoes");
}