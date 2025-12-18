// src/components/AccessibilityGraph.jsx
const AccessibilityGraph = ({ serviceCounts }) => {
  return (
    <div>
      <h4>Service Count Graph</h4>
      <p>(Add bar/radar chart here using Recharts)</p>
      <p>Count: {serviceCounts}</p>
    </div>
  );
};

export default AccessibilityGraph;