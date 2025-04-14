import { useState, useCallback, Dispatch, SetStateAction } from "react";
import React from 'react'; // Import React for JSX
import { Character, EquippableItem, EquipmentSlotId } from "../types/gameData";
import { calculateTotalStrength, calculateFinalMaxHealth } from "../utils/statUtils"; // Import helpers
import { TWO_HANDED_WEAPON_TYPES, ONE_HANDED_WEAPON_TYPES } from "../utils/itemUtils"; // Import the set
import { useCharacterStore } from "../stores/characterStore"; // Correct the import path

// Helper simples para determinar slot (PRECISA SER REFINADO) - Moved from page
// REMOVE Set definition from here
// const TWO_HANDED_WEAPON_TYPES = new Set([
//   "TwoHandedSword",
//   "TwoHandedAxe",
//   "TwoHandedMace",
//   "Bow",
//   "Staff",
// ]);

const getEquipmentSlotForItem = (
  item: EquippableItem
): EquipmentSlotId | null => {
  // Primeiro, checa tipos específicos
  if (item.itemType === "Shield") return "weapon2"; // <<< Escudo vai para slot 2
  if (item.itemType === "Helm") return "helm";
  if (item.itemType === "BodyArmor") return "bodyArmor";
  if (item.itemType === "Gloves") return "gloves";
  if (item.itemType === "Boots") return "boots";
  if (item.itemType === "Belt") return "belt";
  if (item.itemType === "Amulet") return "amulet";
  if (item.itemType === "Ring") return "ring1"; // Simplificação: sempre tenta o anel 1 primeiro

  // Depois, checa categorias de armas
  if (ONE_HANDED_WEAPON_TYPES.has(item.itemType)) return "weapon1"; // <<< Armas 1H vão para slot 1 (por padrão)
  if (TWO_HANDED_WEAPON_TYPES.has(item.itemType)) return "weapon1"; // <<< Armas 2H *sempre* vão para slot 1

  // Fallback se nenhum tipo corresponder
  console.warn(
    `Cannot determine equipment slot for item type: ${item.itemType}`
  );
  return null;
};


// --- Hook Definition --- Updated Props
interface UseInventoryManagerProps {
  activeCharacter: Character | null;
  updateCharacter: (updatedCharData: Partial<Character>) => void;
  saveUpdatedCharacter: (updatedChar: Character) => void;
  setTextBoxContent: Dispatch<SetStateAction<React.ReactNode>>;
}

