// src/components/CrisisModeButton.tsx
// Clean version — ONLY handles showing or hiding the RN Crisis Screen.
// No crisis logic lives here anymore.

import React, { useState } from "react";
import RNCrisisScreen from "../rn/RNCrisisScreen";

const CrisisModeButton: React.FC = () => {
  // Local toggle for showing the RN crisis UI
  const [showCrisisUI, setShowCrisisUI] = useState(false);

  if (showCrisisUI) {
    return (
      <div className="space-y-2">
        <button
          className="text-[10px] px-2 py-1 border rounded bg-white"
          onClick={() => setShowCrisisUI(false)}
        >
          Exit Crisis View (for now)
        </button>

        {/* Render the REAL RN Crisis Screen */}
        <RNCrisisScreen />
      </div>
    );
  }

  return (
    <button
      className="bg-red-500 text-white text-[11px] px-3 py-1.5 rounded-md"
      onClick={() => setShowCrisisUI(true)}
    >
      Crisis Mode
    </button>
  );
};

export default CrisisModeButton;
