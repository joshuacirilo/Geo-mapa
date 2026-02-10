"use client";

import { forwardRef } from 'react';

const MapSidebar = forwardRef(function MapSidebar(
  { id = 'sidebar', title = 'leaflet-sidebar', children },
  ref
) {
  return (
    <div id={id} ref={ref}>
      <h1>{title}</h1>
      {children ?? <p>actualmente no hay informacion</p>}
    </div>
  );
});

export default MapSidebar;
