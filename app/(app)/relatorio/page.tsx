import { Calendar } from "lucide-react";
import { listServicos, parseMesRange, parseReportRange } from "@/lib/services/servicos";
import { LOCAIS, FUNCIONARIOS } from "../servico-options";
import RelatorioClient from "./RelatorioClient";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const MESES_CURTOS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function todayInput() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDia(iso: string) {
  return `${iso.slice(8)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
}

export default async function RelatorioPage(props: PageProps<"/relatorio">) {
  const searchParams = await props.searchParams;

  const rawModo = searchParams?.modo;
  const modo = rawModo === "periodo" ? "periodo" : rawModo === "dia" ? "dia" : "mes";

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const ano = Number(searchParams?.ano) || currentYear;
  const mes = Math.min(12, Math.max(1, Number(searchParams?.mes) || currentMonth));
  const dia = (searchParams?.dia as string | undefined) || todayInput();

  const range =
    modo === "mes"
      ? parseMesRange(mes, ano)
      : modo === "dia"
      ? parseReportRange(dia, dia)
      : parseReportRange(
          searchParams?.inicio as string | undefined,
          searchParams?.fim as string | undefined,
        );

  const { inicio, fim, from, to } = range;

  const filterTorre = searchParams?.torre as string | undefined;
  const filterLocal = searchParams?.local as string | undefined;
  const filterServico = searchParams?.servico as string | undefined;
  const filterAndar = searchParams?.andarApto as string | undefined;
  const equipeParamRaw = searchParams?.equipe;
  const filterEquipe = Array.isArray(equipeParamRaw) ? equipeParamRaw : (equipeParamRaw ? [equipeParamRaw] : []);

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
  if (filterAndar) {
    lista = lista.filter((s) => s.placa?.toLowerCase().includes(filterAndar.toLowerCase()));
  }
  if (filterEquipe.length > 0) {
    lista = lista.filter((s) => {
      if (!s.funcionario) return false;
      const funcsStr = s.funcionario.split(",").map((f) => f.trim().toLowerCase());
      return filterEquipe.some(e => funcsStr.includes(e.toLowerCase()));
    });
  }

  const labelPeriodo =
    modo === "mes"
      ? `${MESES[mes - 1]} ${ano}`
      : modo === "dia"
      ? formatDia(dia)
      : `${inicio.slice(8)}/${inicio.slice(5, 7)} – ${fim.slice(8)}/${fim.slice(5, 7)}`;

  const torreParam = filterTorre ? `&torre=${encodeURIComponent(filterTorre)}` : "";
  const localParam = filterLocal ? `&local=${encodeURIComponent(filterLocal)}` : "";
  const servicoParam = filterServico ? `&servico=${encodeURIComponent(filterServico)}` : "";
  const andarParam = filterAndar ? `&andarApto=${encodeURIComponent(filterAndar)}` : "";
  const equipeParamStr = filterEquipe.map(e => `&equipe=${encodeURIComponent(e)}`).join("");

  const mesHref = (n: number) => `/relatorio?modo=mes&mes=${n}&ano=${ano}${torreParam}${localParam}${servicoParam}${andarParam}${equipeParamStr}`;
  const mesActiveHref = `/relatorio?modo=mes&mes=${mes}&ano=${ano}${torreParam}${localParam}${servicoParam}${andarParam}${equipeParamStr}`;
  const diaActiveHref = `/relatorio?modo=dia&dia=${dia}${torreParam}${localParam}${servicoParam}${andarParam}${equipeParamStr}`;
  const periodoHref = `/relatorio?modo=periodo&inicio=${inicio}&fim=${fim}${torreParam}${localParam}${servicoParam}${andarParam}${equipeParamStr}`;

  return (
    <div className="p-6 space-y-6">
      <div className="px-1">
        <h2 className="text-2xl font-black text-dark-navy">Relatório</h2>
        <p className="text-sm text-slate-400 mt-1">Dados de desempenho do período.</p>
      </div>

      {/* Mode toggle — 3 segments */}
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
          href={diaActiveHref}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold text-center transition-all ${
            modo === "dia"
              ? "bg-white text-dark-navy shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Por Dia
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

      {/* Mode selectors and Month Chips if mes */}
      {modo === "mes" && (
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
      )}

      {/* Unified filters form */}
      <form method="get" className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-4">
        <input type="hidden" name="modo" value={modo} />
        {modo === "mes" && (
          <>
            <input type="hidden" name="mes" value={mes} />
            <input type="hidden" name="ano" value={ano} />
          </>
        )}

        <div className="flex flex-wrap gap-4 items-end">
          {modo === "dia" && (
            <div className="space-y-1 w-full sm:w-[calc(50%-8px)] lg:w-auto lg:flex-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                Data
              </label>
              <div className="bg-white border border-slate-100 rounded-xl px-3 py-2 flex items-center gap-2">
                <Calendar size={14} className="text-slate-400 shrink-0" />
                <input
                  name="dia"
                  type="date"
                  defaultValue={dia}
                  className="bg-transparent border-none text-xs w-full p-0 font-bold text-dark-navy outline-none"
                />
              </div>
            </div>
          )}

          {modo === "periodo" && (
            <>
              <div className="space-y-1 w-full sm:w-[calc(50%-8px)] lg:w-auto lg:flex-1">
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
              <div className="space-y-1 w-full sm:w-[calc(50%-8px)] lg:w-auto lg:flex-1">
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
            </>
          )}

          <div className="space-y-1 w-full sm:w-[calc(50%-8px)] lg:w-auto lg:flex-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
              Andar (Apto)
            </label>
            <input
              type="text"
              name="andarApto"
              defaultValue={filterAndar || ""}
              placeholder="Ex: 2201"
              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs font-bold text-dark-navy outline-none h-9 placeholder:text-slate-300"
            />
          </div>

          <div className="space-y-1 w-full sm:w-[calc(50%-8px)] lg:w-auto lg:flex-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
              Torre
            </label>
            <select
              name="torre"
              defaultValue={filterTorre || ""}
              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs font-bold text-dark-navy outline-none h-9"
            >
              <option value="">Todas</option>
              <option value="Torre A">Torre A</option>
              <option value="Torre B">Torre B</option>
            </select>
          </div>

          <div className="space-y-1 w-full sm:w-[calc(50%-8px)] lg:w-auto lg:flex-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
              Local
            </label>
            <select
              name="local"
              defaultValue={filterLocal || ""}
              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs font-bold text-dark-navy outline-none h-9"
            >
              <option value="">Todos</option>
              {LOCAIS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1 w-full sm:w-[calc(50%-8px)] lg:w-auto lg:flex-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
              Serviço
            </label>
            <select
              name="servico"
              defaultValue={filterServico || ""}
              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs font-bold text-dark-navy outline-none h-9"
            >
              <option value="">Todos</option>
              <option value="Completo">Completo</option>
              <option value="Externo">Externo</option>
            </select>
          </div>

          <div className="space-y-2 w-full">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
              Equipe
            </label>
            <div className="flex flex-wrap gap-2">
              {FUNCIONARIOS.map((f) => {
                const isSelected = filterEquipe.includes(f);
                return (
                  <label key={f} className="cursor-pointer select-none">
                    <input
                      type="checkbox"
                      name="equipe"
                      value={f}
                      defaultChecked={isSelected}
                      className="peer sr-only"
                    />
                    <div className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-[11px] font-bold text-slate-500 peer-checked:bg-primary peer-checked:text-white peer-checked:border-primary peer-checked:shadow-md transition-all">
                      {f}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="w-full sm:w-[calc(50%-8px)] lg:w-auto lg:flex-none flex items-end">
            <button
              type="submit"
              className="w-full lg:w-24 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-md hover:bg-primary-dark transition-all h-9"
            >
              Filtrar
            </button>
          </div>
        </div>
      </form>

      <RelatorioClient
        initialServicos={lista}
        inicio={inicio}
        fim={fim}
        labelPeriodo={labelPeriodo}
        torreParam={torreParam}
        localParam={localParam}
        servicoParam={servicoParam}
        andarParam={andarParam}
        equipeParamStr={equipeParamStr}
      />
    </div>
  );
}
