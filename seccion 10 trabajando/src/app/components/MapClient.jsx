"use client";

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet-sidebar';
import 'leaflet-choropleth';
import 'leaflet-easybutton';
import 'leaflet-minimap';
import 'leaflet-minimap/dist/Control.MiniMap.min.css';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
import MapCanvas from './MapCanvas';
import MapControls from './MapControls';
import MapSidebar from './MapSidebar';
import localGeojson from '../../data/geojson.json';

const DEFAULT_IDS = {
  checkbox: 'checkbox',
  select: 'shape-select',
  create: 'crear',
  clear: 'limpiar',
  sidebar: 'sidebar',
  sidebarToggle: 'sidebar-toggle',
  map: 'map'
};

export default function MapClient({ ids = {} } = {}) {
  const resolvedIds = { ...DEFAULT_IDS, ...ids };
  const mapRef = useRef(null);
  const sidebarRef = useRef(null);
  const [analysisItems, setAnalysisItems] = useState([]);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [osmCategories, setOsmCategories] = useState(null);
  const FIGURE_COLORS = ['#e53935', '#ff7043', '#8e24aa', '#1e88e5', '#00897b', '#7cb342', '#f9a825'];
  const OSM_RENDER_MAX_FEATURES = 500;
  const guatemalaBounds = [
    [18.44834670293207, -88.04443359375001],
    [10.692996347925087, -92.98828125]
  ];

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const resolvedIconUrl = typeof iconUrl === 'string' ? iconUrl : iconUrl?.src;
    const resolvedIconRetinaUrl =
      typeof iconRetinaUrl === 'string' ? iconRetinaUrl : iconRetinaUrl?.src;
    const resolvedShadowUrl =
      typeof shadowUrl === 'string' ? shadowUrl : shadowUrl?.src;

    L.Icon.Default.mergeOptions({
      iconRetinaUrl: resolvedIconRetinaUrl,
      iconUrl: resolvedIconUrl,
      shadowUrl: resolvedShadowUrl
    });

    if (!mapRef.current || !sidebarRef.current) {
      return undefined;
    }

    const map = L.map(mapRef.current, {
      center: [14.602416, -90.517302],
      zoom: 12,
      //zoom control son los controles del mapa que tenemos a la derecha
      zoomControl: false,
      attributionControl: true,
      keyboard: true,
      minZoom: 7,
      maxZoom: 16,
      maxBounds: guatemalaBounds
    });
    const sidebarControl = L.control.sidebar(sidebarRef.current);
    map.addControl(sidebarControl);

    const osmUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
    const alidadeSatelliteUrl =
      'https://tiles.stadiamaps.com/tiles/alidade_satellite/{z}/{x}/{y}{r}.{ext}';
    const alidadeSatelliteAttribution =
      '&copy; CNES, Distribution Airbus DS, © Airbus DS, © PlanetObserver (Contains Copernicus Data) | &copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
    const terrainUrl = 'https://tiles.stadiamaps.com/tiles/stamen_terrain/{z}/{x}/{y}{r}.{ext}';
    const terrainAttribution =
      '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://www.stamen.com/" target="_blank">Stamen Design</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
    const tonerBackgroundUrl =
      'https://tiles.stadiamaps.com/tiles/stamen_toner_background/{z}/{x}/{y}{r}.{ext}';
    const tonerBackgroundAttribution =
      '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://www.stamen.com/" target="_blank">Stamen Design</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

    const mainBaseMap = L.tileLayer(osmUrl, {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    const miniBaseMap = L.tileLayer(osmUrl, {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    });

    const miniDarkMap = L.tileLayer(alidadeSatelliteUrl, {
      minZoom: 0,
      maxZoom: 22,
      attribution: alidadeSatelliteAttribution,
      ext: 'jpg'
    });
    const miniThunderMap = L.tileLayer(terrainUrl, {
      minZoom: 0,
      maxZoom: 18,
      attribution: terrainAttribution,
      ext: 'png'
    });
    const miniTonerMap = L.tileLayer(tonerBackgroundUrl, {
      minZoom: 0,
      maxZoom: 20,
      attribution: tonerBackgroundAttribution,
      ext: 'png'
    });

    const miniMapBaseControl = new L.Control.MiniMap(miniBaseMap, {
      position: 'bottomright'
    });
    const miniMapDarkControl = new L.Control.MiniMap(miniDarkMap, {
      position: 'bottomright'
    });
    const miniMapThunderControl = new L.Control.MiniMap(miniThunderMap, {
      position: 'bottomright'
    });
    const miniMapTonerControl = new L.Control.MiniMap(miniTonerMap, {
      position: 'bottomright'
    });

    const onBaseMiniMapClick = (e) => {
      if (e?.originalEvent) {
        L.DomEvent.stop(e.originalEvent);
      }
      mainBaseMap.options.maxZoom = 19;
      mainBaseMap.options.attribution =
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
      mainBaseMap.setUrl(osmUrl);
    };

    const onDarkMiniMapClick = (e) => {
      if (e?.originalEvent) {
        L.DomEvent.stop(e.originalEvent);
      }
      mainBaseMap.options.maxZoom = 20;
      mainBaseMap.options.attribution = alidadeSatelliteAttribution;
      mainBaseMap.options.ext = 'jpg';
      mainBaseMap.setUrl(alidadeSatelliteUrl);
    };

    const onThunderMiniMapClick = (e) => {
      if (e?.originalEvent) {
        L.DomEvent.stop(e.originalEvent);
      }
      mainBaseMap.options.maxZoom = 18;
      mainBaseMap.options.attribution = terrainAttribution;
      mainBaseMap.options.ext = 'png';
      mainBaseMap.setUrl(terrainUrl);
    };

    const onTonerMiniMapClick = (e) => {
      if (e?.originalEvent) {
        L.DomEvent.stop(e.originalEvent);
      }
      mainBaseMap.options.maxZoom = 20;
      mainBaseMap.options.attribution = tonerBackgroundAttribution;
      mainBaseMap.options.ext = 'png';
      mainBaseMap.setUrl(tonerBackgroundUrl);
    };

    const miniMapToggleButton = L.easyButton({
      position: 'topright',
      states: [
        {
          stateName: 'open-minimap',
          icon: 'fa-regular fa-map',
          title: 'Mostrar minimapa',
          onClick: (btn) => {
            miniMapBaseControl.addTo(map);
            miniMapDarkControl.addTo(map);
            miniMapThunderControl.addTo(map);
            miniMapTonerControl.addTo(map);
            miniMapBaseControl._miniMap?.on('click', onBaseMiniMapClick);
            miniMapDarkControl._miniMap?.on('click', onDarkMiniMapClick);
            miniMapThunderControl._miniMap?.on('click', onThunderMiniMapClick);
            miniMapTonerControl._miniMap?.on('click', onTonerMiniMapClick);
            btn.state('close-minimap');
          }
        },
        {
          stateName: 'close-minimap',
          icon: 'fa-solid fa-x',
          title: 'Ocultar minimapa',
          onClick: (btn) => {
            miniMapBaseControl._miniMap?.off('click', onBaseMiniMapClick);
            miniMapDarkControl._miniMap?.off('click', onDarkMiniMapClick);
            miniMapThunderControl._miniMap?.off('click', onThunderMiniMapClick);
            miniMapTonerControl._miniMap?.off('click', onTonerMiniMapClick);
            map.removeControl(miniMapBaseControl);
            map.removeControl(miniMapDarkControl);
            map.removeControl(miniMapThunderControl);
            map.removeControl(miniMapTonerControl);
            btn.state('open-minimap');
          }
        }
      ]
    }).addTo(map);

    const divIcon = L.divIcon({
      className: '',
      html: '<i class="fa-regular fa-house"></i>',
      iconSize: [18, 18],
      iconAnchor: [9, 18]
    });

    const fixedMarker = L.marker([14.788409, -90.195652], { icon: divIcon })
      .addTo(map)
      .bindPopup('Marcador fijo');
    fixedMarker.openPopup();
    map.panTo(fixedMarker.getLatLng());

    const helloPopup = L.popup().setContent('Hello World!');
    const helloButton = L.easyButton({
      position: 'topright',
      states: [
        {
          stateName: 'polygon',
          icon: 'fa-solid fa-draw-polygon',
          title: 'Mostrar popup',
          onClick: (btn, leafletMap) => {
            helloPopup.setLatLng(leafletMap.getCenter()).openOn(leafletMap);
            btn.state('hand');
          }
        },
        {
          stateName: 'hand',
          icon: 'fa-regular fa-hand',
          title: 'Mostrar popup',
          onClick: (btn, leafletMap) => {
            helloPopup.setLatLng(leafletMap.getCenter()).openOn(leafletMap);
            btn.state('polygon');
          }
        }
      ]
    }).addTo(map);

    let markersLayer = null;

    const choroplethData = {
      ...localGeojson,
      features: (localGeojson.features ?? []).map((feature) => {
        const rawIncidents = Number(feature?.properties?.incidents);
        const fallbackIncidents = Number(feature?.properties?.zona ?? 0);

        return {
          ...feature,
          properties: {
            ...feature.properties,
            incidents: Number.isFinite(rawIncidents) ? rawIncidents : fallbackIncidents
          }
        };
      })
    };

    if (markersLayer) {
      markersLayer.remove();
    }
    markersLayer = L.choropleth(choroplethData, {
      valueProperty: 'incidents',
      scale: ['white', 'red'],
      steps: 5,
      mode: 'q',
      style: {
        color: '#fff',
        weight: 2,
        fillOpacity: 0.35
      },
      onEachFeature: (_feature, layer) => {
        const title = _feature?.properties?.title ?? 'Sin titulo';
        const nombre = _feature?.properties?.nombre ?? title;
        const zona = _feature?.properties?.zona ?? 'N/A';
        const incidents = _feature?.properties?.incidents ?? 0;
        layer.bindPopup(
          `<strong>${nombre}</strong><br/>Zona: ${zona}<br/>Incidents: ${incidents}`
        );
      }
    }).addTo(map);

    const btn = document.querySelector(`#${resolvedIds.create}`);
    const select = document.querySelector(`#${resolvedIds.select}`);
    const checkbox = document.querySelector(`#${resolvedIds.checkbox}`);
    const limpiar = document.querySelector(`#${resolvedIds.clear}`);
    const sidebarEl = document.querySelector(`#${resolvedIds.sidebar}`);
    const sidebarToggle = document.querySelector(`#${resolvedIds.sidebarToggle}`);
    const osmOverlayGroup = L.featureGroup().addTo(map);
    const osmWaterwaysGroup = L.featureGroup().addTo(map);

    const isSidebarVisible = () => {
      if (sidebarControl && typeof sidebarControl.isVisible === 'function') {
        return sidebarControl.isVisible();
      }
      return sidebarEl ? sidebarEl.style.display !== 'none' : false;
    };

    const updateSidebarToggleUi = () => {
      if (!sidebarToggle) {
        return;
      }
      const visible = isSidebarVisible();
      sidebarToggle.textContent = visible ? '\u25c0' : '\u25b6';
      sidebarToggle.setAttribute(
        'aria-label',
        visible ? 'Ocultar sidebar' : 'Mostrar sidebar'
      );
    };

    const setSidebarVisible = (nextVisible) => {
      if (nextVisible) {
        if (sidebarControl && typeof sidebarControl.show === 'function') {
          sidebarControl.show();
        } else if (sidebarEl) {
          sidebarEl.style.display = 'block';
        }
      } else if (sidebarControl && typeof sidebarControl.hide === 'function') {
        sidebarControl.hide();
      } else if (sidebarEl) {
        sidebarEl.style.display = 'none';
      }

      updateSidebarToggleUi();
    };

    const onToggleSidebar = () => {
      if (sidebarControl && typeof sidebarControl.toggle === 'function') {
        sidebarControl.toggle();
        updateSidebarToggleUi();
        return;
      }
      setSidebarVisible(!isSidebarVisible());
    };

    if (sidebarToggle) {
      L.DomEvent.disableClickPropagation(sidebarToggle);
      L.DomEvent.disableScrollPropagation(sidebarToggle);
    }
    updateSidebarToggleUi();

    const showSidebarStatus = (message) => {
      setStatusMessage(message);
      setErrorMessage('');
      setSidebarVisible(true);
    };

    const showSidebarError = (message) => {
      setStatusMessage('');
      setErrorMessage(message);
      setSidebarVisible(true);
    };

    const showSidebarAnalysis = (item) => {
      setStatusMessage('');
      setErrorMessage('');
      setAnalysisItems((prev) => [...prev, item]);
      setSidebarVisible(true);
    };

    const analyzeGeometry = async (geojsonInput) => {
      const response = await fetch('/api/geo/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        cache: 'no-store',
        body: JSON.stringify(geojsonInput)
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error ?? 'No fue posible analizar la geometria.');
      }

      return payload;
    };

    const fetchOsmOverlayPolygons = async (featureCollection, zoom) => {
      const response = await fetch('/api/osm/overlay-polygons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        cache: 'no-store',
        body: JSON.stringify({
          geojson: featureCollection,
          zoom
        })
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error ?? 'No fue posible obtener overlay de poligonos OSM.');
      }
      return payload;
    };

    const fetchOsmWaterways = async (featureCollection, zoom) => {
      const response = await fetch('/api/osm/waterways', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        cache: 'no-store',
        body: JSON.stringify({
          geojson: featureCollection,
          zoom
        })
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error ?? 'No fue posible obtener waterways OSM.');
      }
      return payload;
    };

    const renderOsmOverlayPolygons = (featureCollection) => {
      osmOverlayGroup.clearLayers();

      const colorByTagValue = {
        water: {
          pond: '#4fc3f7',
          river: '#039be5',
          lake: '#1e88e5',
          stream: '#29b6f6',
          canal: '#0288d1',
          drain: '#26c6da'
        },
        natural: {
          water: '#42a5f5',
          wood: '#2e7d32',
          tree_row: '#558b2f',
          sand: '#f4d06f',
          wetland: '#26a69a',
          grassland: '#7cb342'
        },
        landuse: {
          residential: '#9e9e9e',
          orchard: '#66bb6a',
          forest: '#2e7d32',
          cemetery: '#8d6e63',
          farmland: '#d4a017',
          meadow: '#9ccc65',
          farmyard: '#bc8f5a',
          military: '#757575'
        },
        leisure: {
          pitch: '#81c784',
          nature_reserve: '#388e3c',
          park: '#43a047',
          garden: '#66bb6a'
        }
      };

      const resolveCategoryColor = (props) => {
        if (props?.water) {
          return colorByTagValue.water?.[props.water] ?? '#29b6f6';
        }
        if (props?.natural) {
          return colorByTagValue.natural?.[props.natural] ?? '#66bb6a';
        }
        if (props?.landuse) {
          return colorByTagValue.landuse?.[props.landuse] ?? '#bdb76b';
        }
        if (props?.leisure) {
          return colorByTagValue.leisure?.[props.leisure] ?? '#4caf50';
        }
        if (props?.kind === 'water') return '#42a5f5';
        if (props?.kind === 'farmland') return '#d4a017';
        if (props?.kind === 'green') return '#43a047';
        return '#90a4ae';
      };

      const styleByKind = (feature) => {
        const props = feature?.properties ?? {};
        const fillColor = resolveCategoryColor(props);
        return {
          color: fillColor,
          fillColor,
          weight: 1.1,
          fillOpacity: 0.24
        };
      };

      const layer = L.geoJSON(featureCollection, {
        style: styleByKind,
        onEachFeature: (feature, geoLayer) => {
          const props = feature?.properties ?? {};
          const name = props.name ?? 'Sin nombre';
          const kind = props.kind ?? 'unknown';
          const details = [
            `Tipo: ${kind}`,
            props.landuse ? `landuse: ${props.landuse}` : null,
            props.natural ? `natural: ${props.natural}` : null,
            props.leisure ? `leisure: ${props.leisure}` : null,
            props.water ? `water: ${props.water}` : null
          ]
            .filter(Boolean)
            .join('<br/>');
          geoLayer.bindPopup(`<strong>${name}</strong><br/>${details}`);
        }
      });

      layer.addTo(osmOverlayGroup);
    };

    const renderOsmWaterways = (featureCollection) => {
      osmWaterwaysGroup.clearLayers();
      const layer = L.geoJSON(featureCollection, {
        style: {
          color: '#00acc1',
          weight: 2,
          opacity: 0.9
        },
        onEachFeature: (feature, geoLayer) => {
          const props = feature?.properties ?? {};
          const name = props.name ?? 'Sin nombre';
          const waterway = props.waterway ?? 'waterway';
          geoLayer.bindPopup(`<strong>${name}</strong><br/>Waterway: ${waterway}`);
        }
      });

      layer.addTo(osmWaterwaysGroup);
    };

    const clampFeatureCollection = (featureCollection) => {
      const features = Array.isArray(featureCollection?.features) ? featureCollection.features : [];
      if (features.length <= OSM_RENDER_MAX_FEATURES) return featureCollection;
      return {
        ...featureCollection,
        features: features.slice(0, OSM_RENDER_MAX_FEATURES),
        meta: {
          ...(featureCollection?.meta ?? {}),
          truncated: true,
          frontend_limited: true
        }
      };
    };

    const syncOsmOverlaysForSelection = async (geometries) => {
      if (!Array.isArray(geometries) || geometries.length === 0) return;

      const featureCollection = {
        type: 'FeatureCollection',
        features: geometries.map((geometry, index) => ({
          type: 'Feature',
          id: `selection-${index + 1}`,
          properties: {},
          geometry
        }))
      };

      const zoom = map.getZoom();
      const [polygonResult, waterwaysResult] = await Promise.allSettled([
        fetchOsmOverlayPolygons(featureCollection, zoom),
        fetchOsmWaterways(featureCollection, zoom)
      ]);

      if (polygonResult.status === 'fulfilled') {
        const polygonOverlay = clampFeatureCollection(polygonResult.value);
        if (polygonOverlay?.type === 'FeatureCollection') {
          renderOsmOverlayPolygons(polygonOverlay);
        }
        setOsmCategories(polygonOverlay?.meta?.available_categories ?? null);
      } else {
        console.warn('OSM overlay-polygons warning:', polygonResult.reason);
      }

      if (waterwaysResult.status === 'fulfilled') {
        const waterwaysOverlay = clampFeatureCollection(waterwaysResult.value);
        if (waterwaysOverlay?.type === 'FeatureCollection') {
          renderOsmWaterways(waterwaysOverlay);
        }
      } else {
        console.warn('OSM waterways warning:', waterwaysResult.reason);
      }
    };

    const circleToPolygonFeature = (circleLayer, segments = 64) => {
      const center = circleLayer.getLatLng();
      const radius = circleLayer.getRadius();
      const earthRadius = 6378137;
      const centerLat = (center.lat * Math.PI) / 180;
      const centerLng = (center.lng * Math.PI) / 180;
      const angularDistance = radius / earthRadius;
      const ring = [];

      for (let i = 0; i < segments; i += 1) {
        const bearing = (2 * Math.PI * i) / segments;
        const lat = Math.asin(
          Math.sin(centerLat) * Math.cos(angularDistance) +
            Math.cos(centerLat) * Math.sin(angularDistance) * Math.cos(bearing)
        );
        const lng =
          centerLng +
          Math.atan2(
            Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(centerLat),
            Math.cos(angularDistance) - Math.sin(centerLat) * Math.sin(lat)
          );

        ring.push([(lng * 180) / Math.PI, (lat * 180) / Math.PI]);
      }

      if (ring.length > 0) {
        ring.push([...ring[0]]);
      }

      return {
        type: 'Feature',
        properties: {
          source: 'circle',
          radius_m: radius,
          segments
        },
        geometry: {
          type: 'Polygon',
          coordinates: [ring]
        }
      };
    };

    let polygonPoints = [];
    let activePolygonLayer = null;
    let activeCircleLayer = null;
    let activeCircleCenter = null;
    let nextFigureId = 1;
    let currentDrawMode = select?.value ?? 'polygon';
    const finalizedLayers = [];
    const figuresLayerGroup = L.featureGroup().addTo(map);
    const pendingFigurePayloads = [];

    const getNextFigureColor = () => FIGURE_COLORS[(nextFigureId - 1) % FIGURE_COLORS.length];

    const claimFigureIdentity = (shapeLabel) => {
      const figureId = nextFigureId;
      const color = getNextFigureColor();
      nextFigureId += 1;
      return { figureId, color, shapeLabel };
    };

    const resetPolygonDraft = () => {
      if (activePolygonLayer && map.hasLayer(activePolygonLayer)) {
        map.removeLayer(activePolygonLayer);
      }
      activePolygonLayer = null;
      polygonPoints = [];
    };

    const resetCircleDraft = () => {
      if (activeCircleLayer && map.hasLayer(activeCircleLayer)) {
        map.removeLayer(activeCircleLayer);
      }
      activeCircleLayer = null;
      activeCircleCenter = null;
      map.off('mousemove', onMapMoveCircle);
    };

    const ensureFigureLayersPresent = () => {
      if (!map.hasLayer(figuresLayerGroup)) {
        figuresLayerGroup.addTo(map);
      }
      finalizedLayers.forEach((layer) => {
        if (!figuresLayerGroup.hasLayer(layer)) {
          figuresLayerGroup.addLayer(layer);
        }
      });
      if (activePolygonLayer && !map.hasLayer(activePolygonLayer)) {
        activePolygonLayer.addTo(map);
      }
      if (activeCircleLayer && !map.hasLayer(activeCircleLayer)) {
        activeCircleLayer.addTo(map);
      }
    };

    const finalizePolygonDraft = () => {
      if (!activePolygonLayer || polygonPoints.length < 3) {
        return false;
      }

      const identity = claimFigureIdentity('Poligono');
      const finalPolygon = L.polygon(polygonPoints, {
        color: identity.color,
        fillColor: identity.color,
        fillOpacity: 0.2
      });
      if (activePolygonLayer && map.hasLayer(activePolygonLayer)) {
        map.removeLayer(activePolygonLayer);
      }

      figuresLayerGroup.addLayer(finalPolygon);
      finalizedLayers.push(finalPolygon);

      if (window.filtrarMarcadoresPorBounds) {
        window.filtrarMarcadoresPorBounds(finalPolygon.getBounds());
        ensureFigureLayersPresent();
      }

      activePolygonLayer = null;
      polygonPoints = [];

      pendingFigurePayloads.push({
        figureId: identity.figureId,
        color: identity.color,
        shapeLabel: identity.shapeLabel,
        note: '',
        layer: finalPolygon,
        toGeojson: () => finalPolygon.toGeoJSON()
      });

      return true;
    };

    const finalizeCircleDraft = () => {
      if (!activeCircleLayer || activeCircleCenter) {
        return false;
      }

      const identity = claimFigureIdentity('Circulo');
      const center = activeCircleLayer.getLatLng();
      const radius = activeCircleLayer.getRadius();
      const finalCircle = L.circle([center.lat, center.lng], {
        radius,
        color: identity.color,
        fillColor: identity.color,
        fillOpacity: 0.2
      });
      if (activeCircleLayer && map.hasLayer(activeCircleLayer)) {
        map.removeLayer(activeCircleLayer);
      }

      figuresLayerGroup.addLayer(finalCircle);
      finalizedLayers.push(finalCircle);

      if (window.filtrarMarcadoresPorBounds) {
        window.filtrarMarcadoresPorBounds(finalCircle.getBounds());
        ensureFigureLayersPresent();
      }

      activeCircleLayer = null;
      activeCircleCenter = null;
      map.off('mousemove', onMapMoveCircle);

      pendingFigurePayloads.push({
        figureId: identity.figureId,
        color: identity.color,
        shapeLabel: identity.shapeLabel,
        note: 'El circulo se aproxima a poligono para analisis raster.',
        layer: finalCircle,
        toGeojson: () => circleToPolygonFeature(finalCircle)
      });

      return true;
    };

    const processPendingFigures = async () => {
      if (pendingFigurePayloads.length === 0) {
        return false;
      }

      showSidebarStatus(`Analizando ${pendingFigurePayloads.length} figura(s)...`);
      const queue = pendingFigurePayloads.splice(0, pendingFigurePayloads.length);

      for (const item of queue) {
        try {
          const geojson = item.toGeojson();
          const responseAnalysis = await analyzeGeometry(geojson);
          const geometry =
            geojson?.type === 'Feature'
              ? geojson.geometry
              : geojson?.type && geojson?.coordinates
                ? geojson
                : null;
          showSidebarAnalysis({
            figureId: item.figureId,
            color: item.color,
            shapeLabel: item.shapeLabel,
            note: item.note,
            geojson,
            geometry,
            analysis: responseAnalysis
          });
        } catch (error) {
          showSidebarError(
            `Figura ${item.figureId}: ${error?.message ?? 'Error en analisis geoespacial.'}`
          );
        }
      }

      try {
        const geometries = queue
          .map((item) => item.toGeojson())
          .map((g) => (g?.type === 'Feature' ? g.geometry : g))
          .filter((geometry) => geometry && (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon'));
        await syncOsmOverlaysForSelection(geometries);
      } catch (error) {
        console.warn('No fue posible sincronizar overlays OSM:', error);
      }

      return true;
    };

    const onMapClickPolygon = (e) => {
      const punto = [e.latlng.lat, e.latlng.lng];
      polygonPoints.push(punto);
      const drawingColor = getNextFigureColor();

      if (!activePolygonLayer) {
        activePolygonLayer = L.polygon(polygonPoints, {
          color: drawingColor,
          fillColor: drawingColor,
          fillOpacity: 0.2
        }).addTo(map);
      } else {
        activePolygonLayer.setLatLngs(polygonPoints);
      }
    };

    const onMapClickCircle = async (e) => {
      if (!activeCircleCenter) {
        activeCircleCenter = e.latlng;
        const drawingColor = getNextFigureColor();

        if (activeCircleLayer) {
          map.removeLayer(activeCircleLayer);
        }

        activeCircleLayer = L.circle([activeCircleCenter.lat, activeCircleCenter.lng], {
          radius: 0,
          color: drawingColor,
          fillColor: drawingColor,
          fillOpacity: 0.2
        }).addTo(map);
        return;
      }

      const radio = activeCircleCenter.distanceTo(e.latlng);
      activeCircleLayer.setRadius(radio);
      activeCircleCenter = null;
      map.off('mousemove', onMapMoveCircle);
      finalizeCircleDraft();
    };

    const onMapDoubleClickPolygon = (event) => {
      if (event?.originalEvent) {
        L.DomEvent.stop(event.originalEvent);
      }
      finalizePolygonDraft();
    };

    const onMapMoveCircle = (e) => {
      if (!activeCircleCenter || !activeCircleLayer) {
        return;
      }

      const radio = activeCircleCenter.distanceTo(e.latlng);
      activeCircleLayer.setRadius(radio);
    };

    const onMapMouseMoveDebug = (e) => {
      const mapaBounds = map.getBounds();
      const zoomActual = map.getZoom();

      console.log('--- MAP DEBUG ---');
      console.log('Zoom:', zoomActual);
      console.log('Mouse lat/lng:', e.latlng.lat, e.latlng.lng);
      console.log('NorthWest:', mapaBounds.getNorthWest());
      console.log('SouthEast:', mapaBounds.getSouthEast());
      console.log('maxBounds sugerido:', [
        [mapaBounds.getNorth(), mapaBounds.getEast()],
        [mapaBounds.getSouth(), mapaBounds.getWest()]
      ]);
    };

    map.on('mousemove', onMapMouseMoveDebug);
    map.on('layerremove', (event) => {
      if (event.layer === figuresLayerGroup) {
        ensureFigureLayersPresent();
      }
    });

    const evaluar = () => {
      const activo = checkbox?.checked;
      const modo = select?.value;

      if (modo !== currentDrawMode) {
        if (currentDrawMode === 'polygon') {
          if (activePolygonLayer && polygonPoints.length >= 3) {
            finalizePolygonDraft();
          } else {
            resetPolygonDraft();
          }
        }
        if (currentDrawMode === 'circle') {
          if (activeCircleLayer && !activeCircleCenter) {
            finalizeCircleDraft();
          } else {
            resetCircleDraft();
          }
        }
        currentDrawMode = modo;
      }

      map.off('click', onMapClickPolygon);
      map.off('click', onMapClickCircle);
      map.off('dblclick', onMapDoubleClickPolygon);
      map.off('mousemove', onMapMoveCircle);

      if (!activo) {
        resetPolygonDraft();
        resetCircleDraft();
        map.doubleClickZoom.enable();
        return;
      }

      if (modo === 'polygon') {
        map.on('click', onMapClickPolygon);
        map.on('dblclick', onMapDoubleClickPolygon);
        map.doubleClickZoom.disable();
      }

      if (modo === 'circle') {
        map.on('click', onMapClickCircle);
        map.on('mousemove', onMapMoveCircle);
        map.doubleClickZoom.enable();
      }

      ensureFigureLayersPresent();
    };

    const onCrear = async () => {
      const value = select?.value;
      if (value === 'polygon' && activePolygonLayer && polygonPoints.length >= 3) {
        finalizePolygonDraft();
      }
      if (value === 'circle' && activeCircleLayer && !activeCircleCenter) {
        finalizeCircleDraft();
      }

      if (value !== 'polygon' && value !== 'circle') {
        showSidebarError('Selecciona una figura para crear.');
        return;
      }

      const processed = await processPendingFigures();
      if (!processed) {
        showSidebarError('No hay figuras listas para analizar. Termina una figura primero.');
      }
    };

    const onLimpiar = () => {
      resetPolygonDraft();
      resetCircleDraft();
      finalizedLayers.forEach((layer) => {
        if (figuresLayerGroup.hasLayer(layer)) {
          figuresLayerGroup.removeLayer(layer);
        }
      });
      finalizedLayers.length = 0;
      pendingFigurePayloads.length = 0;
      nextFigureId = 1;
      if (window.resetFiltroMarcadores) {
        window.resetFiltroMarcadores();
      }
      setStatusMessage('');
      setErrorMessage('');
      setAnalysisItems([]);
      setOsmCategories(null);
      osmOverlayGroup.clearLayers();
      osmWaterwaysGroup.clearLayers();
    };

    btn?.addEventListener('click', onCrear);
    limpiar?.addEventListener('click', onLimpiar);
    select?.addEventListener('change', evaluar);
    checkbox?.addEventListener('change', evaluar);
    sidebarToggle?.addEventListener('click', onToggleSidebar);

    return () => {
      btn?.removeEventListener('click', onCrear);
      limpiar?.removeEventListener('click', onLimpiar);
      select?.removeEventListener('change', evaluar);
      checkbox?.removeEventListener('change', evaluar);
      sidebarToggle?.removeEventListener('click', onToggleSidebar);
      if (helloButton) {
        map.removeControl(helloButton);
      }
      if (miniMapToggleButton) {
        map.removeControl(miniMapToggleButton);
      }
      miniMapBaseControl._miniMap?.off('click', onBaseMiniMapClick);
      miniMapDarkControl._miniMap?.off('click', onDarkMiniMapClick);
      miniMapThunderControl._miniMap?.off('click', onThunderMiniMapClick);
      miniMapTonerControl._miniMap?.off('click', onTonerMiniMapClick);
      map.removeControl(miniMapBaseControl);
      map.removeControl(miniMapDarkControl);
      map.removeControl(miniMapThunderControl);
      map.removeControl(miniMapTonerControl);
      map.closePopup(helloPopup);
      if (markersLayer) {
        markersLayer.remove();
      }
      figuresLayerGroup.clearLayers();
      map.removeLayer(figuresLayerGroup);
      osmOverlayGroup.clearLayers();
      osmWaterwaysGroup.clearLayers();
      map.removeLayer(osmOverlayGroup);
      map.removeLayer(osmWaterwaysGroup);
      if (fixedMarker) {
        fixedMarker.remove();
      }
      map.off('mousemove', onMapMouseMoveDebug);
      map.off('dblclick', onMapDoubleClickPolygon);
      map.doubleClickZoom.enable();
      map.off();
      map.remove();
    };
  }, []);

  return (
    <>
      <MapControls
        checkboxId={resolvedIds.checkbox}
        selectId={resolvedIds.select}
        createId={resolvedIds.create}
        clearId={resolvedIds.clear}
      />
      <MapCanvas id={resolvedIds.map} ref={mapRef} />
      <MapSidebar
        id={resolvedIds.sidebar}
        ref={sidebarRef}
        statusMessage={statusMessage}
        errorMessage={errorMessage}
        analysisItems={analysisItems}
        osmCategories={osmCategories}
      />
      <button id={resolvedIds.sidebarToggle} className="sidebar-toggle" type="button" />
    </>
  );
}
