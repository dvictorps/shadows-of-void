import { useState, useCallback, Dispatch, SetStateAction } from "react";
import React from 'react'; // Import React for JSX
import { Character, EquippableItem, EquipmentSlotId } from "../types/gameData";
import { calculateTotalStrength, calculateTotalDexterity, calculateTotalIntelligence, calculateFinalMaxHealth } from "../utils/statUtils"; // Import helpers
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

    // --- ADD LOG TO CHECK RECEIVED PROPS ---
    console.log("[useInventoryManager Hook Init] Received Props:", {
        setTextBoxContent: typeof setTextBoxContent,
        setIsConfirmDiscardOpen: typeof setIsConfirmDiscardOpen,
        setItemToDiscard: typeof setItemToDiscard,
        setIsRequirementFailModalOpen: typeof setIsRequirementFailModalOpen,
        setItemFailedRequirements: typeof setItemFailedRequirements
    });
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

    // --- Handlers ---

    // Handle item dropped (no changes needed here, just accumulates)
    const handleItemDropped = (newItem: EquippableItem) => {
        setItemsToShowInModal((prevDrops) => [...prevDrops, newItem]);
    };

    // Clear pending drops (no changes needed)
    const clearPendingDrops = () => {
        setItemsToShowInModal([]);
        console.log("Pending drops cleared.");
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

    // Helper to add item to inventory, handling max capacity
    const addToInventory = (itemToAdd: EquippableItem, currentInventory: EquippableItem[]): EquippableItem[] => {
        const MAX_INVENTORY_SLOTS = 60;
        const updatedInventory = [...currentInventory];
        if (updatedInventory.length >= MAX_INVENTORY_SLOTS) {
            const removedItem = updatedInventory.shift(); // Remove oldest
            console.log("[addToInventory] Inventory full, removing oldest item:", removedItem?.name);
        }
        updatedInventory.push(itemToAdd);
        console.log(`[addToInventory] Added ${itemToAdd.name} to inventory. New size: ${updatedInventory.length}`);
        return updatedInventory;
    };

    // --- Major Refactor of handleEquipItem --- 
    const handleEquipItem = (itemToEquip: EquippableItem, preferredSlot?: 'weapon1' | 'weapon2') => {
        const activeCharacter = useCharacterStore.getState().activeCharacter;
        const updateChar = useCharacterStore.getState().updateCharacter;
        const saveChar = useCharacterStore.getState().saveCharacter;
        if (!activeCharacter) return;

        // --- Calculate Total Attributes BEFORE checking requirements --- 
        const totalStr = calculateTotalStrength(activeCharacter);
        const totalDex = calculateTotalDexterity(activeCharacter);
        const totalInt = calculateTotalIntelligence(activeCharacter);
        // ------------------------------------------------------------

        // --- Check Requirements --- Use calculated totals
        let requirementFailed = false;
        if (itemToEquip.requirements) {
            if (itemToEquip.requirements.level && activeCharacter.level < itemToEquip.requirements.level) requirementFailed = true;
            // Check against totalStr, totalDex, totalInt
            if (!requirementFailed && itemToEquip.requirements.strength && totalStr < itemToEquip.requirements.strength) requirementFailed = true; 
            if (!requirementFailed && itemToEquip.requirements.dexterity && totalDex < itemToEquip.requirements.dexterity) requirementFailed = true;
            if (!requirementFailed && itemToEquip.requirements.intelligence && totalInt < itemToEquip.requirements.intelligence) requirementFailed = true;
        }

        if (requirementFailed) {
            console.log("[handleEquipItem] Requirement failed! Setting modal state via page setters."); 
            console.log("  >>> typeof setItemFailedRequirements received:", typeof setItemFailedRequirements);
            try {
                setItemFailedRequirements(itemToEquip); 
                console.log("  >>> Called setItemFailedRequirements successfully");
                console.log("  >>> typeof setIsRequirementFailModalOpen received:", typeof setIsRequirementFailModalOpen);
                setIsRequirementFailModalOpen(true);   
                console.log("  >>> Called setIsRequirementFailModalOpen successfully");
            } catch (e) {
                 console.error("[handleEquipItem] Error calling requirement fail state setters:", e);
            }
            console.log("[handleEquipItem] Finished requirement fail block.");
            return;
        }
        // --- End Check Requirements ---

        const currentEquipment = { ...(activeCharacter.equipment || {}) }; // Use const
        let currentInventory = [...(activeCharacter.inventory || [])];
        const itemType = itemToEquip.itemType;
        const weapon1 = currentEquipment.weapon1 ?? null;
        const weapon2 = currentEquipment.weapon2 ?? null;
        let itemUnequipped: EquippableItem | null = null;
        let itemUnequipped2: EquippableItem | null = null;

        // --- Determine Target Slot and Handle Conflicts ---
        let finalTargetSlot: EquipmentSlotId | null = null;

        console.log(`[handleEquipItem START] Equipping: ${itemToEquip.name} (Type: ${itemType}), PreferredSlot: ${preferredSlot}`);
        console.log(`  Current Weapon1: ${weapon1?.name ?? 'None'}, Current Weapon2: ${weapon2?.name ?? 'None'}`);

        if (ONE_HANDED_WEAPON_TYPES.has(itemType)) {
            console.log("  Item is One-Handed Weapon.");
            // --- Logic for One-Handed Weapon ---
            if (weapon1 && TWO_HANDED_WEAPON_TYPES.has(weapon1.itemType)) {
                // 1. Equipping 1H while 2H is equipped -> Equip in slot 1, unequip 2H
                console.log("  Scenario 1 (1H vs 2H): Equipping in slot 1, unequipping 2H.");
                finalTargetSlot = 'weapon1';
                itemUnequipped = weapon1;
                currentEquipment.weapon2 = null; 
            } else if (!weapon1) {
                // 2. Slot 1 is empty -> Equip in slot 1
                console.log("  Scenario 2 (Slot 1 empty): Equipping in slot 1.");
                finalTargetSlot = 'weapon1';
            } else if (weapon1 && ONE_HANDED_WEAPON_TYPES.has(weapon1.itemType) && !weapon2) {
                // 3. Slot 1 has 1H, Slot 2 is empty -> Equip in slot 2 (unless preferredSlot is 1)
                finalTargetSlot = (preferredSlot === 'weapon1') ? 'weapon1' : 'weapon2'; 
                console.log(`  Scenario 3 (Slot 1 has 1H, Slot 2 empty): Target determined as ${finalTargetSlot} (preferred: ${preferredSlot})`);
                if (preferredSlot === 'weapon1') {
                    itemUnequipped = weapon1;
                    console.log(`    Unequipping existing weapon1: ${itemUnequipped?.name}`);
                } else {
                    console.log(`    Equipping into empty slot 2.`);
                }
            } else if (weapon1 && ONE_HANDED_WEAPON_TYPES.has(weapon1.itemType) && weapon2 && ONE_HANDED_WEAPON_TYPES.has(weapon2.itemType)) {
                // 4. Both slots have 1H -> Use preferredSlot or default to weapon1
                finalTargetSlot = preferredSlot || 'weapon1';
                itemUnequipped = currentEquipment[finalTargetSlot] ?? null;
                console.log(`  Scenario 4 (Dual Wielding): Target determined as ${finalTargetSlot} (preferred: ${preferredSlot}). Unequipping: ${itemUnequipped?.name ?? "None"}`);
            } else if (weapon1 && ONE_HANDED_WEAPON_TYPES.has(weapon1.itemType) && weapon2 && OFF_HAND_TYPES.has(weapon2.itemType)) {
                // 5. Slot 1 has 1H, Slot 2 has Shield 
                //    Allow replacing weapon1 OR weapon2 (which unequips shield)
                if (preferredSlot === 'weapon2') {
                    // User chose to replace shield
                    console.log("  Scenario 5a (1H + Shield): Replacing Shield with 1H in slot 2.");
                    finalTargetSlot = 'weapon2';
                    itemUnequipped = weapon2; // Unequip the shield
                } else {
                    // Default or preferredSlot === 'weapon1' -> replace weapon1
                    console.log("  Scenario 5b (1H + Shield): Replacing 1H in slot 1.");
                    finalTargetSlot = 'weapon1';
                    itemUnequipped = weapon1; // Unequip the weapon
                }
            } else {
                console.error("  Unhandled 1H weapon equip scenario. weapon1:", weapon1, "weapon2:", weapon2);
                setTextBoxContent("Erro inesperado ao equipar arma de uma mão.");
                return;
            }
        } else if (TWO_HANDED_WEAPON_TYPES.has(itemType)) {
            console.log("  Item is Two-Handed Weapon.");
            // --- Logic for Two-Handed Weapon ---
            console.log(`  Equipping 2H (${itemToEquip.name}), unequipping both weapon slots.`);
            finalTargetSlot = 'weapon1';
            itemUnequipped = weapon1; 
            itemUnequipped2 = weapon2; 
            currentEquipment.weapon2 = null; 
        } else if (OFF_HAND_TYPES.has(itemType)) {
            console.log("  Item is Off-Hand.");
            // --- Logic for Shield (or other Off-Hand) ---
            if (weapon1 && TWO_HANDED_WEAPON_TYPES.has(weapon1.itemType)) {
                // 1. Equipping Shield while 2H is equipped -> Unequip 2H
                console.log(`  Equipping Off-Hand (${itemToEquip.name}), unequipping 2H (${weapon1.name})`);
                itemUnequipped = weapon1;
                currentEquipment.weapon1 = null;
            }
            finalTargetSlot = 'weapon2';
            itemUnequipped2 = weapon2; 
            console.log(`  Equipping ${itemToEquip.name} in slot 2. Unequipping: ${itemUnequipped2?.name ?? "None"}`);
        } else {
            console.log("  Item is Other Gear.");
            // --- Logic for Other Gear ---
            finalTargetSlot = getEquipmentSlotForItem(itemToEquip);
            if (finalTargetSlot) {
                itemUnequipped = currentEquipment[finalTargetSlot] ?? null; 
                console.log(`  Equipping ${itemToEquip.name} in slot ${finalTargetSlot}. Unequipping: ${itemUnequipped?.name ?? "None"}`);
            } else {
                console.error(`  Could not determine slot for ${itemToEquip.name}`);
                setTextBoxContent(`Não foi possível determinar o slot para ${itemToEquip.name}.`);
                return;
            }
        }

        console.log(`[handleEquipItem END] Final Target Slot: ${finalTargetSlot}, Item Unequipped1: ${itemUnequipped?.name ?? 'None'}, Item Unequipped2: ${itemUnequipped2?.name ?? 'None'}`);

        // --- Perform Equip --- 
        if (finalTargetSlot) {
            currentEquipment[finalTargetSlot] = itemToEquip;
        } else {
            console.error("Logic error: finalTargetSlot not determined!");
            return; // Should not happen
        }

        // --- Handle Inventory Updates ---
        // Remove equipped item from inventory (if it was there)
        const inventoryIndex = currentInventory.findIndex((invItem) => invItem.id === itemToEquip.id);
        if (inventoryIndex > -1) {
            currentInventory.splice(inventoryIndex, 1);
        }

        // Add unequipped item(s) back to inventory
        if (itemUnequipped) {
            currentInventory = addToInventory(itemUnequipped, currentInventory);
        }
        if (itemUnequipped2) { // For 2h weapons or shields replacing weapon2
            currentInventory = addToInventory(itemUnequipped2, currentInventory);
        }

        // --- Recalculate Stats & Update Store --- Needs totalStr for max health calc
        const tempCharForCalc: Character = { ...activeCharacter, equipment: currentEquipment }; // Use updated equipment
        // const newTotalStrength = calculateTotalStrength(tempCharForCalc); // Already calculated as totalStr earlier for req check
        let newFlatHealthFromMods = 0;
        Object.values(currentEquipment).forEach(item => {
            if (item) item.modifiers.forEach(mod => {
                if (mod.type === 'MaxHealth') newFlatHealthFromMods += mod.value ?? 0; 
            });
        });
        // Use the totalStr calculated earlier
        const newMaxHealth = calculateFinalMaxHealth(
            activeCharacter.maxHealth, // Assuming this is BASE health BEFORE this item's potential mods
            totalStr, // Pass the calculated total strength
            newFlatHealthFromMods // Pass the recalculated flat health
        );
        const newCurrentHealth = Math.min(activeCharacter.currentHealth, newMaxHealth);

        console.log("Calling updateCharacter with equip changes...");
        updateChar({
            equipment: currentEquipment,
            inventory: currentInventory,
            maxHealth: newMaxHealth,
            currentHealth: newCurrentHealth,
        });
        console.log("updateCharacter call completed.");

        setTimeout(() => {
            // Call saveChar WITHOUT arguments
            console.log("Calling saveCharacter after equip timeout...");
            saveChar();
        }, 50);

        setTextBoxContent(`${itemToEquip.name} equipado.`);
        // Update LOCAL modal state
        const remainingItems = itemsToShowInModal.filter((i) => i.id !== itemToEquip.id);
        setItemsToShowInModal(remainingItems);
        if (remainingItems.length === 0) {
            handleCloseDropModal();
        }
    };

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
    };
};
