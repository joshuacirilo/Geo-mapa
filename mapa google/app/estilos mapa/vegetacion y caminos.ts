export const VEGETATION_LOCAL_STYLE = [
  { featureType: "landscape.man_made", elementType: "geometry.fill", stylers: [{ color: "#e9eef0" }] },

  { featureType: "landscape.natural", elementType: "geometry.fill", stylers: [{ color: "#2d5a27" }] },
  { featureType: "landscape.natural.landcover", elementType: "geometry.fill", stylers: [{ color: "#3a6b32" }] },
  { featureType: "landscape.natural.terrain", elementType: "geometry.fill", stylers: [{ color: "#2f5f2a" }] },

  { featureType: "poi.park", elementType: "geometry.fill", stylers: [{ color: "#4caf50" }, { saturation: 20 }, { lightness: -5 }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#1f3a22" }] },
  { featureType: "poi.park", elementType: "labels.text.stroke", stylers: [{ color: "#e9eef0" }, { weight: 3 }] },

  { featureType: "water", elementType: "geometry.fill", stylers: [{ color: "#17263c" }] },

  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#4a5563" }, { lightness: -5 }] },
  { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#3f4955" }, { lightness: -8 }] },
  { featureType: "road.local", elementType: "geometry", stylers: [{ color: "#38414e" }, { lightness: -10 }] },

  { featureType: "poi.business", stylers: [{ visibility: "on" }] },
  { featureType: "poi.medical", stylers: [{ visibility: "on" }] },
  { featureType: "poi.school", stylers: [{ visibility: "on" }] },
  { featureType: "transit", stylers: [{ visibility: "on" }] }
];