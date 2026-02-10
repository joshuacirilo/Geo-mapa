// images
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';


// css
import 'leaflet/dist/leaflet.css';
import 'leaflet-sidebar/src/L.Control.Sidebar.css';

// js
import * as L from 'leaflet'
import 'leaflet-sidebar'

L.Icon.Default.mergeOptions({
    iconRetinaUrl,
    iconUrl,
    shadowUrl
});
