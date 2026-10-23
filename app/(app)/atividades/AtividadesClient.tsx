"use client";

import { useState, useTransition, useEffect, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Car, ChevronDown, Search, ChevronLeft, ChevronRight, X } from "lucide-react";
import type { Servico, UpdateServicoInput } from "@/lib/services/servicos";
import { filterServicos, sortServicosByIdDesc } from "@/lib/services/servicos-utils";
import { ANDARES, FUNCIONARIOS, LOCAIS, TIPOS_LAVAGEM } from "../servico-options";
import { atualizarServico, excluirServico } from "./actions";
import { CustomDatePicker } from "@/app/components/DatePickerModal";

function toLocalDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

function fromServico(servico: Servico): UpdateServicoInput {
  return {
    placa: servico.placa,
    tipo_lavagem: servico.tipo_lavagem,
    andar: servico.andar,
    local: servico.local,
    funcionario: servico.funcionario,
    data_hora: toLocalDateTime(servico.data_hora),
    forma_pagamento: "Mensal",
    valor: String(servico.valor),
  };
}

function ServiceItem({
  servico,
  onEdit,
  onDelete,
  pending,
}: {
  servico: Servico;
  onEdit: () => void;
  onDelete: () => void;
  pending: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  // Display date using stored UTC ISO string — format as DD/MM/YYYY
  // so the year is clearly visible (e.g., 25/10/2026).
  function formatDate(iso: string) {
    if (!iso) return "";
    const year = iso.slice(0, 4);
    const month = iso.slice(5, 7);
    const day = iso.slice(8, 10);
    if (!day || !month || !year) return "";
    return `${day}/${month}/${year}`;
  }

  function formatTime(iso: string) {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div className="bg-white p-4 rounded-2xl flex flex-col border border-slate-100 shadow-sm overflow-hidden">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-emerald-50 text-emerald-500">
            <Car size={20} />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-dark-navy">{servico.placa}</span>
            <span className="text-xs text-slate-400 font-medium">{servico.tipo_lavagem}</span>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="font-black text-primary">
            {(servico.valor ?? 0).toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          </span>
          <span className="text-[10px] uppercase font-bold text-slate-300 tracking-wider flex items-center gap-1">
            <span suppressHydrationWarning>
              {formatDate(servico.data_hora)}{" "}
              {formatTime(servico.data_hora)}
            </span>
            <ChevronDown
              size={14}
              className={`transition-transform ${expanded ? "rotate-180" : ""}`}
            />
          </span>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-slate-100 pt-4 mt-4 grid grid-cols-2 gap-y-4 gap-x-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Profissional
            </span>
            <span className="text-sm font-semibold text-dark-navy">{servico.funcionario}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Localizacao
            </span>
            <span className="text-sm font-semibold text-dark-navy">{servico.local}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Torre
            </span>
            <span className="text-sm font-semibold text-dark-navy">{servico.andar}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Data
            </span>
            <span suppressHydrationWarning className="text-sm font-semibold text-dark-navy">
              {formatDate(servico.data_hora)}
            </span>
          </div>

          <div className="col-span-2 flex gap-2 pt-2">
            <button
              type="button"
              disabled={pending}
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="flex-1 rounded-xl border border-slate-200 bg-white py-2 text-sm font-bold text-slate-600 disabled:opacity-50"
            >
              Editar
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="flex-1 rounded-xl bg-red-50 py-2 text-sm font-bold text-error disabled:opacity-50"
            >
              Excluir
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function EditItem({
  servico,
  form,
  patchForm,
  onSave,
  onCancel,
  pending,
}: {
  servico: Servico;
  form: UpdateServicoInput;
  patchForm: (field: keyof UpdateServicoInput, value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  pending: boolean;
}) {
  return (
    <div className="bg-white p-4 rounded-2xl border border-primary/30 shadow-sm space-y-3">
      <p className="font-black text-dark-navy text-sm uppercase tracking-widest">{servico.placa}</p>
      <div className="grid grid-cols-2 gap-3">
        <input
          value={form.placa}
          onChange={(e) => patchForm("placa", e.target.value.toUpperCase())}
          placeholder="Modelo Andar"
          className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 font-mono text-sm font-black uppercase tracking-widest text-dark-navy outline-none focus:ring-2 focus:ring-primary"
        />
        <input
          value={form.valor}
          onChange={(e) => patchForm("valor", e.target.value)}
          type="number"
          min="0"
          step="0.01"
          placeholder="Valor"
          className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-bold text-dark-navy outline-none focus:ring-2 focus:ring-primary"
        />
        <select
          value={form.tipo_lavagem}
          onChange={(e) => patchForm("tipo_lavagem", e.target.value)}
          className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-bold text-dark-navy outline-none focus:ring-2 focus:ring-primary"
        >
          {TIPOS_LAVAGEM.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <div className="col-span-2 flex flex-wrap gap-1.5">
          {FUNCIONARIOS.map((f) => {
            const selected = form.funcionario.split(",").map((s) => s.trim()).filter(Boolean);
            const isActive = selected.includes(f);
            return (
              <button
                key={f}
                type="button"
                onClick={() => {
                  const current = form.funcionario.split(",").map((s) => s.trim()).filter(Boolean);
                  let next: string[];
                  if (current.includes(f)) {
                    next = current.filter((x) => x !== f);
                  } else if (current.length < 4) {
                    next = [...current, f];
                  } else {
                    return;
                  }
                  patchForm("funcionario", next.join(", "));
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-primary text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {f}
              </button>
            );
          })}
        </div>
        <select
          value={form.local}
          onChange={(e) => patchForm("local", e.target.value)}
          className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-bold text-dark-navy outline-none focus:ring-2 focus:ring-primary"
        >
          {LOCAIS.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
        <select
          value={form.andar}
          onChange={(e) => patchForm("andar", e.target.value)}
          className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-bold text-dark-navy outline-none focus:ring-2 focus:ring-primary"
        >
          {ANDARES.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <input
          type="datetime-local"
          value={form.data_hora}
          onChange={(e) => patchForm("data_hora", e.target.value)}
          className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-bold text-dark-navy outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={onSave}
          className="flex-1 rounded-xl bg-primary py-2 text-sm font-bold text-white disabled:opacity-50"
        >
          Salvar
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={onCancel}
          className="flex-1 rounded-xl border border-slate-100 bg-white py-2 text-sm font-bold text-slate-600 disabled:opacity-50"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

export function AtividadesClient({
  initialServicos,
  initialSearch,
  initialTorre,
  initialData,
  currentPage,
  totalPages,
}: {
  initialServicos: Servico[];
  initialSearch: string;
  initialTorre: string;
  initialData: string;
  currentPage: number;
  totalPages: number;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [servicos, setServicos] = useState(initialServicos);
  const [search, setSearch] = useState(initialSearch);
  const [torre, setTorre] = useState(initialTorre);
  const [data, setData] = useState(initialData);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [form, setForm] = useState<UpdateServicoInput | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Sync state when server re-renders (page navigation / URL changes)
  useEffect(() => {
    setServicos(initialServicos);
    setSearch(initialSearch);
    setTorre(initialTorre);
    setData(initialData);
  }, [initialServicos, initialSearch, initialTorre, initialData]);

  // Client-side filter + sort — instant, no round-trip
  // Always order by created_at desc so the most recently created service appears first
  const listaFiltrada = useMemo(() => {
    const filtered = filterServicos(servicos, { q: search, torre, data });
    return sortServicosByIdDesc(filtered);
  }, [servicos, search, torre, data]);

  // Debounced push to URL only for placa (q) — triggers server re-fetch
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== initialSearch) {
        pushParams({ q: search, page: 1 });
      }
    }, 400);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function pushParams(overrides: { q?: string; torre?: string; data?: string; page?: number }) {
    const params = new URLSearchParams();
    const q = overrides.q !== undefined ? overrides.q : search;
    const t = overrides.torre !== undefined ? overrides.torre : torre;
    const d = overrides.data !== undefined ? overrides.data : data;
    const p = overrides.page !== undefined ? overrides.page : currentPage;
    if (q) params.set("q", q);
    if (t) params.set("torre", t);
    if (d) params.set("data", d);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  function changePage(newPage: number) {
    pushParams({ page: newPage });
  }

  function clearFilters() {
    setSearch("");
    setTorre("");
    setData("");
    router.push(pathname);
  }

  const hasActiveFilters = search || torre || data;

  function startEdit(servico: Servico) {
    setMessage(null);
    setEditingId(servico.id);
    setForm(fromServico(servico));
  }

  function patchForm(field: keyof UpdateServicoInput, value: string) {
    setForm((current) => (current ? { ...current, [field]: value } : current));
  }

  function saveEdit(id: string | number) {
    if (!form) return;
    setMessage(null);
    startTransition(async () => {
      const result = await atualizarServico(id, form);
      if (!result.ok) {
        setMessage(result.message);
        return;
      }
      setServicos((current) =>
        current.map((s) =>
          s.id === id
            ? {
                ...s,
                placa: form.placa.trim().toUpperCase(),
                tipo_lavagem: form.tipo_lavagem,
                andar: form.andar,
                local: form.local,
                funcionario: form.funcionario,
                data_hora: new Date(form.data_hora).toISOString(),
                forma_pagamento: "Mensal",
                valor: Number(form.valor.replace(",", ".")),
              }
            : s,
        ),
      );
      setEditingId(null);
      setForm(null);
      setMessage("Servico atualizado.");
    });
  }

  function removeServico(id: string | number) {
    const confirmed = window.confirm("Excluir este servico?");
    if (!confirmed) return;
    setMessage(null);
    startTransition(async () => {
      const result = await excluirServico(id);
      if (!result.ok) {
        setMessage(result.message);
        return;
      }
      setServicos((current) => current.filter((s) => s.id !== id));
      setMessage("Servico excluido.");
    });
  }

  return (
    <div className="space-y-3 pb-8">
      {/* Search bar — placa */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-3">
        <Search className="text-slate-400 w-5 h-5 shrink-0" />
        <input
          id="atividades-search-placa"
          type="text"
          placeholder="Buscar por modelo ou placa..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 outline-none text-dark-navy text-sm font-semibold placeholder:font-normal bg-transparent"
        />
        {search && (
          <button type="button" onClick={() => setSearch("")} className="text-slate-300 hover:text-slate-500">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Filter row — data + torre */}
      <div className="flex gap-2">
        <div className="flex-1 bg-white rounded-2xl px-4 py-3 shadow-sm border border-slate-100 flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 shrink-0">
            Data
          </span>
          <CustomDatePicker
            id="atividades-filter-data"
            value={data}
            onChange={(val) => {
              setData(val);
              pushParams({ data: val, page: 1 });
            }}
            placeholder="dd/mm/aaaa"
            className="flex-1 min-w-0"
          />
        </div>

        <div className="flex-1 bg-white rounded-2xl px-4 py-3 shadow-sm border border-slate-100 flex items-center gap-2">
          <label htmlFor="atividades-filter-torre" className="text-[10px] font-bold uppercase tracking-widest text-slate-400 shrink-0">
            Torre
          </label>
          <select
            id="atividades-filter-torre"
            value={torre}
            onChange={(e) => {
              const val = e.target.value;
              setTorre(val);
              pushParams({ torre: val, page: 1 });
            }}
            className="flex-1 outline-none text-dark-navy text-sm font-semibold bg-transparent min-w-0 appearance-none"
          >
            <option value="">Todas</option>
            {ANDARES.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Active filter summary */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between px-1">
          <span className="text-xs text-slate-400 font-medium">
            {listaFiltrada.length} resultado{listaFiltrada.length !== 1 ? "s" : ""}
          </span>
          <button
            type="button"
            onClick={clearFilters}
            className="text-xs font-bold text-primary hover:text-primary/70 flex items-center gap-1"
          >
            <X size={12} />
            Limpar filtros
          </button>
        </div>
      )}

      {message && (
        <div className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-dark-navy border border-slate-100 shadow-sm">
          {message}
        </div>
      )}

      {listaFiltrada.length === 0 ? (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <p className="text-sm text-slate-400">Nenhum servico encontrado.</p>
        </div>
      ) : (
        listaFiltrada.map((servico) => {
          const isEditing = editingId === servico.id && form;
          if (isEditing) {
            return (
              <EditItem
                key={servico.id}
                servico={servico}
                form={form}
                patchForm={patchForm}
                onSave={() => saveEdit(servico.id)}
                onCancel={() => {
                  setEditingId(null);
                  setForm(null);
                }}
                pending={pending}
              />
            );
          }
          return (
            <ServiceItem
              key={servico.id}
              servico={servico}
              onEdit={() => startEdit(servico)}
              onDelete={() => removeServico(servico.id)}
              pending={pending}
            />
          );
        })
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <button
            onClick={() => changePage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="flex items-center gap-1 text-sm font-bold text-slate-500 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={16} />
            Anterior
          </button>

          <span className="text-sm font-semibold text-slate-400">
            Pagina {currentPage} de {totalPages}
          </span>

          <button
            onClick={() => changePage(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="flex items-center gap-1 text-sm font-bold text-slate-500 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Proxima
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
