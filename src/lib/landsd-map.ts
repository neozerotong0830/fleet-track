export const HK_CENTER = { lat: 22.3193, lng: 114.1694 } as const;

export const LANDSD_BASE = "https://mapapi.geodata.gov.hk/gs/api/v1.0.0";

export const LANDSD_VECTOR_BASEMAP =
  `${LANDSD_BASE}/vt/basemap/WGS84/tile/{z}/{y}/{x}.pbf`;
export const LANDSD_VECTOR_LABELS =
  `${LANDSD_BASE}/vt/label/hk/tc/WGS84/tile/{z}/{y}/{x}.pbf`;
export const LANDSD_VECTOR_BASEMAP_STYLE =
  `${LANDSD_BASE}/vt/basemap/WGS84/resources/styles/root.json`;
export const LANDSD_VECTOR_LABEL_STYLE =
  `${LANDSD_BASE}/vt/label/hk/tc/WGS84/resources/styles/root.json`;

export const LANDSD_XYZ_BASEMAP =
  `${LANDSD_BASE}/xyz/basemap/WGS84/{z}/{x}/{y}.png`;
export const LANDSD_XYZ_LABELS =
  `${LANDSD_BASE}/xyz/label/hk/tc/WGS84/{z}/{x}/{y}.png`;

export const LANDSD_ATTRIBUTION = "Map from Lands Department";
