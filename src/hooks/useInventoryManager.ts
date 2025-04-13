import { useState, useCallback, Dispatch, SetStateAction } from "react";
import React from 'react'; // Import React for JSX
import { Character, EquippableItem, EquipmentSlotId } from "../types/gameData";
import { saveCharacters, loadCharacters } from "../utils/localStorage"; // Assuming save logic is needed here or passed in

// Helper simples para determinar slot (PRECISA SER REFINADO) - Moved from page
const TWO_HANDED_WEAPON_TYPES = new Set([
  "TwoHandedSword",
  "TwoHandedAxe",
  "TwoHandedMace",
  "Bow",
  "Staff",
]); // Add all relevant 2H types

const getEquipmentSlotForItem = (
  item: EquippableItem
): EquipmentSlotId | null => {
  switch (item.itemType) {
    case "Helm": return "helm";
    case "Body Armor": return "bodyArmor";
    case "Gloves": return "gloves";
    case "Boots": return "boots";
    case "Belt": return "belt";
    case "Amulet": return "amulet";
    case "Ring": return "ring1"; // Simplification
    case "Sword": case "Axe": case "Mace":
    case "TwoHandedSword": case "TwoHandedAxe": case "TwoHandedMace":
    case "Bow": case "Staff":
      return "weapon1";
    default:
      console.warn(
        `Cannot determine equipment slot for item type: ${item.itemType}`
      );
      return null;
  }
};


// --- Hook Definition ---
interface UseInventoryManagerProps {
  activeCharacter: Character | null;
  setActiveCharacter: Dispatch<SetStateAction<Character | null>>;
  saveUpdatedCharacter: (updatedChar: Character) => void; // Pass save function
  setTextBoxContent: Dispatch<SetStateAction<React.ReactNode>>; // Pass setTextBoxContent
}

