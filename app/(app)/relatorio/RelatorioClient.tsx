"use client";

import { useMemo, useState } from "react";
import { CheckCircle, Download, FileText, Search } from "lucide-react";
import { summarizeServicos, type Servico } from "@/lib/services/servicos-utils";
import { FUNCIONARIOS } from "../servico-options";

interface RelatorioClientProps {
  initialServicos: Servico[];
  inicio: string;
  fim: string;
  labelPeriodo: string;
  torreParam: string;
  localParam: string;
  servicoParam: string;
  andarParam?: string;
  equipeParamStr?: string;
}

export default function RelatorioClient({
  initialServicos,
  inicio,
  fim,
  labelPeriodo,
  torreParam,
  localParam,
  servicoParam,
  andarParam,
  equipeParamStr = "",
}: RelatorioClientProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredServicos = useMemo(() => {
    const q = searchQuery.trim().toUpperCase();
    if (!q) return initialServicos;
    return initialServicos.filter((s) => s.placa.toUpperCase().includes(q));
  }, [searchQuery, initialServicos]);

  const { totalServicos, receitaTotal, ticketMedio, parteCEO, parteFuncionarios, funcionariosRanking } =
    useMemo(() => summarizeServicos(filteredServicos), [filteredServicos]);

  const allFuncionariosReceita = useMemo(() => {
    const rankingMap = Object.fromEntries(funcionariosRanking);
    return FUNCIONARIOS.map((nome) => ({
      nome,
      receita: rankingMap[nome] ?? 0,
    })).sort((a, b) => b.receita - a.receita);
  }, [funcionariosRanking]);

  const exportCsvHref = `/api/relatorio/csv?inicio=${inicio}&fim=${fim}${torreParam}${localParam}${servicoParam}${andarParam || ""}${equipeParamStr}${
    searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ""
  }`;
  const exportPdfHref = `/api/relatorio/pdf?inicio=${inicio}&fim=${fim}${torreParam}${localParam}${servicoParam}${andarParam || ""}${equipeParamStr}${
    searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ""
  }`;

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          placeholder="Buscar por modelo ou andar (Ex: BYD ou 2201)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-4 bg-white border border-slate-100 rounded-2xl text-sm font-semibold outline-none focus:ring-2 focus:ring-primary transition-all text-dark-navy shadow-sm"
        />
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
      </div>

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
            <p className="text-xs font-medium text-slate-400">Funcionários (Total)</p>
            <p className="font-headline font-bold text-dark-navy">
              {parteFuncionarios.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </p>
          </div>
          <span className="h-9 w-9 rounded-full bg-slate-200 flex items-center justify-center text-xs font-black text-slate-600">
            Eq.
          </span>
        </div>

        {/* Detailed employee breakdown */}
        <div className="border-t border-slate-100 pt-3 mt-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Detalhamento por Funcionário
          </p>
          <ul className="space-y-2">
            {allFuncionariosReceita.map(({ nome, receita }) => (
              <li key={nome} className="flex justify-between items-center bg-slate-50 px-3 py-2 rounded-xl">
                <span className="text-xs font-semibold text-slate-600">{nome}</span>
                <span className="text-xs font-bold text-dark-navy">
                  {receita.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </span>
              </li>
            ))}
          </ul>
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
                <th className="px-4 py-3 font-bold text-dark-navy uppercase text-[11px]">Torre</th>
                <th className="px-4 py-3 font-bold text-dark-navy uppercase text-[11px]">Local</th>
                <th className="px-4 py-3 font-bold text-dark-navy uppercase text-[11px]">Equipe</th>
                <th className="px-4 py-3 font-bold text-dark-navy uppercase text-[11px] text-right">
                  Valor
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredServicos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-sm text-slate-400 text-center">
                    Nenhum serviço correspondente.
                  </td>
                </tr>
              ) : (
                filteredServicos.map((s, i) => (
                  <tr key={s.id} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                    <td className="px-4 py-3 font-bold text-dark-navy font-mono tracking-wider">
                      {s.placa}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{s.tipo_lavagem}</td>
                    <td className="px-4 py-3 text-slate-500 font-semibold">{s.andar}</td>
                    <td className="px-4 py-3 text-slate-500">{s.local}</td>
                    <td className="px-4 py-3">
                      {s.funcionario ? (
                        <div className="flex flex-wrap gap-1">
                          {s.funcionario.split(",").map((name) => (
                            <span key={name} className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider">
                              {name.trim()}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">-</span>
                      )}
                    </td>
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
          href={exportCsvHref}
          className="flex items-center justify-center gap-2 bg-slate-100 py-4 rounded-xl text-slate-600 font-bold hover:bg-slate-200 transition-all"
        >
          <Download size={18} />
          <span>CSV</span>
        </a>
        <a
          href={exportPdfHref}
          target="_blank"
          className="flex items-center justify-center gap-2 bg-slate-100 py-4 rounded-xl text-slate-600 font-bold hover:bg-slate-200 transition-all"
        >
          <FileText size={18} />
          <span>Exportar PDF</span>
        </a>
      </div>
    </div>
  );
}
