import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { countServicos, listServicos, parseAtividadeParams } from "@/lib/services/servicos";
import { AtividadesClient } from "./AtividadesClient";

export default async function AtividadesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; torre?: string; data?: string; page?: string }>;
}) {
  const resolvedParams = await searchParams;
  const { q: query, torre, data, page } = parseAtividadeParams(resolvedParams);
  const limit = 50;
  const offset = (page - 1) * limit;

  // Server-side filtering by placa (q) — torre and data are filtered client-side
  // for instant UX without round-trips, since the full page is already 50 records max.
  const [lista, total] = await Promise.all([
    listServicos({ q: query, limit, offset }),
    countServicos({ q: query }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="p-2 -ml-2 bg-slate-50 text-slate-600 rounded-full hover:bg-slate-100"
          aria-label="Voltar"
        >
          <ChevronLeft size={20} />
        </Link>
        <div>
          <h2 className="text-2xl font-black text-dark-navy">Atividades</h2>
          <p className="text-sm text-slate-400 mt-1">Todos os servicos registrados.</p>
        </div>
      </div>

      <AtividadesClient
        initialServicos={lista}
        initialSearch={query}
        initialTorre={torre}
        initialData={data}
        currentPage={page}
        totalPages={totalPages}
      />
    </div>
  );
}
