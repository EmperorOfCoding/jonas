import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import {
  normalizeServicoInput,
  parseServicoId,
  ServicosValidationError,
  type ServicoInput,
} from "./servicos-validation";

export type Periodo = "hoje" | "semana" | "mes";
const PERIODOS: Periodo[] = ["hoje", "semana", "mes"];
const CEO_SHARE_PER_SERVICE = 20;

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

export type CreateServicoInput = ServicoInput;
export type UpdateServicoInput = ServicoInput;

type ServicoRow = Database["public"]["Tables"]["servicos"]["Row"];

export class ServicosError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = "ServicosError";
    this.status = status;
  }
}

function toDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeServico(row: ServicoRow): Servico {
  return {
    id: row.id,
    placa: row.placa ?? "",
    tipo_lavagem: row.tipo_lavagem ?? "",
    andar: row.andar ?? "",
    local: row.local ?? "",
    funcionario: row.funcionario ?? "",
    data_hora: row.data_hora ?? "",
    forma_pagamento: row.forma_pagamento ?? "",
    valor: Number(row.valor ?? 0),
  };
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

export function parsePeriodo(value: unknown): Periodo {
  return PERIODOS.includes(value as Periodo) ? (value as Periodo) : "hoje";
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

async function getAuthenticatedSupabase() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new ServicosError("Nao autorizado.", 401);
  }

  return supabase;
}

export async function listServicos(params: { from?: string; to?: string; limit?: number } = {}) {
  const supabase = await getAuthenticatedSupabase();
  let query = supabase.from("servicos").select("*").order("data_hora", { ascending: false });

  if (params.from) {
    query = query.gte("data_hora", params.from);
  }

  if (params.to) {
    query = query.lte("data_hora", params.to);
  }

  if (params.limit) {
    query = query.limit(params.limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new ServicosError("Nao foi possivel carregar os servicos.");
  }

  return ((data ?? []) as ServicoRow[]).map(normalizeServico);
}

export async function countServicos(params: { from?: string; to?: string } = {}) {
  const supabase = await getAuthenticatedSupabase();
  let query = supabase.from("servicos").select("id", { count: "exact", head: true });

  if (params.from) {
    query = query.gte("data_hora", params.from);
  }

  if (params.to) {
    query = query.lte("data_hora", params.to);
  }

  const { count, error } = await query;

  if (error) {
    throw new ServicosError("Nao foi possivel contar os servicos.");
  }

  return count ?? 0;
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

export function getParteCEO(valor: number) {
  return Math.min(valor, CEO_SHARE_PER_SERVICE);
}

export function getParteFuncionario(valor: number) {
  return Math.max(valor - getParteCEO(valor), 0);
}

export async function createServico(input: CreateServicoInput) {
  const payload = normalizeForService(input);

  const supabase = await getAuthenticatedSupabase();
  const { error } = await supabase.from("servicos").insert(payload);

  if (error) {
    throw new ServicosError("Nao foi possivel registrar o servico.");
  }
}

export async function updateServico(id: string | number, input: UpdateServicoInput) {
  const safeId = normalizeIdForService(id);
  const payload = normalizeForService(input);
  const supabase = await getAuthenticatedSupabase();
  const { data, error } = await supabase.from("servicos").update(payload).eq("id", safeId).select("id").maybeSingle();

  if (error || !data) {
    throw new ServicosError("Nao foi possivel atualizar o servico.");
  }
}

export async function deleteServico(id: string | number) {
  const safeId = normalizeIdForService(id);
  const supabase = await getAuthenticatedSupabase();
  const { data, error } = await supabase.from("servicos").delete().eq("id", safeId).select("id").maybeSingle();

  if (error || !data) {
    throw new ServicosError("Nao foi possivel excluir o servico.");
  }
}

function normalizeForService(input: ServicoInput) {
  try {
    return normalizeServicoInput(input);
  } catch (error) {
    if (error instanceof ServicosValidationError) {
      throw new ServicosError(error.message, 400);
    }

    throw error;
  }
}

function normalizeIdForService(id: string | number) {
  try {
    return parseServicoId(id);
  } catch (error) {
    if (error instanceof ServicosValidationError) {
      throw new ServicosError(error.message, 400);
    }

    throw error;
  }
}
