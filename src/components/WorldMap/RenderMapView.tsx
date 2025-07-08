"use client";

import React from "react";
import MapArea from "../MapArea";
import { Character, MapLocation } from "@/types/gameData";

export interface RenderMapViewProps {
  character: Character;
  locations: MapLocation[];
  onHoverLocation: (description: string) => void;
  onLeaveLocation: () => void;
  onBackClick: () => void;
  onAreaClick: (targetAreaId: string) => void;
  onCurrentAreaClick: () => void;
  isTraveling: boolean;
  travelProgress: number;
  travelTargetAreaId: string | null;
  windCrystals: number;
}

export default function RenderMapView({
  character,
  locations,
  onHoverLocation,
  onLeaveLocation,
  onBackClick,
  onAreaClick,
  onCurrentAreaClick,
  isTraveling,
  travelProgress,
  travelTargetAreaId,
  windCrystals,
}: RenderMapViewProps) {
  return (
    <MapArea
      character={character}
      locations={locations}
      onHoverLocation={onHoverLocation}
      onLeaveLocation={onLeaveLocation}
      onBackClick={onBackClick}
      onAreaClick={onAreaClick}
      onCurrentAreaClick={onCurrentAreaClick}
      isTraveling={isTraveling}
      travelProgress={travelProgress}
      travelTargetAreaId={travelTargetAreaId}
      windCrystals={windCrystals}
    />
  );
} 