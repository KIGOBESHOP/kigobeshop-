"use client";

import "./InstallPrompt.css";
import { useEffect, useState } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export default function InstallPrompt() {
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
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
    if (!dismissed) {
      setVisible(true);
      if (ios) setShowInstructions(true);
    }

    const handleBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallPromptEvent);
      // No reabrimos el aviso automáticamente si el usuario ya lo cerró.
    };

    const openFromMenu = () => {
      setVisible(true);
      // Si el navegador no ofrece instalación automática, enseñamos instrucciones.
      setShowInstructions(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("kigobeshop:open-install", openFromMenu);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        console.error("No se pudo registrar el service worker:", error);
      });
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("kigobeshop:open-install", openFromMenu);
    };
  }, []);

  const dismiss = () => {
    setVisible(false);
    setShowInstructions(false);
    window.localStorage.setItem("kigobeshop-install-dismissed", "1");
  };

  const install = async () => {
    if (!installEvent) {
      setShowInstructions(true);
      return;
    }

    await installEvent.prompt();
    const choice = await installEvent.userChoice;

    if (choice.outcome === "accepted") {
      setVisible(false);
      setShowInstructions(false);
    }
    setInstallEvent(null);
  };

  if (!visible) return null;

  return (
    <div
      className="kigobe-install-backdrop"
      role="presentation"
      onClick={() => setVisible(false)}
    >
      <aside
        className="kigobe-install"
        role="dialog"
        aria-modal="true"
        aria-labelledby="kigobe-install-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="kigobe-install-close"
          onClick={dismiss}
          aria-label="Cerrar"
        >
          ×
        </button>

        <div className="kigobe-install-mark" aria-hidden="true">K</div>
        <h2 id="kigobe-install-title">¡Lleva KigobeShop contigo!</h2>
        <p>Añade nuestra tienda a la pantalla de inicio y vuelve cuando quieras a descubrir novedades.</p>

        {installEvent && !isIOS ? (
          <button type="button" className="kigobe-install-button" onClick={install}>
            Instalar KigobeShop
          </button>
        ) : (
          <button
            type="button"
            className="kigobe-install-button"
            onClick={() => setShowInstructions((current) => !current)}
          >
            {showInstructions ? "Ocultar instrucciones" : "Cómo instalarla"}
          </button>
        )}

        {showInstructions && (
          <div className="kigobe-install-help">
            {isIOS ? (
              <>
                <strong>En iPhone o iPad:</strong>
                <ol>
                  <li>Abre KigobeShop en Safari.</li>
                  <li>Pulsa el botón Compartir.</li>
                  <li>Elige «Añadir a pantalla de inicio».</li>
                  <li>Pulsa «Añadir».</li>
                </ol>
              </>
            ) : (
              <>
                <strong>En Android:</strong>
                <ol>
                  <li>Abre KigobeShop en Chrome.</li>
                  <li>Pulsa los tres puntitos del navegador.</li>
                  <li>Elige «Instalar aplicación» o «Añadir a pantalla de inicio».</li>
                  <li>Confirma la instalación.</li>
                </ol>
              </>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}
