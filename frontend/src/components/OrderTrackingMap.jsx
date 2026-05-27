import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// 🔄 This helper auto-pans and centers the camera on the rider dynamically
const RecenterMap = ({ coords }) => {
  const map = useMap();
  useEffect(() => {
    if (coords) {
      map.setView(coords, 16, { animate: true, duration: 1.5 }); // Smooth camera glide animation
    }
  }, [coords, map]);
  return null;
};

const OrderTrackingMap = ({ customerCoords, initialRiderCoords }) => {
  return (
    <MapContainer 
      center={initialRiderCoords} 
      zoom={16} 
      className="w-full h-full"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />
      
      {/* Recenter behavior hook */}
      <RecenterMap coords={initialRiderCoords} />

      {/* Rider Marker */}
      <Marker position={initialRiderCoords}>
        <Popup>🛵 Rider (You)</Popup>
      </Marker>

      {/* Customer Marker */}
      <Marker position={customerCoords}>
        <Popup>📍 Delivery Destination</Popup>
      </Marker>
    </MapContainer>
  );
};

export default OrderTrackingMap;