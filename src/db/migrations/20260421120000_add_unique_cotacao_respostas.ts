import type { Knex } from "knex";

/**
 * Bug Fix: adiciona a unique constraint composta em cotacao_respostas
 * necessária para que .onConflict(["cotacao_fornecedor_id", "cotacao_item_id"]).merge()
 * funcione corretamente no CotacaoService.responder().
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("cotacao_respostas", (table) => {
    table.unique(["cotacao_fornecedor_id", "cotacao_item_id"], {
      indexName: "uq_cotacao_respostas_fornecedor_item",
    });
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("cotacao_respostas", (table) => {
    table.dropUnique(
      ["cotacao_fornecedor_id", "cotacao_item_id"],
      "uq_cotacao_respostas_fornecedor_item"
    );
  });
}
