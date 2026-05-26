import { NextRequest } from "next/server";
import {
  getParteFuncionario,
  listServicos,
  parseReportRange,
  ServicosError,
  summarizeServicos,
} from "@/lib/services/servicos";

function formatMoney(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function pdfText(value: string | number) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function buildPdf(lines: string[]) {
  const content = [
    "BT",
    "/F1 16 Tf",
    "50 792 Td",
    "18 TL",
    ...lines.map((line, index) => {
      const font = index === 0 ? "/F1 16 Tf" : index < 8 ? "/F1 10 Tf" : "/F1 9 Tf";
      return `${font} (${pdfText(line)}) Tj T*`;
    }),
    "ET",
  ].join("\n");

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefStart = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return Buffer.from(pdf, "utf-8");
}

export async function GET(request: NextRequest) {
  try {
    const { inicio, fim, from, to } = parseReportRange(
      request.nextUrl.searchParams.get("inicio"),
      request.nextUrl.searchParams.get("fim")
    );
    const filterTorre = request.nextUrl.searchParams.get("torre");
    const filterLocal = request.nextUrl.searchParams.get("local");
    const query = request.nextUrl.searchParams.get("q");

    let lista = await listServicos({ from, to });
    if (filterTorre) {
      lista = lista.filter((s) => s.andar === filterTorre);
    }
    if (filterLocal) {
      lista = lista.filter((s) => s.local === filterLocal);
    }
    if (query) {
      const q = query.trim().toUpperCase();
      lista = lista.filter((s) => s.placa.toUpperCase().includes(q));
    }

    const resumo = summarizeServicos(lista);
    const printableRows = lista.slice(0, 30);
    const truncated = lista.length > printableRows.length;

    const lines = [
      "Relatorio Jonas Lavagem",
      `Periodo: ${inicio} ate ${fim}`,
      `Total de servicos: ${resumo.totalServicos}`,
      `Receita total: ${formatMoney(resumo.receitaTotal)}`,
      `Ticket medio: ${formatMoney(resumo.ticketMedio)}`,
      `CEO (R$20/servico): ${formatMoney(resumo.parteCEO)}`,
      `Funcionarios: ${formatMoney(resumo.parteFuncionarios)}`,
      "",
      "Servicos",
      ...printableRows.map((servico) => {
        const data = new Date(servico.data_hora).toLocaleDateString("pt-BR");
        return `${data} | ${servico.placa} | ${servico.andar} | ${servico.local} | ${servico.funcionario} | func. ${formatMoney(getParteFuncionario(servico.valor))}`;
      }),
      truncated ? `Mais ${lista.length - printableRows.length} servicos no CSV completo.` : "",
    ].filter(Boolean);

    const pdf = buildPdf(lines);

    return new Response(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": String(pdf.byteLength),
        "Content-Disposition": `attachment; filename="relatorio-jonas-${inicio}-${fim}.pdf"`,
      },
    });
  } catch (error) {
    const status = error instanceof ServicosError ? error.status : 500;
    const message = error instanceof Error ? error.message : "Erro ao exportar relatorio.";

    return Response.json({ error: message }, { status });
  }
}
