import { useState, useCallback, Dispatch, SetStateAction } from "react";
// import React from 'react'; // <<< REMOVE UNUSED IMPORT
import { EquippableItem, EquipmentSlotId, Character } from "../types/gameData";
import { calculateTotalStrength, calculateTotalDexterity, calculateTotalIntelligence, calculateEffectiveStats } from "../utils/statUtils"; // Import helpers AND calculateEffectiveStats
import { TWO_HANDED_WEAPON_TYPES, ONE_HANDED_WEAPON_TYPES, OFF_HAND_TYPES } from "../utils/itemUtils"; // Import the set
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
  if (OFF_HAND_TYPES.has(item.itemType)) return "weapon2";

  // Fallback se nenhum tipo corresponder
  console.warn(
    `Cannot determine equipment slot for item type: ${item.itemType}`
  );
  return null;
};


// --- Hook Definition --- Updated Props
interface UseInventoryManagerProps {
  // activeCharacter: Character | null; // REMOVED
  // updateCharacter: (updatedCharData: Partial<Character>) => void; // REMOVED
  // saveUpdatedCharacter: (updatedChar: Character) => void; // REMOVED
  setIsConfirmDiscardOpen: Dispatch<SetStateAction<boolean>>;
  setItemToDiscard: Dispatch<SetStateAction<EquippableItem | null>>;
  setIsRequirementFailModalOpen: Dispatch<SetStateAction<boolean>>;
  setItemFailedRequirements: Dispatch<SetStateAction<EquippableItem | null>>;
}

