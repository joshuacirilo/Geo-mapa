"use client";

import { useState } from "react";
import { Circle } from "./circle";
import { Map3DView } from "./Map3DView";

type ViewMode = "2d" | "3d";

export function MapModeSwitcher() {
  const [mode, setMode] = useState<ViewMode>("2d");

  return (
    <section style={{ position: "relative", width: "100%", height: "100vh" }}>
      <div
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          zIndex: 30,
          background: "white",
          borderRadius: 8,
          padding: 8,
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          display: "flex",
          gap: 8,
        }}
      >
        <button
          type="button"
          onClick={() => setMode("2d")}
          style={{ padding: "6px 10px", fontWeight: mode === "2d" ? 700 : 400 }}
        >
          2D
        </button>
        <button
          type="button"
          onClick={() => setMode("3d")}
          style={{ padding: "6px 10px", fontWeight: mode === "3d" ? 700 : 400 }}
        >
          3D
        </button>
      </div>

      {mode === "2d" ? <Circle /> : <Map3DView />}
    </section>
  );
}

