"use client";

import { useEffect, useState } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export default function InstallPrompt() {
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);
  const [showIOSHelp, setShowIOSHelp] = useState(false);
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const ua = window.navigator.userAgent;
    const ios =
      /iPad|iPhone|iPod/.test(ua) ||
      (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1);
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);

    setIsIOS(ios);

    if (standalone) return;

    const dismissed = window.localStorage.getItem("kigobeshop-install-dismissed");
    if (dismissed) return;

    const handleBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // En iPhone/iPad no existe beforeinstallprompt: mostramos instrucciones.
    if (ios) setVisible(true);

    // Registro del service worker de la tienda.
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        console.error("No se pudo registrar el service worker:", error);
      });
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const dismiss = () => {
    setVisible(false);
    setShowIOSHelp(false);
    window.localStorage.setItem("kigobeshop-install-dismissed", "1");
  };

  const install = async () => {
    if (!installEvent) return;

    await installEvent.prompt();
    const choice = await installEvent.userChoice;

    if (choice.outcome === "accepted") {
      setVisible(false);
    }
    setInstallEvent(null);
  };

  if (!visible) return null;

  return (
    <aside className="kigobe-install" aria-label="Instalar KigobeShop">
      <button
        type="button"
        className="kigobe-install-close"
        onClick={dismiss}
        aria-label="Cerrar aviso"
      >
        ×
      </button>

      <div className="kigobe-install-mark" aria-hidden="true">K</div>

      <div className="kigobe-install-copy">
        <strong>¡Lleva KigobeShop contigo!</strong>
        <span>Añade nuestra tienda a tu pantalla de inicio.</span>
      </div>

      {isIOS ? (
        <button
          type="button"
          className="kigobe-install-button"
          onClick={() => setShowIOSHelp((current) => !current)}
        >
          Cómo añadirla
        </button>
      ) : installEvent ? (
        <button
          type="button"
          className="kigobe-install-button"
          onClick={install}
        >
          Instalar
        </button>
      ) : null}

      {showIOSHelp && (
        <div className="kigobe-install-help">
          <strong>En tu iPhone o iPad:</strong>
          <ol>
            <li>Abre KigobeShop en Safari.</li>
            <li>Pulsa el botón Compartir.</li>
            <li>Selecciona «Añadir a pantalla de inicio».</li>
            <li>Pulsa «Añadir» para terminar.</li>
          </ol>
        </div>
      )}
    </aside>
  );
}
