"use client";

import { forwardRef } from 'react';
import { PieChart } from '@mui/x-charts/PieChart';
import { BarChart } from '@mui/x-charts/BarChart';
import { ScatterChart } from '@mui/x-charts/ScatterChart';

const MapSidebar = forwardRef(function MapSidebar(
  {
    id = 'sidebar',
    title = 'leaflet-sidebar',
    statusMessage = '',
    errorMessage = '',
    analysisItems = [],
    osmCategories = null,
    children
  },
  ref
) {
  const formatNumber = (value) =>
    Number(value ?? 0).toLocaleString('es-GT', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

  return (
    <div id={id} ref={ref} className="map-sidebar">
      <h1>{title}</h1>
      {children}
      {statusMessage ? <p>{statusMessage}</p> : null}
      {errorMessage ? <p>{errorMessage}</p> : null}
      {osmCategories ? (
        <article className="sidebar-analysis-card">
          <header className="analysis-card-header">
            <strong>Categorias rurales detectadas</strong>
          </header>
          <div className="osm-category-grid">
            {['landuse', 'natural', 'leisure', 'water'].map((group) => {
              const items = Array.isArray(osmCategories?.[group]) ? osmCategories[group] : [];
              if (items.length === 0) return null;
              return (
                <div key={group} className="osm-category-group">
                  <h5>{group}</h5>
                  <ul>
                    {items.slice(0, 8).map((entry) => (
                      <li key={`${group}-${entry.value}`}>
                        {entry.value} ({entry.count})
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </article>
      ) : null}
      {analysisItems.length > 0 ? (
        <div className="sidebar-analysis-list">
          <article className="sidebar-analysis-card">
            <header className="analysis-card-header">
              <strong>Comparacion entre figuras</strong>
            </header>
            <div className="sidebar-chart">
              <BarChart
                dataset={analysisItems.map((item) => ({
                  terreno: `Figura ${item.figureId}`,
                  vegetacion: Number(item.analysis?.vegetacion_pct ?? 0),
                  construccion: Number(item.analysis?.built_up_pct ?? 0)
                }))}
                xAxis={[{ scaleType: 'band', dataKey: 'terreno' }]}
                series={[
                  { dataKey: 'vegetacion', label: 'Vegetacion (%)', color: '#4caf50' },
                  { dataKey: 'construccion', label: 'Construccion (%)', color: '#757575' }
                ]}
                width={260}
                height={220}
              />
            </div>
          </article>
          <article className="sidebar-analysis-card">
            <header className="analysis-card-header">
              <strong>Tendencia (Dispersion)</strong>
            </header>
            <div className="sidebar-chart">
              <ScatterChart
                series={analysisItems.map((item) => ({
                  label: `Figura ${item.figureId}`,
                  color: item.color,
                  data: [
                    {
                      x: Number(item.analysis?.vegetacion_pct ?? 0),
                      y: Number(item.analysis?.built_up_pct ?? 0),
                      id: `Figura ${item.figureId}`
                    }
                  ]
                }))}
                xAxis={[{ label: 'Vegetacion (%)', min: 0, max: 100 }]}
                yAxis={[{ label: 'Construccion (%)', min: 0, max: 100 }]}
                width={260}
                height={220}
              />
            </div>
          </article>
          {analysisItems.map((item) => {
            const pieData = [
              { id: 0, value: item.analysis.vegetacion_pct ?? 0, label: 'Vegetacion', color: '#2E8B57' },
              { id: 1, value: item.analysis.built_up_pct ?? 0, label: 'Construccion', color: '#D9534F' },
              { id: 2, value: item.analysis.other_pct ?? 0, label: 'Otros', color: '#FFB347' }
            ];

            return (
              <article key={item.figureId} className="sidebar-analysis-card">
                <header className="analysis-card-header">
                  <span
                    className="analysis-color-dot"
                    style={{ backgroundColor: item.color }}
                    aria-hidden="true"
                  />
                  <strong>
                    Figura {item.figureId} ({item.shapeLabel})
                  </strong>
                </header>
                <p>
                  <strong>Area total (m2):</strong> {formatNumber(item.analysis.area_total_m2)}
                </p>
                <p>
                  <strong>Vegetacion (%):</strong> {formatNumber(item.analysis.vegetacion_pct)}
                </p>
                <p>
                  <strong>Construccion (%):</strong> {formatNumber(item.analysis.built_up_pct)}
                </p>
                <p>
                  <strong>Otros (%):</strong> {formatNumber(item.analysis.other_pct)}
                </p>
                {item.note ? (
                  <p>
                    <em>{item.note}</em>
                  </p>
                ) : null}
                <div className="sidebar-chart">
                  <PieChart
                    series={[
                      {
                        data: pieData,
                        innerRadius: 28,
                        outerRadius: 80,
                        paddingAngle: 3,
                        cornerRadius: 4
                      }
                    ]}
                    width={260}
                    height={190}
                  />
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <p>actualmente no hay informacion</p>
      )}
    </div>
  );
});

export default MapSidebar;
