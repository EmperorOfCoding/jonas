"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Home, Plus, FileText, LogOut } from "lucide-react";

const items = [
  { href: "/dashboard", label: "Início", Icon: Home },
  { href: "/registro", label: "Lavar", Icon: Plus },
  { href: "/relatorio", label: "Relatórios", Icon: FileText },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-20 bg-white border-t border-slate-100 flex justify-around items-center px-6">
      {items.map(({ href, label, Icon }) => {
        const active =
          pathname.startsWith(href) ||
          (href === "/dashboard" && pathname.startsWith("/atividades"));
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-1 transition-all ${
              active ? "text-primary" : "text-slate-300 hover:text-slate-400"
            }`}
          >
            <Icon
              size={22}
              strokeWidth={active ? 2.5 : 2}
            />
            <span
              className={`text-[10px] font-bold uppercase tracking-wider transition-opacity ${
                active ? "opacity-100" : "opacity-0"
              }`}
            >
              {label}
            </span>
            {active && (
              <span className="w-1 h-1 bg-primary rounded-full mt-0.5" />
            )}
          </Link>
        );
      })}

      <button
        type="button"
        onClick={handleLogout}
        className="flex flex-col items-center gap-1 text-slate-300 hover:text-slate-400 transition-all"
      >
        <LogOut size={22} strokeWidth={2} />
        <span className="text-[10px] font-bold uppercase tracking-wider opacity-0">Sair</span>
        <span className="w-1 h-1 rounded-full mt-0.5 opacity-0" />
      </button>
    </nav>
  );
}
