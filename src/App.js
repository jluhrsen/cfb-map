import React from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';
import { useMapEvents } from 'react-leaflet';

function App() {
  return (
      <div className="App">
        <h1>College Football Map</h1>
          <MapContainer
              center={[41.4179, -118.8771]}
              zoom={5.7}
              scrollWheelZoom={true}
              zoomSnap={0.15}
              zoomDelta={0.15}
              style={{ height: "90vh", width: "100%" }}
          >
          <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {/* <MapLogger /> */}
        </MapContainer>
      </div>
  );
}

function MapLogger() {
    useMapEvents({
        moveend: (e) => {
            const map = e.target;
            const center = map.getCenter();
            const zoom = map.getZoom();
            console.log(`Center: [${center.lat.toFixed(4)}, ${center.lng.toFixed(4)}], Zoom: ${zoom}`);
        }
    });
    return null;
}

export default App;
