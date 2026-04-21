import type { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
  await knex("cotacoes").del();
  await knex("itens").del();
  await knex("fornecedores").del();
  await knex("departamentos").del();
  await knex("restaurantes").del();

  const [restaurante] = await knex("restaurantes")
    .insert({
      nome: "Restaurante do Manus",
      telefone: "11988887777",
      email: "contato@restaurante.com",
      cnpj: "12.345.678/0001-99",
      responsavel: "Manus Agent",
      status: "ativo",
      degustacao_inicio: knex.fn.now(),
    })
    .returning("id");

  const restauranteId = restaurante.id;

  const [depMercearia, depProteinas] = await knex("departamentos")
    .insert([
      { restaurante_id: restauranteId, nome: "MERCEARIA", descricao: "Produtos secos e latarias" },
      { restaurante_id: restauranteId, nome: "PROTEÍNAS", descricao: "Carnes, aves e peixes" },
    ])
    .returning("id");

  await knex("fornecedores").insert([
    {
      restaurante_id: restauranteId,
      nome: "Distribuidora Vale",
      telefone: "11977776666",
      email: "vendas@vale.com",
      cnpj: "11.222.333/0001-00",
      contato_nome: "Ricardo",
      ativo: true,
    },
    {
      restaurante_id: restauranteId,
      nome: "Frigorífico Boi Bom",
      telefone: "11966665555",
      email: "pedidos@boibom.com",
      cnpj: "22.333.444/0001-11",
      contato_nome: "Ana",
      ativo: true,
    },
  ]);

  await knex("itens").insert([
    {
      restaurante_id: restauranteId,
      departamento_id: depMercearia.id,
      produto: "Arroz Agulhinha T1 5kg",
      unidade: "pct",
      quantidade: 10,
    },
    {
      restaurante_id: restauranteId,
      departamento_id: depMercearia.id,
      produto: "Óleo de Soja 900ml",
      unidade: "cx",
      quantidade: 5,
    },
    {
      restaurante_id: restauranteId,
      departamento_id: depProteinas.id,
      produto: "Alcatra Limpa",
      unidade: "kg",
      quantidade: 20,
    },
    {
      restaurante_id: restauranteId,
      departamento_id: depProteinas.id,
      produto: "Peito de Frango",
      unidade: "kg",
      quantidade: 15,
    },
  ]);

  console.log("✅ Seed do CotaWeb finalizado com sucesso!");
}