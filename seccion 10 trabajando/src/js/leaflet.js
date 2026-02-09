// images
import shadowImg from '../../node_modules/leaflet/dist/images/marker-shadow.png';
import markerImg from '../../node_modules/leaflet/dist/images/marker-icon.png';


// css
import '../../node_modules/leaflet/dist/leaflet.css';
import '../../node_modules/leaflet-sidebar/src/L.Control.Sidebar.css';

// js
import * as L from 'leaflet'
import 'leaflet-sidebar'

L.Marker.prototype.setIcon(
    L.icon({
        iconUrl: markerImg,
        shadowUrl: shadowImg
    })
);