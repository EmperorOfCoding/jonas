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
    const filterTorre = request.nextUrl.searchParams.get("torre");
    const filterLocal = request.nextUrl.searchParams.get("local");
    const filterServico = request.nextUrl.searchParams.get("servico");
    const filterAndarApto = request.nextUrl.searchParams.get("andarApto");
    const filterEquipe = request.nextUrl.searchParams.getAll("equipe");
    const query = request.nextUrl.searchParams.get("q");

    let lista = await listServicos({ from, to });
    if (filterTorre) {
      lista = lista.filter((s) => s.andar === filterTorre);
    }
    if (filterLocal) {
      lista = lista.filter((s) => s.local === filterLocal);
    }
    if (filterServico) {
      lista = lista.filter((s) => s.tipo_lavagem?.toLowerCase() === filterServico.toLowerCase());
    }
    if (filterAndarApto) {
      lista = lista.filter((s) => s.placa?.toLowerCase().includes(filterAndarApto.toLowerCase()));
    }
    if (filterEquipe.length > 0) {
      lista = lista.filter((s) => {
        if (!s.funcionario) return false;
        const funcsStr = s.funcionario.split(",").map((f) => f.trim().toLowerCase());
        return filterEquipe.some(e => funcsStr.includes(e.toLowerCase()));
      });
    }
    if (query) {
      const q = query.trim().toUpperCase();
      lista = lista.filter((s) => s.placa.toUpperCase().includes(q));
    }

    lista.sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime());

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
        "Torre",
        "Local",
        "Funcionario",
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
