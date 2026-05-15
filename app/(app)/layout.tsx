import BottomNav from "@/app/components/BottomNav";
import { Droplets } from "lucide-react";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const greeting = getGreeting();
  const dateStr = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="min-h-screen bg-dark-navy flex flex-col">
      <header className="h-40 bg-dark-navy relative overflow-hidden shrink-0">
        <div
          className="absolute inset-0 opacity-80"
          style={{ background: "radial-gradient(circle at 30% 30%, #1b4f73 0%, #0b1e30 100%)" }}
        />
        <div className="relative z-10 p-6 flex justify-between items-start">
          <div className="flex items-center gap-2">
            <Droplets className="text-primary w-6 h-6 fill-current" />
            <h1 className="font-display font-black text-xl text-white tracking-widest uppercase">
              Jonas
            </h1>
          </div>
        </div>
        <div className="relative z-10 px-6 mt-1">
          <h2 className="text-white text-lg font-bold">{greeting}, Jonas!</h2>
          <p className="text-white/40 text-xs uppercase tracking-widest font-bold capitalize">
            {dateStr}
          </p>
        </div>
        <Droplets className="absolute -right-6 -bottom-6 text-white/5 w-32 h-32" />
      </header>

      <main className="flex-1 -mt-6 relative z-20 bg-surface-container rounded-t-[32px] overflow-y-auto no-scrollbar pb-24">
        {children}
      </main>

      <BottomNav />
    </div>
  );
}
