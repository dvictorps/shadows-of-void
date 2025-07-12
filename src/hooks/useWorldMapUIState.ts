import { useState } from "react";
import { EquippableItem } from "../types/gameData";

export default function useWorldMapUIState() {
  const [isConfirmDiscardOpen, setIsConfirmDiscardOpen] = useState(false);
  const [itemToDiscard, setItemToDiscard] = useState<EquippableItem | null>(null);
  const [isRequirementFailModalOpen, setIsRequirementFailModalOpen] = useState(false);
  const [itemFailedRequirements, setItemFailedRequirements] = useState<EquippableItem | null>(null);

  return {
    isConfirmDiscardOpen,
    setIsConfirmDiscardOpen,
    itemToDiscard,
    setItemToDiscard,
    isRequirementFailModalOpen,
    setIsRequirementFailModalOpen,
    itemFailedRequirements,
    setItemFailedRequirements,
  } as const;
} 