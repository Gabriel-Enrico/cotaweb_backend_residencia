import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { FornecedorService } from "../services/FornecedorService";
import { validate } from "../utils/validate";

const svc = new FornecedorService();

const idParam = z.object({ id: z.coerce.number().int().positive() });
const restauranteParam = z.object({ restauranteId: z.coerce.number().int().positive() });
const telefoneRegex = /^\d{10,11}$/;

const createSchema = z.object({
  restaurante_id: z.number().int().positive(),
  nome: z.string().min(2).max(100).trim(),
  telefone: z.string().regex(telefoneRegex, "Telefone deve ter 10 ou 11 dígitos"),
  email: z.string().email().optional(),
  cnpj: z.string().max(18).optional(),
  contato_nome: z.string().max(100).optional(),
});

const updateSchema = createSchema.omit({ restaurante_id: true }).partial().extend({
  ativo: z.boolean().optional(),
});

export async function fornecedorRoutes(app: FastifyInstance) {
  // GET /restaurantes/:restauranteId/fornecedores
  app.get<{ Params: { restauranteId: string } }>(
    "/restaurantes/:restauranteId/fornecedores",
    async (req, reply) => {
      const params = validate(restauranteParam, req.params, reply);
      if (!params) return;
      return reply.send(await svc.listarPorRestaurante(params.restauranteId));
    }
  );

  // GET /fornecedores/:id
  app.get<{ Params: { id: string } }>("/fornecedores/:id", async (req, reply) => {
    const params = validate(idParam, req.params, reply);
    if (!params) return;
    const f = await svc.buscarPorId(params.id);
    if (!f) return reply.status(404).send({ error: "Fornecedor não encontrado" });
    return reply.send(f);
  });

  // POST /fornecedores
  app.post("/fornecedores", async (req, reply) => {
    const body = validate(createSchema, req.body, reply);
    if (!body) return;
    return reply.status(201).send(await svc.criar(body));
  });

  // PUT /fornecedores/:id
  app.put<{ Params: { id: string } }>("/fornecedores/:id", async (req, reply) => {
    const params = validate(idParam, req.params, reply);
    if (!params) return;
    const body = validate(updateSchema, req.body, reply);
    if (!body) return;
    try {
      return reply.send(await svc.atualizar(params.id, body));
    } catch (err: any) {
      return reply.status(404).send({ error: err.message });
    }
  });

  // DELETE /fornecedores/:id
  app.delete<{ Params: { id: string } }>("/fornecedores/:id", async (req, reply) => {
    const params = validate(idParam, req.params, reply);
    if (!params) return;
    try {
      await svc.deletar(params.id);
      return reply.status(204).send();
    } catch (err: any) {
      return reply.status(404).send({ error: err.message });
    }
  });
}