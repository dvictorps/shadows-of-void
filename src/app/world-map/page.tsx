"use client";

import WorldMapPageInner from "@/features/worldmap/components/WorldMapPageInner";
import { WorldMapProvider } from "@/features/worldmap/context/WorldMapContext";

export default function WorldMapPage() {
  return (
    <WorldMapProvider>
      <WorldMapPageInner />
    </WorldMapProvider>
  );
} 