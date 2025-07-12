import React from "react";

interface PendingDropsButtonProps {
  count: number;
  onClick: () => void;
}

const PendingDropsButton: React.FC<PendingDropsButtonProps> = ({ count, onClick }) => {
  if (count <= 0) return null;
  return (
    <button
      onClick={onClick}
      className="absolute top-12 right-2 px-2 py-1 border border-gray-600 bg-gray-800 rounded text-white hover:bg-gray-700 focus:outline-none flex items-center gap-1 z-20"
      aria-label={`Ver ${count} itens pendentes`}
    >
      <img
        src="/sprites/ui/bag.png"
        alt="Itens pendentes"
        className="w-5 h-5 object-contain"
        draggable={false}
      />
      <span className="bg-red-600 text-white text-xs font-bold rounded-full px-1.5 py-0.5 relative -top-1 -right-1">
        {count}
      </span>
    </button>
  );
};

export default PendingDropsButton; 