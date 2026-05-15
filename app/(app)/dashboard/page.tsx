import Link from "next/link";
import { Car, Droplets, CheckCircle } from "lucide-react";
import { listServicos, parsePeriodo, periodoStart, summarizeServicos, type Periodo } from "@/lib/services/servicos";

export default async function DashboardPage(props: PageProps<"/dashboard">) {
  const searchParams = await props.searchParams;
  const periodo = parsePeriodo(searchParams?.periodo);

  const lista = await listServicos({ from: periodoStart(periodo) });
  const { totalServicos, receitaTotal, funcionariosRanking, veiculosFrequentes } =
    summarizeServicos(lista);
  const atividadesRecentes = lista.slice(0, 5);

  const labels: Record<Periodo, string> = { hoje: "Hoje", semana: "Semana", mes: "Mês" };
  const labelAtual = labels[periodo];

  return (
    <div className="p-6 space-y-6">
      {/* Period chips */}
      <div className="flex gap-2">
        {(["hoje", "semana", "mes"] as Periodo[]).map((p) => (
          <a
            key={p}
            href={`/dashboard?periodo=${p}`}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              periodo === p
                ? "bg-primary text-white shadow-md"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {labels[p]}
          </a>
        ))}
      </div>

      {/* Revenue card */}
      <div
        className="rounded-2xl p-6 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0b1e30 0%, #1b4f73 100%)" }}
      >
        <div className="relative z-10">
          <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-1">
            Receita — {labelAtual}
          </p>
          <h2 className="text-4xl font-black text-white">
            {receitaTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </h2>
          <div className="flex items-center gap-2 mt-4 text-white/80">
            <CheckCircle size={14} className="text-emerald-400" />
            <span className="text-sm font-medium">{totalServicos} lavagens concluídas</span>
          </div>
        </div>
        <Droplets className="absolute -right-4 -bottom-4 text-white/10 w-32 h-32 rotate-12" />
      </div>

      {/* Funcionários ranking */}
      {funcionariosRanking.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">
            Receita por Funcionário
          </h3>
          <ul className="space-y-3">
            {funcionariosRanking.map(([nome, receita]) => (
              <li key={nome} className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-black text-primary">
                  {nome.charAt(0)}
                </div>
                <p className="flex-1 text-sm font-semibold text-dark-navy">{nome}</p>
                <p className="text-sm font-bold text-primary">
                  {receita.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Veículos frequentes */}
      {veiculosFrequentes.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">
            Veículos Frequentes
          </h3>
          <ul className="space-y-2">
            {veiculosFrequentes.map(([veiculo, count]) => (
              <li
                key={veiculo}
                className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-2.5"
              >
                <span className="font-mono text-sm font-black tracking-wider text-dark-navy">
                  {veiculo}
                </span>
                <span className="text-sm font-semibold text-slate-400">{count}x</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Atividades recentes */}
      <div>
        <div className="flex justify-between items-center mb-4 px-1">
          <h3 className="text-lg font-bold text-dark-navy">Atividades Recentes</h3>
          <Link href="/atividades" className="text-primary text-sm font-bold">
            Ver tudo
          </Link>
        </div>

        {atividadesRecentes.length === 0 ? (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <p className="text-sm text-slate-400">Nenhum serviço no período.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {atividadesRecentes.map((servico) => (
              <li
                key={servico.id}
                className="bg-white p-4 rounded-2xl flex items-center justify-between border border-slate-100 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-emerald-50 text-emerald-500">
                    <Car size={20} />
                  </div>
                  <div>
                    <span className="font-black text-dark-navy block">{servico.placa}</span>
                    <span className="text-xs text-slate-400 font-medium">{servico.tipo_lavagem}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-black text-primary block">
                    {(servico.valor ?? 0).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-slate-300 tracking-wider">
                    {new Date(servico.data_hora).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
