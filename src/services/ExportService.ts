import ExcelJS from "exceljs";
import db from "../db/connection";

export class ExportService {
  // Exportar clientes
  async exportarClientes(): Promise<ExcelJS.Buffer> {
    const clientes = await db("clientes")
      .leftJoin("contratos", "clientes.id", "contratos.cliente_id")
      .select(
        "clientes.id",
        "clientes.nome",
        "clientes.telefone",
        "clientes.email",
        "clientes.cpf",
        "clientes.status",
        "clientes.created_at",
        db.raw("COALESCE(contratos.numero_contrato, '-') as contrato"),
        db.raw("COALESCE(contratos.plano, '-') as plano"),
        db.raw("COALESCE(contratos.valor_divida, 0) as valor_divida")
      )
      .orderBy("clientes.nome");

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Bee Fibra API";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet("Clientes");

    // Estilo do cabeçalho
    sheet.columns = [
      { header: "ID", key: "id", width: 8 },
      { header: "Nome", key: "nome", width: 30 },
      { header: "Telefone", key: "telefone", width: 18 },
      { header: "Email", key: "email", width: 30 },
      { header: "CPF", key: "cpf", width: 18 },
      { header: "Status", key: "status", width: 15 },
      { header: "Contrato", key: "contrato", width: 18 },
      { header: "Plano", key: "plano", width: 18 },
      { header: "Dívida (R$)", key: "valor_divida", width: 15 },
      { header: "Cadastrado em", key: "created_at", width: 20 },
    ];

    const headerRow = sheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE8960A" },
      };
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.alignment = { horizontal: "center" };
    });

    clientes.forEach((c) => {
      const row = sheet.addRow({
        ...c,
        valor_divida: Number(c.valor_divida),
        created_at: new Date(c.created_at).toLocaleDateString("pt-BR"),
      });

      // Colorir linhas de inadimplentes
      if (c.status === "inadimplente") {
        row.eachCell((cell) => {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFFDE8E8" },
          };
        });
      }
    });

    // Formatar coluna de dívida
    sheet.getColumn("valor_divida").numFmt = 'R$ #,##0.00';

    return workbook.xlsx.writeBuffer();
  }

  // Exportar inadimplentes
  async exportarInadimplentes(): Promise<ExcelJS.Buffer> {
    const dados = await db("clientes")
      .join("contratos", "clientes.id", "contratos.cliente_id")
      .join("cobrancas", "contratos.id", "cobrancas.contrato_id")
      .where("clientes.status", "inadimplente")
      .whereIn("cobrancas.status", ["vencido", "negociando"])
      .select(
        "clientes.nome",
        "clientes.cpf",
        "clientes.telefone",
        "contratos.numero_contrato",
        "contratos.plano",
        "contratos.valor_divida",
        "cobrancas.valor as valor_cobranca",
        "cobrancas.data_vencimento",
        "cobrancas.status as status_cobranca",
        "cobrancas.observacoes"
      )
      .orderBy("contratos.valor_divida", "desc");

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Bee Fibra API";

    const sheet = workbook.addWorksheet("Inadimplentes");

    sheet.columns = [
      { header: "Nome", key: "nome", width: 30 },
      { header: "CPF", key: "cpf", width: 18 },
      { header: "Telefone", key: "telefone", width: 18 },
      { header: "Contrato", key: "numero_contrato", width: 18 },
      { header: "Plano", key: "plano", width: 18 },
      { header: "Total Dívida (R$)", key: "valor_divida", width: 18 },
      { header: "Parcela (R$)", key: "valor_cobranca", width: 15 },
      { header: "Vencimento", key: "data_vencimento", width: 15 },
      { header: "Situação", key: "status_cobranca", width: 15 },
      { header: "Observações", key: "observacoes", width: 35 },
    ];

    const headerRow = sheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFCC0000" },
      };
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.alignment = { horizontal: "center" };
    });

    dados.forEach((d) => {
      sheet.addRow({
        ...d,
        valor_divida: Number(d.valor_divida),
        valor_cobranca: Number(d.valor_cobranca),
        data_vencimento: new Date(d.data_vencimento + "T00:00:00").toLocaleDateString("pt-BR"),
        observacoes: d.observacoes || "-",
      });
    });

    sheet.getColumn("valor_divida").numFmt = 'R$ #,##0.00';
    sheet.getColumn("valor_cobranca").numFmt = 'R$ #,##0.00';

    return workbook.xlsx.writeBuffer();
  }
}
