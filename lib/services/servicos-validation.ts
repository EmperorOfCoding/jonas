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

  const dataHora = input.data_hora ? new Date(input.data_hora) : new Date();
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
