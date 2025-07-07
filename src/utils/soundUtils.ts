import { useSettingsStore } from '../stores/settingsStore';

export const playSound = (src: string): HTMLAudioElement => {
  const audio = new Audio(src);
  const volume = useSettingsStore.getState().volume;
  audio.volume = volume;
  audio.play();
  return audio;
}; 