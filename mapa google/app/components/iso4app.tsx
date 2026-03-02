"use client";

declare global {
  interface Window {
    iso4app?: any;
    __ISO4APP_KEY__?: string;
  }
}

let iso4appLoadPromise: Promise<void> | null = null;

function getIso4appKey(): string {
  const key =
    process.env.NEXT_PUBLIC_ISO4APP_KEY ??
    process.env.NEXT_PUBLIC_ISO4APP ??
    window.__ISO4APP_KEY__ ??
    "";
  return String(key).trim();
}

function parseIsoCoords(rawCoords: string): Array<{ lat: number; lng: number }> {
  return rawCoords
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((pair) => pair.split(" ").filter(Boolean))
    .map(([latRaw, lngRaw]) => ({ lat: Number(latRaw), lng: Number(lngRaw) }))
    .filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng));
}

export async function ensureIso4appLoaded(): Promise<void> {
  if (window.iso4app) return;
  if (iso4appLoadPromise) return iso4appLoadPromise;

  const iso4appKey = getIso4appKey();

  if (!iso4appKey) {
    throw new Error("Falta NEXT_PUBLIC_ISO4APP_KEY en .env");
  }

  iso4appLoadPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(
      "script[data-iso4app='true']",
    ) as HTMLScriptElement | null;

    const onReady = () => {
      if (window.iso4app) {
        resolve();
        return;
      }
      reject(new Error("iso4app no esta disponible despues de cargar el script."));
    };

    if (existing) {
      if (window.iso4app) {
        resolve();
        return;
      }
      existing.addEventListener("load", onReady, { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("No se pudo cargar el script de iso4app.")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = `https://www.iso4app.net/api/js?v=1.3&lkey=${iso4appKey}`;
    script.async = true;
    script.defer = true;
    script.dataset.iso4app = "true";
    script.addEventListener("load", onReady, { once: true });
    script.addEventListener(
      "error",
      () => reject(new Error("No se pudo cargar el script de iso4app.")),
      { once: true },
    );
    document.head.appendChild(script);
  });

  return iso4appLoadPromise;
}

export async function getIsochronePolygon(
  lat: number,
  lng: number,
): Promise<{ paths: Array<{ lat: number; lng: number }>; startpoint?: string }> {
  await ensureIso4appLoaded();
  const iso4app = window.iso4app;

  if (!iso4app?.Engine) {
    throw new Error("iso4app.Engine no esta disponible.");
  }

  const engine = new iso4app.Engine();
  const props = {
    maxdist: "100",
    mobility: iso4app.Mobility.MOTOR_VEHICLE,
    speedtype: iso4app.Speed.NORMAL,
  };

  const result = engine.getIsoline(lat, lng, iso4app.Distance.METERS_10000, props);

  if (!result || result.errcode !== "0") {
    throw new Error(`${result?.errcode ?? "ISO"}: ${result?.errmsg ?? "Error desconocido"}`);
  }

  const paths = parseIsoCoords(String(result.isocoords ?? ""));
  if (paths.length < 3) {
    throw new Error("La isocrona no devolvio suficientes puntos para dibujar poligono.");
  }

  return {
    paths,
    startpoint: result.startpoint,
  };
}
