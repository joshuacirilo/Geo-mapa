import { NextResponse } from "next/server";

const GOOGLE_MAPS_SCRIPT_BASE_URL = "https://maps.googleapis.com/maps/api/js";
const DEFAULT_VERSION = "beta";

export async function GET(request: Request) {
  const allowedOrigins = (process.env.GOOGLE_MAPS_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  if (allowedOrigins.length > 0) {
    const origin = request.headers.get("origin");
    const referer = request.headers.get("referer");
    let requestOrigin = origin;

    if (!requestOrigin && referer) {
      try {
        requestOrigin = new URL(referer).origin;
      } catch {
        requestOrigin = null;
      }
    }

    if (!requestOrigin || !allowedOrigins.includes(requestOrigin)) {
      return NextResponse.json({ error: "Forbidden origin for Google Maps loader." }, { status: 403 });
    }
  }

  const serverKey =
    process.env.GOOGLE_MAPS_API_KEY_SERVER ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!serverKey || serverKey === "pega_tu_api_key_aqui") {
    return NextResponse.json(
      { error: "Missing Google Maps key in server environment variables." },
      { status: 500 },
    );
  }

  const incomingUrl = new URL(request.url);
  const libraries = incomingUrl.searchParams.get("libraries") ?? "";
  const version = incomingUrl.searchParams.get("v") ?? DEFAULT_VERSION;

  const upstreamParams = new URLSearchParams({
    key: serverKey,
    v: version,
  });

  if (libraries.trim()) {
    upstreamParams.set("libraries", libraries);
  }

  const upstreamUrl = `${GOOGLE_MAPS_SCRIPT_BASE_URL}?${upstreamParams.toString()}`;

  const upstreamResponse = await fetch(upstreamUrl, {
    method: "GET",
    cache: "no-store",
  });

  if (!upstreamResponse.ok) {
    const payload = await upstreamResponse.text();
    return new NextResponse(payload, {
      status: upstreamResponse.status,
      headers: {
        "content-type": upstreamResponse.headers.get("content-type") ?? "text/plain; charset=utf-8",
        "cache-control": "no-store",
      },
    });
  }

  const script = await upstreamResponse.text();
  return new NextResponse(script, {
    status: 200,
    headers: {
      "content-type": "application/javascript; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
