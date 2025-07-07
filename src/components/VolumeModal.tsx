import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { useSettingsStore } from '../stores/settingsStore';

interface VolumeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const VolumeModal: React.FC<VolumeModalProps> = ({ isOpen, onClose }) => {
  const volume = useSettingsStore((s) => s.volume);
  const setVolume = useSettingsStore((s) => s.setVolume);

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const v = parseFloat(e.target.value);
    if (!isNaN(v)) setVolume(v);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Volume"
      actions={<Button onClick={onClose}>Fechar</Button>}
    >
      <div className="flex flex-col items-center gap-3 py-4">
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={handleChange}
          className="w-full"
        />
        <span>{Math.round(volume * 100)}%</span>
      </div>
    </Modal>
  );
};

export default VolumeModal; 