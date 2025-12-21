import React from 'react';

interface ScoreControlsProps {
  onIncrement: () => void;
  onDecrement: () => void;
  onReset: () => void;
}

const ScoreControls: React.FC<ScoreControlsProps> = ({
  onIncrement,
  onDecrement,
  onReset,
}) => {
  return (
    <div className="flex justify-center space-x-4">
      <button
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        onClick={onIncrement}
      >
        Increment
      </button>
      <button
        className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
        onClick={onDecrement}
      >
        Decrement
      </button>
      <button
        className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
        onClick={onReset}
      >
        Reset
      </button>
    </div>
  );
};

export default ScoreControls;
