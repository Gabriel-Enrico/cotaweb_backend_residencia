import type { FastifyInstance } from "fastify";
import { ExportService } from "../services/ExportService";

const exportService = new ExportService();

export async function exportRoutes(app: FastifyInstance) {
  // GET /exportar/clientes - baixar Excel com todos os clientes
  app.get("/exportar/clientes", async (_req, reply) => {
    const buffer = await exportService.exportarClientes();
    const filename = `clientes_${new Date().toISOString().split("T")[0]}.xlsx`;

    return reply
      .header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
      .header("Content-Disposition", `attachment; filename="${filename}"`)
      .send(Buffer.from(buffer));
  });

  // GET /exportar/inadimplentes - baixar Excel só dos inadimplentes
  app.get("/exportar/inadimplentes", async (_req, reply) => {
    const buffer = await exportService.exportarInadimplentes();
    const filename = `inadimplentes_${new Date().toISOString().split("T")[0]}.xlsx`;

    return reply
      .header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
      .header("Content-Disposition", `attachment; filename="${filename}"`)
      .send(Buffer.from(buffer));
  });
}
