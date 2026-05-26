import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeServicoInput,
  parseServicoId,
  ServicosValidationError,
} from "../lib/services/servicos-validation";

test("normalizes service input for persistence", () => {
  const normalized = normalizeServicoInput({
    placa: "BYD 2201",
    tipo_lavagem: " Completo ",
    andar: " Torre A ",
    local: " Garagem ",
    funcionario: " Maria ",
    data_hora: "2026-05-14T10:30",
    forma_pagamento: " Mensal ",
    valor: "40,50",
  });

  assert.equal(normalized.placa, "BYD 2201");
  assert.equal(normalized.tipo_lavagem, "Completo");
  assert.equal(normalized.valor, 40.5);
  assert.equal(normalized.data_hora, new Date("2026-05-14T10:30").toISOString());
});

test("rejects invalid service input", () => {
  assert.throws(
    () =>
      normalizeServicoInput({
        placa: "   ",
        tipo_lavagem: "Completo",
        andar: "1o",
        local: "Garagem",
        funcionario: "Joao",
        data_hora: "2026-05-14T10:30",
        forma_pagamento: "Pix",
        valor: "40",
      }),
    ServicosValidationError,
  );

  assert.throws(
    () =>
      normalizeServicoInput({
        placa: "2201 BYD",
        tipo_lavagem: "Completo",
        andar: "1o",
        local: "Garagem",
        funcionario: "Joao",
        data_hora: "not-a-date",
        forma_pagamento: "Pix",
        valor: "40",
      }),
    /data valida/,
  );
});

test("parses safe service ids", () => {
  assert.equal(parseServicoId("123"), 123);
  assert.equal(parseServicoId("8f59d9a6-85b4-47f7-a2c7-b2a76cc6d391"), "8f59d9a6-85b4-47f7-a2c7-b2a76cc6d391");

  assert.throws(() => parseServicoId("abc"), /servico invalido/);
  assert.throws(() => parseServicoId("123;delete"), /servico invalido/);
});
