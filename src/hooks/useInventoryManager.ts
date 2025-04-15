import { useState, useCallback, Dispatch, SetStateAction } from "react";
import React from 'react'; // Import React for JSX
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
  setTextBoxContent: Dispatch<SetStateAction<React.ReactNode>>;
  setIsConfirmDiscardOpen: Dispatch<SetStateAction<boolean>>;
  setItemToDiscard: Dispatch<SetStateAction<EquippableItem | null>>;
  setIsRequirementFailModalOpen: Dispatch<SetStateAction<boolean>>;
  setItemFailedRequirements: Dispatch<SetStateAction<EquippableItem | null>>;
}

export const useInventoryManager = ({
    setTextBoxContent,
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

        Object.entries(equipment).forEach(([slot, item]: [string, EquippableItem | null]) => {
            if (item && !checkRequirements(currentCharacter, item)) {
                console.log(`Item ${item.name} in slot ${slot} no longer meets requirements.`);
                itemsToUnequip.push({ slot: slot as EquipmentSlotId, item });
            }
        });

        if (itemsToUnequip.length > 0) {
            itemsToUnequip.forEach(({ slot, item }) => {
                equipment[slot] = null; // Clear slot
                inventory.push(item); // Add back to inventory
                setTextBoxContent(`Item ${item.name} desequipado por falta de requisitos.`);
                 // Potentially open a modal here too if desired
                 // setItemFailedRequirements(item); // Maybe reuse?
                 // setIsRequirementFailModalOpen(true);
            });

            // Recalculate stats after unequipping ALL necessary items
            const tempUpdatedCharacter = { ...currentCharacter, equipment };
            const newEffectiveStats = calculateEffectiveStats(tempUpdatedCharacter);

            updateChar({
                equipment: equipment,
                inventory: inventory,
                maxHealth: newEffectiveStats.maxHealth, // Update health again
            });
            console.log("Character updated after requirement check unequips.");
            // Consider saving character here too
        }
    }, [checkRequirements, setTextBoxContent]); // Depends on checkRequirements and setTextBoxContent
    // ----------------------------------------------------

    // --- Handlers ---

    // Handle item dropped (no changes needed here, just accumulates)
    const handleItemDropped = (newItem: EquippableItem) => {
        setItemsToShowInModal((prevDrops) => [...prevDrops, newItem]);
    };

    // Clear pending drops (no changes needed)
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

    // --- Pick Up / Equip Handlers ---
    const handlePickUpItem = useCallback(
        (item: EquippableItem) => {
            const activeCharacter = useCharacterStore.getState().activeCharacter;
            const updateChar = useCharacterStore.getState().updateCharacter;
            const saveChar = useCharacterStore.getState().saveCharacter; // Get save function
            if (!activeCharacter) return;

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
            updateChar({ inventory: currentInventory });
            pickedUp = true;

            // Save after update (consider removing later)
            setTimeout(() => {
                // Call saveChar WITHOUT arguments
                saveChar();
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
        [itemsToShowInModal, handleCloseDropModal]
    );

    const handlePickUpAll = useCallback(() => {
        const activeCharacter = useCharacterStore.getState().activeCharacter;
        const updateChar = useCharacterStore.getState().updateCharacter;
        const saveChar = useCharacterStore.getState().saveCharacter; // Get save function
        if (itemsToShowInModal.length === 0 || !activeCharacter) return;

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
        updateChar({ inventory: currentInventory });

        // Save after update (consider removing later)
        setTimeout(() => {
            // Call saveChar WITHOUT arguments
            saveChar();
        }, 50);

        console.log(`[handlePickUpAll] Picked up all items. Final inventory size: ${currentInventory.length}`);

        // Clear modal state AFTER initiating the character state update
        setItemsToShowInModal([]);
        handleCloseDropModal();
    }, [itemsToShowInModal, handleCloseDropModal]
    );

    // --- Handle Unequipping Item --- NEW
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

            // 1. Add item back to inventory (check space? NO, just add)
            currentInventory.push(itemToUnequip);

            // 2. Clear the equipment slot
            currentEquipment[slotToUnequip] = null;

             // --- Recalculate Stats and Update Store ---
            const tempUpdatedCharacter = { ...activeCharacter, equipment: currentEquipment }; // Use updated equipment
            const newEffectiveStats = calculateEffectiveStats(tempUpdatedCharacter);

            console.log("[handleUnequipItem] New Effective Stats Calculated:", newEffectiveStats);

            // <<< Log BEFORE updateChar >>>
            console.log(`[handleUnequipItem] Updating store with maxHealth: ${newEffectiveStats.maxHealth}`);

            updateChar({
                inventory: currentInventory,
                equipment: currentEquipment,
                maxHealth: newEffectiveStats.maxHealth, // <<< ADD MAX HEALTH UPDATE >>>
            });
            // -------------------------------------------

            console.log(`Unequipped ${itemToUnequip.name} from ${slotToUnequip}`);

            // Save after update
            setTimeout(() => { saveChar(); }, 50);

             // --- Post-Unequip Requirement Check ---
             checkAndHandleRequirementChanges(activeCharacter);
            // ------------------------------------
        },
        [checkAndHandleRequirementChanges]
    );

    // --- Major Refactor of handleEquipItem --- 
    const handleEquipItem = useCallback(
        (itemToEquip: EquippableItem, preferredSlot?: 'weapon1' | 'weapon2') => {
            const activeCharacter = useCharacterStore.getState().activeCharacter;
            const updateChar = useCharacterStore.getState().updateCharacter;
            const saveChar = useCharacterStore.getState().saveCharacter;
            if (!activeCharacter) return;

            // --- Check Requirements FIRST ---
            const meetsRequirements = checkRequirements(activeCharacter, itemToEquip); // USE checkRequirements
            if (!meetsRequirements) {
                setItemFailedRequirements(itemToEquip);
                setIsRequirementFailModalOpen(true);
                return; // Stop equipping
            }
            // -----------------------------

            const targetSlot = preferredSlot || getEquipmentSlotForItem(itemToEquip);

            if (!targetSlot) {
                console.error("Could not determine slot for item:", itemToEquip);
                return;
            }

            // Check if item is two-handed
            const isTwoHanded = TWO_HANDED_WEAPON_TYPES.has(itemToEquip.itemType);

            const currentInventory = [...(activeCharacter.inventory || [])];
            const currentEquipment = { ...(activeCharacter.equipment || {}) };

            // 1. Remove item from inventory
            const itemIndex = currentInventory.findIndex((i) => i.id === itemToEquip.id);
            if (itemIndex === -1) {
                console.error("Item to equip not found in inventory!");
                return; // Should not happen
            }
            currentInventory.splice(itemIndex, 1);

            // 2. Handle Unequipping Existing Item(s)
            const currentlyEquipped = currentEquipment[targetSlot];
            let currentlyEquippedOffhand: EquippableItem | null = null;

            if (currentlyEquipped) {
                console.log(`Adding ${currentlyEquipped.name} back to inventory from slot ${targetSlot}`);
                // Add to inventory (no check needed, just push)
                currentInventory.push(currentlyEquipped);
                currentEquipment[targetSlot] = null; // Clear the slot
            }

            // If equipping a 2H weapon, also unequip the offhand (slot 2)
            if (isTwoHanded && targetSlot === 'weapon1') {
                currentlyEquippedOffhand = currentEquipment.weapon2 || null;
                if (currentlyEquippedOffhand) {
                    console.log(`Unequipping offhand ${currentlyEquippedOffhand.name} due to 2H weapon`);
                    currentInventory.push(currentlyEquippedOffhand);
                    currentEquipment.weapon2 = null;
                }
            }
            // <<< NEW: If equipping Shield/Offhand in weapon2, unequip 2H from weapon1 >>>
            if ((OFF_HAND_TYPES.has(itemToEquip.itemType) || ONE_HANDED_WEAPON_TYPES.has(itemToEquip.itemType)) && targetSlot === 'weapon2') {
                const mainHandItem = currentEquipment.weapon1;
                if (mainHandItem && TWO_HANDED_WEAPON_TYPES.has(mainHandItem.itemType)) {
                    console.log(`Unequipping 2H weapon ${mainHandItem.name} from main hand due to equipping in offhand`);
                    currentInventory.push(mainHandItem);
                    currentEquipment.weapon1 = null;
                }
            }
            // <<< END NEW >>>

            // 3. Equip the new item
            currentEquipment[targetSlot] = itemToEquip;

            // --- Recalculate Stats and Update Store ---
            const tempUpdatedCharacter = { ...activeCharacter, equipment: currentEquipment }; // Use updated equipment
            const newEffectiveStats = calculateEffectiveStats(tempUpdatedCharacter);

            console.log("[handleEquipItem] New Effective Stats Calculated:", newEffectiveStats);

            // <<< Log BEFORE updateChar >>>
            console.log(`[handleEquipItem] Updating store with maxHealth: ${newEffectiveStats.maxHealth}`);

            updateChar({
                inventory: currentInventory,
                equipment: currentEquipment,
                maxHealth: newEffectiveStats.maxHealth, // <<< ADD MAX HEALTH UPDATE >>>
            });
            // -------------------------------------------

            console.log(
                `Equipped ${itemToEquip.name} to ${targetSlot}. Replaced: ${currentlyEquipped?.name ?? "None"}
                ${isTwoHanded && currentlyEquippedOffhand ? `and Offhand: ${currentlyEquippedOffhand.name}` : ""}`
            );

            // Save after update
            setTimeout(() => { saveChar(); }, 50);

            // --- Post-Equip Requirement Check ---
            // Needed if equipping this item makes *another* item invalid
            checkAndHandleRequirementChanges(activeCharacter); // USE checkAndHandleRequirementChanges
            // ------------------------------------
        },
        [
            checkRequirements, // Add dependency
            checkAndHandleRequirementChanges, // Add new dependency
            setItemFailedRequirements,
            setIsRequirementFailModalOpen,
        ]
    );

    // --- NEW Handler to close the requirement fail modal ---
    const handleCloseRequirementFailModal = () => {
        setIsRequirementFailModalOpen(false);
        setItemFailedRequirements(null);
    };
    // -------------------------------------------------------

    // --- ADD NEW: handleSwapWeapons --- 
    const handleSwapWeapons = useCallback(() => {
        const activeCharacter = useCharacterStore.getState().activeCharacter;
        const updateChar = useCharacterStore.getState().updateCharacter;
        const saveChar = useCharacterStore.getState().saveCharacter; // Get save function
        if (!activeCharacter || !activeCharacter.equipment) return;

        const weapon1 = activeCharacter.equipment.weapon1;
        const weapon2 = activeCharacter.equipment.weapon2;

        // Check if both slots have 1H weapons
        if (weapon1 && ONE_HANDED_WEAPON_TYPES.has(weapon1.itemType) &&
            weapon2 && ONE_HANDED_WEAPON_TYPES.has(weapon2.itemType)) 
        {
            console.log(`Swapping weapon slots: ${weapon1.name} <-> ${weapon2.name}`);
            const updatedEquipment = { 
                ...activeCharacter.equipment, 
                weapon1: weapon2, 
                weapon2: weapon1 
            };
            updateChar({ equipment: updatedEquipment });
            // Save needed?
            setTimeout(() => {
                // Call saveChar WITHOUT arguments
                saveChar();
            }, 50);
            setTextBoxContent("Armas trocadas de slot.");
        } else {
            console.log("Cannot swap weapons: Requires two one-handed weapons equipped.");
            setTextBoxContent("É necessário ter duas armas de uma mão equipadas para trocar.");
        }
    }, [setTextBoxContent]);

    // --- Return states and handlers ---
    return {
        isDropModalOpen,          // For collection modal
        itemsToShowInModal,       // Pending/Collection items list
        isPendingDropsModalOpen,  // NEW: For view-only modal
        isInventoryOpen,
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
        handleCloseRequirementFailModal,
        handleSwapWeapons,          // Return the new swap function
        handleUnequipItem,          // RETURN NEW UNEQUIP FUNCTION
    };
};
