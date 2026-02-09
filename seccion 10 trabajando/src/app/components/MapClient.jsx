"use client";

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet-sidebar';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

export default function MapClient() {
  const mapRef = useRef(null);
  const sidebarRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    L.Icon.Default.mergeOptions({
      iconRetinaUrl,
      iconUrl,
      shadowUrl
    });

    if (!mapRef.current || !sidebarRef.current) {
      return undefined;
    }

    const map = L.map(mapRef.current).setView([51.505, -0.09], 13);
    const sidebarControl = L.control.sidebar(sidebarRef.current);
    map.addControl(sidebarControl);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    const marker = L.marker([51.505, -0.09], { draggable: true }).addTo(map);

    marker.on('click', () => {
      sidebarControl.toggle();
    });

    marker.on('drag', () => {
      const { lat, lng } = marker.getLatLng();
      sidebarControl.setContent(`
        <h2>Informacion</h2>
        <p>Latitud: ${lat}</p>
        <p>Longitud: ${lng}</p>
      `);
    });

    const btn = document.querySelector('#crear');
    const select = document.querySelector('select');
    const checkbox = document.querySelector('#checkbox');
    const limpiar = document.querySelector('#limpiar');
    const sidebarEl = document.querySelector('#sidebar');

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
      marker.off();
      map.off();
      map.remove();
    };
  }, []);

  return (
    <>
      <div id="controls">
        <label className="control-item">
          <input type="checkbox" id="checkbox" />
          Activar dibujo
        </label>
        <select className="control-item" aria-label="Selecciona figura">
          <option value="">Selecciona figura</option>
          <option value="polygon">Poligono</option>
          <option value="circle">Circulo</option>
        </select>
        <button id="crear" className="control-item" type="button">
          Crear
        </button>
        <button id="limpiar" className="control-item" type="button">
          Limpiar
        </button>
      </div>

      <div id="map" ref={mapRef} />

      <div id="sidebar" ref={sidebarRef}>
        <h1>leaflet-sidebar</h1>
        <p>actualmente no hay informacion</p>
      </div>
    </>
  );
}
