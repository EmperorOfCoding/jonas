export class ServicosError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = "ServicosError";
    this.status = status;
  }
}

export type Periodo = "hoje" | "semana" | "mes";
export const PERIODOS: Periodo[] = ["hoje", "semana", "mes"];
export const CEO_SHARE_PER_SERVICE = 20;

export type Servico = {
  id: string | number;
  placa: string;
  tipo_lavagem: string;
  andar: string;
  local: string;
  funcionario: string;
  data_hora: string;
  forma_pagamento: string;
  valor: number;
};

export function toDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parsePeriodo(value: unknown): Periodo {
  return PERIODOS.includes(value as Periodo) ? (value as Periodo) : "hoje";
}

export function periodoStart(periodo: Periodo) {
  const now = new Date();
  const start = new Date(now);

  if (periodo === "hoje") {
    start.setHours(0, 0, 0, 0);
  } else if (periodo === "semana") {
    start.setDate(now.getDate() - 7);
    start.setHours(0, 0, 0, 0);
  } else {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
  }

  return start.toISOString();
}

export function defaultReportRange() {
  const end = new Date();
  const start = new Date(end.getFullYear(), end.getMonth(), 1);

  return {
    inicio: toDateInput(start),
    fim: toDateInput(end),
  };
}

export function parseMesRange(mes: number, ano: number) {
  const lastDay = new Date(ano, mes, 0).getDate();
  const inicio = `${ano}-${String(mes).padStart(2, "0")}-01`;
  const fim = `${ano}-${String(mes).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  const { from, to } = parseReportRange(inicio, fim);
  return { inicio, fim, from, to };
}

export function parseReportRange(inicio?: string | null, fim?: string | null) {
  const defaults = defaultReportRange();
  const startInput = inicio || defaults.inicio;
  const endInput = fim || defaults.fim;
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;

  if (!datePattern.test(startInput) || !datePattern.test(endInput)) {
    throw new ServicosError("Periodo invalido.", 400);
  }

  const start = new Date(`${startInput}T00:00:00`);
  const end = new Date(`${endInput}T23:59:59`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    throw new ServicosError("Periodo invalido.", 400);
  }

  return {
    inicio: startInput,
    fim: endInput,
    from: start.toISOString(),
    to: end.toISOString(),
  };
}

export function getParteCEO(valor: number) {
  return Math.min(valor, CEO_SHARE_PER_SERVICE);
}

export function getParteFuncionario(valor: number) {
  return Math.max(valor - getParteCEO(valor), 0);
}

export function summarizeServicos(lista: Servico[]) {
  const totalServicos = lista.length;
  const receitaTotal = lista.reduce((acc, servico) => acc + servico.valor, 0);
  const ticketMedio = totalServicos > 0 ? receitaTotal / totalServicos : 0;
  const parteCEO = lista.reduce((acc, servico) => acc + getParteCEO(servico.valor), 0);
  const parteFuncionarios = receitaTotal - parteCEO;

  const porFuncionario = lista.reduce<Record<string, number>>((acc, servico) => {
    const funcionario = servico.funcionario || "Sem funcionario";
    acc[funcionario] = (acc[funcionario] ?? 0) + getParteFuncionario(servico.valor);
    return acc;
  }, {});

  const porVeiculo = lista.reduce<Record<string, number>>((acc, servico) => {
    const veiculo = servico.placa || "Sem identificação";
    acc[veiculo] = (acc[veiculo] ?? 0) + 1;
    return acc;
  }, {});

  return {
    totalServicos,
    receitaTotal,
    ticketMedio,
    parteCEO,
    parteFuncionarios,
    funcionariosRanking: Object.entries(porFuncionario).sort((a, b) => b[1] - a[1]),
    veiculosFrequentes: Object.entries(porVeiculo)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5),
  };
}
