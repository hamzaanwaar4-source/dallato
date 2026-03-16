"use client"

import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { useState, useEffect, useCallback } from "react"
import { Plus, Minus } from "lucide-react"

interface HeatMapDataPoint {
  name: string
  country?: string
  coordinates: [number, number]
  value: number
}

interface SatelliteMapProps {
  data?: HeatMapDataPoint[]
}

function MapController({ isFullscreen, data }: { isFullscreen: boolean, data: HeatMapDataPoint[] }) {
  const map = useMap();
  
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
      if (data.length > 0) {
        const bounds = L.latLngBounds(data.map(p => [p.coordinates[1], p.coordinates[0]]));
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: isFullscreen ? 5 : 2 });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [isFullscreen, map, data]);

  return null;
}

export default function SatelliteMap({ data = [] }: SatelliteMapProps) {
  const [hoveredMarker, setHoveredMarker] = useState<HeatMapDataPoint | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);

  const displayData = data && data.length > 0 ? data : [];
  const maxVal = displayData.length > 0 ? Math.max(...displayData.map(d => d.value), 1) : 1;
  
  const createCustomIcon = useCallback((point: HeatMapDataPoint) => {
    const getRadius = (val: number) => {
      const minRadius = 12;
      const maxRadius = 30;
      return minRadius + (val / maxVal) * (maxRadius - minRadius);
    };
    const radius = getRadius(point.value);
    return L.divIcon({
      html: `
        <div class="relative flex items-center justify-center group">
          <div class="absolute rounded-full bg-blue-500/50 border-2 border-blue-400 transition-all duration-300 group-hover:bg-blue-400/70" 
               style="width: ${radius * 2}px; height: ${radius * 2}px;"></div>
          <span class="relative z-10 text-white font-black text-[10px] pointer-events-none" style="font-family: Inter;">${point.value}</span>
          <div class="absolute top-full mt-1 whitespace-nowrap text-[10px] font-semibold text-[#cbd5e1] pointer-events-none" 
               style="font-family: Inter; text-shadow: 0px 1px 2px rgba(0,0,0,0.8)">${point.name}</div>
        </div>
      `,
      className: "custom-div-icon",
      iconSize: [radius * 2, radius * 2],
      iconAnchor: [radius, radius],
    });
  }, [maxVal]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleZoomIn = () => {
    if (mapInstance) mapInstance.zoomIn();
  };

  const handleZoomOut = () => {
    if (mapInstance) mapInstance.zoomOut();
  };

  return (
    <div className={`relative transition-all duration-300 ease-in-out ${isFullscreen ? 'fixed inset-0 bg-slate-900 w-screen h-screen' : 'h-full w-full min-h-[350px]'}`}>
      <MapContainer
        center={[20, 0]}
        zoom={2}
        minZoom={2}
        maxZoom={12}
        style={{ height: "100%", width: "100%", background: "#1e293b" }}
        scrollWheelZoom={true}
        attributionControl={false}
        zoomControl={false}
        ref={setMapInstance}
      >
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
        />
        
        <MapController isFullscreen={isFullscreen} data={displayData} />

        {displayData.map((point, idx) => (
          <Marker
            key={`${point.name}-${idx}`}
            position={[point.coordinates[1], point.coordinates[0]]}
            icon={createCustomIcon(point)}
            eventHandlers={{
              mouseover: () => setHoveredMarker(point),
              mouseout: () => setHoveredMarker(null),
            }}
          />
        ))}
      </MapContainer>
      
      {/* Control Buttons */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
        {/* <button
          onClick={toggleFullscreen}
          className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg backdrop-blur-md border border-white/30 transition-all flex items-center justify-center shadow-xl cursor-pointer"
          title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          style={{ width: "36px", height: "36px" }}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button> */}

        <div className="flex flex-col gap-2">
          <button
            onClick={handleZoomIn}
            className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg backdrop-blur-md border border-white/30 transition-all flex items-center justify-center shadow-xl cursor-pointer"
            style={{ width: "36px", height: "36px" }}
            title="Zoom In"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg backdrop-blur-md border border-white/30 transition-all flex items-center justify-center shadow-xl cursor-pointer"
            style={{ width: "36px", height: "36px" }}
            title="Zoom Out"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Tooltip */}
      {hoveredMarker && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-[2000]">
          <div className="bg-white text-slate-900 px-4 py-2 rounded-xl shadow-2xl border border-slate-200 min-w-[150px]">
            <div className="flex justify-between items-start mb-1">
              <div>
                <p className="text-xs font-bold text-blue-600 leading-none">{hoveredMarker.name}</p>
                {hoveredMarker.country && <p className="text-[9px] text-slate-400 mt-0.5">{hoveredMarker.country}</p>}
              </div>
            </div>
            <div className="flex items-center justify-between gap-4 pt-1 border-t border-slate-100">
              <span className="text-[10px] text-slate-500">Booked Trips:</span>
              <span className="text-sm font-black">{hoveredMarker.value}</span>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 right-4 z-[1000] bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center gap-4 text-[10px] text-gray-600 shadow-sm pointer-events-none">
        <div className="flex items-center gap-1.5">
          <span className="text-gray-500 font-medium">Volume:</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-blue-400/50 border border-blue-400" />
          <span>Low</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-full bg-blue-600/50 border border-blue-600" />
          <span>High</span>
        </div>
      </div>
    </div>
  )
}