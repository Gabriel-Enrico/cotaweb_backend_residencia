import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { DepartamentoService } from "../services/DepartamentoService";
import { validate } from "../utils/validate";

const svc = new DepartamentoService();

const idParam = z.object({ id: z.coerce.number().int().positive() });
const restauranteParam = z.object({ restauranteId: z.coerce.number().int().positive() });

const createSchema = z.object({
  restaurante_id: z.number().int().positive(),
  nome: z.string().min(2).max(100).trim(),
  descricao: z.string().max(255).optional(),
});

const updateSchema = z.object({
  nome: z.string().min(2).max(100).trim().optional(),
  descricao: z.string().max(255).optional(),
});

export async function departamentoRoutes(app: FastifyInstance) {
  // GET /restaurantes/:restauranteId/departamentos
  app.get<{ Params: { restauranteId: string } }>(
    "/restaurantes/:restauranteId/departamentos",
    async (req, reply) => {
      const params = validate(restauranteParam, req.params, reply);
      if (!params) return;
      return reply.send(await svc.listarPorRestaurante(params.restauranteId));
    }
  );

  // POST /departamentos
  app.post("/departamentos", async (req, reply) => {
    const body = validate(createSchema, req.body, reply);
    if (!body) return;
    const dep = await svc.criar(body);
    return reply.status(201).send(dep);
  });

  // PUT /departamentos/:id
  app.put<{ Params: { id: string } }>("/departamentos/:id", async (req, reply) => {
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

  // DELETE /departamentos/:id
  app.delete<{ Params: { id: string } }>("/departamentos/:id", async (req, reply) => {
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