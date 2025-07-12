import React, { useEffect } from 'react';
import { Character, MapLocation } from '../types/gameData';
import { EffectiveStats } from '../utils/statUtils/weapon';

interface UseLowHealthWarningProps {
  activeCharacter: Character | null;
  effectiveStats: EffectiveStats | null;
  textBoxContent: React.ReactNode;
  currentView: 'worldMap' | 'areaView';
  currentArea: MapLocation | null;
  displayPersistentMessage: (message: React.ReactNode) => void;
  isHardcoreDeath?: boolean;
}

export const useLowHealthWarning = ({
  activeCharacter,
  effectiveStats,
  textBoxContent,
  currentView,
  currentArea,
  displayPersistentMessage,
  isHardcoreDeath,
}: UseLowHealthWarningProps) => {
  useEffect(() => {
    if (isHardcoreDeath) return;
    if (!activeCharacter || !effectiveStats) return; // Need character and stats

    const healthPercentage =
      (activeCharacter.currentHealth / effectiveStats.maxHealth) * 100;

    // Check if health is no longer low AND the current message is the low health warning
    // Type-safe check for the specific React element structure
    let isLowHealthWarningVisible = false;
    if (
      React.isValidElement(textBoxContent) &&
      typeof textBoxContent.type === "string" &&
      textBoxContent.type === "span" && // Check if it's specifically a span
      textBoxContent.props && // Check if props exist
      typeof textBoxContent.props === "object" && // Check if props is an object
      "children" in textBoxContent.props && // Check if children prop exists
      // Update the text check here
      textBoxContent.props.children === "Vida Baixa! Use uma poção!"
    ) {
      isLowHealthWarningVisible = true;
    }

    if (healthPercentage >= 30 && isLowHealthWarningVisible) {
      // Determine the correct persistent message to restore
      let persistentMessageToShow: React.ReactNode = "Mapa - Ato 1"; // Default
      if (currentView === "areaView" && currentArea) {
        persistentMessageToShow = currentArea.description;
      }
      displayPersistentMessage(persistentMessageToShow);
    }
  }, [
    activeCharacter?.currentHealth,
    effectiveStats?.maxHealth,
    textBoxContent,
    currentView,
    currentArea,
    displayPersistentMessage,
    activeCharacter, // Need the whole object for checks
    effectiveStats, // Need the whole object for checks
    isHardcoreDeath,
  ]);
}; 