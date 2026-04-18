import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import { X, MapPin } from "lucide-react";
import { useI18n } from "../../context/I18nContext";
import { useGame } from "../../context/GameContext";
import { buildRoutes } from "../../data/defaultData";

// Fix Leaflet's default icon paths broken by Vite bundling
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon   from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

const DEFAULT_CENTER = [49.7475, 13.3776];
const DEFAULT_ZOOM   = 14;

const ROUTE_PALETTE = [
  "#22c55e", // green
  "#60a5fa", // blue
  "#f97316", // orange
  "#a855f7", // purple
  "#ec4899", // pink
  "#14b8a6", // teal
  "#f59e0b", // amber
  "#ef4444", // red
];

// Build a color map sorted by day then stage so color assignment is stable regardless of pin order
function buildColorMap(pins) {
  const map = {};
  let idx = 0;
  [...pins]
    .sort((a, b) => a.day !== b.day ? a.day - b.day : a.stage - b.stage)
    .forEach(({ day, stage }) => {
      const key = `${day}-${stage}`;
      if (!(key in map)) map[key] = ROUTE_PALETTE[idx++ % ROUTE_PALETTE.length];
    });
  return map;
}

function darkenHex(hex, factor) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const ch = v => Math.min(255, Math.round(v * factor)).toString(16).padStart(2, "0");
  return `#${ch(r)}${ch(g)}${ch(b)}`;
}

// Viewbox 0 0 40 58 — smooth teardrop: circle top (cx=20,cy=20,r=18), tip at (20,56)
const PIN_PATH = "M20 2C10.1 2 2 10.1 2 20C2 29.2 8.4 37.5 15 45.4L20 56L25 45.4C31.6 37.5 38 29.2 38 20C38 10.1 29.9 2 20 2Z";

function makePinIcon(pin, selected, color, isDark) {
  const w    = selected ? 48 : 39;
  const h    = Math.round(w * 58 / 40);
  const fill = selected ? darkenHex(color, 0.72) : color;
  const fs   = selected ? 9.5 : 8;
  const anchorY   = Math.round(h * 56 / 58);
  const stroke     = isDark ? "#0a1a0a" : "white";
  const circleFill = isDark ? "#162616" : "white";

  const html =
    `<div style="filter:drop-shadow(0 4px 12px rgba(0,0,0,0.5));">` +
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 40 58">` +
      `<path d="${PIN_PATH}" fill="${fill}" stroke="${stroke}" stroke-width="2.5" stroke-linejoin="round"/>` +
      `<circle cx="20" cy="20" r="10" fill="${circleFill}" opacity="0.93"/>` +
      `<text x="20" y="20" text-anchor="middle" dy="0.38em" ` +
            `font-family="'Space Mono',monospace" font-size="${fs}" font-weight="bold" fill="${fill}">${pin.label}</text>` +
    `</svg></div>`;

  return L.divIcon({ className: "", iconSize: [w, h], iconAnchor: [w / 2, anchorY], html });
}

