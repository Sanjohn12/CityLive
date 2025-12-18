import React, { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  GeoJSON,
  useMapEvents,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import "../styles/markercluster.css";

import georaster from "georaster";
import GeoRasterLayer from "georaster-layer-for-leaflet";
import geoblaze from "geoblaze";
import * as turf from "@turf/turf";
import axios from "axios";
import Sidebar from "./SideBar";

const ORS_API_KEY = import.meta.env.VITE_ORS_API_KEY;

const categoryColors = {
  "Food & Dai": "#3b82f6",
  "Civic & Se": "#10b981",
  Mobility: "#f59e0b",
  Recreation: "#8b5cf6",
  Health: "#ef4444",
  Education: "#f97316",
  Other: "#6b7280",
};

/**
 * GLOBAL ACCESSIBILITY LEGEND
 * Consistent range from 0.00 to 0.87
 */
function DensityLegend({ visible }) {
  if (!visible) return null;
  const steps = [
    { color: "#ff4500", label: "0.70 - 0.87 (Peak)" },
    { color: "#fde725", label: "0.56 - 0.70 (High)" },
    { color: "#5ec962", label: "0.42 - 0.56 (Med)" },
    { color: "#21918c", label: "0.28 - 0.42 (Low-Med)" },
    { color: "#3b528b", label: "0.14 - 0.28 (Low)" },
    { color: "#440154", label: "0.00 - 0.14 (V. Low)" },
  ];
  return (
    <div
      style={{
        position: "absolute",
        bottom: "30px",
        left: "20px",
        zIndex: 1000,
        backgroundColor: "white",
        padding: "12px",
        borderRadius: "8px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
        fontSize: "11px",
        width: "165px",
      }}
    >
      <div style={{ fontWeight: "bold", marginBottom: "8px", color: "#333" }}>
        Service Density
      </div>
      {steps.map((step, i) => (
        <div
          key={i}
          style={{ display: "flex", alignItems: "center", marginBottom: "4px" }}
        >
          <div
            style={{
              width: "12px",
              height: "12px",
              backgroundColor: step.color,
              marginRight: "8px",
              borderRadius: "2px",
            }}
          />
          <span style={{ color: "#666" }}>{step.label}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * MASKED GLOBAL RASTER LAYER
 * Uses the same global color break-points as before
 */
function RasterLayer({ data, visible }) {
  const map = useMap();
  useEffect(() => {
    if (!data || !map || !visible) return;
    const layer = new GeoRasterLayer({
      georaster: data,
      opacity: 0.8,
      pixelValuesToColorFn: (values) => {
        const val = values[0];
        if (val < 0.001 || isNaN(val)) return "transparent";
        // Fixed Global Breakpoints
        if (val < 0.14) return "#440154";
        if (val < 0.28) return "#3b528b";
        if (val < 0.42) return "#21918c";
        if (val < 0.56) return "#5ec962";
        if (val < 0.7) return "#fde725";
        return "#ff4500";
      },
      resolution: 128,
    });
    layer.addTo(map);
    return () => {
      if (map && layer) map.removeLayer(layer);
    };
  }, [data, map, visible]);
  return null;
}

function MapClickHandler({ onIsochrone, travelMode, travelTime }) {
  useMapEvents({
    click: async (e) => {
      const coords = [e.latlng.lng, e.latlng.lat];
      try {
        const res = await axios.post(
          `https://api.openrouteservice.org/v2/isochrones/${travelMode}`,
          { locations: [coords], range: [travelTime] },
          {
            headers: {
              Authorization: ORS_API_KEY,
              "Content-Type": "application/json",
            },
          }
        );
        onIsochrone(res.data.features[0].geometry);
      } catch (err) {
        onIsochrone(turf.circle(coords, 0.5, { units: "kilometers" }).geometry);
      }
    },
  });
  return null;
}

export default function MapView() {
  const [servicePoints, setServicePoints] = useState(null);
  const [fullKdeRaster, setFullKdeRaster] = useState(null);
  const [displayRaster, setDisplayRaster] = useState(null);
  const [isochrone, setIsochrone] = useState(null);
  const [showKde, setShowKde] = useState(false);
  const [serviceCount, setServiceCount] = useState(0);
  const [accessibilityScore, setAccessibilityScore] = useState(null);
  const [serviceDistribution, setServiceDistribution] = useState({});
  const [travelMode, setTravelMode] = useState("driving-car");
  const [travelTime, setTravelTime] = useState(900);

  useEffect(() => {
    fetch("/data/kde.tif")
      .then((res) => res.arrayBuffer())
      .then(georaster)
      .then(setFullKdeRaster);
    fetch(
      "https://chimerical-florentine-1073f6.netlify.app/service_points.geojson"
    )
      .then((res) => res.json())
      .then(setServicePoints);
  }, []);

  useEffect(() => {
    if (!fullKdeRaster) return;

    if (!isochrone) {
      setDisplayRaster(fullKdeRaster);
      return;
    }

    // Clipping Logic (No Local Normalization)
    try {
      const clipped = geoblaze.clip(fullKdeRaster, isochrone);
      setDisplayRaster(clipped);
    } catch (e) {
      setDisplayRaster(fullKdeRaster);
    }

    const polygon = turf.feature(isochrone);
    const ptsWithin = turf.pointsWithinPolygon(
      turf.featureCollection(servicePoints.features),
      polygon
    );

    let totalWeight = 0;
    const distribution = {};
    const uniqueCategories = new Set();

    ptsWithin.features.forEach((f) => {
      const w = f.properties.Weight || 1;
      totalWeight += w;
      const type = f.properties.Category || "Other";
      distribution[type] = (distribution[type] || 0) + w;
      uniqueCategories.add(type);
    });

    let avgKDE = 0;
    try {
      const stats = geoblaze.mean(fullKdeRaster, polygon);
      avgKDE = stats ? stats[0] : 0;
    } catch {
      avgKDE = 0;
    }

    const densityComp = Math.sqrt(Math.min(avgKDE / 0.87, 1)) * 40;
    const quantityComp = Math.min(15 * Math.log10(totalWeight + 1), 30);
    const diversityComp = Math.min((uniqueCategories.size / 7) * 30, 30);
    const timeFactor = Math.max(0.5, 1 - travelTime / 7200);

    setAccessibilityScore(
      Number(
        Math.min(
          (densityComp + quantityComp + diversityComp) * timeFactor,
          100
        ).toFixed(1)
      )
    );
    setServiceCount(totalWeight);
    setServiceDistribution(distribution);
  }, [isochrone, servicePoints, fullKdeRaster, travelTime]);

  const handleReset = () => {
    setIsochrone(null);
    setDisplayRaster(fullKdeRaster);
    setAccessibilityScore(null);
  };

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
      }}
    >
      <div style={{ flex: 1, position: "relative" }}>
        <DensityLegend visible={showKde} />
        <MapContainer
          center={[51.0637, 13.7409]}
          zoom={15}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
          <RasterLayer
            key={isochrone ? "clp" : "full"}
            data={displayRaster}
            visible={showKde}
          />
          <MarkerClusterGroup>
            {servicePoints?.features.map((f, idx) => (
              <Marker
                key={idx}
                position={[
                  f.geometry.coordinates[1],
                  f.geometry.coordinates[0],
                ]}
                icon={L.divIcon({
                  className: "custom-marker",
                  html: `<div style="background-color:${
                    categoryColors[f.properties.Category] || "#6b7280"
                  }; width:12px; height:12px; border-radius:50%; border:2px solid white;"></div>`,
                })}
              >
                <Popup>
                  <strong>{f.properties.Name}</strong>
                  <br />
                  {f.properties.Category}
                </Popup>
              </Marker>
            ))}
          </MarkerClusterGroup>
          {isochrone && (
            <GeoJSON
              key={JSON.stringify(isochrone)}
              data={isochrone}
              style={{
                color: "#1e293b",
                weight: 2,
                fillOpacity: 0.05,
                dashArray: "5, 5",
              }}
            />
          )}
          <MapClickHandler
            onIsochrone={setIsochrone}
            travelMode={travelMode}
            travelTime={travelTime}
          />
        </MapContainer>
      </div>
      <Sidebar
        accessibilityScore={accessibilityScore}
        serviceCounts={serviceCount}
        serviceDistribution={serviceDistribution}
        categoryColors={categoryColors}
        isKdeVisible={showKde}
        onToggleKdePalette={() => setShowKde(!showKde)}
        travelMode={travelMode}
        setTravelMode={setTravelMode}
        travelTime={travelTime}
        setTravelTime={setTravelTime}
        onReset={handleReset}
        isIsochroneActive={!!isochrone}
      />
    </div>
  );
}
