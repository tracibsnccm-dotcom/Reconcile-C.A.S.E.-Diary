import React from "react";

interface Props {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const navItems = [
  { id: "4ps", label: "4Ps of Wellness" },
  { id: "10vs", label: "10-Vs Engine" },
  { id: "pain", label: "Pain Diary" },
  { id: "sdoh", label: "SDOH Flags" },
  { id: "crisis", label: "Crisis Mode" },
  { id: "timeline", label: "Timeline & Notes" },
  { id: "providers", label: "Provider Tools" },
];

const RNAssessmentNav: React.FC<Props> = ({ activeTab, setActiveTab }) => {
  return (
    <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => setActiveTab(item.id)}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "6px",
            border: item.id === activeTab ? "2px solid #0f2a6a" : "1px solid #cbd5e1",
            background: item.id === activeTab ? "#0f2a6a" : "#f1f5f9",
            color: item.id === activeTab ? "#ffffff" : "#0f2a6a",
            cursor: "pointer",
            fontWeight: item.id === activeTab ? "bold" : "normal",
          }}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
};

export default RNAssessmentNav;
