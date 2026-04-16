import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { RestauranteService } from "../services/RestauranteService";
import { validate } from "../utils/validate";

const svc = new RestauranteService();

const idParam = z.object({ id: z.coerce.number().int().positive() });

const createSchema = z.object({
  nome: z.string().min(2).max(100).trim(),
  telefone: z.string().regex(/^\d{10,11}$/, "Telefone deve ter 10 ou 11 dígitos"),
  email: z.string().email().optional(),
  cnpj: z.string().max(18).optional(),
  responsavel: z.string().max(100).optional(),
});

const updateSchema = createSchema.partial().extend({
  status: z.enum(["degustacao", "ativo", "suspenso", "cancelado"]).optional(),
});

export async function restauranteRoutes(app: FastifyInstance) {
  // GET /restaurantes
  app.get("/restaurantes", async (_req, reply) => {
    return reply.send(await svc.listar());
  });

  // GET /restaurantes/:id
  app.get<{ Params: { id: string } }>("/restaurantes/:id", async (req, reply) => {
    const params = validate(idParam, req.params, reply);
    if (!params) return;
    const r = await svc.buscarPorId(params.id);
    if (!r) return reply.status(404).send({ error: "Restaurante não encontrado" });
    return reply.send(r);
  });

  // POST /restaurantes
  app.post("/restaurantes", async (req, reply) => {
    const body = validate(createSchema, req.body, reply);
    if (!body) return;
    const r = await svc.criar(body);
    return reply.status(201).send(r);
  });

  // PUT /restaurantes/:id
  app.put<{ Params: { id: string } }>("/restaurantes/:id", async (req, reply) => {
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

  // DELETE /restaurantes/:id
  app.delete<{ Params: { id: string } }>("/restaurantes/:id", async (req, reply) => {
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