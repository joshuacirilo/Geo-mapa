"use client";

import { forwardRef } from 'react';

const MapCanvas = forwardRef(function MapCanvas({ id = 'map', ...rest }, ref) {
  return <div id={id} ref={ref} {...rest} />;
});

export default MapCanvas;
