"use client";

import { useEffect, useRef } from 'react';
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

    const setSidebarHtml = (html) => {
      if (sidebarControl && typeof sidebarControl.setContent === 'function') {
        sidebarControl.setContent(html);
        setSidebarVisible(true);
        return;
      }
      if (sidebarEl) {
        sidebarEl.innerHTML = html;
        setSidebarVisible(true);
      }
    };

    const setSidebarText = (text) => {
      if (sidebarControl && typeof sidebarControl.setContent === 'function') {
        sidebarControl.setContent(`<p>${text}</p>`);
        setSidebarVisible(true);
        return;
      }
      if (sidebarEl) {
        sidebarEl.textContent = text;
        setSidebarVisible(true);
      }
    };

    let latlngs = [];
    let polygon = null;
    let circle = null;
    let circleCenter = null;

    const onMapClickPolygon = (e) => {
      const punto = [e.latlng.lat, e.latlng.lng];
      latlngs.push(punto);

      if (!polygon) {
        polygon = L.polygon(latlngs, { color: 'red' }).addTo(map);
      } else {
        polygon.setLatLngs(latlngs);
      }
    };

    const onMapClickCircle = (e) => {
      if (!circleCenter) {
        circleCenter = e.latlng;

        if (circle) {
          map.removeLayer(circle);
        }

        circle = L.circle([circleCenter.lat, circleCenter.lng], { radius: 0 }).addTo(map);
        return;
      }

      const radio = circleCenter.distanceTo(e.latlng);
      circle.setRadius(radio);
      circleCenter = null;
      map.off('mousemove', onMapMoveCircle);
    };

    const onMapMoveCircle = (e) => {
      if (!circleCenter || !circle) {
        return;
      }

      const radio = circleCenter.distanceTo(e.latlng);
      circle.setRadius(radio);
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

    const evaluar = () => {
      const activo = checkbox?.checked;
      const modo = select?.value;

      map.off('click', onMapClickPolygon);
      map.off('click', onMapClickCircle);
      map.off('mousemove', onMapMoveCircle);

      if (!activo) {
        return;
      }

      if (modo === 'polygon') {
        map.on('click', onMapClickPolygon);
      }

      if (modo === 'circle') {
        map.on('click', onMapClickCircle);
        map.on('mousemove', onMapMoveCircle);
      }
    };

    const onCrear = () => {
      const value = select?.value;

      if (value === 'polygon') {
        if (!polygon || latlngs.length < 3) {
          setSidebarText('Poligono incompleto: agrega al menos 3 puntos.');
          return;
        }

        const geojson = polygon.toGeoJSON();
        setSidebarHtml(`<pre>${JSON.stringify(geojson, null, 2)}</pre>`);
        if (window.filtrarMarcadoresPorBounds) {
          window.filtrarMarcadoresPorBounds(polygon.getBounds());
        }
        return;
      }

      if (value === 'circle') {
        if (!circle || circleCenter) {
          setSidebarText('Circulo incompleto: define centro y radio con 2 clicks.');
          return;
        }

        const geojson = circle.toGeoJSON();
        geojson.properties = {
          ...geojson.properties,
          radius: circle.getRadius()
        };

        setSidebarHtml(`<pre>${JSON.stringify(geojson, null, 2)}</pre>`);
        if (window.filtrarMarcadoresPorBounds) {
          window.filtrarMarcadoresPorBounds(circle.getBounds());
        }
        return;
      }

      setSidebarText('Selecciona una figura para crear.');
    };

    const onLimpiar = () => {
      if (polygon) {
        map.removeLayer(polygon);
        polygon = null;
      }
      if (circle) {
        map.removeLayer(circle);
        circle = null;
      }
      circleCenter = null;
      map.off('mousemove', onMapMoveCircle);
      latlngs = [];
      if (window.resetFiltroMarcadores) {
        window.resetFiltroMarcadores();
      }
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
      if (fixedMarker) {
        fixedMarker.remove();
      }
      map.off('mousemove', onMapMouseMoveDebug);
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
      <MapSidebar id={resolvedIds.sidebar} ref={sidebarRef} />
      <button id={resolvedIds.sidebarToggle} className="sidebar-toggle" type="button" />
    </>
  );
}
