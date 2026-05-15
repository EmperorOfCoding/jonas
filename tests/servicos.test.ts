import assert from "node:assert/strict";
import test from "node:test";
import {
  getParteCEO,
  getParteFuncionario,
  summarizeServicos,
  parseMesRange,
  parseReportRange,
  parsePeriodo,
  type Servico,
} from "../lib/services/servicos-utils";

// ---------------------------------------------------------------------------
// Revenue split
// ---------------------------------------------------------------------------

test("CEO share is capped at R$20 per service", () => {
  assert.equal(getParteCEO(20), 20);
  assert.equal(getParteCEO(50), 20);
  assert.equal(getParteCEO(10), 10);
  assert.equal(getParteCEO(0), 0);
});

test("employee share is the remainder after CEO cut", () => {
  assert.equal(getParteFuncionario(50), 30);
  assert.equal(getParteFuncionario(20), 0);
  assert.equal(getParteFuncionario(10), 0);
  assert.equal(getParteFuncionario(0), 0);
});

// ---------------------------------------------------------------------------
// summarizeServicos
// ---------------------------------------------------------------------------

function makeServico(overrides: Partial<Servico> = {}): Servico {
  return {
    id: 1,
    placa: "2201 BYD",
    tipo_lavagem: "Completo",
    andar: "1o",
    local: "Garagem",
    funcionario: "Maria",
    data_hora: new Date().toISOString(),
    forma_pagamento: "Pix",
    valor: 50,
    ...overrides,
  };
}

test("empty list produces all-zero summary", () => {
  const s = summarizeServicos([]);
  assert.equal(s.totalServicos, 0);
  assert.equal(s.receitaTotal, 0);
  assert.equal(s.ticketMedio, 0);
  assert.equal(s.parteCEO, 0);
  assert.equal(s.parteFuncionarios, 0);
  assert.deepEqual(s.funcionariosRanking, []);
  assert.deepEqual(s.veiculosFrequentes, []);
});

test("single service produces correct summary", () => {
  const s = summarizeServicos([makeServico({ valor: 50 })]);
  assert.equal(s.totalServicos, 1);
  assert.equal(s.receitaTotal, 50);
  assert.equal(s.ticketMedio, 50);
  assert.equal(s.parteCEO, 20);
  assert.equal(s.parteFuncionarios, 30);
});

test("multiple services accumulate totals and ticket medio", () => {
  const lista = [
    makeServico({ valor: 40 }),
    makeServico({ valor: 60 }),
  ];
  const s = summarizeServicos(lista);
  assert.equal(s.receitaTotal, 100);
  assert.equal(s.ticketMedio, 50);
  assert.equal(s.parteCEO, 40);
  assert.equal(s.parteFuncionarios, 60);
});

test("funcionariosRanking is sorted descending by revenue", () => {
  const lista = [
    makeServico({ funcionario: "Ana", valor: 30 }),
    makeServico({ funcionario: "Bob", valor: 50 }),
    makeServico({ funcionario: "Ana", valor: 20 }),
  ];
  const { funcionariosRanking } = summarizeServicos(lista);
  assert.equal(funcionariosRanking[0][0], "Bob");
  assert.equal(funcionariosRanking[1][0], "Ana");
  // Ana: valor 30 → employee 10, valor 20 → employee 0, total = 10
  assert.equal(funcionariosRanking[1][1], 10);
});

test("veiculosFrequentes returns top 5 by wash count", () => {
  const placas = ["AAA", "BBB", "CCC", "DDD", "EEE", "FFF"];
  // AAA appears 3x, BBB 2x, rest 1x
  const lista = [
    makeServico({ placa: "AAA" }),
    makeServico({ placa: "AAA" }),
    makeServico({ placa: "AAA" }),
    makeServico({ placa: "BBB" }),
    makeServico({ placa: "BBB" }),
    makeServico({ placa: "CCC" }),
    makeServico({ placa: "DDD" }),
    makeServico({ placa: "EEE" }),
    makeServico({ placa: "FFF" }),
  ];
  const { veiculosFrequentes } = summarizeServicos(lista);
  assert.equal(veiculosFrequentes.length, 5);
  assert.equal(veiculosFrequentes[0][0], "AAA");
  assert.equal(veiculosFrequentes[0][1], 3);
  assert.equal(veiculosFrequentes[1][0], "BBB");
  assert.equal(veiculosFrequentes[1][1], 2);
});

// ---------------------------------------------------------------------------
// parseMesRange
// ---------------------------------------------------------------------------

test("parseMesRange produces correct start/end for January", () => {
  const r = parseMesRange(1, 2026);
  assert.equal(r.inicio, "2026-01-01");
  assert.equal(r.fim, "2026-01-31");
  // from/to are UTC ISO strings; only validate ordering and ISO format
  assert.ok(r.from < r.to);
  assert.ok(!Number.isNaN(new Date(r.from).getTime()));
  assert.ok(!Number.isNaN(new Date(r.to).getTime()));
});

test("parseMesRange handles February in leap year", () => {
  const r = parseMesRange(2, 2024);
  assert.equal(r.fim, "2024-02-29");
});

test("parseMesRange handles February in non-leap year", () => {
  const r = parseMesRange(2, 2025);
  assert.equal(r.fim, "2025-02-28");
});

test("parseMesRange handles December", () => {
  const r = parseMesRange(12, 2026);
  assert.equal(r.inicio, "2026-12-01");
  assert.equal(r.fim, "2026-12-31");
});

// ---------------------------------------------------------------------------
// parseReportRange
// ---------------------------------------------------------------------------

test("parseReportRange returns ISO timestamps for valid input", () => {
  const r = parseReportRange("2026-03-01", "2026-03-31");
  assert.equal(r.inicio, "2026-03-01");
  assert.equal(r.fim, "2026-03-31");
  // from/to are UTC ISO strings derived from local midnight/23:59; verify ordering
  assert.ok(r.from < r.to);
  assert.ok(!Number.isNaN(new Date(r.from).getTime()));
  assert.ok(!Number.isNaN(new Date(r.to).getTime()));
});

test("parseReportRange falls back to defaults when input is missing", () => {
  const r = parseReportRange(undefined, undefined);
  assert.ok(r.inicio);
  assert.ok(r.fim);
  assert.ok(r.from < r.to);
});

test("parseReportRange throws on invalid date format", () => {
  assert.throws(() => parseReportRange("not-a-date", "2026-03-31"), /invalido/i);
  assert.throws(() => parseReportRange("2026-03-01", "bad"), /invalido/i);
});

test("parseReportRange throws when start is after end", () => {
  assert.throws(() => parseReportRange("2026-04-01", "2026-03-01"), /invalido/i);
});

// ---------------------------------------------------------------------------
// parsePeriodo
// ---------------------------------------------------------------------------

test("parsePeriodo accepts valid values", () => {
  assert.equal(parsePeriodo("hoje"), "hoje");
  assert.equal(parsePeriodo("semana"), "semana");
  assert.equal(parsePeriodo("mes"), "mes");
});

test("parsePeriodo falls back to hoje for unknown values", () => {
  assert.equal(parsePeriodo(""), "hoje");
  assert.equal(parsePeriodo("year"), "hoje");
  assert.equal(parsePeriodo(undefined), "hoje");
});
