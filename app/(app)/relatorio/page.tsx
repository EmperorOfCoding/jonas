import { Calendar, CheckCircle, Download, FileText } from "lucide-react";
import { listServicos, parseMesRange, parseReportRange, summarizeServicos } from "@/lib/services/servicos";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const MESES_CURTOS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export default async function RelatorioPage(props: PageProps<"/relatorio">) {
  const searchParams = await props.searchParams;
  const modo = searchParams?.modo === "periodo" ? "periodo" : "mes";

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const ano = Number(searchParams?.ano) || currentYear;
  const mes = Math.min(12, Math.max(1, Number(searchParams?.mes) || currentMonth));

  const range =
    modo === "mes"
      ? parseMesRange(mes, ano)
      : parseReportRange(
          searchParams?.inicio as string | undefined,
          searchParams?.fim as string | undefined,
        );

  const { inicio, fim, from, to } = range;

  const lista = await listServicos({ from, to });
  const { totalServicos, receitaTotal, ticketMedio, parteCEO, parteFuncionarios } =
    summarizeServicos(lista);

  const labelPeriodo =
    modo === "mes"
      ? `${MESES[mes - 1]} ${ano}`
      : `${inicio.slice(8)}/${inicio.slice(5, 7)} – ${fim.slice(8)}/${fim.slice(5, 7)}`;

  const mesHref = (n: number) => `/relatorio?modo=mes&mes=${n}&ano=${ano}`;
  const periodoHref = `/relatorio?modo=periodo&inicio=${inicio}&fim=${fim}`;
  const mesActiveHref = `/relatorio?modo=mes&mes=${mes}&ano=${ano}`;

  return (
    <div className="p-6 space-y-6">
      <div className="px-1">
        <h2 className="text-2xl font-black text-dark-navy">Relatório</h2>
        <p className="text-sm text-slate-400 mt-1">Dados de desempenho do período.</p>
      </div>

      {/* Mode toggle */}
      <div className="flex bg-slate-100 rounded-2xl p-1 gap-1">
        <a
          href={mesActiveHref}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold text-center transition-all ${
            modo === "mes"
              ? "bg-white text-dark-navy shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Por Mês
        </a>
        <a
          href={periodoHref}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold text-center transition-all ${
            modo === "periodo"
              ? "bg-white text-dark-navy shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Período
        </a>
      </div>

      {/* Month tabs or date filter */}
      {modo === "mes" ? (
        <div className="overflow-x-auto -mx-6 px-6">
          <div className="flex gap-2 w-max pb-1">
            {MESES_CURTOS.map((label, i) => {
              const n = i + 1;
              return (
                <a
                  key={n}
                  href={mesHref(n)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                    n === mes
                      ? "bg-primary text-white shadow-md"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {label}
                </a>
              );
            })}
          </div>
        </div>
      ) : (
        <form method="get" className="flex gap-4">
          <input type="hidden" name="modo" value="periodo" />
          <div className="flex-1 space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
              Início
            </label>
            <div className="bg-white border border-slate-100 rounded-xl px-3 py-2 flex items-center gap-2">
              <Calendar size={14} className="text-slate-400 shrink-0" />
              <input
                name="inicio"
                type="date"
                defaultValue={inicio}
                className="bg-transparent border-none text-xs w-full p-0 font-bold text-dark-navy outline-none"
              />
            </div>
          </div>
          <div className="flex-1 space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
              Fim
            </label>
            <div className="bg-white border border-slate-100 rounded-xl px-3 py-2 flex items-center gap-2">
              <Calendar size={14} className="text-slate-400 shrink-0" />
              <input
                name="fim"
                type="date"
                defaultValue={fim}
                className="bg-transparent border-none text-xs w-full p-0 font-bold text-dark-navy outline-none"
              />
            </div>
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl"
            >
              Filtrar
            </button>
          </div>
        </form>
      )}

      {/* Faturamento hero */}
      <div
        className="rounded-2xl p-6 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0b1e30 0%, #1b4f73 100%)" }}
      >
        <div className="relative z-10">
          <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-1">
            Faturamento — {labelPeriodo}
          </p>
          <h2 className="text-4xl font-black text-white">
            {receitaTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </h2>
          <div className="flex items-center gap-2 mt-4 text-white/80">
            <CheckCircle size={14} className="text-emerald-400" />
            <span className="text-sm font-medium">{totalServicos} lavagens concluídas</span>
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="flex gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex-1 flex flex-col items-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Total Serv.
          </span>
          <span className="text-2xl font-black text-dark-navy">{totalServicos}</span>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex-1 flex flex-col items-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Ticket Médio
          </span>
          <span className="text-xl font-black text-dark-navy">
            {ticketMedio.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </span>
        </div>
      </div>

      {/* Revenue split */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-3">
        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
          Divisão de Receita
        </h3>
        <div className="flex items-center justify-between rounded-xl bg-primary/10 px-4 py-3">
          <div>
            <p className="text-xs font-medium text-primary/70">CEO (R$20/serviço)</p>
            <p className="font-headline font-bold text-primary">
              {parteCEO.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </p>
          </div>
          <span className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center text-xs font-black text-primary">
            CEO
          </span>
        </div>
        <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
          <div>
            <p className="text-xs font-medium text-slate-400">Funcionários</p>
            <p className="font-headline font-bold text-dark-navy">
              {parteFuncionarios.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </p>
          </div>
          <span className="h-9 w-9 rounded-full bg-slate-200 flex items-center justify-center text-xs font-black text-slate-600">
            Eq.
          </span>
        </div>
        <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
          <div>
            <p className="text-xs font-medium text-slate-400">Ticket Médio</p>
            <p className="font-headline font-bold text-dark-navy">
              {ticketMedio.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </p>
          </div>
        </div>
      </div>

      {/* Service table */}
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-4 py-3 font-bold text-dark-navy uppercase text-[11px]">Veículo</th>
                <th className="px-4 py-3 font-bold text-dark-navy uppercase text-[11px]">Serviço</th>
                <th className="px-4 py-3 font-bold text-dark-navy uppercase text-[11px] text-right">
                  Valor
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {lista.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-sm text-slate-400 text-center">
                    Nenhum serviço no período.
                  </td>
                </tr>
              ) : (
                lista.map((s, i) => (
                  <tr key={s.id} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                    <td className="px-4 py-3 font-bold text-dark-navy font-mono tracking-wider">
                      {s.placa}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{s.tipo_lavagem}</td>
                    <td className="px-4 py-3 text-right font-bold text-primary">
                      {(s.valor ?? 0).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export buttons */}
      <div className="grid grid-cols-2 gap-4 pb-2">
        <a
          href={`/api/relatorio/csv?inicio=${inicio}&fim=${fim}`}
          className="flex items-center justify-center gap-2 bg-slate-100 py-4 rounded-xl text-slate-600 font-bold hover:bg-slate-200 transition-all"
        >
          <Download size={18} />
          <span>CSV</span>
        </a>
        <a
          href={`/api/relatorio/pdf?inicio=${inicio}&fim=${fim}`}
          className="flex items-center justify-center gap-2 bg-slate-100 py-4 rounded-xl text-slate-600 font-bold hover:bg-slate-200 transition-all"
        >
          <FileText size={18} />
          <span>PDF</span>
        </a>
      </div>
    </div>
  );
}
