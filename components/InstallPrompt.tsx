"use client";

import "./InstallPrompt.css";
import { useEffect, useState } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type DeviceKind = "ios" | "android" | "desktop" | "other";

function detectDevice(): DeviceKind {
  const ua = window.navigator.userAgent || "";
  const platform = window.navigator.platform || "";

  const isIPadOS =
    platform === "MacIntel" && window.navigator.maxTouchPoints > 1;
  if (/iPhone|iPad|iPod/i.test(ua) || isIPadOS) return "ios";
  if (/Android/i.test(ua)) return "android";
  if (/Windows|Macintosh|Mac OS X|Linux|X11/i.test(ua)) return "desktop";
  return "other";
}

function isRunningStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    Boolean(
      (window.navigator as Navigator & { standalone?: boolean }).standalone
    )
  );
}

export default function InstallPrompt() {
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [device, setDevice] = useState<DeviceKind>("other");

  useEffect(() => {
    const detectedDevice = detectDevice();
    setDevice(detectedDevice);

    if (isRunningStandalone()) return;

    const dismissed = window.localStorage.getItem("kigobeshop-install-dismissed");
    if (!dismissed) {
      setVisible(true);
      if (detectedDevice !== "android") setShowInstructions(true);
    }

    const handleBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallPromptEvent);
      setShowInstructions(false);
    };

    const handleOpenInstall = () => {
      setVisible(true);
      // En Android/ordenador priorizamos siempre el diálogo nativo si Chrome
      // ha entregado beforeinstallprompt. Si no, mostramos ayuda específica.
      setShowInstructions(detectedDevice !== "ios" && !installEvent);
    };

    const handleInstalled = () => {
      setInstallEvent(null);
      setVisible(false);
      setShowInstructions(false);
      window.localStorage.setItem("kigobeshop-install-dismissed", "1");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleInstalled);
    window.addEventListener("kigobeshop:open-install", handleOpenInstall);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        console.error("No se pudo registrar el service worker:", error);
      });
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleInstalled);
      window.removeEventListener("kigobeshop:open-install", handleOpenInstall);
    };
  }, [installEvent]);

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

    try {
      await installEvent.prompt();
      const choice = await installEvent.userChoice;

      if (choice.outcome === "accepted") {
        setVisible(false);
        setShowInstructions(false);
      } else {
        setShowInstructions(true);
      }
    } catch (error) {
      console.error("No se pudo abrir la instalación:", error);
      setShowInstructions(true);
    } finally {
      setInstallEvent(null);
    }
  };

  if (!visible) return null;

  const hasNativeInstall = Boolean(installEvent) && device !== "ios";

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
        <p>
          Añade nuestra tienda a la pantalla de inicio y vuelve cuando quieras
          a descubrir novedades.
        </p>

        {hasNativeInstall ? (
          <button
            type="button"
            className="kigobe-install-button"
            onClick={install}
          >
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
            {device === "ios" ? (
              <>
                <strong>En iPhone o iPad:</strong>
                <ol>
                  <li>Abre KigobeShop en Safari.</li>
                  <li>Pulsa el botón Compartir.</li>
                  <li>Elige «Añadir a pantalla de inicio».</li>
                  <li>Pulsa «Añadir».</li>
                </ol>
              </>
            ) : device === "android" ? (
              <>
                <strong>En Android:</strong>
                <ol>
                  <li>Abre KigobeShop en Chrome.</li>
                  <li>Pulsa los tres puntitos del navegador.</li>
                  <li>Elige «Instalar aplicación» o «Añadir a pantalla de inicio».</li>
                  <li>Confirma la instalación.</li>
                </ol>
              </>
            ) : (
              <>
                <strong>En ordenador:</strong>
                <ol>
                  <li>Abre KigobeShop en Chrome o Edge.</li>
                  <li>Busca el icono de instalación en la barra de direcciones o abre el menú del navegador.</li>
                  <li>Selecciona «Instalar KigobeShop» si aparece.</li>
                </ol>
                <small>
                  La instalación directa depende de que el navegador ofrezca esa opción.
                </small>
              </>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}
