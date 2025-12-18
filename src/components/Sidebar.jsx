import React from "react";
import {
  RadialBarChart,
  RadialBar,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function Sidebar({
  accessibilityScore,
  serviceCounts,
  serviceDistribution,
  categoryColors,
  onToggleKdePalette,
  isKdeVisible,
  travelMode,
  setTravelMode,
  travelTime,
  setTravelTime,
  onReset,
  isIsochroneActive,
}) {
  const chartData = Object.entries(serviceDistribution || {}).map(
    ([key, value]) => ({
      name: key,
      value,
      fill: categoryColors[key] || "#6b7280",
    })
  );

  const getScoreInfo = (score) => {
    if (score === null)
      return { color: "#94a3b8", label: "Ready", bg: "#f1f5f9" };
    if (score >= 80)
      return { color: "#10b981", label: "Excellent Access", bg: "#dcfce7" };
    if (score >= 60)
      return { color: "#3b82f6", label: "High Access", bg: "#dbeafe" };
    if (score >= 40)
      return { color: "#f59e0b", label: "Moderate Access", bg: "#fef3c7" };
    return { color: "#ef4444", label: "Limited Access", bg: "#fee2e2" };
  };

  const scoreInfo = getScoreInfo(accessibilityScore);

  return (
    <div
      style={{
        width: 380,
        background: "#fff",
        borderLeft: "1px solid #e2e8f0",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div
        style={{
          padding: "24px",
          borderBottom: "1px solid #f1f5f9",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: "1.1rem",
              fontWeight: 800,
              color: "#0f172a",
            }}
          >
            CITY ANALYSIS
          </h2>
          <p style={{ margin: 0, fontSize: "0.7rem", color: "#64748b" }}>
            Accessibility Dashboard
          </p>
        </div>
        {isIsochroneActive && (
          <button
            onClick={onReset}
            style={{
              background: "#fee2e2",
              color: "#ef4444",
              border: "none",
              padding: "6px 12px",
              borderRadius: "6px",
              fontSize: "0.7rem",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            RESET
          </button>
        )}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
        <div
          style={{
            marginBottom: "24px",
            padding: "16px",
            background: "#f8fafc",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
          }}
        >
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                fontSize: "9px",
                fontWeight: 800,
                color: "#64748b",
                textTransform: "uppercase",
                display: "block",
                marginBottom: "6px",
              }}
            >
              Travel Mode
            </label>
            <select
              value={travelMode}
              onChange={(e) => setTravelMode(e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                fontSize: "0.85rem",
              }}
            >
              <option value="driving-car">🚗 Driving</option>
              <option value="cycling-regular">🚲 Cycling</option>
              <option value="foot-walking">🚶 Walking</option>
            </select>
          </div>
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "6px",
              }}
            >
              <label
                style={{
                  fontSize: "9px",
                  fontWeight: 800,
                  color: "#64748b",
                  textTransform: "uppercase",
                }}
              >
                Time Limit
              </label>
              <span
                style={{
                  fontSize: "0.85rem",
                  fontWeight: 800,
                  color: "#3b82f6",
                }}
              >
                {travelTime / 60} min
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={60}
              value={travelTime / 60}
              onChange={(e) => setTravelTime(Number(e.target.value) * 60)}
              style={{ width: "100%", accentColor: "#3b82f6" }}
            />
          </div>
        </div>

        <div style={{ textAlign: "center", marginBottom: 32 }}>
          {isIsochroneActive ? (
            <>
              <div
                style={{
                  fontSize: "4.5rem",
                  fontWeight: 900,
                  color: scoreInfo.color,
                  lineHeight: 1,
                }}
              >
                {accessibilityScore}%
              </div>
              <div
                style={{
                  display: "inline-block",
                  background: scoreInfo.bg,
                  color: scoreInfo.color,
                  padding: "6px 16px",
                  borderRadius: "30px",
                  fontSize: "0.75rem",
                  fontWeight: 800,
                  marginTop: "12px",
                  textTransform: "uppercase",
                }}
              >
                {scoreInfo.label}
              </div>
              <div
                style={{
                  color: "#1e293b",
                  fontWeight: 800,
                  fontSize: "0.8rem",
                  textTransform: "uppercase",
                  letterSpacing: "1.5px",
                  marginTop: "16px",
                }}
              >
                Accessibility Index
              </div>
            </>
          ) : (
            <div
              style={{
                padding: "40px 20px",
                border: "2px dashed #e2e8f0",
                borderRadius: "16px",
                color: "#94a3b8",
                fontSize: "0.85rem",
              }}
            >
              Click map to begin analysis
            </div>
          )}
        </div>

        {isIsochroneActive && (
          <>
            <div
              style={{
                background: "#0f172a",
                padding: "20px",
                borderRadius: "16px",
                marginBottom: 24,
                color: "#fff",
              }}
            >
              <div
                style={{
                  fontSize: "0.65rem",
                  color: "#94a3b8",
                  fontWeight: 800,
                  marginBottom: 4,
                }}
              >
                TOTAL SERVICES
              </div>
              <div style={{ fontSize: "2.2rem", fontWeight: 900 }}>
                {serviceCounts}
              </div>
            </div>
            <h4
              style={{
                fontSize: "0.75rem",
                color: "#64748b",
                marginBottom: 16,
                fontWeight: 800,
                textTransform: "uppercase",
              }}
            >
              Category Diversity
            </h4>
            <div style={{ height: 200, marginBottom: "20px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  innerRadius="30%"
                  outerRadius="100%"
                  data={chartData}
                  startAngle={90}
                  endAngle={-270}
                >
                  <RadialBar background dataKey="value" cornerRadius={10} />
                  <Tooltip
                    contentStyle={{ borderRadius: "12px", border: "none" }}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "8px",
              }}
            >
              {chartData.map((d) => (
                <div
                  key={d.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px",
                    background: "#f8fafc",
                    borderRadius: "8px",
                  }}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      backgroundColor: d.fill,
                    }}
                  />
                  <span
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      color: "#334155",
                    }}
                  >
                    {d.value}{" "}
                    <span style={{ color: "#64748b" }}>
                      {d.name.split(" ")[0]}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div style={{ padding: "24px", borderTop: "1px solid #f1f5f9" }}>
        <button
          onClick={onToggleKdePalette}
          style={{
            width: "100%",
            padding: "16px",
            borderRadius: "12px",
            border: "none",
            backgroundColor: isKdeVisible ? "#64748b" : "#0f172a",
            color: "#fff",
            fontWeight: 800,
            fontSize: "0.85rem",
            cursor: "pointer",
            transition: "0.3s ease",
          }}
        >
          {isKdeVisible ? "HIDE DENSITY OVERLAY" : "VIEW DENSITY OVERLAY"}
        </button>
      </div>
    </div>
  );
}
