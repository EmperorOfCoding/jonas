"use client";

import { useEffect, useState } from "react";

// BeforeInstallPromptEvent não existe nos tipos padrão do TypeScript
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type Platform = "ios" | "android" | null;

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent;
  const isIOS = /iphone|ipad|ipod/i.test(ua);
  const isAndroid = /android/i.test(ua);
  if (isIOS) return "ios";
  if (isAndroid) return "android";
  return null;
}

function isRunningAsInstalledPWA(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (navigator as any).standalone === true
  );
}

const DISMISSED_KEY = "pwa_prompt_dismissed";

export default function PWAInstallPrompt() {
  const [platform, setPlatform] = useState<Platform>(null);
  const [visible, setVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Não exibir se já está rodando como PWA instalado
    if (isRunningAsInstalledPWA()) return;

    // Não exibir se o usuário já fechou antes
    if (localStorage.getItem(DISMISSED_KEY)) return;

    const p = detectPlatform();
    if (!p) return;

    setPlatform(p);

    if (p === "android") {
      // Captura o evento nativo do Chrome para Android
      const handler = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
        setVisible(true);
      };
      window.addEventListener("beforeinstallprompt", handler);
      return () => window.removeEventListener("beforeinstallprompt", handler);
    } else {
      // iOS: sempre mostra as instruções manuais
      setVisible(true);
    }
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, "1");
    setVisible(false);
  }

  async function handleAndroidInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      dismiss();
    }
  }

  if (!visible) return null;

  return (
    <>
      <style>{`
        @keyframes slideUpPrompt {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .pwa-prompt { animation: slideUpPrompt 0.45s cubic-bezier(.22,1,.36,1) both; }
        .pwa-install-btn {
          background: linear-gradient(135deg, #376386 0%, #2a5a7d 100%);
          transition: box-shadow 0.2s, transform 0.15s;
        }
        .pwa-install-btn:active { transform: scale(0.97); }
      `}</style>

      <div
        className="pwa-prompt mx-3 mb-3 overflow-hidden rounded-[20px] border border-white/20 bg-white/10 shadow-lg backdrop-blur-md"
        role="banner"
        aria-label="Instalar aplicativo"
      >
        <div className="flex items-start gap-3 px-4 py-4">
          {/* Ícone */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
            <svg
              className="h-5 w-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.8}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
              />
            </svg>
          </div>

          {/* Texto */}
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-white">
              Instalar Jonas Lavagem
            </p>
            {platform === "ios" ? (
              <p className="mt-0.5 text-[11px] leading-relaxed text-white/70">
                Toque em{" "}
                <span className="inline-flex items-center gap-0.5 rounded bg-white/20 px-1 py-0.5 font-semibold text-white">
                  {/* Share icon */}
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 5l-1.42 1.42-1.59-1.59V16h-1.98V4.83L9.42 6.42 8 5l4-4 4 4zm4 5v11c0 1.1-.9 2-2 2H6c-1.11 0-2-.9-2-2V10c0-1.11.89-2 2-2h3v2H6v11h12V10h-3V8h3c1.1 0 2 .89 2 2z"/>
                  </svg>
                  Compartilhar
                </span>{" "}
                e depois{" "}
                <span className="font-semibold text-white">
                  &quot;Adicionar à Tela de Início&quot;
                </span>
              </p>
            ) : (
              <p className="mt-0.5 text-[11px] leading-relaxed text-white/70">
                Adicione à tela inicial para acesso rápido como um app nativo.
              </p>
            )}
          </div>

          {/* Fechar */}
          <button
            onClick={dismiss}
            aria-label="Fechar"
            className="shrink-0 rounded-full p-1 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Botão de instalar para Android (usa o prompt nativo) */}
        {platform === "android" && deferredPrompt && (
          <div className="border-t border-white/10 px-4 pb-4 pt-3">
            <button
              id="pwa-install-btn"
              onClick={handleAndroidInstall}
              className="pwa-install-btn w-full rounded-xl py-3 text-[13px] font-bold text-white"
            >
              Instalar agora
            </button>
          </div>
        )}
      </div>
    </>
  );
}
