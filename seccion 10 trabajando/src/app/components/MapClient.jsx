"use client";

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet-sidebar';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
import MapCanvas from './MapCanvas';
import MapControls from './MapControls';
import MapSidebar from './MapSidebar';

const DEFAULT_IDS = {
  checkbox: 'checkbox',
  select: 'shape-select',
  create: 'crear',
  clear: 'limpiar',
  sidebar: 'sidebar',
  map: 'map'
};

export default function MapClient({ ids = {} } = {}) {
  const resolvedIds = { ...DEFAULT_IDS, ...ids };
  const mapRef = useRef(null);
  const sidebarRef = useRef(null);

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
      center: [14.607820, -90.513863],
      zoom: 7,
      //zoom control son los controles del mapa que tenemos a la derecha
      zoomControl: false,
      attributionControl: true,
      keyboard: true,
      minZoom: 7,
      maxZoom: 16,
      maxBounds: [[18.44834670293207, -88.04443359375001], [10.692996347925087, -92.98828125]]
    });
    const sidebarControl = L.control.sidebar(sidebarRef.current);
    map.addControl(sidebarControl);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    let markersLayer = null;

    const loadMarkers = async () => {
      try {
        const res = await fetch('/api/markers', { cache: 'no-store' });
        if (!res.ok) {
          return;
        }
        const featureCollection = await res.json();
        if (markersLayer) {
          markersLayer.remove();
        }
        markersLayer = L.geoJSON(featureCollection, {
          onEachFeature: (_feature, layer) => {
            const title = _feature?.properties?.title ?? 'Sin titulo';
            layer.bindPopup(title);
          }
        }).addTo(map);
      } catch (error) {
        console.error('Error cargando markers', error);
      }
    };

    loadMarkers();

    const btn = document.querySelector(`#${resolvedIds.create}`);
    const select = document.querySelector(`#${resolvedIds.select}`);
    const checkbox = document.querySelector(`#${resolvedIds.checkbox}`);
    const limpiar = document.querySelector(`#${resolvedIds.clear}`);
    const sidebarEl = document.querySelector(`#${resolvedIds.sidebar}`);

    const setSidebarHtml = (html) => {
      if (sidebarControl && typeof sidebarControl.setContent === 'function') {
        sidebarControl.setContent(html);
        if (typeof sidebarControl.show === 'function') {
          sidebarControl.show();
        }
        return;
      }
      if (sidebarEl) {
        sidebarEl.innerHTML = html;
      }
    };

    const setSidebarText = (text) => {
      if (sidebarControl && typeof sidebarControl.setContent === 'function') {
        sidebarControl.setContent(`<p>${text}</p>`);
        if (typeof sidebarControl.show === 'function') {
          sidebarControl.show();
        }
        return;
      }
      if (sidebarEl) {
        sidebarEl.textContent = text;
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

    return () => {
      btn?.removeEventListener('click', onCrear);
      limpiar?.removeEventListener('click', onLimpiar);
      select?.removeEventListener('change', evaluar);
      checkbox?.removeEventListener('change', evaluar);
      if (markersLayer) {
        markersLayer.remove();
      }
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
    </>
  );
}