export default function MapView({ eventId, eventData, activeDay, activeStage, role, selectedPin, onSelectPin, addingPinFor, setAddingPinFor }) {
  const { t }       = useI18n();
  const { updatePin, addPin, updateTree } = useGame();
  const isOrganizator = role === "Organizátor";

  // mapReady drives the markers effect so it always re-runs after map init
  const [mapReady, setMapReady] = useState(false);

  // reactive dark-mode flag — re-runs markers effect immediately on toggle
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));
  useEffect(() => {
    const obs = new MutationObserver(() =>
      setIsDark(document.documentElement.classList.contains("dark"))
    );
    obs.observe(document.documentElement, { attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  const containerRef  = useRef(null);
  const mapRef        = useRef(null);
  const markersRef    = useRef({});
  const polylinesRef  = useRef([]);
  const addingRef     = useRef(addingPinFor);
  const pinsRef       = useRef(eventData.pins);
  const treeRef       = useRef(eventData.tree);

  addingRef.current = addingPinFor;
  pinsRef.current   = eventData.pins;
  treeRef.current   = eventData.tree;

  const visiblePins = (() => {
    let pins = eventData.pins;
    if (activeDay   !== -1) pins = pins.filter(p => p.day   === activeDay);
    if (activeStage !== -1) pins = pins.filter(p => p.stage === activeStage);
    return pins;
  })();
  const routes = buildRoutes(visiblePins);

  // ── Init map once ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;

    const map = L.map(containerRef.current, {
      center: eventData.mapCenter ?? DEFAULT_CENTER,
      zoom:   eventData.mapCenter ? 12 : DEFAULT_ZOOM,
      zoomControl: false,
      minZoom: 3,
      maxBounds: [[-85, -180], [85, 180]],
      maxBoundsViscosity: 1.0,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
      maxZoom: 19,
      minZoom: 3,
      noWrap: true,
    }).addTo(map);
    L.control.zoom({ position: "topright" }).addTo(map);
    mapRef.current = map;

    // After flex layout paints, recalculate map size then signal markers effect
    requestAnimationFrame(() => {
      map.invalidateSize();
      setMapReady(true);
    });

    map.on("click", e => {
      const apf = addingRef.current;
      if (!apf) return;
      const { di, si } = apf;
      const { lat, lng } = e.latlng;
      const cur        = pinsRef.current;
      const nextId     = cur.length > 0 ? Math.max(...cur.map(p => p.id)) + 1 : 0;
      const nextLabel  = String.fromCharCode(65 + cur.length);
      const stagePins  = cur.filter(p => p.day === di && p.stage === si);
      const nextOrder  = stagePins.length > 0 ? Math.max(...stagePins.map(p => p.order)) + 1 : 0;
      const newPin = {
        id: nextId, label: nextLabel, day: di, stage: si, order: nextOrder,
        name: "Stanoviště ", vedouci: "", description: "", maxPoints: 100,
        lat: Math.round(lat * 1e6) / 1e6, lng: Math.round(lng * 1e6) / 1e6,
      };
      addPin(eventId, newPin);
      const updatedTree = (treeRef.current ?? []).map((d, i) =>
        i === di
          ? { ...d, stages: d.stages.map((s, j) =>
              j === si ? { ...s, pinLabels: [...s.pinLabels, nextLabel] } : s
            )}
          : d
      );
      updateTree(eventId, updatedTree);
      setAddingPinFor(null);
    });

    return () => { map.remove(); mapRef.current = null; setMapReady(false); };
  }, []); // eslint-disable-line

  // ── Sync markers — runs whenever mapReady, pins, day/stage filter, or selection changes ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const visIds = new Set(visiblePins.map(p => p.id));

    // Remove stale markers
    Object.keys(markersRef.current).forEach(id => {
      const nid = Number(id);
      if (!visIds.has(nid)) { map.removeLayer(markersRef.current[nid]); delete markersRef.current[nid]; }
    });

    // Add / update markers
    const colorMap = buildColorMap(visiblePins);
    visiblePins.forEach(pin => {
      if (pin.lat == null || pin.lng == null) return;
      const isSel  = selectedPin === pin.id;
      const color  = colorMap[`${pin.day}-${pin.stage}`] ?? "#22c55e";
      const exists = markersRef.current[pin.id];
      if (exists) {
        exists.setLatLng([pin.lat, pin.lng]);
        exists.setIcon(makePinIcon(pin, isSel, color, isDark));
        exists.setZIndexOffset(isSel ? 1000 : 0);
      } else {
        const marker = L.marker([pin.lat, pin.lng], {
          icon: makePinIcon(pin, isSel, color, isDark),
          draggable: isOrganizator,
          zIndexOffset: isSel ? 1000 : 0,
        });
        marker.on("click",   () => onSelectPin(pin.id));
        marker.on("dragend", ev => {
          const { lat, lng } = ev.target.getLatLng();
          updatePin(eventId, pin.id, { lat: Math.round(lat * 1e6) / 1e6, lng: Math.round(lng * 1e6) / 1e6 });
        });
        marker.addTo(map);
        markersRef.current[pin.id] = marker;
      }
    });

    // Remove old polylines / midpoint labels
    polylinesRef.current.forEach(l => map.removeLayer(l));
    polylinesRef.current = [];

    // Draw routes
    routes.forEach(seg => {
      if (seg.from.lat == null || seg.to.lat == null) return;
      const color = colorMap[`${seg.day}-${seg.stage}`];
      const pl = L.polyline([[seg.from.lat, seg.from.lng], [seg.to.lat, seg.to.lng]], {
        color, weight: 6, opacity: 0.75,
      }).addTo(map);
      const midLat  = (seg.from.lat + seg.to.lat) / 2;
      const midLng  = (seg.from.lng + seg.to.lng) / 2;
      const label   = `D${seg.day + 1} / E${seg.stage + 1}`;
      const tagBg   = isDark ? "#162016" : "#ffffff";
      const midIcon = L.divIcon({
        className: "",
        iconSize: [80, 26], iconAnchor: [40, 13],
        html: `<div style="width:80px;height:26px;display:flex;align-items:center;justify-content:center;background:${tagBg};border:2px solid ${color};border-radius:13px;font-family:'Courier New',monospace;font-size:11px;font-weight:bold;color:${color};white-space:nowrap;">${label}</div>`,
      });
      const mid = L.marker([midLat, midLng], { icon: midIcon, interactive: false }).addTo(map);
      polylinesRef.current.push(pl, mid);
    });
  }, [mapReady, visiblePins, selectedPin, routes, isOrganizator, isDark]); // eslint-disable-line

  // ── Invalidate size on container resize (panel drag / toggle) ─────────────
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(() => {
      if (mapRef.current) mapRef.current.invalidateSize();
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // ── Pan to selected pin ────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    const pin = eventData.pins.find(p => p.id === selectedPin);
    if (pin?.lat != null) mapRef.current.panTo([pin.lat, pin.lng], { animate: true, duration: 0.3 });
  }, [selectedPin, mapReady]); // eslint-disable-line

  return (
    <div
      className="flex-1 relative"
      style={{ minHeight: 380, border: "1px solid var(--border)", overflow: "hidden" }}
    >
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
      {addingPinFor && (
        <div
          className="absolute top-2 left-2 right-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs"
          style={{ zIndex: 1000, background: "rgba(22,32,22,0.92)", border: "1px solid var(--green)", color: "var(--green)", backdropFilter: "blur(8px)", overflow: "hidden" }}
        >
          <MapPin size={11} className="flex-shrink-0" />
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
            {t("map.clickMapToPlace")}
          </span>
          <button className="ml-1 font-bold hover:opacity-60 flex-shrink-0" onClick={() => setAddingPinFor(null)}>
            <X size={12} />
          </button>
        </div>
      )}
    </div>
  );
}