export const useInventoryManager = ({
  activeCharacter,
  setActiveCharacter,
  saveUpdatedCharacter,
  setTextBoxContent,
}: UseInventoryManagerProps) => {

  // --- States Moved from Page ---
  const [isDropModalOpen, setIsDropModalOpen] = useState(false);
  const [itemsToShowInModal, setItemsToShowInModal] = useState<EquippableItem[]>([]);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isConfirmDiscardOpen, setIsConfirmDiscardOpen] = useState(false);
  const [itemToDiscard, setItemToDiscard] = useState<EquippableItem | null>(null);

  // --- Handlers Moved and Adapted ---

  // Drop Modal Related
   const handleOpenDropModal = useCallback((items: EquippableItem[]) => {
    if (items.length > 0) {
      setItemsToShowInModal(items);
      setIsDropModalOpen(true);
      // Set initial text box content when modal opens? Or handle in page?
       setTextBoxContent("..."); // Reset textbox when drop modal opens
    } else {
         setTextBoxContent("..."); // Also reset if no items dropped
    }
   }, [setTextBoxContent]); // Added dependency

   const handleCloseDropModal = useCallback(() => {
     setIsDropModalOpen(false);
     setItemsToShowInModal([]);
     setTextBoxContent("..."); // Reset text box on close
   }, [setTextBoxContent]);

   // Discard individual item FROM DROP modal
    const handleDiscardItemFromDrop = useCallback((itemToDiscard: EquippableItem) => {
        console.log("Discarding item from drop:", itemToDiscard.name);
        const remainingItems = itemsToShowInModal.filter((i) => i.id !== itemToDiscard.id);
        setItemsToShowInModal(remainingItems);
        // Check if modal should close after discarding the last item
        if (remainingItems.length === 0) {
             handleCloseDropModal();
        }
    }, [itemsToShowInModal, handleCloseDropModal]); // Updated dependencies

    // Discard all items FROM DROP modal (called by the "Descartar Tudo" button)
    const handleDiscardAllFromDrop = useCallback(() => {
        console.log("Discarding all dropped items.");
        handleCloseDropModal(); // Reuses closing logic
    }, [handleCloseDropModal]);


  // Inventory Modal Related
  const handleOpenInventory = useCallback(() => {
    setIsInventoryOpen(true);
  }, []);

  const handleCloseInventory = useCallback(() => {
    setIsInventoryOpen(false);
  }, []);

  // Discard Confirmation (for items ALREADY in inventory)
  const handleOpenDiscardConfirm = useCallback((item: EquippableItem) => {
    setItemToDiscard(item);
    setIsConfirmDiscardOpen(true);
  }, []);

  const handleCloseDiscardConfirm = useCallback(() => {
    setIsConfirmDiscardOpen(false);
    setItemToDiscard(null);
  }, []);

  // Actually discard item FROM INVENTORY
  const handleConfirmDiscard = useCallback(() => {
    if (!itemToDiscard || !activeCharacter) return;

    console.log("Confirming discard (from inventory):", itemToDiscard.name);
    setActiveCharacter((prevChar) => {
      if (!prevChar) return prevChar;
      const updatedInventory = (prevChar.inventory || []).filter(
        (invItem) => invItem.id !== itemToDiscard.id
      );
      const updatedChar = { ...prevChar, inventory: updatedInventory };
      saveUpdatedCharacter(updatedChar);
      return updatedChar;
    });

    handleCloseDiscardConfirm();
  }, [
    itemToDiscard,
    activeCharacter,
    setActiveCharacter,
    saveUpdatedCharacter,
    handleCloseDiscardConfirm,
  ]);

  // Pick Up/Equip Logic (needs setActiveCharacter)
  const handlePickUpItem = useCallback(
    (item: EquippableItem) => {
        let pickedUp = false; // Flag
        setActiveCharacter((prevChar) => {
            if (!prevChar) return prevChar;
            const currentInventory = [...(prevChar.inventory || [])];
            const MAX_INVENTORY_SLOTS = 60;
            if (currentInventory.length >= MAX_INVENTORY_SLOTS) {
                const removed = currentInventory.shift();
                console.log("Inventory full, removing oldest item:", removed?.name);
            }
            currentInventory.push(item);
            const updatedChar = { ...prevChar, inventory: currentInventory };
            saveUpdatedCharacter(updatedChar);
            console.log(`Picked up ${item.name}. Inventory size: ${currentInventory.length}`);
            pickedUp = true;
            return updatedChar;
        });

        if(pickedUp) {
            const remainingItems = itemsToShowInModal.filter((i) => i.id !== item.id);
            setItemsToShowInModal(remainingItems);
             // Check if modal should close after picking up the last item
            if (remainingItems.length === 0) {
                 handleCloseDropModal();
            }
        }
    },
    [activeCharacter, setActiveCharacter, saveUpdatedCharacter, itemsToShowInModal, handleCloseDropModal]
  );

  const handlePickUpAll = useCallback(() => {
    if (itemsToShowInModal.length === 0) return;

    setActiveCharacter((prevChar) => {
      if (!prevChar) return prevChar;
      const currentInventory = [...(prevChar.inventory || [])];
      const itemsToPickUp = [...itemsToShowInModal];
      const MAX_INVENTORY_SLOTS = 60;
      console.log(`Attempting to pick up ${itemsToPickUp.length} items.`);
      for (const item of itemsToPickUp) {
        if (currentInventory.length >= MAX_INVENTORY_SLOTS) {
          const removedItem = currentInventory.shift();
           console.log("Inventory full during Pick Up All, removing oldest item:", removedItem?.name);
        }
        currentInventory.push(item);
      }
      const updatedChar = { ...prevChar, inventory: currentInventory };
      saveUpdatedCharacter(updatedChar);
      console.log(`Picked up all items. Final inventory size: ${currentInventory.length}`);
      return updatedChar;
    });

    handleCloseDropModal(); // Clear and close modal
  }, [activeCharacter, setActiveCharacter, itemsToShowInModal, saveUpdatedCharacter, handleCloseDropModal]);

  const handleEquipItem = useCallback(
    (itemToEquip: EquippableItem) => {
      let equipSuccess = false;

      setActiveCharacter((prevChar) => {
        if (!prevChar) return prevChar;

        // --- Check Requirements ---
        let requirementFailed = false;
        const errorMessages: React.ReactNode[] = []; // Use const
        if (itemToEquip.requirements) {
          if (itemToEquip.requirements.level && prevChar.level < itemToEquip.requirements.level) {
            requirementFailed = true;
            errorMessages.push(<span key="level-req">Requer Nível {itemToEquip.requirements.level}</span>);
          }
          if (itemToEquip.requirements.strength && prevChar.strength < itemToEquip.requirements.strength) {
            requirementFailed = true;
            errorMessages.push(<span key="str-req">Requer {itemToEquip.requirements.strength} Força</span>);
          }
           if (itemToEquip.requirements.dexterity && prevChar.dexterity < itemToEquip.requirements.dexterity) {
             requirementFailed = true;
             errorMessages.push(<span key="dex-req">Requer {itemToEquip.requirements.dexterity} Destreza</span>);
           }
           if (itemToEquip.requirements.intelligence && prevChar.intelligence < itemToEquip.requirements.intelligence) {
             requirementFailed = true;
             errorMessages.push(<span key="int-req">Requer {itemToEquip.requirements.intelligence} Inteligência</span>);
           }
        }

        if (requirementFailed) {
           console.log(`Requirements not met to equip ${itemToEquip.name}. Player Level: ${prevChar.level}, Str: ${prevChar.strength}, Dex: ${prevChar.dexterity}, Int: ${prevChar.intelligence}`);
           setTextBoxContent(
             <span className="text-red-500">
               Requisitos não atendidos para {itemToEquip.name}: {errorMessages.map((msg, index) => <React.Fragment key={index}>{index > 0 && ", "}{msg}</React.Fragment>)}
             </span>
           );
           return prevChar;
        }
        // --- End Check Requirements ---

        const targetSlot = getEquipmentSlotForItem(itemToEquip);
        if (!targetSlot) {
          console.error(`Could not determine slot for ${itemToEquip.name}`);
           setTextBoxContent(<span className="text-red-500">Não foi possível determinar o slot para {itemToEquip.name}.</span>);
          return prevChar;
        }

        const currentEquipment = { ...(prevChar.equipment || {}) };
        const currentInventory = [...(prevChar.inventory || [])];
        const itemInSlot = currentEquipment[targetSlot];
        const MAX_INVENTORY_SLOTS = 60;

         console.log(`Equipping ${itemToEquip.name} into slot ${targetSlot}. Item currently in slot: ${itemInSlot?.name ?? "None"}`);

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

        const updatedChar: Character = { ...prevChar, equipment: currentEquipment, inventory: currentInventory };
        saveUpdatedCharacter(updatedChar);
        equipSuccess = true;
        return updatedChar;
      }); // End setActiveCharacter

      if (equipSuccess) {
           setTextBoxContent(`${itemToEquip.name} equipado.`);
            const remainingItems = itemsToShowInModal.filter((i) => i.id !== itemToEquip.id);
            setItemsToShowInModal(remainingItems);
            // Check if modal should close after equipping the last item
             if (remainingItems.length === 0) {
                  handleCloseDropModal();
             }
      }
    },
    [activeCharacter, setActiveCharacter, saveUpdatedCharacter, setTextBoxContent, itemsToShowInModal, handleCloseDropModal]
  );


  // --- Return states and handlers ---
  return {
    // States
    isDropModalOpen,
    itemsToShowInModal,
    isInventoryOpen,
    isConfirmDiscardOpen,
    itemToDiscard,

    // Handlers
    handleOpenDropModal,
    handleCloseDropModal,
    handleDiscardItemFromDrop,
    handleDiscardAllFromDrop,

    handleOpenInventory,
    handleCloseInventory,

    handleOpenDiscardConfirm,
    handleCloseDiscardConfirm,
    handleConfirmDiscard,

    handlePickUpItem,
    handlePickUpAll,
    handleEquipItem,
  };
};
