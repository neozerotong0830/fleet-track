"use client";

import { useEffect, useState } from "react";
import { TileLayer, useMap } from "react-leaflet";
import {
  LANDSD_ATTRIBUTION,
  LANDSD_VECTOR_BASEMAP,
  LANDSD_VECTOR_BASEMAP_STYLE,
  LANDSD_VECTOR_LABELS,
  LANDSD_VECTOR_LABEL_STYLE,
  LANDSD_XYZ_BASEMAP,
  LANDSD_XYZ_LABELS,
} from "@/lib/landsd-map";

type VectorStyle = {
  version: number;
  sprite?: string;
  glyphs?: string;
  sources: Record<string, unknown>;
  layers: Array<{ id: string; source?: string; [key: string]: unknown }>;
};

const STYLE_TOKENS = ["fontstack", "range", "z", "x", "y"] as const;

function restoreGlyphTokens(url: string) {
  return url
    .replaceAll("%7Bfontstack%7D", "{fontstack}")
    .replaceAll("%7Brange%7D", "{range}")
    .replaceAll("%7Bz%7D", "{z}")
    .replaceAll("%7Bx%7D", "{x}")
    .replaceAll("%7By%7D", "{y}");
}

function absUrl(maybeRelative: string | undefined, styleUrl: string) {
  if (!maybeRelative) return maybeRelative;
  if (/^https?:\/\//i.test(maybeRelative)) return restoreGlyphTokens(maybeRelative);

  let path = maybeRelative;
  for (const token of STYLE_TOKENS) {
    path = path.replaceAll(`{${token}}`, `__TOKEN_${token}__`);
  }
  try {
    let out = new URL(path, styleUrl).href;
    for (const token of STYLE_TOKENS) {
      out = out.replaceAll(`__TOKEN_${token}__`, `{${token}}`);
    }
    return restoreGlyphTokens(out);
  } catch {
    return maybeRelative;
  }
}

async function loadMergedVectorStyle(): Promise<VectorStyle> {
  const [baseRes, labelRes] = await Promise.all([
    fetch(LANDSD_VECTOR_BASEMAP_STYLE),
    fetch(LANDSD_VECTOR_LABEL_STYLE),
  ]);
  if (!baseRes.ok || !labelRes.ok) throw new Error("LandsD vector style HTTP error");
  const base = (await baseRes.json()) as VectorStyle;
  const labels = (await labelRes.json()) as VectorStyle;

  const labelLayers = (labels.layers ?? []).map((layer) => ({
    ...layer,
    id: `label-${layer.id}`,
    source: layer.source ? `labels-${layer.source}` : layer.source,
  }));

  const glyphs =
    absUrl(base.glyphs, LANDSD_VECTOR_BASEMAP_STYLE) ??
    `${LANDSD_VECTOR_BASEMAP_STYLE.replace("/styles/root.json", "/fonts/{fontstack}/{range}.pbf")}`;

  return {
    ...base,
    sprite: absUrl(base.sprite, LANDSD_VECTOR_BASEMAP_STYLE) ?? base.sprite,
    glyphs,
    sources: {
      esri: {
        type: "vector",
        tiles: [LANDSD_VECTOR_BASEMAP],
        minzoom: 10,
        maxzoom: 15,
      },
      "labels-esri": {
        type: "vector",
        tiles: [LANDSD_VECTOR_LABELS],
        minzoom: 9,
        maxzoom: 15,
      },
    },
    layers: [...(base.layers ?? []), ...labelLayers],
  };
}

function RasterTiles() {
  return (
    <>
      <TileLayer
        url={LANDSD_XYZ_BASEMAP}
        attribution={LANDSD_ATTRIBUTION}
        minZoom={10}
        maxZoom={19}
      />
      <TileLayer url={LANDSD_XYZ_LABELS} minZoom={10} maxZoom={19} />
    </>
  );
}

export function LandsDBasemap() {
  const map = useMap();
  const [vectorOk, setVectorOk] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let glMap: { remove: () => void; resize: () => void; jumpTo: (v: object) => void } | null = null;

    const paneName = "landsd-vector";
    const pane = map.getPane(paneName) ?? map.createPane(paneName);
    pane.style.zIndex = "200";
    pane.style.pointerEvents = "none";

    function sync() {
      if (!glMap) return;
      const c = map.getCenter();
      glMap.jumpTo({ center: [c.lng, c.lat], zoom: map.getZoom(), bearing: 0, pitch: 0 });
    }

    function onResize() {
      glMap?.resize();
    }

    async function attach() {
      const maplibregl = await import("maplibre-gl");
      await import("maplibre-gl/dist/maplibre-gl.css");
      const style = await loadMergedVectorStyle();
      if (cancelled) return;

      pane.innerHTML = "";
      const container = document.createElement("div");
      container.style.width = "100%";
      container.style.height = "100%";
      pane.appendChild(container);

      const instance = new maplibregl.Map({
        container,
        style: style as never,
        center: [map.getCenter().lng, map.getCenter().lat],
        zoom: map.getZoom(),
        attributionControl: false,
        interactive: false,
        fadeDuration: 0,
      });
      glMap = instance;
      instance.on("load", () => {
        if (!cancelled) setVectorOk(true);
        instance.resize();
        sync();
      });
      map.on("move", sync);
      map.on("resize", onResize);
    }

    attach().catch(() => {
      if (!cancelled) setVectorOk(false);
    });

    return () => {
      cancelled = true;
      map.off("move", sync);
      map.off("resize", onResize);
      try {
        glMap?.remove();
      } catch {
        /* ignore */
      }
      pane.innerHTML = "";
    };
  }, [map]);

  if (vectorOk) return null;
  return <RasterTiles />;
}
