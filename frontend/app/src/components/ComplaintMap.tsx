import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import type { Complaint } from '../types';
import { Badge } from './ui/Badge';

const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface ComplaintMapProps {
  complaints: Complaint[];
  center?: [number, number];
  zoom?: number;
  height?: string;
}

export const ComplaintMap: React.FC<ComplaintMapProps> = ({
  complaints,
  center = [12.97159, 77.59456],
  zoom = 12,
  height = "400px"
}) => {
  return (
    <div style={{ height }} className="w-full rounded-xl overflow-hidden shadow-sm border border-slate-200">
      <MapContainer center={center} zoom={zoom} scrollWheelZoom={false} className="w-full h-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {complaints.map((c) => (
          <Marker
            key={c.id}
            position={[c.latitude, c.longitude]}
            icon={defaultIcon}
          >
            <Popup>
              <div className="p-1 max-w-xs">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-bold text-slate-800 text-sm">#{c.id} {c.title}</span>
                </div>
                <p className="text-xs text-slate-600 mb-2">{c.address}</p>
                <div className="flex items-center justify-between text-xs">
                  <Badge variant={c.status.toLowerCase() as any}>{c.status}</Badge>
                  <span className="font-semibold text-rose-600">Severity: {c.severity}/10</span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};
