import assert from "node:assert/strict";
import test from "node:test";
import { normalizeServicoInput } from "../lib/services/servicos-validation";
import {
  filterServicos,
  sortServicosByIdDesc,
  parseAtividadeParams,
  type AtividadeFilterParams,
} from "../lib/services/servicos-utils";
import type { Servico } from "../lib/services/servicos-utils";

// ---------------------------------------------------------------------------
// Bug fix: date input "2026-10-03" must NOT shift to 2026-10-02 due to UTC offset
// ---------------------------------------------------------------------------

test("date-only input is saved as local noon UTC — day never shifts", () => {
  // Simulates: user selects 2026-10-03 in a BRT (UTC-3) timezone machine.
  // Previously new Date("2026-10-03") → 2026-10-03T00:00:00Z → displayed as 2026-10-02 locally.
  const result = normalizeServicoInput({
    placa: "BYD 2201",
    tipo_lavagem: "Completo G",
    andar: "Torre A",
    local: "Horto",
    funcionario: "Jonas",
    data_hora: "2026-10-03",
    forma_pagamento: "Pix",
    valor: "40",
  });

  // The day in the stored ISO string must be "03", regardless of timezone.
  // We use noon (T12:00:00Z) as an anchor safe for any UTC offset from -12 to +14.
  const stored = new Date(result.data_hora);
  assert.ok(
    !Number.isNaN(stored.getTime()),
    "stored data_hora must be a valid date"
  );
  assert.equal(
    stored.toISOString().slice(0, 10),
    "2026-10-03",
    "day must not shift due to UTC conversion"
  );
});

test("datetime-local input (with time) is preserved exactly", () => {
  // datetime-local inputs (e.g., "2026-10-03T14:30") should work unchanged.
  const result = normalizeServicoInput({
    placa: "BYD 2201",
    tipo_lavagem: "Externo",
    andar: "Torre B",
    local: "Barra",
    funcionario: "Rian",
    data_hora: "2026-10-03T14:30",
    forma_pagamento: "Dinheiro",
    valor: "35",
  });

  const stored = new Date(result.data_hora);
  assert.equal(stored.toISOString().slice(0, 10), "2026-10-03");
});

// ---------------------------------------------------------------------------
// filterServicos — multi-field filter for atividades
// ---------------------------------------------------------------------------

function makeServico(overrides: Partial<Servico> & { id: number }): Servico {
  return {
    placa: "BYD 2201",
    tipo_lavagem: "Completo G",
    andar: "Torre A",
    local: "Horto",
    funcionario: "Jonas",
    data_hora: "2026-10-03T12:00:00.000Z",
    forma_pagamento: "Pix",
    valor: 40,
    ...overrides,
  };
}

const FIXTURES: Servico[] = [
  makeServico({ id: 1, placa: "BYD 2201", andar: "Torre A", data_hora: "2026-10-01T12:00:00.000Z" }),
  makeServico({ id: 2, placa: "AUDI 1602", andar: "Torre B", data_hora: "2026-10-02T12:00:00.000Z" }),
  makeServico({ id: 3, placa: "BYD 2201", andar: "Torre A", data_hora: "2026-10-03T12:00:00.000Z" }),
  makeServico({ id: 4, placa: "CIVIC 0501", andar: "Torre A", data_hora: "2026-10-04T12:00:00.000Z" }),
  makeServico({ id: 5, placa: "AUDI 1602", andar: "Torre B", data_hora: "2026-10-05T12:00:00.000Z" }),
];

test("filterServicos — no filters returns all", () => {
  const result = filterServicos(FIXTURES, {});
  assert.equal(result.length, 5);
});

test("filterServicos — filter by placa (q) is case-insensitive", () => {
  const result = filterServicos(FIXTURES, { q: "byd" });
  assert.equal(result.length, 2);
  assert.ok(result.every((s) => s.placa.includes("BYD")));
});

test("filterServicos — filter by torre (andar)", () => {
  const result = filterServicos(FIXTURES, { torre: "Torre B" });
  assert.equal(result.length, 2);
  assert.ok(result.every((s) => s.andar === "Torre B"));
});

test("filterServicos — filter by date returns services on that date", () => {
  // "2026-10-03" should match services whose data_hora falls on 2026-10-03 UTC
  const result = filterServicos(FIXTURES, { data: "2026-10-03" });
  assert.equal(result.length, 1);
  assert.equal(result[0].id, 3);
});

test("filterServicos — combining q and torre", () => {
  const result = filterServicos(FIXTURES, { q: "audi", torre: "Torre B" });
  assert.equal(result.length, 2);
  assert.ok(result.every((s) => s.andar === "Torre B" && s.placa.includes("AUDI")));
});

test("filterServicos — combining q and data", () => {
  const result = filterServicos(FIXTURES, { q: "byd", data: "2026-10-03" });
  assert.equal(result.length, 1);
  assert.equal(result[0].id, 3);
});

// ---------------------------------------------------------------------------
// sortServicosByIdDesc — latest service (highest id) comes first
// ---------------------------------------------------------------------------

test("sortServicosByIdDesc orders by id descending", () => {
  const unsorted: Servico[] = [
    makeServico({ id: 1 }),
    makeServico({ id: 3 }),
    makeServico({ id: 2 }),
  ];
  const result = sortServicosByIdDesc(unsorted);
  assert.equal(result[0].id, 3);
  assert.equal(result[1].id, 2);
  assert.equal(result[2].id, 1);
});

test("sortServicosByIdDesc does not mutate the original array", () => {
  const original: Servico[] = [makeServico({ id: 1 }), makeServico({ id: 3 })];
  const copy = [...original];
  sortServicosByIdDesc(original);
  assert.deepEqual(
    original.map((s) => s.id),
    copy.map((s) => s.id)
  );
});

test("sortServicosByIdDesc: for same placa, the most recent (highest id) is first", () => {
  // Simulates: two AUDI 1602 registrations — newest must appear first
  const list: Servico[] = [
    makeServico({ id: 2, placa: "AUDI 1602" }),
    makeServico({ id: 5, placa: "AUDI 1602" }),
  ];
  const sorted = sortServicosByIdDesc(list);
  assert.equal(sorted[0].id, 5, "latest AUDI 1602 must be first");
});

// ---------------------------------------------------------------------------
// parseAtividadeParams — parse search params from URL safely
// ---------------------------------------------------------------------------

test("parseAtividadeParams returns empty strings for missing params", () => {
  const params = parseAtividadeParams({});
  assert.equal(params.q, "");
  assert.equal(params.torre, "");
  assert.equal(params.data, "");
  assert.equal(params.page, 1);
});

test("parseAtividadeParams picks up valid params", () => {
  const params = parseAtividadeParams({
    q: "BYD",
    torre: "Torre A",
    data: "2026-10-03",
    page: "2",
  });
  assert.equal(params.q, "BYD");
  assert.equal(params.torre, "Torre A");
  assert.equal(params.data, "2026-10-03");
  assert.equal(params.page, 2);
});

test("parseAtividadeParams clamps page to 1 for invalid values", () => {
  assert.equal(parseAtividadeParams({ page: "abc" }).page, 1);
  assert.equal(parseAtividadeParams({ page: "0" }).page, 1);
  assert.equal(parseAtividadeParams({ page: "-5" }).page, 1);
});
