import React from 'react';

interface ScoreDisplayProps {
  score: number;
}

const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ score }) => {
  return (
    <div className="text-4xl font-bold text-center my-8">
      Current Score: {score}
    </div>
  );
};

export default ScoreDisplay;
