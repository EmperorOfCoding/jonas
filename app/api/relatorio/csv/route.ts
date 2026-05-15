import { NextRequest } from "next/server";
import {
  getParteCEO,
  getParteFuncionario,
  listServicos,
  parseReportRange,
  ServicosError,
  summarizeServicos,
} from "@/lib/services/servicos";

function csvCell(value: string | number) {
  const text = String(value).replaceAll('"', '""');
  return `"${text}"`;
}

function formatMoney(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export async function GET(request: NextRequest) {
  try {
    const { inicio, fim, from, to } = parseReportRange(
      request.nextUrl.searchParams.get("inicio"),
      request.nextUrl.searchParams.get("fim")
    );
    const lista = await listServicos({ from, to });
    const resumo = summarizeServicos(lista);

    const rows = [
      ["Relatorio Jonas Lavagem"],
      [`Periodo: ${inicio} ate ${fim}`],
      [],
      ["Total de servicos", resumo.totalServicos],
      ["Receita total", formatMoney(resumo.receitaTotal)],
      ["Ticket medio", formatMoney(resumo.ticketMedio)],
      ["CEO (R$20/servico)", formatMoney(resumo.parteCEO)],
      ["Funcionarios", formatMoney(resumo.parteFuncionarios)],
      [],
      [
        "Data/Hora",
        "Placa",
        "Tipo",
        "Andar",
        "Local",
        "Funcionario",
        "Pagamento",
        "Valor",
        "Parte CEO",
        "Parte funcionario",
      ],
      ...lista.map((servico) => [
        new Date(servico.data_hora).toLocaleString("pt-BR"),
        servico.placa,
        servico.tipo_lavagem,
        servico.andar,
        servico.local,
        servico.funcionario,
        servico.forma_pagamento,
        formatMoney(servico.valor),
        formatMoney(getParteCEO(servico.valor)),
        formatMoney(getParteFuncionario(servico.valor)),
      ]),
    ];

    const csv = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");

    return new Response(`\uFEFF${csv}`, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="relatorio-jonas-${inicio}-${fim}.csv"`,
      },
    });
  } catch (error) {
    const status = error instanceof ServicosError ? error.status : 500;
    const message = error instanceof Error ? error.message : "Erro ao exportar relatorio.";

    return Response.json({ error: message }, { status });
  }
}
