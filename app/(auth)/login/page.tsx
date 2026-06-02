"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import PWAInstallPrompt from "@/app/components/PWAInstallPrompt";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("Email ou senha incorretos.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <>
      <style>{`
        @keyframes fadeDown {
          from { opacity: 0; transform: translateY(-24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(48px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes floatIcon {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-10px); }
        }
        @keyframes drip {
          0%   { transform: translateY(0) scale(1);   opacity: 0.18; }
          60%  { transform: translateY(8px) scale(1); opacity: 0.18; }
          100% { transform: translateY(8px) scale(1.08) scaleX(1.3); opacity: 0; }
        }
        .brand-in  { animation: fadeDown 0.75s cubic-bezier(.22,1,.36,1) both; }
        .card-in   { animation: slideUp 0.65s 0.18s cubic-bezier(.22,1,.36,1) both; }
        .f1        { animation: slideUp 0.55s 0.32s cubic-bezier(.22,1,.36,1) both; }
        .f2        { animation: slideUp 0.55s 0.42s cubic-bezier(.22,1,.36,1) both; }
        .f3        { animation: slideUp 0.55s 0.52s cubic-bezier(.22,1,.36,1) both; }
        .icon-float { animation: floatIcon 3.6s ease-in-out infinite; }
        .drop1 { animation: drip 2.8s 0s ease-in infinite; }
        .drop2 { animation: drip 2.8s 0.9s ease-in infinite; }
        .drop3 { animation: drip 2.8s 1.7s ease-in infinite; }
        .btn-shine {
          position: relative; overflow: hidden;
          background: linear-gradient(135deg, #376386 0%, #2a5a7d 100%);
          transition: box-shadow 0.2s, transform 0.15s;
        }
        .btn-shine::after {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.18) 50%, transparent 60%);
          transform: translateX(-100%);
          transition: transform 0.5s;
        }
        .btn-shine:not(:disabled):hover { box-shadow: 0 8px 24px rgba(55,99,134,0.45); }
        .btn-shine:not(:disabled):hover::after { transform: translateX(100%); }
        .btn-shine:not(:disabled):active { transform: scale(0.98); }
      `}</style>

      <div
        className="relative flex min-h-dvh flex-col overflow-hidden"
        style={{ background: "radial-gradient(ellipse 120% 80% at 30% -10%, #1b4f73 0%, #0b1e30 55%)" }}
      >
        {/* Ambient blobs */}
        <div className="pointer-events-none absolute inset-0 select-none">
          <div className="absolute -left-24 -top-16 h-96 w-96 rounded-full opacity-25"
            style={{ background: "radial-gradient(circle, #376386, transparent 70%)" }} />
          <div className="absolute -right-20 top-24 h-72 w-72 rounded-full opacity-15"
            style={{ background: "radial-gradient(circle, #5ba3d0, transparent 70%)" }} />
          <div className="absolute bottom-56 -left-8 h-48 w-48 rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, #376386, transparent 70%)" }} />

          {/* Decorative water drops */}
          <svg className="drop1 absolute right-10 top-14 opacity-0" width="18" height="26" viewBox="0 0 18 26" fill="rgba(255,255,255,0.7)">
            <path d="M9 0C9 0 0 10.5 0 16a9 9 0 0018 0C18 10.5 9 0 9 0z"/>
          </svg>
          <svg className="drop2 absolute left-14 top-36 opacity-0" width="12" height="18" viewBox="0 0 18 26" fill="rgba(255,255,255,0.5)">
            <path d="M9 0C9 0 0 10.5 0 16a9 9 0 0018 0C18 10.5 9 0 9 0z"/>
          </svg>
          <svg className="drop3 absolute right-20 top-52 opacity-0" width="8" height="12" viewBox="0 0 18 26" fill="rgba(255,255,255,0.4)">
            <path d="M9 0C9 0 0 10.5 0 16a9 9 0 0018 0C18 10.5 9 0 9 0z"/>
          </svg>
        </div>

        {/* Brand hero */}
        <div className="brand-in flex flex-1 flex-col items-center justify-center px-6 pb-6 pt-20">
          <div className="icon-float mb-7 flex h-[88px] w-[88px] items-center justify-center rounded-[28px] border border-white/20 bg-white/10 shadow-lg backdrop-blur-md">
            <svg className="h-11 w-11 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.4} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
            </svg>
          </div>

          <h1 className="font-headline text-[52px] font-black leading-none tracking-tight text-white">Jonas</h1>
          <div className="mt-2 flex items-center gap-3">
            <span className="h-px w-10 bg-white/25" />
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/45">Lavagem</span>
            <span className="h-px w-10 bg-white/25" />
          </div>
        </div>

        {/* PWA install banner */}
        <PWAInstallPrompt />

        {/* Login card — bottom sheet feel */}
        <div className="card-in relative mx-3 mb-4 rounded-[28px] bg-white px-7 pb-8 pt-7 shadow-[0_-4px_40px_rgba(0,0,0,0.25)]">
          {/* Pill handle */}
          <div className="absolute -top-3 left-1/2 h-1 w-10 -translate-x-1/2 rounded-full bg-white/40" />

          <div className="mb-6">
            <h2 className="font-headline text-[22px] font-bold text-on-surface">Bem-vindo</h2>
            <p className="mt-0.5 text-sm text-on-surface-variant">Entre com sua conta para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="f1">
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-outline-variant bg-surface-container px-4 py-3.5 text-[15px] text-on-surface outline-none placeholder:text-on-surface-variant/40 transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15"
                placeholder="seu@email.com"
              />
            </div>

            <div className="f2">
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant" htmlFor="password">
                Senha
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-outline-variant bg-surface-container px-4 py-3.5 text-[15px] text-on-surface outline-none placeholder:text-on-surface-variant/40 transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2.5 rounded-2xl bg-red-50 px-4 py-3">
                <svg className="mt-0.5 h-4 w-4 shrink-0 text-error" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                <p className="text-sm text-error">{error}</p>
              </div>
            )}

            <div className="f3 pt-1">
              <button
                type="submit"
                disabled={loading}
                className="btn-shine w-full rounded-2xl py-4 text-[15px] font-bold text-white disabled:opacity-60"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Entrando...
                  </span>
                ) : "Entrar"}
              </button>
            </div>
          </form>
        </div>

        {/* Vexaris credit */}
        <p className="pb-5 text-center text-[11px] tracking-wide text-white/35">
          Criação de Sistema por{" "}
          <a
            href="https://vexaris.com.br"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-white/55 transition-colors hover:text-white/80"
          >
            Vexaris
          </a>
        </p>
      </div>
    </>
  );
}
