import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Database } from "@/lib/supabase/database.types";
import {
  normalizeServicoInput,
  parseServicoId,
  ServicosValidationError,
  type ServicoInput,
} from "./servicos-validation";
import {
  ServicosError,
  type Periodo,
  type Servico,
  parsePeriodo,
  periodoStart,
  defaultReportRange,
  parseMesRange,
  parseReportRange,
  summarizeServicos,
  getParteCEO,
  getParteFuncionario,
} from "./servicos-utils";

export type { Periodo, Servico };
export {
  ServicosError,
  parsePeriodo,
  periodoStart,
  defaultReportRange,
  parseMesRange,
  parseReportRange,
  summarizeServicos,
  getParteCEO,
  getParteFuncionario,
};

export type CreateServicoInput = ServicoInput;
export type UpdateServicoInput = ServicoInput;

type ServicoRow = Database["public"]["Tables"]["servicos"]["Row"];

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

async function getAuthenticatedSupabase() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new ServicosError("Não autenticado", 401);
  }

  return supabase;
}

export async function listServicos(params: { from?: string; to?: string; limit?: number; offset?: number; q?: string } = {}) {
  const supabase = await getAuthenticatedSupabase();
  let query = supabase.from("servicos").select("*").order("id", { ascending: false });

  if (params.from) {
    query = query.gte("data_hora", params.from);
  }

  if (params.to) {
    query = query.lte("data_hora", params.to);
  }

  if (params.q) {
    query = query.ilike("placa", `%${params.q}%`);
  }

  if (params.limit !== undefined) {
    query = query.limit(params.limit);
  }

  if (params.offset !== undefined && params.limit !== undefined) {
    query = query.range(params.offset, params.offset + params.limit - 1);
  }

  const { data, error } = await query;

  if (error) {
    throw new ServicosError("Nao foi possivel carregar os servicos.");
  }

  return ((data ?? []) as ServicoRow[]).map(normalizeServico);
}

export async function countServicos(params: { from?: string; to?: string; q?: string } = {}) {
  const supabase = await getAuthenticatedSupabase();
  let query = supabase.from("servicos").select("id", { count: "exact", head: true });

  if (params.from) {
    query = query.gte("data_hora", params.from);
  }

  if (params.to) {
    query = query.lte("data_hora", params.to);
  }

  if (params.q) {
    query = query.ilike("placa", `%${params.q}%`);
  }

  const { count, error } = await query;

  if (error) {
    throw new ServicosError("Nao foi possivel contar os servicos.");
  }

  return count ?? 0;
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