export const useInventoryManager = ({
    setIsConfirmDiscardOpen,
    setItemToDiscard,
    setIsRequirementFailModalOpen,
    setItemFailedRequirements,
}: UseInventoryManagerProps) => {

    // --- REMOVE LOG TO CHECK RECEIVED PROPS ---
    /*
    console.log("[useInventoryManager Hook Init] Received Props:", {
        setTextBoxContent: typeof setTextBoxContent,
        setIsConfirmDiscardOpen: typeof setIsConfirmDiscardOpen,
        setItemToDiscard: typeof setItemToDiscard,
        setIsRequirementFailModalOpen: typeof setIsRequirementFailModalOpen,
        setItemFailedRequirements: typeof setItemFailedRequirements
    });
    */
    // -------------------------------------

    // Remove unused store functions from here
    // const updateCharacter = useCharacterStore((state) => state.updateCharacter);
    // const saveCharacter = useCharacterStore((state) => state.saveCharacter);
    
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

    // --- NEW: Over Capacity State ---
    const [isOverCapacityModalOpen, setIsOverCapacityModalOpen] = useState(false);
    const [itemsPendingPickup, setItemsPendingPickup] = useState<EquippableItem[]>([]); // Items player wants to pick up
    const [requiredSpaceToFree, setRequiredSpaceToFree] = useState(0); // How many slots need to be freed
    // --------------------------------

    // --- Define Requirement Check Functions EARLIER --- 
    const checkRequirements = useCallback((character: Character | null, item: EquippableItem): boolean => {
        if (!character) return false;

        // --- Calculate Total Attributes --- 
        const totalStr = calculateTotalStrength(character);
        const totalDex = calculateTotalDexterity(character);
        const totalInt = calculateTotalIntelligence(character);
        // ---------------------------------

        if (item.requirements) {
            if (item.requirements.level && character.level < item.requirements.level) return false;
            if (item.requirements.strength && totalStr < item.requirements.strength) return false;
            if (item.requirements.dexterity && totalDex < item.requirements.dexterity) return false;
            if (item.requirements.intelligence && totalInt < item.requirements.intelligence) return false;
        }
        return true;
    }, []); // Depends only on util functions, empty deps okay

    // --- Define checkAndHandleRequirementChanges EARLIER --- 
    const checkAndHandleRequirementChanges = useCallback((currentCharacter: Character | null) => {
        if (!currentCharacter) return;
        const updateChar = useCharacterStore.getState().updateCharacter;
        const equipment = { ...currentCharacter.equipment };
        const itemsToUnequip: { slot: EquipmentSlotId; item: EquippableItem }[] = [];
        const inventory = [...currentCharacter.inventory];
        let currentHealth = currentCharacter.currentHealth;
        let currentBarrier = currentCharacter.currentBarrier ?? 0;

        Object.entries(equipment).forEach(([slot, item]: [string, EquippableItem | null]) => {
            const tempCharForCheck = { ...currentCharacter, equipment: { ...equipment, [slot]: null } };
            if (item && !checkRequirements(tempCharForCheck, item)) { 
                console.log(`Item ${item.name} in slot ${slot} no longer meets requirements.`);
                itemsToUnequip.push({ slot: slot as EquipmentSlotId, item });
            }
        });

        if (itemsToUnequip.length > 0) {
            itemsToUnequip.forEach(({ slot, item }) => {
                equipment[slot] = null;
                inventory.push(item);
                console.log(`Item ${item.name} desequipado por falta de requisitos.`);
            });

            const tempUpdatedCharacter = { ...currentCharacter, equipment, inventory }; 
            const newEffectiveStats = calculateEffectiveStats(tempUpdatedCharacter);

            if (currentHealth > newEffectiveStats.maxHealth) {
                console.log(`[Requirement Check] Clamping health: ${currentHealth} > ${newEffectiveStats.maxHealth}`);
                currentHealth = newEffectiveStats.maxHealth;
            }
            if (currentBarrier > newEffectiveStats.totalBarrier) {
                console.log(`[Requirement Check] Clamping barrier: ${currentBarrier} > ${newEffectiveStats.totalBarrier}`);
                currentBarrier = newEffectiveStats.totalBarrier;
            }

            updateChar({
                equipment: equipment,
                inventory: inventory,
                maxHealth: newEffectiveStats.maxHealth,
                currentHealth: currentHealth,
                currentBarrier: currentBarrier,
            });
            console.log("Character updated after requirement check unequips.");
        }
    }, [checkRequirements]); // Depends on checkRequirements
    // ----------------------------------------------------

    // --- Handlers ---

    // Handle item dropped (no changes needed here, just accumulates)
    const handleItemDropped = (newItem: EquippableItem) => {
        setItemsToShowInModal((prevDrops) => [...prevDrops, newItem]);
    };

    const clearPendingDrops = () => {
        setItemsToShowInModal([]);
        console.log("all Pending drops cleared.");
    };

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
    }, []);

    // Discard all items FROM DROP modal
    const handleDiscardAllFromDrop = useCallback(() => {
        console.log("Discarding all dropped items.");
        setItemsToShowInModal([]);
        handleCloseDropModal();
    }, [handleCloseDropModal]);

    // --- PendingDropsModal Handlers --- NEW
    const handleOpenPendingDropsModal = () => {
        if(itemsToShowInModal.length > 0) {
            setIsPendingDropsModalOpen(true);
            console.log("Opening pending drops modal.");
        }
    };

    const handleClosePendingDropsModal = () => {
        setIsPendingDropsModalOpen(false);
        console.log("Closing pending drops modal.");
    };

    // --- Inventory Modal Handlers (No change) ---
    const handleOpenInventory = useCallback(() => {
        setIsInventoryOpen(true);
    }, []);

    const handleCloseInventory = useCallback(() => {
        setIsInventoryOpen(false);
    }, []);

    // --- Discard Confirmation Handlers ---
    const handleOpenDiscardConfirm = (item: EquippableItem) => {
        console.log("[useInventoryManager] handleOpenDiscardConfirm called for:", item.name);
        try {
            setItemToDiscard(item);
            console.log("  >>> Called setItemToDiscard");
            setIsConfirmDiscardOpen(true);
            console.log("  >>> Called setIsConfirmDiscardOpen(true)");
        } catch (e) {
            console.error("[useInventoryManager] Error calling discard state setters:", e);
        }
        console.log("[useInventoryManager] Finished handleOpenDiscardConfirm");
    };

    const handleCloseDiscardConfirm = () => {
        setIsConfirmDiscardOpen(false);
        setItemToDiscard(null);
    };

    const handleConfirmDiscard = (itemToDiscard: EquippableItem | null) => { 
        const activeCharacter = useCharacterStore.getState().activeCharacter;
        const updateChar = useCharacterStore.getState().updateCharacter; 
        const saveChar = useCharacterStore.getState().saveCharacter; 
        
        // Use the passed item
        if (!itemToDiscard || !activeCharacter) { 
            console.error("[handleConfirmDiscard] Error: No item provided or no active character.");
            handleCloseDiscardConfirm(); // Still close modal
            return; 
        }
        console.log("[handleConfirmDiscard] Attempting to discard:", itemToDiscard.name);
        // ... (log inventory before)
        const updatedInventory = (activeCharacter.inventory || []).filter(
            (invItem) => invItem.id !== itemToDiscard.id // Use itemToDiscard from arg
        );
        // ... (log inventory after)
        updateChar({ inventory: updatedInventory }); 
        setTimeout(() => { saveChar(); }, 50); 
        handleCloseDiscardConfirm(); 
    }; 

    // --- Handler to close the requirement fail modal ---
    const handleCloseRequirementFailModal = () => {
        setIsRequirementFailModalOpen(false);
        setItemFailedRequirements(null);
    };
    // -------------------------------------------------------

    // --- handleSwapWeapons --- 
    const handleSwapWeapons = useCallback(() => {
        const activeCharacter = useCharacterStore.getState().activeCharacter;
        const updateChar = useCharacterStore.getState().updateCharacter;
        const saveChar = useCharacterStore.getState().saveCharacter; 
        if (!activeCharacter || !activeCharacter.equipment) return;
        const weapon1 = activeCharacter.equipment.weapon1;
        const weapon2 = activeCharacter.equipment.weapon2;
        if (weapon1 && ONE_HANDED_WEAPON_TYPES.has(weapon1.itemType) &&
            weapon2 && ONE_HANDED_WEAPON_TYPES.has(weapon2.itemType)) 
        {
            console.log(`Swapping weapon slots: ${weapon1.name} <-> ${weapon2.name}`);
            const updatedEquipment = { ...activeCharacter.equipment, weapon1: weapon2, weapon2: weapon1 };
            updateChar({ equipment: updatedEquipment });
            setTimeout(() => { saveChar(); }, 50);
        } else {
            console.log("Cannot swap weapons: Requires two one-handed weapons equipped.");
        }
    }, []);
    // --- END handleSwapWeapons ---

    // --- handleUnequipItem --- 
    const handleUnequipItem = useCallback(
        (slotToUnequip: EquipmentSlotId) => {
            const activeCharacter = useCharacterStore.getState().activeCharacter;
            const updateChar = useCharacterStore.getState().updateCharacter;
            const saveChar = useCharacterStore.getState().saveCharacter;
            if (!activeCharacter) return;
            const currentInventory = [...(activeCharacter.inventory || [])];
            const currentEquipment = { ...(activeCharacter.equipment || {}) };
            const itemToUnequip = currentEquipment[slotToUnequip];
            if (!itemToUnequip) {
                console.warn(`Attempted to unequip from empty slot: ${slotToUnequip}`);
                return;
            }
            currentInventory.push(itemToUnequip);
            currentEquipment[slotToUnequip] = null;
            const tempUpdatedCharacter = { ...activeCharacter, equipment: currentEquipment }; 
            const newEffectiveStats = calculateEffectiveStats(tempUpdatedCharacter);
            console.log("[handleUnequipItem] New Effective Stats Calculated:", newEffectiveStats);
            console.log(`[handleUnequipItem] Updating store with maxHealth: ${newEffectiveStats.maxHealth}`);
            updateChar({
                inventory: currentInventory,
                equipment: currentEquipment,
                maxHealth: newEffectiveStats.maxHealth, 
            });
            console.log(`Unequipped ${itemToUnequip.name} from ${slotToUnequip}`);
            setTimeout(() => { saveChar(); }, 50); 
            checkAndHandleRequirementChanges(tempUpdatedCharacter); 
        },
        [checkAndHandleRequirementChanges] 
    );
    // --- END handleUnequipItem ---

    // --- handleEquipItem --- 
    const handleEquipItem = useCallback(
        (itemToEquip: EquippableItem, preferredSlot?: 'weapon1' | 'weapon2' | 'ring1' | 'ring2') => {
            const activeCharacter = useCharacterStore.getState().activeCharacter;
            const updateChar = useCharacterStore.getState().updateCharacter;
            const saveChar = useCharacterStore.getState().saveCharacter;
            if (!activeCharacter) return;
            const meetsRequirements = checkRequirements(activeCharacter, itemToEquip); 
            if (!meetsRequirements) {
                setItemFailedRequirements(itemToEquip);
                setIsRequirementFailModalOpen(true);
                return; 
            }
            let targetSlot: EquipmentSlotId | null = null;
            if (preferredSlot && 
                ( (preferredSlot === 'weapon1' || preferredSlot === 'weapon2') && (ONE_HANDED_WEAPON_TYPES.has(itemToEquip.itemType) || TWO_HANDED_WEAPON_TYPES.has(itemToEquip.itemType) || OFF_HAND_TYPES.has(itemToEquip.itemType)) ) ||
                ( (preferredSlot === 'ring1' || preferredSlot === 'ring2') && itemToEquip.itemType === 'Ring' ) 
               ) {
                targetSlot = preferredSlot;
            } else {
                if (itemToEquip.itemType === 'Ring') {
                    targetSlot = !activeCharacter?.equipment?.ring1 ? 'ring1' : !activeCharacter?.equipment?.ring2 ? 'ring2' : 'ring1';
                } else {
                    targetSlot = getEquipmentSlotForItem(itemToEquip);
                }
            }
            if (!targetSlot) {
                console.error("Could not determine slot for item:", itemToEquip);
                return;
            }
            const isTwoHanded = TWO_HANDED_WEAPON_TYPES.has(itemToEquip.itemType);
            const currentInventory = [...(activeCharacter.inventory || [])];
            const currentEquipment = { ...(activeCharacter.equipment || {}) };
            const itemIndex = currentInventory.findIndex((i) => i.id === itemToEquip.id);
            if (itemIndex === -1) {
                console.error("Item to equip not found in inventory!");
                return; 
            }
            currentInventory.splice(itemIndex, 1);
            const currentlyEquipped = currentEquipment[targetSlot];
            let currentlyEquippedOffhand: EquippableItem | null = null;
            if (currentlyEquipped) {
                console.log(`Adding ${currentlyEquipped.name} back to inventory from slot ${targetSlot}`);
                currentInventory.push(currentlyEquipped);
                currentEquipment[targetSlot] = null; 
            }
            if (isTwoHanded && targetSlot === 'weapon1') {
                currentlyEquippedOffhand = currentEquipment.weapon2 || null;
                if (currentlyEquippedOffhand) {
                    console.log(`Unequipping offhand ${currentlyEquippedOffhand.name} due to 2H weapon`);
                    currentInventory.push(currentlyEquippedOffhand);
                    currentEquipment.weapon2 = null;
                }
            }
            if ((OFF_HAND_TYPES.has(itemToEquip.itemType) || ONE_HANDED_WEAPON_TYPES.has(itemToEquip.itemType)) && targetSlot === 'weapon2') {
                const mainHandItem = currentEquipment.weapon1;
                if (mainHandItem && TWO_HANDED_WEAPON_TYPES.has(mainHandItem.itemType)) {
                    console.log(`Unequipping 2H weapon ${mainHandItem.name} from main hand due to equipping in offhand`);
                    currentInventory.push(mainHandItem);
                    currentEquipment.weapon1 = null;
                }
            }
            currentEquipment[targetSlot] = itemToEquip;
            const tempUpdatedCharacter = { ...activeCharacter, equipment: currentEquipment }; 
            const newEffectiveStats = calculateEffectiveStats(tempUpdatedCharacter);
            console.log("[handleEquipItem] New Effective Stats Calculated:", newEffectiveStats);
            console.log(`[handleEquipItem] Updating store with maxHealth: ${newEffectiveStats.maxHealth}`);
            updateChar({
                inventory: currentInventory,
                equipment: currentEquipment,
                maxHealth: newEffectiveStats.maxHealth,
            });
            console.log(
                `Equipped ${itemToEquip.name} to ${targetSlot}. Replaced: ${currentlyEquipped?.name ?? "None"}
                ${isTwoHanded && currentlyEquippedOffhand ? `and Offhand: ${currentlyEquippedOffhand.name}` : ""}`
            );
            setTimeout(() => { saveChar(); }, 50);
            checkAndHandleRequirementChanges(tempUpdatedCharacter); 
        },
        [
            checkRequirements, 
            checkAndHandleRequirementChanges, 
            setItemFailedRequirements,
            setIsRequirementFailModalOpen,
        ]
    );
    // --- END handleEquipItem ---

    // --- Handlers for Over Capacity Modal ---
    const handleOpenOverCapacityModal = useCallback((itemsToPick: EquippableItem[], spaceNeeded: number) => {
        setItemsPendingPickup(itemsToPick);
        setRequiredSpaceToFree(spaceNeeded);
        setIsOverCapacityModalOpen(true);
        handleCloseDropModal();
    }, [handleCloseDropModal]);

    const handleCloseOverCapacityModal = useCallback(() => {
        setIsOverCapacityModalOpen(false);
        // Do NOT clear pending items here, so if they re-open the modal, the context is the same
        // setItemsPendingPickup([]); 
        // setRequiredSpaceToFree(0);
        
        // Re-open the drop modal so the player can see the items on the ground again
        if (itemsToShowInModal.length > 0) {
            handleOpenDropModalForCollection();
        }
    }, [itemsToShowInModal, handleOpenDropModalForCollection]);

    const handleConfirmOverCapacityDiscard = useCallback((inventoryItemIdsToDiscard: string[]) => {
        if (inventoryItemIdsToDiscard.length < requiredSpaceToFree) {
            console.error("Not enough items selected to discard.");
            return;
        }
        const activeCharacter = useCharacterStore.getState().activeCharacter;
        const updateChar = useCharacterStore.getState().updateCharacter;
        const saveChar = useCharacterStore.getState().saveCharacter;
        if (!activeCharacter) return;
        console.log(`[handleConfirmOverCapacityDiscard] Discarding ${inventoryItemIdsToDiscard.length} items from inventory.`);
        console.log(`[handleConfirmOverCapacityDiscard] Picking up ${itemsPendingPickup.length} pending items.`);
        const currentInventory = activeCharacter.inventory || [];
        const inventoryAfterDiscard = currentInventory.filter(item => !inventoryItemIdsToDiscard.includes(item.id));
        const finalInventory = [...inventoryAfterDiscard, ...itemsPendingPickup];
        updateChar({ inventory: finalInventory });
        setTimeout(() => { saveChar(); }, 50);
        const pendingPickupIds = new Set(itemsPendingPickup.map(item => item.id));
        const remainingGroundItems = itemsToShowInModal.filter(item => !pendingPickupIds.has(item.id));
        setItemsToShowInModal(remainingGroundItems);
        
        // Fully reset state after successful operation
        setIsOverCapacityModalOpen(false);
        setItemsPendingPickup([]);
        setRequiredSpaceToFree(0);
        
        // Close the main drop modal only if there are no items left on the ground
        if (remainingGroundItems.length === 0) {
             handleCloseDropModal(); 
        } else {
             // Otherwise, re-open it to show the remaining items
             handleOpenDropModalForCollection();
        }
    }, [
      requiredSpaceToFree, 
      itemsPendingPickup, 
      itemsToShowInModal, 
      handleCloseDropModal,
      handleOpenDropModalForCollection
    ]);
    // --- END Handlers for Over Capacity Modal ---

    // --- Pickup Handlers (with capacity check) ---
    const handlePickUpAll = useCallback(() => {
        const activeCharacter = useCharacterStore.getState().activeCharacter;
        const updateChar = useCharacterStore.getState().updateCharacter;
        const saveChar = useCharacterStore.getState().saveCharacter;
        if (itemsToShowInModal.length === 0 || !activeCharacter) return;
        const itemsToPickUp = [...itemsToShowInModal]; 
        const currentInventory = activeCharacter.inventory || [];
        const MAX_INVENTORY_SLOTS = 60;
        const availableSpace = MAX_INVENTORY_SLOTS - currentInventory.length;
        console.log(`[handlePickUpAll] Trying to pick up ${itemsToPickUp.length}, Space available: ${availableSpace}`);
        if (itemsToPickUp.length > availableSpace) {
            const spaceNeeded = itemsToPickUp.length - availableSpace;
            console.log(`[handlePickUpAll] Inventory full. Need to free ${spaceNeeded} slots.`);
            handleOpenOverCapacityModal(itemsToPickUp, spaceNeeded);
            return; 
        }
        const newInventory = [...currentInventory, ...itemsToPickUp];
        console.log("[handlePickUpAll] Enough space. Calculated new inventory:", JSON.parse(JSON.stringify(newInventory)));
        updateChar({ inventory: newInventory });
        setTimeout(() => { saveChar(); }, 50);
        console.log(`[handlePickUpAll] Picked up all items. Final inventory size: ${newInventory.length}`);
        setItemsToShowInModal([]);
        handleCloseDropModal();
    }, [
        itemsToShowInModal,
        handleCloseDropModal,
        handleOpenOverCapacityModal 
    ]);

    const handlePickUpSelectedItems = useCallback((itemIds: string[]) => {
        if (itemIds.length === 0) return;
        const activeCharacter = useCharacterStore.getState().activeCharacter;
        const updateChar = useCharacterStore.getState().updateCharacter;
        const saveChar = useCharacterStore.getState().saveCharacter;
        if (!activeCharacter) return;
        const itemsToPick = itemsToShowInModal.filter(item => itemIds.includes(item.id));
        if (itemsToPick.length === 0) return;
        const currentInventory = activeCharacter.inventory || [];
        const MAX_INVENTORY_SLOTS = 60;
        const availableSpace = MAX_INVENTORY_SLOTS - currentInventory.length;
        console.log(`[handlePickUpSelectedItems] Trying to pick up ${itemsToPick.length}, Space available: ${availableSpace}`);
        if (itemsToPick.length > availableSpace) {
            const spaceNeeded = itemsToPick.length - availableSpace;
            console.log(`[handlePickUpSelectedItems] Inventory full. Need to free ${spaceNeeded} slots.`);
            handleOpenOverCapacityModal(itemsToPick, spaceNeeded);
            return; 
        }
        const newInventory = [...currentInventory, ...itemsToPick];
        updateChar({ inventory: newInventory });
        setTimeout(() => { saveChar(); }, 50);
        const remainingItems = itemsToShowInModal.filter(item => !itemIds.includes(item.id));
        setItemsToShowInModal(remainingItems);
        console.log(`[handlePickUpSelectedItems] Picked up ${itemsToPick.length} items. Final inventory size: ${newInventory.length}`);
        if (remainingItems.length === 0) {
            handleCloseDropModal();
        }
    }, [
        itemsToShowInModal,
        handleCloseDropModal,
        handleOpenOverCapacityModal 
    ]);

    const handleDiscardSelectedItems = useCallback((itemIds: string[]) => {
        if (itemIds.length === 0) return;
        console.log(`[handleDiscardSelectedItems] Discarding ${itemIds.length} selected items.`);
        const remainingItems = itemsToShowInModal.filter(item => !itemIds.includes(item.id));
        setItemsToShowInModal(remainingItems);
        if (remainingItems.length === 0) {
            handleCloseDropModal();
        }
    }, [itemsToShowInModal, handleCloseDropModal]);
    // --- END Pickup Handlers ---

    // --- Return states and handlers ---
    return {
        isDropModalOpen,
        itemsToShowInModal,
        isPendingDropsModalOpen,
        isInventoryOpen,
        // Over Capacity state and handlers
        isOverCapacityModalOpen,
        itemsPendingPickup,
        requiredSpaceToFree,
        handleOpenOverCapacityModal,
        handleCloseOverCapacityModal,
        handleConfirmOverCapacityDiscard,
        // Existing handlers
        handleOpenDropModalForCollection,
        handleCloseDropModal,
        handleDiscardAllFromDrop,
        clearPendingDrops,
        handleOpenPendingDropsModal,
        handleClosePendingDropsModal,
        handleOpenInventory,
        handleCloseInventory,
        handleOpenDiscardConfirm,
        handleCloseDiscardConfirm,
        handleConfirmDiscard,
        handlePickUpAll,           // Ensure included
        handleEquipItem,           // Ensure included
        handleItemDropped,
        handleCloseRequirementFailModal,
        handleSwapWeapons,         // Ensure included
        handleUnequipItem,         // Ensure included
        handlePickUpSelectedItems, // Ensure included
        handleDiscardSelectedItems,
    };
};
