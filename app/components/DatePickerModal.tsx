"use client";

import { useState, useMemo, useEffect } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, Calendar as CalendarIcon, X } from "lucide-react";

const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const MESES_CURTOS = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

const DIAS_SEMANA = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

interface DatePickerModalProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export function DatePickerModal({
  value,
  onChange,
  isOpen,
  onClose,
  title = "Selecionar Data",
}: DatePickerModalProps) {
  // Parse initial selected date or default to today
  const initialDate = useMemo(() => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split("-").map(Number);
      return new Date(y, m - 1, d);
    }
    return new Date();
  }, [value]);

  const [currentYear, setCurrentYear] = useState<number>(initialDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(initialDate.getMonth()); // 0-11
  const [selectedDate, setSelectedDate] = useState<string>(value || "");
  const [viewMode, setViewMode] = useState<"days" | "months">("days");

  // Keep internal state aligned when modal opens
  useEffect(() => {
    if (isOpen) {
      if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const [y, m, d] = value.split("-").map(Number);
        setCurrentYear(y);
        setCurrentMonth(m - 1);
        setSelectedDate(value);
      } else {
        const now = new Date();
        setCurrentYear(now.getFullYear());
        setCurrentMonth(now.getMonth());
        setSelectedDate("");
      }
      setViewMode("days");
    }
  }, [isOpen, value]);

  const todayStr = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, []);

  // Compute days matrix for current month (Monday-first)
  const daysMatrix = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    // getDay(): 0 is Sunday, 1 is Monday ... 6 is Saturday
    // Convert to Monday = 0, Sunday = 6
    let startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7;

    const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const items: Array<{
      day: number;
      monthOffset: -1 | 0 | 1;
      dateStr: string;
      isToday: boolean;
      isSelected: boolean;
    }> = [];

    // Trailing days from previous month
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      const prevMonthDate = new Date(currentYear, currentMonth - 1, day);
      const y = prevMonthDate.getFullYear();
      const m = String(prevMonthDate.getMonth() + 1).padStart(2, "0");
      const d = String(day).padStart(2, "0");
      const dateStr = `${y}-${m}-${d}`;
      items.push({
        day,
        monthOffset: -1,
        dateStr,
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDate,
      });
    }

    // Days in current month
    for (let day = 1; day <= daysInCurrentMonth; day++) {
      const y = currentYear;
      const m = String(currentMonth + 1).padStart(2, "0");
      const d = String(day).padStart(2, "0");
      const dateStr = `${y}-${m}-${d}`;
      items.push({
        day,
        monthOffset: 0,
        dateStr,
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDate,
      });
    }

    // Leading days of next month to fill remaining slots (multiples of 7)
    const remaining = (7 - (items.length % 7)) % 7;
    for (let day = 1; day <= remaining; day++) {
      const nextMonthDate = new Date(currentYear, currentMonth + 1, day);
      const y = nextMonthDate.getFullYear();
      const m = String(nextMonthDate.getMonth() + 1).padStart(2, "0");
      const d = String(day).padStart(2, "0");
      const dateStr = `${y}-${m}-${d}`;
      items.push({
        day,
        monthOffset: 1,
        dateStr,
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDate,
      });
    }

    return items;
  }, [currentYear, currentMonth, todayStr, selectedDate]);

  if (!isOpen) return null;

  function prevMonth() {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  }

  function selectDay(dateStr: string, monthOffset: -1 | 0 | 1) {
    setSelectedDate(dateStr);
    if (monthOffset === -1) {
      prevMonth();
    } else if (monthOffset === 1) {
      nextMonth();
    }
  }

  function handleQuickSelect(type: "today" | "yesterday") {
    const d = new Date();
    if (type === "yesterday") {
      d.setDate(d.getDate() - 1);
    }
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const str = `${y}-${m}-${day}`;
    setSelectedDate(str);
    setCurrentYear(y);
    setCurrentMonth(d.getMonth());
  }

  function handleConfirm() {
    onChange(selectedDate);
    onClose();
  }

  function handleClear() {
    setSelectedDate("");
    onChange("");
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[340px] bg-white rounded-3xl p-5 shadow-2xl border border-slate-100 flex flex-col space-y-4 select-none animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Quick select pills */}
        <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
          <button
            type="button"
            onClick={() => handleQuickSelect("today")}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
              selectedDate === todayStr
                ? "bg-primary text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Hoje
          </button>
          <button
            type="button"
            onClick={() => handleQuickSelect("yesterday")}
            className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Ontem
          </button>
          {selectedDate && (
            <button
              type="button"
              onClick={() => setSelectedDate("")}
              className="ml-auto text-xs text-slate-400 hover:text-red-500 font-semibold"
            >
              Limpar
            </button>
          )}
        </div>

        {/* Header: Prev / Month Year Toggle / Next */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              if (viewMode === "months") {
                setCurrentYear((y) => y - 1);
              } else {
                prevMonth();
              }
            }}
            className="w-9 h-9 rounded-xl border border-slate-200/70 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors"
            aria-label="Anterior"
          >
            <ChevronLeft size={18} />
          </button>

          <button
            type="button"
            onClick={() => setViewMode(viewMode === "days" ? "months" : "days")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-slate-50 text-dark-navy font-black text-sm transition-colors"
          >
            <span>
              {viewMode === "months"
                ? `${currentYear}`
                : `${MESES[currentMonth]} ${currentYear}`}
            </span>
            <ChevronDown
              size={15}
              className={`text-slate-400 transition-transform ${
                viewMode === "months" ? "rotate-180" : ""
              }`}
            />
          </button>

          <button
            type="button"
            onClick={() => {
              if (viewMode === "months") {
                setCurrentYear((y) => y + 1);
              } else {
                nextMonth();
              }
            }}
            className="w-9 h-9 rounded-xl border border-slate-200/70 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors"
            aria-label="Próximo"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Content: Days Grid OR Months Grid */}
        {viewMode === "months" ? (
          <div className="grid grid-cols-3 gap-2 py-2">
            {MESES_CURTOS.map((mes, idx) => {
              const isSelected = idx === currentMonth;
              return (
                <button
                  key={mes}
                  type="button"
                  onClick={() => {
                    setCurrentMonth(idx);
                    setViewMode("days");
                  }}
                  className={`py-3 rounded-2xl text-xs font-bold transition-all ${
                    isSelected
                      ? "bg-primary text-white shadow-md shadow-primary/30"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {mes}
                </button>
              );
            })}
          </div>
        ) : (
          <div>
            {/* Week days row */}
            <div className="grid grid-cols-7 mb-2">
              {DIAS_SEMANA.map((dia) => (
                <div
                  key={dia}
                  className="text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider py-1"
                >
                  {dia}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-y-1 justify-items-center">
              {daysMatrix.map((item, idx) => {
                const isOutOfMonth = item.monthOffset !== 0;

                return (
                  <button
                    key={`${item.dateStr}-${idx}`}
                    type="button"
                    onClick={() => selectDay(item.dateStr, item.monthOffset)}
                    className={`relative w-9 h-9 rounded-full flex flex-col items-center justify-center text-sm font-semibold transition-all ${
                      item.isSelected
                        ? "bg-primary text-white font-black shadow-md shadow-primary/30 scale-105"
                        : isOutOfMonth
                        ? "text-slate-300 hover:text-slate-500 hover:bg-slate-50"
                        : "text-slate-800 hover:bg-slate-100"
                    }`}
                  >
                    <span>{item.day}</span>
                    {item.isToday && !item.isSelected && (
                      <span className="w-1 h-1 rounded-full bg-primary absolute bottom-1" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer actions: Cancelar / Confirmar */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-5 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold shadow-md shadow-primary/25 active:scale-95 transition-all"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

interface CustomDatePickerProps {
  id?: string;
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function CustomDatePicker({
  id,
  value,
  onChange,
  placeholder = "dd/mm/aaaa",
  className = "",
}: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Formats stored YYYY-MM-DD to DD/MM/YYYY for display
  const displayValue = useMemo(() => {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return "";
    const [y, m, d] = value.split("-");
    return `${d}/${m}/${y}`;
  }, [value]);

  return (
    <>
      <div
        id={id}
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsOpen(true);
          }
        }}
        className={`flex items-center justify-between cursor-pointer select-none ${className}`}
      >
        <span
          className={`text-sm font-semibold truncate ${
            displayValue ? "text-dark-navy" : "text-slate-300 font-normal"
          }`}
        >
          {displayValue || placeholder}
        </span>

        <div className="flex items-center gap-1 shrink-0 ml-1">
          {value && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              className="p-0.5 text-slate-300 hover:text-slate-500 rounded-full transition-colors"
              aria-label="Limpar data"
            >
              <X size={14} />
            </button>
          )}
          <CalendarIcon size={16} className="text-slate-400" />
        </div>
      </div>

      <DatePickerModal
        value={value}
        onChange={onChange}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
