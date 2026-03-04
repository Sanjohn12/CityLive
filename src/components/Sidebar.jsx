import React, { useState, useEffect } from "react";
import AccessibilityGraph from "./AccessibilityGraph";
import axios from "axios";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-2.5-flash-lite";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

// --- PROVINCE LIST ---
const PROVINCES = [
  "Baden-Württemberg",
  "Bayern",
  "Berlin",
  "Brandenburg",
  "Bremen",
  "Hamburg",
  "Hessen",
  "Mecklenburg-Vorpommern",
  "Niedersachsen",
  "Nordrhein-Westfalen",
  "Rheinland-Pfalz",
  "Saarland",
  "Sachsen",
  "Sachsen-Anhalt",
  "Schleswig-Holstein",
  "Thüringen",
];

function ServiceCategory({ name, data, color, isCustomMode, customWeight, onWeightChange }) {
  const [expanded, setExpanded] = useState(false);
  const handleToggle = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    setExpanded(!expanded);
  };

  return (
    <div
      style={{
        marginBottom: "8px",
        border: "1px solid #f1f5f9",
        borderRadius: "8px",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        onClick={handleToggle}
        style={{
          display: "flex",
          alignItems: "center",
          padding: "10px",
          background: "#f8fafc",
          cursor: "pointer",
        }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            backgroundColor: color,
            marginRight: "12px",
            boxShadow: `0 0 10px ${color}66`,
          }}
        />
        <div
          style={{
            flex: 1,
            fontSize: "0.8rem",
            fontWeight: "bold",
            textTransform: "capitalize",
          }}
        >
          {data.total} {name}
        </div>
        <div
          style={{
            fontSize: "0.65rem",
            color: "#6366f1",
            background: "#e0e7ff",
            padding: "2px 6px",
            borderRadius: "4px",
            display: "flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          Wt: {isCustomMode ? (customWeight || data.major_wt || 1) : (data.major_wt || 0)}
        </div>
        <span style={{ marginLeft: "10px", fontSize: "0.7rem" }}>
          {expanded ? "▲" : "▼"}
        </span>
      </div>
      {expanded && (
        <div style={{ padding: "8px 10px", background: "#fff", display: "flex", flexDirection: "column", gap: "8px" }}>
          {isCustomMode && (
            <div style={{ padding: "8px", background: "#f8fafc", borderRadius: "6px", marginBottom: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", fontWeight: "bold", marginBottom: "5px" }}>
                <span>Custom Major Weight</span>
                <span style={{ color: "#6366f1" }}>{customWeight || data.major_wt || 1}</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={customWeight || data.major_wt || 1}
                onChange={(e) => onWeightChange(name, Number(e.target.value))}
                style={{ width: "100%", accentColor: "#6366f1" }}
              />
            </div>
          )}
          {Object.entries(data.subs || {}).map(([subName, subData]) => (
            <div
              key={subName}
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "0.7rem",
                padding: "4px 0",
                borderBottom: "1px solid #f8fafc",
              }}
            >
              <span style={{ color: "#475569" }}>{subName}</span>
              <div style={{ display: "flex", gap: "12px" }}>
                <span style={{ color: "#94a3b8" }}>
                  Wt:{" "}
                  <b style={{ color: "#6366f1" }}>{subData.weight || 0}</b>
                </span>
                <span style={{ fontWeight: "700" }}>{subData.count}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function HeatmapLegend() {
  const gradient =
    "linear-gradient(to right, #3b0f70, #1f6ae1, #52c569, #f4e61e, #d62828)";
  return (
    <div
      style={{
        padding: "12px",
        background: "#f8fafc",
        borderRadius: "8px",
        border: "1px solid #e2e8f0",
        marginBottom: "15px",
      }}
    >
      <div
        style={{
          fontSize: "0.65rem",
          fontWeight: "800",
          color: "#475569",
          marginBottom: "8px",
          letterSpacing: "0.05em",
        }}
      >
        DENSITY GRADIENT
      </div>
      <div
        style={{
          height: "10px",
          width: "100%",
          background: gradient,
          borderRadius: "4px",
          marginBottom: "5px",
        }}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "0.6rem",
          color: "#64748b",
          fontWeight: "bold",
        }}
      >
        <span>LOW</span>
        <span>PEAK</span>
      </div>
    </div>
  );
}

const formatReviewText = (text) => {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} style={{ color: "#0f172a", fontWeight: "bold" }}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
};

function RankCard({ rank, result, categoryColors }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isWinner = rank === 0;
  return (
    <div
      className="premium-card"
      onClick={() => setIsExpanded(!isExpanded)}
      style={{
        padding: "16px",
        border: isWinner ? "2px solid #10b981" : "1px solid #e2e8f0",
        borderRadius: "14px",
        marginBottom: "12px",
        background: isWinner ? "#f0fdf4" : "#fff",
        cursor: "pointer",
        boxShadow: isWinner ? "0 4px 12px rgba(16, 185, 129, 0.1)" : "0 2px 4px rgba(0,0,0,0.02)",
        transition: "all 0.3s ease",
      }}
    >
      {isWinner && (
        <div style={{ marginBottom: "8px", display: "flex", justifyContent: "flex-end" }}>
          <span className="winner-badge">🏆 TOP CHOICE</span>
        </div>
      )}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div style={{ fontSize: "0.7rem", fontWeight: "bold" }}>
            #{rank + 1} ({result.score}%)
          </div>
          <div style={{ fontSize: "0.7rem", color: "#64748b" }}>
            {result.coords.lat.toFixed(3)}, {result.coords.lng.toFixed(3)}
          </div>
        </div>
        <div style={{ fontSize: "9px", color: "#64748b", fontWeight: "bold" }}>
          {isExpanded ? "▲ CLOSE" : "▼ DETAILS"}
        </div>
      </div>
      {isExpanded && (
        <div
          style={{
            marginTop: "12px",
            paddingTop: "10px",
            borderTop: "1px solid #e2e8f0",
          }}
        >
          {Object.entries(result.dist || {}).map(([cat, data]) => (
            <ServiceCategory
              key={cat}
              name={cat}
              data={data}
              color={categoryColors[cat.toLowerCase()] || "#94a3b8"}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SideBar({
  accessibilityScore,
  serviceDistribution,
  categoryColors,
  onToggleKdePalette,
  isKdeVisible,
  showGrid,
  onToggleGrid,
  showProvinceBoundaries,
  onToggleBoundaries,
  travelMode,
  setTravelMode,
  rangeValue,
  setRangeValue,
  onReset,
  isIsochroneActive,
  isBatchMode,
  setIsBatchMode,
  batchResults,
  onBatchRun,
  selectedProvince,
  setSelectedProvince,
  isLoadingProvince,
  onAiRecommendations,
  onPersonaUpdate,
  areaPersona,
  markerPos,
  customWeights,
  isCustomWeightMode,
  setIsCustomWeightMode,
  onWeightChange,
}) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [coords, setCoords] = useState("");
  const [aiReview, setAiReview] = useState("");
  const [batchAiReview, setBatchAiReview] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isBatchAiLoading, setIsBatchAiLoading] = useState(false);

  const callGemini = async (messages) => {
    const response = await axios.post(
      GEMINI_URL,
      {
        contents: messages.map(m => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }]
        }))
      },
      { headers: { "Content-Type": "application/json" } }
    );
    return response.data.candidates[0].content.parts[0].text;
  };

  useEffect(() => {
    const fetchAiInsight = async () => {
      if (markerPos && !isBatchMode) {
        setIsAiLoading(true);
        setAiReview(""); // Clear previous review
        try {
          const categories = Object.entries(serviceDistribution)
            .map(([name, data]) => `${name}: ${data.total} services`)
            .join(", ");

          const prompt = `You are a professional Urban Planner. Analyze this 15-minute city accessibility data for coordinates [${markerPos.lat}, ${markerPos.lng}]:
          - Accessibility Score: ${accessibilityScore}%
          - Service Distribution: ${categories}
          
          1. Provide a concise analysis (max 3 sentences) of livability. 
          2. Identify the 'Most Suitable Persona' (e.g. Young Families, Students, Professionals, Retirees).
          3. Suggest 2 infrastructure improvements.

          IMPORTANT: Return the data as a JSON block at the end like this:
          JSON_START
          {
            "persona": "Persona Name",
            "persona_reason": "One sentence why",
            "recommendations": [{"lat": L1, "lng": G1, "type": "Type", "reason": "Reason"}]
          }
          JSON_END
          Use markdown bolding for the text analysis.`;

          const content = await callGemini([{ role: "user", content: prompt }]);

          const jsonMatch = content.match(/JSON_START([\s\S]*?)JSON_END/);
          let cleanText = content.replace(/JSON_START[\s\S]*?JSON_END/, "").trim();

          setAiReview(cleanText);

          if (jsonMatch) {
            try {
              const data = JSON.parse(jsonMatch[1]);
              if (data.recommendations) onAiRecommendations(data.recommendations);
              if (data.persona && onPersonaUpdate) {
                onPersonaUpdate({
                  name: data.persona,
                  reason: data.persona_reason,
                  lat: markerPos.lat,
                  lng: markerPos.lng
                });
              }
            } catch (e) {
              console.error("Failed to parse AI data", e);
            }
          }
        } catch (error) {
          console.error("AI Insight Error:", error);
          setAiReview("⚠️ AI Error: Failed to analyze area.");
        } finally {
          setIsAiLoading(false);
        }
      }
    };

    const timer = setTimeout(fetchAiInsight, 1000);
    return () => clearTimeout(timer);
  }, [accessibilityScore, serviceDistribution, isBatchMode, markerPos]);

  useEffect(() => {
    const fetchBatchAiInsight = async () => {
      if (isBatchMode && batchResults.length > 0) {
        setIsBatchAiLoading(true);
        setBatchAiReview("");
        try {
          const locationData = batchResults.map((r, i) =>
            `Location #${i + 1}: Score ${r.score}%, Coords [${r.coords.lat.toFixed(4)}, ${r.coords.lng.toFixed(4)}]`
          ).join("\n");

          const prompt = `You are a professional Urban Planner. Analyze and compare these ${batchResults.length} locations for a 15-minute city development:
          ${locationData}
          
          1. Provide a concise comparison of these spots.
          2. Explicitly recommend which one is the BEST choice for development.
          3. Explain the primary urban planning reason for this choice.
          
          Use markdown bolding for the analysis. Keep it professional and premium.`;

          const content = await callGemini([{ role: "user", content: prompt }]);
          setBatchAiReview(content);
        } catch (error) {
          console.error("Batch AI Error:", error);
          setBatchAiReview("⚠️ Failed to generate comparative analysis.");
        } finally {
          setIsBatchAiLoading(false);
        }
      }
    };

    const timer = setTimeout(fetchBatchAiInsight, 1500);
    return () => clearTimeout(timer);
  }, [isBatchMode, batchResults]);

  return (
    <>
      <style>{`
        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .premium-card {
          animation: slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .insight-box {
          animation: slideUpFade 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .winner-badge {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          padding: 2px 8px;
          border-radius: 20px;
          font-size: 0.6rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);
        }
      `}</style>
      <div
        className="glass-sidebar"
        style={{
          width: 360,
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <div
          style={{
            padding: "15px",
            background: "#0f172a",
            color: "#fff",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <b style={{ fontSize: "0.8rem", letterSpacing: "1px" }}>
            CITY ANALYST v2.0
          </b>
          {isIsochroneActive && (
            <button
              onClick={onReset}
              style={{
                background: "#ef4444",
                color: "#fff",
                border: "none",
                fontSize: "0.6rem",
                padding: "4px 8px",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              RESET
            </button>
          )}
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "15px" }}>
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                fontSize: "0.65rem",
                fontWeight: "bold",
                color: "#64748b",
                display: "block",
                marginBottom: "5px",
              }}
            >
              SELECT GERMAN PROVINCE
            </label>
            <div style={{ position: "relative" }}>
              <select
                value={selectedProvince}
                onChange={(e) => setSelectedProvince(e.target.value)}
                disabled={isLoadingProvince}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "2px solid #e2e8f0",
                  fontSize: "0.85rem",
                  appearance: "none",
                  cursor: "pointer",
                  background: isLoadingProvince ? "#f1f5f9" : "#fff",
                }}
              >
                {PROVINCES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              {isLoadingProvince && (
                <div
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: "0.7rem",
                    color: "#3b82f6",
                    fontWeight: "bold",
                  }}
                >
                  LOADING...
                </div>
              )}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              background: "#f1f5f9",
              borderRadius: "8px",
              padding: "3px",
              marginBottom: "15px",
            }}
          >
            <button
              onClick={() => setIsBatchMode(false)}
              style={{
                flex: 1,
                padding: "8px",
                border: "none",
                borderRadius: "6px",
                background: !isBatchMode ? "#fff" : "transparent",
                fontSize: "0.75rem",
                fontWeight: "bold",
                cursor: "pointer",
                boxShadow: !isBatchMode ? "0 2px 4px rgba(0,0,0,0.05)" : "none",
              }}
            >
              Single Point
            </button>
            <button
              onClick={() => setIsBatchMode(true)}
              style={{
                flex: 1,
                padding: "8px",
                border: "none",
                borderRadius: "6px",
                background: isBatchMode ? "#fff" : "transparent",
                fontSize: "0.75rem",
                fontWeight: "bold",
                cursor: "pointer",
                boxShadow: isBatchMode ? "0 2px 4px rgba(0,0,0,0.05)" : "none",
              }}
            >
              Batch Rank
            </button>
          </div>

          {isKdeVisible && <HeatmapLegend />}

          {isIsochroneActive && !isBatchMode && (
            <div
              className="insight-box"
              style={{
                background: "#f8fafc",
                padding: "16px",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                marginBottom: "20px",
                minHeight: "100px",
                position: "relative",
              }}
            >
              <div
                style={{
                  fontSize: "0.7rem",
                  fontWeight: "800",
                  color: "#6366f1",
                  marginBottom: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                {isAiLoading && <div className="map-loader" style={{ width: 12, height: 12 }}></div>}
                🤖 STRATEGIST INSIGHT {isAiLoading && "(ANALYZING...)"}
              </div>

              {!isAiLoading && areaPersona && (
                <div
                  style={{
                    background: "#f0fdf4",
                    border: "1px solid #dcfce7",
                    padding: "12px",
                    borderRadius: "10px",
                    marginBottom: "12px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "2px",
                    boxShadow: "0 2px 6px rgba(16, 185, 129, 0.05)"
                  }}
                >
                  <span style={{ fontSize: "0.6rem", color: "#16a34a", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.5px" }}>Ideal Demographic</span>
                  <span style={{ fontSize: "1rem", fontWeight: "800", color: "#065f46" }}>✨ {areaPersona.name}</span>
                  <span style={{ fontSize: "0.75rem", color: "#166534", lineHeight: "1.3" }}>{areaPersona.reason}</span>
                </div>
              )}

              <div
                style={{
                  fontSize: "0.8rem",
                  color: "#475569",
                  lineHeight: "1.6",
                  whiteSpace: "pre-line",
                  opacity: isAiLoading ? 0.5 : 1,
                  transition: "opacity 0.3s ease",
                }}
              >
                {isAiLoading ? "Processing urban spatial data..." : (formatReviewText(aiReview) || "Click on the map to see urban analysis.")}
              </div>
            </div>
          )}

          {isIsochroneActive && isBatchMode && (
            <div
              className="insight-box"
              style={{
                background: "#eff6ff",
                padding: "16px",
                borderRadius: "12px",
                border: "1px solid #dbeafe",
                marginBottom: "20px",
                minHeight: "100px",
              }}
            >
              <div
                style={{
                  fontSize: "0.7rem",
                  fontWeight: "800",
                  color: "#2563eb",
                  marginBottom: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                {isBatchAiLoading && <div className="map-loader" style={{ width: 12, height: 12 }}></div>}
                🔍 BATCH COMPARISON {isBatchAiLoading && "(COMPARING...)"}
              </div>
              <div
                style={{
                  fontSize: "0.8rem",
                  color: "#1e40af",
                  lineHeight: "1.6",
                  whiteSpace: "pre-line",
                  opacity: isBatchAiLoading ? 0.5 : 1,
                  transition: "opacity 0.3s ease",
                }}
              >
                {isBatchAiLoading ? "Analyzing development suitability..." : (formatReviewText(batchAiReview) || "Comparing locations to find the best choice.")}
              </div>
            </div>
          )}

          <div
            style={{
              background: "#f8fafc",
              padding: "12px",
              borderRadius: "10px",
              border: "1px solid #e2e8f0",
              marginBottom: "15px",
            }}
          >
            {!isBatchMode ? (
              <select
                value={travelMode}
                onChange={(e) => setTravelMode(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px",
                  marginBottom: "10px",
                  borderRadius: "5px",
                  border: "1px solid #cbd5e1",
                }}
              >
                <option value="foot-walking">🚶 Walking</option>
                <option value="cycling-regular">🚲 Cycling</option>
                <option value="driving-car">🚗 Driving</option>
              </select>
            ) : (
              <textarea
                value={coords}
                onChange={(e) => setCoords(e.target.value)}
                placeholder="52.52, 13.40; 52.51, 13.38"
                style={{
                  width: "100%",
                  height: "60px",
                  padding: "8px",
                  fontSize: "0.7rem",
                  marginBottom: "10px",
                  border: "1px solid #cbd5e1",
                  borderRadius: "5px",
                  resize: "none",
                }}
              />
            )}
            <label
              style={{
                fontSize: "0.65rem",
                fontWeight: "bold",
                color: "#64748b",
              }}
            >
              {isBatchMode ? "SEARCH RADIUS" : "TRAVEL TIME"}
            </label>
            <input
              type="range"
              min={300}
              max={5000}
              step={300}
              value={rangeValue}
              onChange={(e) => setRangeValue(Number(e.target.value))}
              style={{ width: "100%", accentColor: "#3b82f6" }}
            />
            <div
              style={{
                textAlign: "right",
                fontSize: "0.7rem",
                color: "#3b82f6",
                fontWeight: "bold",
              }}
            >
              {isBatchMode
                ? `${(rangeValue / 1000).toFixed(1)} km`
                : `${rangeValue / 60} min`}
            </div>
            {isBatchMode && (
              <button
                onClick={() => onBatchRun(coords)}
                style={{
                  width: "100%",
                  background: "#3b82f6",
                  color: "#fff",
                  padding: "10px",
                  border: "none",
                  borderRadius: "8px",
                  marginTop: "10px",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                RUN BATCH RANKING
              </button>
            )}
          </div>

          {!isBatchMode
            ? isIsochroneActive && (
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: "0.65rem",
                    fontWeight: "bold",
                    color: "#94a3b8",
                  }}
                >
                  ACCESSIBILITY SCORE
                </div>
                <h1
                  className="score-value"
                  style={{
                    fontSize: "4rem",
                    margin: "0",
                    color: accessibilityScore > 60 ? "#10b981" : "#ef4444",
                    fontWeight: "800",
                    textShadow: "0 2px 10px rgba(0,0,0,0.1)",
                  }}
                >
                  {accessibilityScore}%
                </h1>

                <AccessibilityGraph serviceDistribution={serviceDistribution} />

                <button
                  onClick={() => setShowBreakdown(!showBreakdown)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#2777e0",
                    fontSize: "0.7rem",
                    fontWeight: "bold",
                    cursor: "pointer",
                    textDecoration: "underline",
                    marginBottom: "15px",
                  }}
                >
                  {showBreakdown ? "Hide calculation" : "Score Breakdown"}
                </button>

                {showBreakdown && (
                  <div
                    style={{
                      background: "#f1f5f9",
                      padding: "12px",
                      borderRadius: "8px",
                      textAlign: "left",
                      fontSize: "0.75rem",
                      marginBottom: "20px",
                      border: "1px dashed #cbd5e1",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "4px",
                      }}
                    >
                      <span>🏙️ Urban Density (40%)</span>{" "}
                      <strong>
                        {Math.min(40, accessibilityScore * 0.4).toFixed(0)}%
                      </strong>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "4px",
                      }}
                    >
                      <span>📦 Service Volume (30%)</span>{" "}
                      <strong>
                        {Math.min(30, accessibilityScore * 0.3).toFixed(0)}%
                      </strong>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <span>🌈 Category Diversity (30%)</span>{" "}
                      <strong>
                        {Math.min(30, accessibilityScore * 0.3).toFixed(0)}%
                      </strong>
                    </div>
                  </div>
                )}

                <div style={{ textAlign: "left", marginBottom: "15px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", padding: "8px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: "bold", color: "#475569" }}>Scoring Mode</span>
                    <div style={{ display: "flex", gap: "5px", background: "#e2e8f0", padding: "2px", borderRadius: "6px" }}>
                      <button
                        onClick={() => setIsCustomWeightMode(false)}
                        style={{
                          padding: "4px 8px",
                          border: "none",
                          borderRadius: "4px",
                          background: !isCustomWeightMode ? "#fff" : "transparent",
                          color: !isCustomWeightMode ? "#6366f1" : "#64748b",
                          fontSize: "0.65rem",
                          fontWeight: "bold",
                          cursor: "pointer",
                          boxShadow: !isCustomWeightMode ? "0 1px 2px rgba(0,0,0,0.1)" : "none",
                        }}
                      >
                        Default
                      </button>
                      <button
                        onClick={() => setIsCustomWeightMode(true)}
                        style={{
                          padding: "4px 8px",
                          border: "none",
                          borderRadius: "4px",
                          background: isCustomWeightMode ? "#fff" : "transparent",
                          color: isCustomWeightMode ? "#6366f1" : "#64748b",
                          fontSize: "0.65rem",
                          fontWeight: "bold",
                          cursor: "pointer",
                          boxShadow: isCustomWeightMode ? "0 1px 2px rgba(0,0,0,0.1)" : "none",
                        }}
                      >
                        Custom
                      </button>
                    </div>
                  </div>

                  {Object.entries(serviceDistribution).map(([k, v]) => (
                    <ServiceCategory
                      key={k}
                      name={k}
                      data={v}
                      color={categoryColors[k.toLowerCase()] || "#94a3b8"}
                      isCustomMode={isCustomWeightMode}
                      customWeight={customWeights[k]}
                      onWeightChange={onWeightChange}
                    />
                  ))}
                </div>
              </div>
            )
            : batchResults.map((r, i) => (
              <RankCard
                key={r.id || i}
                rank={i}
                result={r}
                categoryColors={categoryColors}
              />
            ))}
        </div>

        <div
          style={{
            padding: "15px",
            borderTop: "1px solid #eee",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            background: "#f8fafc",
          }}
        >
          <button
            onClick={onToggleBoundaries}
            style={{
              padding: "10px",
              background: showProvinceBoundaries ? "#10b981" : "#fff",
              color: showProvinceBoundaries ? "#fff" : "#475569",
              border: "1px solid #cbd5e1",
              borderRadius: "8px",
              fontSize: "0.7rem",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            {showProvinceBoundaries ? "HIDE GERMANY MAP" : "SHOW GERMANY MAP"}
          </button>
          <button
            onClick={onToggleGrid}
            style={{
              padding: "10px",
              background: showGrid ? "#8b5cf6" : "#fff",
              color: showGrid ? "#fff" : "#475569",
              border: "1px solid #cbd5e1",
              borderRadius: "8px",
              fontSize: "0.7rem",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            {showGrid ? "DISABLE GRID" : "ENABLE GRID"}
          </button>
          <button
            onClick={onToggleKdePalette}
            style={{
              padding: "10px",
              background: isKdeVisible ? "#ef4444" : "#0f172a",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            {isKdeVisible ? "HIDE HEATMAP" : "SHOW HEATMAP OVERLAY"}
          </button>
        </div>
      </div>
    </>
  );
}
