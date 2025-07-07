import React, { useState } from "react";
import { FaArrowLeft, FaStore, FaBox, FaVolumeUp } from "react-icons/fa";
import VolumeModal from "../VolumeModal";

interface TopControlsProps {
  isTown: boolean;
  areaComplete: boolean;
  onReturnToMap: (areaWasCompleted: boolean) => void;
  onOpenVendor: () => void;
  onOpenStash: () => void;
}

const TopControls: React.FC<TopControlsProps> = ({
  isTown,
  areaComplete,
  onReturnToMap,
  onOpenVendor,
  onOpenStash,
}) => {
  const [isVolumeOpen, setIsVolumeOpen] = useState(false);

  if (isTown) {
    return (
      <>
        <button
          onClick={() => onReturnToMap(areaComplete)}
          className="absolute top-2 right-16 p-1 border border-white rounded text-white hover:bg-gray-700 focus:outline-none z-20"
          aria-label="Voltar ao Mapa"
        >
          <FaArrowLeft />
        </button>

        <button
          onClick={() => setIsVolumeOpen(true)}
          className="absolute top-2 right-4 p-1 border border-white rounded text-white hover:bg-gray-700 focus:outline-none z-20"
          aria-label="Volume Settings"
        >
          <FaVolumeUp />
        </button>

        <VolumeModal isOpen={isVolumeOpen} onClose={() => setIsVolumeOpen(false)} />

        <div className="absolute top-1/2 right-2 transform -translate-y-1/2 flex flex-col gap-4 z-20">
          <button
            onClick={onOpenVendor}
            className="px-3 py-2 border border-yellow-400 bg-yellow-900/50 rounded text-yellow-300 hover:bg-yellow-800/50 focus:outline-none flex items-center gap-1.5"
            aria-label="Abrir Vendedor"
          >
            <FaStore size={18} />
            <span className="hidden sm:inline">Vendedor</span>
          </button>
          <button
            onClick={onOpenStash}
            className="px-3 py-2 border border-orange-400 bg-orange-900/50 rounded text-orange-300 hover:bg-orange-800/50 focus:outline-none flex items-center gap-1.5"
            aria-label="Abrir Baú"
          >
            <FaBox size={18} />
            <span className="hidden sm:inline">Baú</span>
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <button
        onClick={() => onReturnToMap(areaComplete)}
        className="absolute top-2 right-16 p-1 border border-white rounded text-white hover:bg-gray-700 focus:outline-none z-20"
        aria-label="Voltar ao Mapa"
      >
        <FaArrowLeft />
      </button>

      <button
        onClick={() => setIsVolumeOpen(true)}
        className="absolute top-2 right-4 p-1 border border-white rounded text-white hover:bg-gray-700 focus:outline-none z-20"
        aria-label="Volume Settings"
      >
        <FaVolumeUp />
      </button>

      <VolumeModal isOpen={isVolumeOpen} onClose={() => setIsVolumeOpen(false)} />
    </>
  );
};

export default TopControls; 