export const useInventoryManager = ({
  activeCharacter,
  updateCharacter,
  saveUpdatedCharacter,
  setTextBoxContent,
}: UseInventoryManagerProps) => {

  // --- State ---
  // Original ItemDropModal (now only for collection)
  const [isDropModalOpen, setIsDropModalOpen] = useState(false);
  const [itemsToShowInModal, setItemsToShowInModal] = useState<EquippableItem[]>([]);
  // Remove isDropModalViewOnly state
  // const [isDropModalViewOnly, setIsDropModalViewOnly] = useState(false);

  // New PendingDropsModal state
  const [isPendingDropsModalOpen, setIsPendingDropsModalOpen] = useState(false); // NEW

  // Inventory & Discard Confirmation state
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isConfirmDiscardOpen, setIsConfirmDiscardOpen] = useState(false);
  const [itemToDiscard, setItemToDiscard] = useState<EquippableItem | null>(null);

  // --- Handlers ---

  // Handle item dropped (no changes needed here, just accumulates)
  const handleItemDropped = useCallback((newItem: EquippableItem) => {
    setItemsToShowInModal((prevDrops) => [...prevDrops, newItem]);
  }, []);

  // Clear pending drops (no changes needed)
  const clearPendingDrops = useCallback(() => {
    setItemsToShowInModal([]);
    console.log("Pending drops cleared.");
  }, []);

  // --- ItemDropModal Handlers (Collection Modal) ---
  // Remove handleOpenDropModalForViewing
  // const handleOpenDropModalForViewing = useCallback(() => { ... });

   const handleOpenDropModalForCollection = useCallback(() => {
     if(itemsToShowInModal.length > 0) {
         setIsDropModalOpen(true);
         // setIsDropModalViewOnly(false); // No longer needed
         console.log("Opening drop modal for collection.");
     }
   }, [itemsToShowInModal.length]);

   const handleCloseDropModal = useCallback(() => {
     setIsDropModalOpen(false);
     // setIsDropModalViewOnly(false); // No longer needed
     // Don't clear items here
     setTextBoxContent("...");
   }, [setTextBoxContent]);

   // Discard individual item FROM DROP modal
    const handleDiscardItemFromDrop = useCallback((itemToDiscard: EquippableItem) => {
        console.log("Discarding item from drop:", itemToDiscard.name);
        const remainingItems = itemsToShowInModal.filter((i) => i.id !== itemToDiscard.id);
        setItemsToShowInModal(remainingItems);
        if (remainingItems.length === 0) {
             handleCloseDropModal();
        }
    }, [itemsToShowInModal, handleCloseDropModal]);

    // Discard all items FROM DROP modal
    const handleDiscardAllFromDrop = useCallback(() => {
        console.log("Discarding all dropped items.");
        setItemsToShowInModal([]);
        handleCloseDropModal();
    }, [handleCloseDropModal]);

  // --- PendingDropsModal Handlers --- NEW
  const handleOpenPendingDropsModal = useCallback(() => {
      if(itemsToShowInModal.length > 0) {
          setIsPendingDropsModalOpen(true);
          console.log("Opening pending drops modal.");
      }
  }, [itemsToShowInModal.length]);

  const handleClosePendingDropsModal = useCallback(() => {
      setIsPendingDropsModalOpen(false);
      console.log("Closing pending drops modal.");
  }, []);

  // --- Inventory Modal Handlers (No change) ---
  const handleOpenInventory = useCallback(() => {
    setIsInventoryOpen(true);
  }, []);

  const handleCloseInventory = useCallback(() => {
    setIsInventoryOpen(false);
  }, []);

  // --- Discard Confirmation Handlers ---
  const handleOpenDiscardConfirm = useCallback((item: EquippableItem) => {
    setItemToDiscard(item);
    setIsConfirmDiscardOpen(true);
  }, []);

  const handleCloseDiscardConfirm = useCallback(() => {
    setIsConfirmDiscardOpen(false);
    setItemToDiscard(null);
  }, []);

  const handleConfirmDiscard = useCallback(() => {
    if (!itemToDiscard || !activeCharacter) return;

    console.log("[handleConfirmDiscard] Confirming discard (from inventory):", itemToDiscard.name);
    
    // Calculate new inventory
    const updatedInventory = (activeCharacter.inventory || []).filter(
      (invItem) => invItem.id !== itemToDiscard.id
    );
    
    // Call updateCharacter with only the changed property
    updateCharacter({ inventory: updatedInventory });
    
    // Decide if explicit save is needed here or if store handles it
    // For now, let's assume we still need it, but pass the *updated* character from the store
    // This might cause a race condition or be redundant if updateCharacter triggers save
    setTimeout(() => {
        const potentiallyUpdatedChar = useCharacterStore.getState().activeCharacter;
        if(potentiallyUpdatedChar) saveUpdatedCharacter(potentiallyUpdatedChar);
    }, 50); // Delay slightly

    handleCloseDiscardConfirm();
  }, [
    itemToDiscard,
    activeCharacter, // Depends on activeCharacter to get initial inventory
    updateCharacter, // Use updateCharacter
    saveUpdatedCharacter,
    handleCloseDiscardConfirm,
  ]);

  // --- Pick Up / Equip Handlers ---
  const handlePickUpItem = useCallback(
    (item: EquippableItem) => {
        if (!activeCharacter) return; // Guard clause

        let pickedUp = false;
        // Calculate new inventory first
        const currentInventory = [...(activeCharacter.inventory || [])];
        const MAX_INVENTORY_SLOTS = 60;
        if (currentInventory.length >= MAX_INVENTORY_SLOTS) {
            const removed = currentInventory.shift();
            console.log("[handlePickUpItem] Inventory full, removing oldest item:", removed?.name);
        }
        currentInventory.push(item);

        // Call updateCharacter with just the inventory change
        updateCharacter({ inventory: currentInventory });
        pickedUp = true;

        // Save after update (consider removing later)
        setTimeout(() => {
            const potentiallyUpdatedChar = useCharacterStore.getState().activeCharacter;
            if(potentiallyUpdatedChar) saveUpdatedCharacter(potentiallyUpdatedChar);
        }, 50);

        console.log(`[handlePickUpItem] Picked up ${item.name}. Inventory size: ${currentInventory.length}`);

        if(pickedUp) {
            // Remove item from modal state AFTER successful state update
            const remainingItems = itemsToShowInModal.filter((i) => i.id !== item.id);
            setItemsToShowInModal(remainingItems);
            if (remainingItems.length === 0) {
                 handleCloseDropModal();
            }
        }
    },
    [activeCharacter, updateCharacter, saveUpdatedCharacter, itemsToShowInModal, handleCloseDropModal]
  );

  const handlePickUpAll = useCallback(() => {
    if (itemsToShowInModal.length === 0 || !activeCharacter) return; // Guard clause

    // --- Logging START ---
    console.log("[handlePickUpAll] Character state BEFORE calculating update:", JSON.parse(JSON.stringify(activeCharacter)));
    // --- Logging END ---

    // Calculate the new inventory state
    const currentInventory = [...(activeCharacter.inventory || [])];
    const itemsToPickUp = [...itemsToShowInModal];
    const MAX_INVENTORY_SLOTS = 60;
    console.log(`[handlePickUpAll] Attempting to pick up ${itemsToPickUp.length} items.`);
    for (const item of itemsToPickUp) {
      if (currentInventory.length >= MAX_INVENTORY_SLOTS) {
        const removedItem = currentInventory.shift();
         console.log("[handlePickUpAll] Inventory full during Pick Up All, removing oldest item:", removedItem?.name);
      }
      currentInventory.push(item);
    }

    // --- Logging START ---
    console.log("[handlePickUpAll] Calculated new inventory:", JSON.parse(JSON.stringify(currentInventory)));
    // --- Logging END ---

    // Call updateCharacter with just the inventory change
    updateCharacter({ inventory: currentInventory });

    // Save after update (consider removing later)
     setTimeout(() => {
        const potentiallyUpdatedChar = useCharacterStore.getState().activeCharacter;
        if(potentiallyUpdatedChar) saveUpdatedCharacter(potentiallyUpdatedChar);
    }, 50);

    console.log(`[handlePickUpAll] Picked up all items. Final inventory size: ${currentInventory.length}`);

    // Clear modal state AFTER initiating the character state update
    setItemsToShowInModal([]);
    handleCloseDropModal();
  }, [activeCharacter, updateCharacter, itemsToShowInModal, saveUpdatedCharacter, handleCloseDropModal]);

  const handleEquipItem = useCallback(
    (itemToEquip: EquippableItem) => {
      const activeCharacter = useCharacterStore.getState().activeCharacter; // Get fresh state
      if (!activeCharacter) return; 

      // --- Check Requirements ---
      let requirementFailed = false;
      const errorMessages: React.ReactNode[] = []; // Use const
      if (itemToEquip.requirements) {
        if (itemToEquip.requirements.level && activeCharacter.level < itemToEquip.requirements.level) {
          requirementFailed = true;
          errorMessages.push(`Requer Nível ${itemToEquip.requirements.level}`);
        }
        if (itemToEquip.requirements.strength && activeCharacter.strength < itemToEquip.requirements.strength) {
          requirementFailed = true;
          errorMessages.push(`Requer ${itemToEquip.requirements.strength} Força`);
        }
         if (itemToEquip.requirements.dexterity && activeCharacter.dexterity < itemToEquip.requirements.dexterity) {
           requirementFailed = true;
           errorMessages.push(`Requer ${itemToEquip.requirements.dexterity} Destreza`);
         }
         if (itemToEquip.requirements.intelligence && activeCharacter.intelligence < itemToEquip.requirements.intelligence) {
           requirementFailed = true;
           errorMessages.push(`Requer ${itemToEquip.requirements.intelligence} Inteligência`);
         }
      }

      if (requirementFailed) {
         console.log(`Requirements not met to equip ${itemToEquip.name}. Player Level: ${activeCharacter.level}, Str: ${activeCharacter.strength}, Dex: ${activeCharacter.dexterity}, Int: ${activeCharacter.intelligence}`);
         // Use plain string for error message
         const errorString = `Requisitos não atendidos para ${itemToEquip.name}: ${errorMessages.join(", ")}`;
         setTextBoxContent(errorString);
         return;
      }
      // --- End Check Requirements ---

      const targetSlot = getEquipmentSlotForItem(itemToEquip);
      if (!targetSlot) {
        console.error(`Could not determine slot for ${itemToEquip.name}`);
         setTextBoxContent(`Não foi possível determinar o slot para ${itemToEquip.name}.`);
        return;
      }

      // --- NEW: Check for 2H weapon conflict before equipping off-hand --- 
      const weapon1 = activeCharacter.equipment?.weapon1;
      if (targetSlot === 'weapon2' && weapon1 && TWO_HANDED_WEAPON_TYPES.has(weapon1.itemType)) {
          console.error(`Cannot equip ${itemToEquip.name} in off-hand while a 2H weapon is equipped.`);
          setTextBoxContent(`Não é possível equipar um item na mão secundária com uma arma de duas mãos equipada.`);
          return; // Prevent equipping
      }
      // -------------------------------------------------------------------

      // Calculate new equipment and inventory states
      const currentEquipment = { ...(activeCharacter.equipment || {}) };
      const currentInventory = [...(activeCharacter.inventory || [])];
      const itemInSlot = currentEquipment[targetSlot];
      const MAX_INVENTORY_SLOTS = 60;

       console.log(`[handleEquipItem] Equipping ${itemToEquip.name} into slot ${targetSlot}. Item currently in slot: ${itemInSlot?.name ?? "None"}`);

      // --- Actual Equip Logic ---
      currentEquipment[targetSlot] = itemToEquip;

      const inventoryIndex = currentInventory.findIndex((invItem) => invItem.id === itemToEquip.id);
      if (inventoryIndex > -1) {
         console.log(`${itemToEquip.name} found in inventory, removing.`);
        currentInventory.splice(inventoryIndex, 1);
      } else {
        console.log(`${itemToEquip.name} not found in inventory (likely equipped from drop).`);
      }

      if (itemInSlot) {
         console.log(`Moving ${itemInSlot.name} to inventory.`);
        if (currentInventory.length >= MAX_INVENTORY_SLOTS) {
          const removedItem = currentInventory.shift();
           console.log("Inventory full while equipping, removing oldest item:", removedItem?.name);
        }
        currentInventory.push(itemInSlot);
      }

      // Handle Two-Handed
      if (targetSlot === 'weapon1' && TWO_HANDED_WEAPON_TYPES.has(itemToEquip.itemType)) {
        const itemInOffHand = currentEquipment['weapon2'];
        if (itemInOffHand) {
           console.log(`Equipping 2H weapon, moving ${itemInOffHand.name} from off-hand to inventory.`);
          if (currentInventory.length >= MAX_INVENTORY_SLOTS) {
            const removedItem = currentInventory.shift();
             console.log("Inventory full while clearing off-hand, removing oldest item:", removedItem?.name);
          }
          currentInventory.push(itemInOffHand);
          currentEquipment['weapon2'] = null;
        }
      }
      // --- End Equip Logic ---

      // --- Recalculate Max Health based on new equipment/strength ---
      const tempCharForCalc: Character = {
        ...activeCharacter,
        equipment: currentEquipment,
        inventory: currentInventory
      };
      const newTotalStrength = calculateTotalStrength(tempCharForCalc);

      // --- Recalculate flat health from mods with NEW equipment ---
      let newFlatHealthFromMods = 0;
      for (const slotId in currentEquipment) {
          const equippedItem = currentEquipment[slotId as keyof typeof currentEquipment];
          if (equippedItem) {
              for (const mod of equippedItem.modifiers) {
                  if (mod.type === 'MaxHealth') {
                      newFlatHealthFromMods += mod.value ?? 0;
                  }
              }
          }
      }
      
      // Calculate new max health based on the character's *base* max health, new strength, and NEW flat health mods
      const newMaxHealth = calculateFinalMaxHealth(
          activeCharacter.maxHealth, // Assuming this is BASE health
          newTotalStrength, 
          newFlatHealthFromMods // Pass the recalculated flat health
      );

      // Adjust current health if it exceeds new max health
      const newCurrentHealth = Math.min(activeCharacter.currentHealth, newMaxHealth);

      // Call updateCharacter with all changed properties
      updateCharacter({
          equipment: currentEquipment,
          inventory: currentInventory,
          maxHealth: newMaxHealth,
          currentHealth: newCurrentHealth,
      });

      // Save after update (consider removing later)
      setTimeout(() => {
        const potentiallyUpdatedChar = useCharacterStore.getState().activeCharacter;
        if(potentiallyUpdatedChar) saveUpdatedCharacter(potentiallyUpdatedChar);
      }, 50);

      setTextBoxContent(`${itemToEquip.name} equipado.`);
      
      // Remove item from modal state AFTER initiating character update
      const remainingItems = itemsToShowInModal.filter((i) => i.id !== itemToEquip.id);
      setItemsToShowInModal(remainingItems);
      if (remainingItems.length === 0) {
           handleCloseDropModal();
      }
    },
    [activeCharacter, updateCharacter, saveUpdatedCharacter, setTextBoxContent, itemsToShowInModal, handleCloseDropModal]
  );


  // --- Return states and handlers ---
  return {
    // States
    isDropModalOpen,          // For collection modal
    itemsToShowInModal,       // Pending/Collection items list
    isPendingDropsModalOpen,  // NEW: For view-only modal
    isInventoryOpen,
    isConfirmDiscardOpen,
    itemToDiscard,

    // Handlers
    handleOpenDropModalForCollection, // For collection modal
    handleCloseDropModal,             // For collection modal
    handleDiscardItemFromDrop,        // From collection modal
    handleDiscardAllFromDrop,         // From collection modal
    clearPendingDrops,

    handleOpenPendingDropsModal,    // NEW: For view-only modal
    handleClosePendingDropsModal,   // NEW: For view-only modal

    handleOpenInventory,
    handleCloseInventory,

    handleOpenDiscardConfirm,
    handleCloseDiscardConfirm,
    handleConfirmDiscard,

    handlePickUpItem,           // From collection modal
    handlePickUpAll,            // From collection modal
    handleEquipItem,            // From collection or inventory modal
    handleItemDropped,
  };
};
