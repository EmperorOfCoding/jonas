"use client";

import { useEffect, useState } from "react";
import { MapPin, DollarSign, CheckCircle, AlertCircle } from "lucide-react";
import { carregarResumoRegistro, registrarServico } from "./actions";
import { ANDARES, FUNCIONARIOS, LOCAIS, PRECO_POR_TIPO, TIPOS_LAVAGEM } from "../servico-options";

function nowLocalISO() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
        active
          ? "bg-primary text-white shadow-md"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
      }`}
    >
      {label}
    </button>
  );
}

export default function RegistroPage() {
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [carrosHoje, setCarrosHoje] = useState<number | null>(null);

  const [apartamento, setApartamento] = useState("");
  const [nomeVeiculo, setNomeVeiculo] = useState("");
  const [tipo, setTipo] = useState<string>("");
  const [andar, setAndar] = useState("");
  const [local, setLocal] = useState<string>("");
  const [funcionarios, setFuncionarios] = useState<string[]>([]);
  const [dataHora, setDataHora] = useState("");
  const [pagamento, setPagamento] = useState<string>("Mensal");
  const [valor, setValor] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDataHora(nowLocalISO());
    }, 0);
    carregarResumoRegistro().then((result) => {
      if (result.ok) setCarrosHoje(result.carrosHoje);
    });
    return () => clearTimeout(timer);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const identificacao = `${nomeVeiculo.trim().toUpperCase()} ${apartamento.trim()}`.trim();

    const result = await registrarServico({
      placa: identificacao,
      tipo_lavagem: tipo,
      andar,
      local,
      funcionario: funcionarios.join(", "),
      data_hora: dataHora,
      forma_pagamento: pagamento,
      valor,
    });

    setLoading(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    setCarrosHoje((c) => (c === null ? c : c + 1));
    setShowSuccess(true);
  }

  function handleCloseSuccess() {
    setShowSuccess(false);
    setApartamento("");
    setNomeVeiculo("");
    setTipo("");
    setAndar("");
    setLocal("");
    setFuncionarios([]);
    setDataHora(nowLocalISO());
    setPagamento("Mensal");
    setValor("");
  }

  function toggleFuncionario(f: string) {
    setFuncionarios((prev) => {
      if (prev.includes(f)) return prev.filter((x) => x !== f);
      if (prev.length >= 4) return prev;
      return [...prev, f];
    });
  }

  function handleTipoChange(nextTipo: (typeof TIPOS_LAVAGEM)[number]) {
    setTipo(nextTipo);
    setValor(PRECO_POR_TIPO[nextTipo]);
  }

  return (
    <div className="p-6 space-y-5">
      <div className="px-1">
        <h2 className="text-2xl font-black text-dark-navy">Novo Serviço</h2>
        <p className="text-sm text-slate-400 mt-1">Preencha os detalhes para registrar.</p>
      </div>

      {carrosHoje !== null && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            Carros no dia
          </span>
          <span className="text-2xl font-black text-dark-navy">
            {String(carrosHoje).padStart(2, "0")}
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Identificação + tipo */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-4">
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-1">
              Identificação do Veículo
            </label>
            <div className="flex gap-3">
              <input
                required
                value={nomeVeiculo}
                onChange={(e) => setNomeVeiculo(e.target.value.toUpperCase())}
                placeholder="Modelo"
                className="w-3/5 bg-slate-50 border border-slate-100 rounded-2xl px-5 py-5 text-2xl font-black tracking-[2px] uppercase placeholder:text-slate-200 outline-none focus:ring-2 focus:ring-primary transition-all text-dark-navy text-center"
              />
              <input
                required
                value={apartamento}
                onChange={(e) => setApartamento(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="Andar"
                inputMode="numeric"
                className="w-2/5 bg-slate-50 border border-slate-100 rounded-2xl px-5 py-5 text-2xl font-black tracking-[2px] placeholder:text-slate-200 outline-none focus:ring-2 focus:ring-primary transition-all text-dark-navy text-center"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-1">
              Tipo de Lavagem
            </label>
            <div className="flex gap-2 flex-wrap">
              {TIPOS_LAVAGEM.map((t) => (
                <Chip key={t} label={t} active={tipo === t} onClick={() => handleTipoChange(t)} />
              ))}
            </div>
          </div>
        </div>

        {/* Torre + local */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-4">
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-1">
              Torre
            </label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <select
                required
                value={andar}
                onChange={(e) => setAndar(e.target.value)}
                className="w-full pl-10 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-dark-navy font-bold outline-none focus:ring-2 focus:ring-primary transition-all appearance-none"
              >
                <option value="">Selecionar torre</option>
                {ANDARES.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-1">
              Local
            </label>
            <div className="flex flex-wrap gap-2">
              {LOCAIS.map((l) => (
                <Chip key={l} label={l} active={local === l} onClick={() => setLocal(l)} />
              ))}
            </div>
          </div>
        </div>

        {/* Funcionário + pagamento + data */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-4">
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-1">
              Funcionário{" "}
              <span className="normal-case font-normal text-slate-300">(máx. 4)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {FUNCIONARIOS.map((f) => (
                <Chip
                  key={f}
                  label={f}
                  active={funcionarios.includes(f)}
                  onClick={() => toggleFuncionario(f)}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-1">
              Data e Hora
            </label>
            <input
              type="datetime-local"
              value={dataHora}
              onChange={(e) => setDataHora(e.target.value)}
              className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-dark-navy font-bold outline-none focus:ring-2 focus:ring-primary transition-all"
            />
          </div>
        </div>

        {/* Valor */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-2">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-1">
            Valor do Serviço
          </label>
          <div className="relative">
            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-primary w-6 h-6" />
            <input
              required
              type="number"
              min="0"
              step="0.01"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="0,00"
              className="w-full pl-12 pr-4 py-6 bg-slate-50 border border-slate-100 rounded-2xl text-3xl font-black text-dark-navy outline-none focus:ring-2 focus:ring-primary transition-all"
            />
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2.5 rounded-2xl bg-red-50 px-4 py-3">
            <AlertCircle size={16} className="mt-0.5 shrink-0 text-error" />
            <p className="text-sm text-error">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !tipo || !local || funcionarios.length === 0}
          className="w-full bg-primary text-white font-headline font-bold py-6 rounded-2xl shadow-xl shadow-primary/30 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
        >
          <CheckCircle size={24} />
          <span>{loading ? "Registrando..." : "Registrar"}</span>
        </button>
      </form>

      {/* Success modal */}
      {showSuccess && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-dark-navy/60 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center mx-auto">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-6">
              <CheckCircle size={40} />
            </div>
            <h3 className="text-2xl font-black text-dark-navy mb-2">Sucesso!</h3>
            <p className="text-slate-500 font-medium mb-8">
              Veículo registrado com sucesso na fila de serviços.
            </p>
            <button
              onClick={handleCloseSuccess}
              className="w-full bg-slate-100 hover:bg-slate-200 text-dark-navy font-bold py-4 rounded-xl transition-colors"
            >
              Novo Registro
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
