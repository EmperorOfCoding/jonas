export type ServicoInput = {
  placa: string;
  tipo_lavagem: string;
  andar: string;
  local: string;
  funcionario: string;
  data_hora: string;
  forma_pagamento: string;
  valor: string;
};

export type ServicoPayload = {
  placa: string;
  tipo_lavagem: string;
  andar: string;
  local: string;
  funcionario: string;
  data_hora: string;
  forma_pagamento: string;
  valor: number;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class ServicosValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ServicosValidationError";
  }
}

function normalizeRequired(value: string, field: string) {
  const normalized = value.trim();
  if (!normalized) {
    throw new ServicosValidationError(`Preencha ${field}.`);
  }
  return normalized;
}

export function normalizeServicoInput(input: ServicoInput): ServicoPayload {
  const placa = input.placa.trim().toUpperCase();
  if (!placa) {
    throw new ServicosValidationError("Informe a identificação do veículo.");
  }

  const valor = Number(input.valor.replace(",", "."));
  if (!Number.isFinite(valor) || valor <= 0) {
    throw new ServicosValidationError("Informe um valor valido.");
  }

  // Fix timezone bug: a date-only string "YYYY-MM-DD" parsed via new Date() is
  // treated as midnight UTC, which shifts to the previous day in UTC-N timezones
  // (e.g. BRT = UTC-3 shows "2026-10-03" as "2026-10-02" locally).
  // Anchor to T12:00:00Z (noon UTC) — safe for every timezone from UTC-12 to UTC+14.
  const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
  const rawInput = input.data_hora || new Date().toISOString().slice(0, 10);
  const isoString = DATE_ONLY_PATTERN.test(rawInput.trim())
    ? `${rawInput.trim()}T12:00:00Z`
    : rawInput;
  const dataHora = new Date(isoString);
  if (Number.isNaN(dataHora.getTime())) {
    throw new ServicosValidationError("Informe uma data valida.");
  }

  return {
    placa,
    tipo_lavagem: normalizeRequired(input.tipo_lavagem, "o tipo de lavagem"),
    andar: normalizeRequired(input.andar, "o andar"),
    local: normalizeRequired(input.local, "o local"),
    funcionario: normalizeRequired(input.funcionario, "o funcionario"),
    data_hora: dataHora.toISOString(),
    forma_pagamento: normalizeRequired(input.forma_pagamento, "a forma de pagamento"),
    valor,
  };
}

export function parseServicoId(id: string | number) {
  const raw = String(id).trim();

  if (/^\d+$/.test(raw)) {
    return Number(raw);
  }

  if (UUID_PATTERN.test(raw)) {
    return raw;
  }

  throw new ServicosValidationError("Identificador do servico invalido.");
}
