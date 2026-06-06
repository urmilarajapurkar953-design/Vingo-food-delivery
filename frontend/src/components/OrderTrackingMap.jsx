import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

// 🔄 Fixes the broken gray map tiles by forcing Leaflet to recalculate its parent dimensions
const ForceMapInvalidate = () => {
  const map = useMap();
  useEffect(() => {
    if (map) {
      setTimeout(() => {
        map.invalidateSize({ animate: true });
      }, 300); // Gives DOM an extra microsecond to mount fully
    }
  }, [map]);
  return null;
};

// 🔄 Smoothly pans/zooms the camera view bounds so BOTH the rider and customer are perfectly centered
const AutoPanPerspective = ({ riderCoords, customerCoords }) => {
  const map = useMap();
  useEffect(() => {
    if (riderCoords && customerCoords) {
      const bounds = L.latLngBounds([riderCoords, customerCoords]);
      // Fits the map viewing window dynamically over both coordinates with a 50px boundary padding
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15, animate: true, duration: 1.2 });
    }
  }, [riderCoords, customerCoords, map]);
  return null;
};

const OrderTrackingMap = ({ customerCoords, initialRiderCoords }) => {
  
  // 🎨 Clean custom map icons to replace standard broken generic markers
  const bikeIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3198/3198336.png', // Delivery bike icon
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -34]
  });

  const customerIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/1216/1216844.png', // Clear drop-off location pin
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -30]
  });

  // Safe checks to avoid crashing if coordinates array values drop out temporarily during loading states
  const validRiderPos = Array.isArray(initialRiderCoords) ? initialRiderCoords : [19.0760, 72.8777];
  const validCustomerPos = Array.isArray(customerCoords) ? customerCoords : [19.0820, 72.8888];

  return (
    <div className="w-full h-full relative min-h-[500px]">
      <MapContainer 
        center={validRiderPos} 
        zoom={14} 
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {/* Helper layout hooks */}
        <AutoPanPerspective riderCoords={validRiderPos} customerCoords={validCustomerPos} />
        <ForceMapInvalidate />

        {/* 🛵 Rider Marker */}
        <Marker position={validRiderPos} icon={bikeIcon}>
          <Popup>🛵 Your Delivery Executive is here</Popup>
        </Marker>

        {/* 📍 Customer Marker */}
        <Marker position={validCustomerPos} icon={customerIcon}>
          <Popup>📍 Delivery Destination Address</Popup>
        </Marker>

        {/* 🛣️ Real-time connecting path routing line */}
        <Polyline 
          positions={[validRiderPos, validCustomerPos]} 
          pathOptions={{ 
            color: '#f97316',       // Vibrant Orange route tracking color line
            weight: 4,              // Line thickness metric
            dashArray: '10, 10',    // Dashboard tracking dotted configuration
            lineCap: 'round',
            lineJoin: 'round'
          }} 
        />
      </MapContainer>
    </div>
  );
};

export default OrderTrackingMap;