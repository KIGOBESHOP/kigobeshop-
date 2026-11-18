"use client";

import "./InstallPrompt.css";
import { useEffect, useRef, useState } from "react";

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
  const installEventRef = useRef<InstallPromptEvent | null>(null);
  const [device, setDevice] = useState<DeviceKind>("other");
  const [visible, setVisible] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    const detectedDevice = detectDevice();
    setDevice(detectedDevice);

    if (isRunningStandalone()) return;

    const handleBeforeInstall = (event: Event) => {
      // El navegador solo permite mostrar el diálogo nativo después de este evento.
      event.preventDefault();
      installEventRef.current = event as InstallPromptEvent;
      setCanInstall(true);
    };

    const handleOpenInstall = () => {
      setVisible(true);
      setShowFallback(false);
    };

    const handleInstalled = () => {
      installEventRef.current = null;
      setCanInstall(false);
      setVisible(false);
      setShowFallback(false);
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
  }, []);

  const close = () => {
    setVisible(false);
    setShowFallback(false);
  };

  const install = async () => {
    const promptEvent = installEventRef.current;

    if (promptEvent) {
      try {
        await promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        installEventRef.current = null;
        setCanInstall(false);

        if (choice.outcome === "accepted") {
          close();
        } else {
          // No mostramos instrucciones automáticamente si el usuario cancela.
          close();
        }
      } catch (error) {
        console.error("No se pudo abrir la instalación:", error);
        setShowFallback(true);
      }
      return;
    }

    // iOS y navegadores que no ofrecen beforeinstallprompt no permiten
    // iniciar la instalación desde código; explicamos únicamente esa limitación.
    setShowFallback(true);
  };

  if (!visible) return null;

  const fallbackContent =
    device === "ios"
      ? {
          title: "Para instalar en iPhone",
          message:
            "Apple requiere un paso manual: abre esta página en Safari, pulsa Compartir y elige «Añadir a pantalla de inicio».",
        }
      : device === "android"
        ? {
            title: "Instalación no disponible directamente",
            message:
              "Este navegador no ha ofrecido la instalación automática. Prueba desde Chrome; si no aparece el aviso, abre el menú ⋮ y selecciona «Instalar aplicación» o «Añadir a pantalla de inicio».",
          }
        : {
            title: "Instalación no disponible directamente",
            message:
              "Este navegador no ha ofrecido la instalación automática. Prueba con Chrome o Edge y busca «Instalar KigobeShop» en el menú del navegador.",
          };

  return (
    <div className="kigobe-install-backdrop" role="presentation" onClick={close}>
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
          onClick={close}
          aria-label="Cerrar"
        >
          ×
        </button>

        <div className="kigobe-install-mark" aria-hidden="true">
          K
        </div>
        <h2 id="kigobe-install-title">¡Lleva KigobeShop contigo!</h2>
        <p>
          Añade nuestra tienda a la pantalla de inicio y vuelve cuando quieras
          a descubrir novedades.
        </p>

        <button
          type="button"
          className="kigobe-install-button"
          onClick={install}
        >
          {canInstall && device !== "ios"
            ? "Instalar KigobeShop"
            : "Instalar KigobeShop"}
        </button>

        {showFallback && (
          <div className="kigobe-install-help" role="status">
            <strong>{fallbackContent.title}</strong>
            <p>{fallbackContent.message}</p>
          </div>
        )}
      </aside>
    </div>
  );
}
