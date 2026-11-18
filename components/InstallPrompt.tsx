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
  const [alreadyInstalled, setAlreadyInstalled] = useState(false);

  useEffect(() => {
    setDevice(detectDevice());

    const handleBeforeInstall = (event: Event) => {
      event.preventDefault();
      installEventRef.current = event as InstallPromptEvent;
    };

    const handleOpenInstall = () => {
      // No salimos antes si la web ya está instalada: el botón del menú
      // debe responder siempre, incluso en modo aplicación.
      if (isRunningStandalone()) {
        setAlreadyInstalled(true);
        setShowFallback(false);
        setVisible(true);
        return;
      }

      setAlreadyInstalled(false);
      setShowFallback(false);

      const promptEvent = installEventRef.current;

      // El evento prompt debe ejecutarse directamente dentro del clic
      // del usuario; por eso lo lanzamos desde este manejador.
      if (promptEvent && detectDevice() !== "ios") {
        promptEvent.prompt().then(async () => {
          const choice = await promptEvent.userChoice;
          installEventRef.current = null;

          if (choice.outcome === "accepted") {
            setVisible(false);
          }
        }).catch((error) => {
          console.error("No se pudo abrir la instalación:", error);
          setVisible(true);
          setShowFallback(true);
        });
        return;
      }

      // iPhone y navegadores sin instalación nativa muestran ayuda.
      setVisible(true);
      setShowFallback(true);
    };

    const handleInstalled = () => {
      installEventRef.current = null;
      setVisible(false);
      setShowFallback(false);
      setAlreadyInstalled(false);
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
    setAlreadyInstalled(false);
  };

  if (!visible) return null;

  const fallbackContent =
    device === "ios"
      ? {
          title: "Añade KigobeShop a tu iPhone",
          message:
            "En Safari, pulsa Compartir y selecciona «Añadir a pantalla de inicio». Después pulsa «Añadir». Así tendrás el acceso directo de KigobeShop en tu pantalla.",
        }
      : device === "android"
        ? {
            title: "Instala KigobeShop desde Chrome",
            message:
              "Abre el menú de Chrome (⋮) y selecciona «Instalar aplicación». Chrome ya permite instalar KigobeShop en este dispositivo.",
          }
        : {
            title: "Instala KigobeShop en tu ordenador",
            message:
              "En Chrome o Edge, abre el menú del navegador y selecciona «Instalar KigobeShop» si aparece disponible.",
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

        <div className="kigobe-install-mark" aria-hidden="true">K</div>
        <h2 id="kigobe-install-title">
          {alreadyInstalled ? "¡KigobeShop ya está instalada!" : "¡Lleva KigobeShop contigo!"}
        </h2>
        <p>
          {alreadyInstalled
            ? "Ya tienes KigobeShop instalada en este dispositivo. Ábrela desde tu pantalla de inicio."
            : "Añade nuestra tienda a la pantalla de inicio y vuelve cuando quieras a descubrir novedades."}
        </p>

        {showFallback && !alreadyInstalled && (
          <div className="kigobe-install-help" role="status">
            <strong>{fallbackContent.title}</strong>
            <p>{fallbackContent.message}</p>
          </div>
        )}

        <button
          type="button"
          className="kigobe-install-button"
          onClick={close}
        >
          {alreadyInstalled ? "¡Perfecto!" : "Entendido"}
        </button>
      </aside>
    </div>
  );
}
