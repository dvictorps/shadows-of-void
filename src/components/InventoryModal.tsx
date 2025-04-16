"use client";

import React, { useState, useMemo, useCallback } from "react";
import Image from "next/image";
import Modal from "./Modal";
import Button from "./Button";
import {
  EquippableItem,
  EquipmentSlotId,
  OverallGameData,
} from "../types/gameData";
import ItemTooltipContent from "./ItemTooltipContent";
import * as Tooltip from "@radix-ui/react-tooltip";
import * as Popover from "@radix-ui/react-popover";
import { useCharacterStore } from "../stores/characterStore";
import {
  getRarityBorderClass,
  getRarityInnerGlowClass,
  ONE_HANDED_WEAPON_TYPES,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  OFF_HAND_TYPES, // Keep for future use, disable lint error
} from "../utils/itemUtils";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  useDroppable,
  DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import ConfirmationModal from "./ConfirmationModal";

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  handleEquipItem: (
    itemToEquip: EquippableItem,
    preferredSlot?: "weapon1" | "weapon2"
  ) => void;
  handleOpenDiscardConfirm: (item: EquippableItem) => void;
  handleSwapWeapons: () => void;
  handleUnequipItem: (slotId: EquipmentSlotId) => void;
  currencies: OverallGameData["currencies"] | null;
}

const TOTAL_SLOTS = 60;
const COLUMNS = 8;

interface SortableItemProps {
  id: string;
  item: EquippableItem;
  onEquip: (item: EquippableItem, slot?: "weapon1" | "weapon2") => void;
  onDiscard: (item: EquippableItem) => void;
  equippedWeapon1?: EquippableItem | null;
  isDiscardMode: boolean;
  isSelected: boolean;
  onToggleSelect: (itemId: string) => void;
}

function SortableItem({
  id,
  item,
  onEquip,
  onDiscard,
  equippedWeapon1,
  isDiscardMode,
  isSelected,
  onToggleSelect,
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    disabled: isDiscardMode,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : "auto",
    touchAction: "none",
  };

  const baseBorderColor = getRarityBorderClass(item.rarity);
  const borderColorClass =
    isDiscardMode && isSelected ? "border-white border-2" : baseBorderColor;
  const innerGlowClass = getRarityInnerGlowClass(item.rarity);
  const iconUrl = `${item.icon || "default_icon.png"}`;

  const isClickedItemOneHanded = ONE_HANDED_WEAPON_TYPES.has(item.itemType);
  const isMainHandEmpty = !equippedWeapon1;
  const isMainHandOneHanded =
    equippedWeapon1 && ONE_HANDED_WEAPON_TYPES.has(equippedWeapon1.itemType);
  const showWeaponOptions =
    isClickedItemOneHanded && (isMainHandEmpty || isMainHandOneHanded);

  const handleDivClick = () => {
    if (isDiscardMode) {
      onToggleSelect(id);
    }
  };

  return (
    <Popover.Root>
      <Tooltip.Provider delayDuration={100}>
        <Tooltip.Root>
          <Popover.Trigger asChild disabled={isDiscardMode}>
            <Tooltip.Trigger asChild>
              <div
                ref={setNodeRef}
                style={style}
                {...(!isDiscardMode ? attributes : {})}
                {...(!isDiscardMode ? listeners : {})}
                onClick={handleDivClick}
                className={`border ${borderColorClass} ${innerGlowClass} bg-transparent hover:bg-black hover:bg-opacity-30 transition-colors duration-150 flex items-center justify-center p-1 ${
                  isDiscardMode ? "cursor-pointer" : "cursor-grab"
                } w-24 h-24 aspect-square rounded relative`}
              >
                <Image
                  src={iconUrl}
                  alt={item.name}
                  width={48}
                  height={48}
                  className="object-contain flex-shrink-0 pointer-events-none filter brightness-110"
                  unoptimized
                />
              </div>
            </Tooltip.Trigger>
          </Popover.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content
              className="w-max max-w-xs p-2 bg-gray-900 text-white text-xs rounded border border-gray-600 shadow-lg z-50 pointer-events-none"
              sideOffset={5}
              align="center"
            >
              <ItemTooltipContent item={item} />
              <Tooltip.Arrow className="fill-gray-900" />
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
      </Tooltip.Provider>
      {!isDiscardMode && (
        <Popover.Portal>
          <Popover.Content
            className="flex flex-col gap-1 bg-gray-800 border border-gray-600 rounded p-2 shadow-xl z-[70] w-auto"
            sideOffset={5}
            align="center"
          >
            {showWeaponOptions ? (
              <>
                <Popover.Close asChild>
                  <Button
                    className="text-xs px-2 py-1 cursor-pointer hover:bg-gray-700 w-full justify-center"
                    onClick={() => onEquip(item, "weapon1")}
                  >
                    Equipar Mão Principal
                  </Button>
                </Popover.Close>
                <Popover.Close asChild>
                  <Button
                    className="text-xs px-2 py-1 cursor-pointer hover:bg-gray-700 w-full justify-center"
                    onClick={() => onEquip(item, "weapon2")}
                  >
                    Equipar Mão Secundária
                  </Button>
                </Popover.Close>
              </>
            ) : (
              <Popover.Close asChild>
                <Button
                  className="text-xs px-2 py-1 cursor-pointer hover:bg-gray-700 w-full justify-center"
                  onClick={() => onEquip(item)}
                >
                  Equipar
                </Button>
              </Popover.Close>
            )}
            <Popover.Close asChild>
              <Button
                className="text-xs px-2 py-1 text-red-400 cursor-pointer hover:bg-red-900 hover:text-red-200 w-full justify-center"
                onClick={() => {
                  console.log(
                    "[SortableItem Popover] Discard Button Clicked for item:",
                    item.name
                  );
                  onDiscard(item);
                }}
              >
                Descartar
              </Button>
            </Popover.Close>
            <Popover.Arrow className="fill-gray-800" />
          </Popover.Content>
        </Popover.Portal>
      )}
    </Popover.Root>
  );
}

interface EquipmentSlotProps {
  slotId: EquipmentSlotId;
  item: EquippableItem | null | undefined;
  isOver: boolean;
  onClick: (slotId: EquipmentSlotId) => void;
  onUnequip: (slotId: EquipmentSlotId) => void;
}

function EquipmentSlot({
  slotId,
  item,
  isOver,
  onClick,
  onUnequip,
}: EquipmentSlotProps) {
  const { setNodeRef } = useDroppable({ id: slotId, data: { slotId } });
  const isEmpty = !item;
  const baseBorderColorClass = isEmpty
    ? "border-gray-700"
    : getRarityBorderClass(item?.rarity);
  const innerGlowClass = isEmpty ? "" : getRarityInnerGlowClass(item?.rarity);
  const iconUrl = isEmpty ? "" : `${item?.icon || "default_icon.png"}`;
  const currentBorderColorClass = isOver
    ? "border-green-500 border-2"
    : baseBorderColorClass;

  return (
    <div className="flex flex-col items-center w-24">
      <span className="text-xs text-gray-500 mb-0.5 capitalize">
        {slotId
          .replace("weapon", "Arma ")
          .replace("bodyArmor", "Peitoral")
          .replace("helm", "Elmo")
          .replace("gloves", "Luvas")
          .replace("boots", "Botas")
          .replace("ring", "Anel ")}
      </span>
      <Popover.Root>
        <Tooltip.Provider delayDuration={100}>
          <Tooltip.Root>
            <Popover.Trigger asChild disabled={isEmpty}>
              <Tooltip.Trigger asChild disabled={isEmpty}>
                <div
                  ref={setNodeRef}
                  className={`border ${currentBorderColorClass} ${innerGlowClass} bg-transparent ${
                    !isEmpty
                      ? "hover:bg-black hover:bg-opacity-30 cursor-pointer"
                      : "cursor-default"
                  } transition-colors duration-150 flex items-center justify-center p-1 w-24 h-24 aspect-square rounded`}
                  onClick={() => !isEmpty && onClick(slotId)}
                >
                  {!isEmpty ? (
                    <Image
                      src={iconUrl}
                      alt={item.name}
                      width={48}
                      height={48}
                      className="object-contain flex-shrink-0 pointer-events-none filter brightness-110"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full"></div>
                  )}
                </div>
              </Tooltip.Trigger>
            </Popover.Trigger>
            {!isEmpty && (
              <Tooltip.Portal>
                <Tooltip.Content
                  className="w-max max-w-xs p-2 bg-gray-900 text-white text-xs rounded border border-gray-600 shadow-lg z-50 pointer-events-none"
                  sideOffset={5}
                  align="center"
                >
                  <ItemTooltipContent item={item} />
                  <Tooltip.Arrow className="fill-gray-900" />
                </Tooltip.Content>
              </Tooltip.Portal>
            )}
          </Tooltip.Root>
        </Tooltip.Provider>
        {!isEmpty && (
          <Popover.Portal>
            <Popover.Content
              className="flex flex-col gap-1 bg-gray-800 border border-gray-600 rounded p-2 shadow-xl z-[70] w-auto"
              sideOffset={5}
              align="center"
            >
              <Popover.Close asChild>
                <Button
                  className="text-xs px-2 py-1 cursor-pointer hover:bg-gray-700 w-full justify-center"
                  onClick={() => onUnequip(slotId)}
                >
                  Desequipar
                </Button>
              </Popover.Close>
              <Popover.Arrow className="fill-gray-800" />
            </Popover.Content>
          </Popover.Portal>
        )}
      </Popover.Root>
    </div>
  );
}

const InventoryModal: React.FC<InventoryModalProps> = ({
  isOpen,
  onClose,
  handleEquipItem,
  handleOpenDiscardConfirm,
  handleSwapWeapons,
  handleUnequipItem,
  currencies,
}): React.ReactElement | null => {
  const character = useCharacterStore((state) => state.activeCharacter);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overSlotId, setOverSlotId] = useState<string | null>(null);
  const [isDiscardMode, setIsDiscardMode] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState(
    () => new Set<string>()
  );
  const [isMultiDiscardConfirmOpen, setIsMultiDiscardConfirmOpen] =
    useState(false);

  const inventoryItemIds = useMemo(
    () => character?.inventory?.map((i) => i.id) ?? [],
    [character?.inventory]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    console.log("[DragStart]", event);
    setActiveId(event.active.id as string);
  };

  const updateCharacter = useCharacterStore((state) => state.updateCharacter);
  const saveCharacter = useCharacterStore((state) => state.saveCharacter);

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    setOverSlotId(over ? (over.id as string) : null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setOverSlotId(null);
    setActiveId(null);

    if (!over) return;
    const activeId = active.id as string;
    const overId = over.id as string;
    if (activeId === overId) return;

    const isInventoryDrag =
      inventoryItemIds.includes(activeId) && inventoryItemIds.includes(overId);
    const isEquipSlotDrop = equipmentSlotOrder.includes(
      overId as EquipmentSlotId
    );

    if (isInventoryDrag) {
      console.log(`[DragEnd] Reordering inventory: ${activeId} -> ${overId}`);
      if (character && character.inventory) {
        const oldIndex = character.inventory.findIndex(
          (item) => item.id === activeId
        );
        const newIndex = character.inventory.findIndex(
          (item) => item.id === overId
        );
        if (oldIndex !== -1 && newIndex !== -1) {
          const newInventory = arrayMove(
            character.inventory,
            oldIndex,
            newIndex
          );
          updateCharacter({ inventory: newInventory });
          setTimeout(() => saveCharacter(), 50);
        }
      }
    } else if (isEquipSlotDrop && inventoryItemIds.includes(activeId)) {
      console.log(
        `[DragEnd] Attempting to equip item ${activeId} to slot ${overId}`
      );
      const itemToEquip = character?.inventory?.find(
        (item) => item.id === activeId
      );

      if (itemToEquip) {
        handleEquipItem(itemToEquip);
      } else {
        console.warn(
          `[DragEnd] Item with id ${activeId} not found in inventory.`
        );
      }
    } else {
      console.log(`[DragEnd] Invalid drop: active=${activeId}, over=${overId}`);
    }
  };

  const toggleDiscardMode = useCallback(() => {
    setIsDiscardMode((prev) => {
      if (prev) {
        setSelectedItemIds(new Set<string>());
      }
      return !prev;
    });
  }, []);

  const handleToggleSelect = useCallback((itemId: string) => {
    setSelectedItemIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }, []);

  // --- Handler to OPEN the multi-discard confirmation ---
  const handleDiscardSelected = useCallback(() => {
    if (selectedItemIds.size > 0) {
      setIsMultiDiscardConfirmOpen(true); // Open the confirmation modal
    }
  }, [selectedItemIds.size]);
  // ----------------------------------------------------

  // --- Handler to CLOSE the multi-discard confirmation ---
  const closeMultiDiscardConfirm = useCallback(() => {
    setIsMultiDiscardConfirmOpen(false);
  }, []);
  // -----------------------------------------------------

  // --- Handler to EXECUTE the multi-discard after confirmation ---
  const confirmAndDiscardSelected = useCallback(() => {
    if (selectedItemIds.size === 0) return;
    const currentCharacter = useCharacterStore.getState().activeCharacter;
    if (!currentCharacter || !currentCharacter.inventory) return;

    console.log(
      `[Confirm MultiDiscard] Discarding ${selectedItemIds.size} items`
    );
    const newInventory = currentCharacter.inventory.filter(
      (item) => !selectedItemIds.has(item.id)
    );

    updateCharacter({ inventory: newInventory });
    setTimeout(() => saveCharacter(), 50);

    closeMultiDiscardConfirm(); // Close this modal
    toggleDiscardMode(); // Exit discard mode (which also clears selection)
  }, [
    selectedItemIds,
    updateCharacter,
    saveCharacter,
    toggleDiscardMode,
    closeMultiDiscardConfirm,
  ]);
  // -------------------------------------------------------------

  if (!isOpen || !character) return null;

  const { inventory = [], equipment = {} } = character;
  const weapon1 = equipment.weapon1;
  const weapon2 = equipment.weapon2;
  const equipmentSlotOrder: EquipmentSlotId[] = [
    "helm",
    "amulet",
    "bodyArmor",
    "weapon1",
    "belt",
    "weapon2",
    "gloves",
    "ring1",
    "boots",
    "ring2",
  ];
  const isWieldingOneHander =
    weapon1 && ONE_HANDED_WEAPON_TYPES.has(weapon1.itemType);
  const isDualWieldingOneHanders =
    isWieldingOneHander &&
    weapon2 &&
    ONE_HANDED_WEAPON_TYPES.has(weapon2.itemType);
  const canSwapWeapons = isDualWieldingOneHanders;

  const displayItems = inventory.slice(0, TOTAL_SLOTS);
  const emptySlotsCount = TOTAL_SLOTS - displayItems.length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setIsDiscardMode(false);
        setSelectedItemIds(new Set<string>());
        onClose();
      }}
      title="Inventário"
      maxWidthClass="max-w-screen-xl"
      actions={
        <div className="flex justify-center items-center flex-wrap w-full gap-4">
          {isDiscardMode ? (
            <>
              <Button
                onClick={handleDiscardSelected}
                disabled={selectedItemIds.size === 0}
                className={`text-white ${
                  selectedItemIds.size > 0
                    ? "bg-red-700 hover:bg-red-800"
                    : "bg-gray-500 cursor-not-allowed"
                }`}
              >
                Descartar Selecionados ({selectedItemIds.size})
              </Button>
              <Button
                onClick={toggleDiscardMode}
                className="bg-gray-600 hover:bg-gray-700"
              >
                Cancelar
              </Button>
            </>
          ) : (
            <>
              {canSwapWeapons && (
                <Button
                  onClick={handleSwapWeapons}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Inverter Slots de Arma
                </Button>
              )}
              <Button
                onClick={toggleDiscardMode}
                className="bg-yellow-600 hover:bg-yellow-700 text-black"
              >
                Selecionar para Descarte
              </Button>
              <Button onClick={onClose}>Fechar</Button>
            </>
          )}
        </div>
      }
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
      >
        <div className="my-4 flex flex-col md:flex-row gap-4 overflow-y-auto p-1">
          <div className="w-full md:w-auto md:min-w-[320px] border border-gray-700 p-3 rounded bg-black bg-opacity-20 flex-shrink-0 relative">
            {currencies && (
              <div className="absolute top-1 right-2 text-xs text-red-400 bg-black bg-opacity-60 px-1.5 py-0.5 rounded border border-gray-700">
                Rubis: {currencies.ruby}
              </div>
            )}
            <h3 className="text-center text-gray-400 mb-3 font-semibold pt-4">
              Equipamento
            </h3>
            <div className="grid grid-cols-3 gap-2 justify-items-center">
              {equipmentSlotOrder.map((slotId) => (
                <EquipmentSlot
                  key={slotId}
                  slotId={slotId}
                  item={equipment[slotId]}
                  isOver={overSlotId === slotId}
                  onClick={() => {}}
                  onUnequip={handleUnequipItem}
                />
              ))}
            </div>
          </div>
          <div className="w-full md:flex-grow border border-gray-700 p-3 rounded bg-black bg-opacity-20">
            <h3 className="text-center text-gray-400 mb-3 font-semibold">
              Inventário ({inventory.length}/{TOTAL_SLOTS})
            </h3>
            <div className="relative rounded mx-auto scroll-fade bg-black overflow-y-auto max-h-[65vh]">
              <SortableContext
                items={inventoryItemIds}
                strategy={rectSortingStrategy}
                disabled={isDiscardMode}
              >
                <div
                  className={`grid grid-cols-${COLUMNS} gap-2 px-4 pt-4 pb-2 custom-scrollbar`}
                >
                  {inventory.map((item) => (
                    <SortableItem
                      key={item.id}
                      id={item.id}
                      item={item}
                      onEquip={handleEquipItem}
                      onDiscard={handleOpenDiscardConfirm}
                      equippedWeapon1={equipment.weapon1}
                      isDiscardMode={isDiscardMode}
                      isSelected={selectedItemIds.has(item.id)}
                      onToggleSelect={handleToggleSelect}
                    />
                  ))}
                  {Array.from({ length: emptySlotsCount }).map((_, index) => (
                    <div
                      key={`empty-${index}`}
                      className="border border-gray-700 bg-transparent flex items-center justify-center w-24 h-24 aspect-square rounded"
                    ></div>
                  ))}
                </div>
              </SortableContext>
            </div>
          </div>
        </div>

        {!isDiscardMode && (
          <DragOverlay>
            {activeId ? (
              inventory.find((item) => item.id === activeId) ? (
                <div className="w-24 h-24 p-1 border border-yellow-400 rounded bg-black bg-opacity-50 flex items-center justify-center">
                  <Image
                    src={
                      inventory.find((item) => item.id === activeId)?.icon || ""
                    }
                    alt={
                      inventory.find((item) => item.id === activeId)?.name ||
                      "item"
                    }
                    width={48}
                    height={48}
                    className="object-contain flex-shrink-0 filter brightness-110"
                    unoptimized
                  />
                </div>
              ) : null
            ) : null}
          </DragOverlay>
        )}
      </DndContext>

      <ConfirmationModal
        isOpen={isMultiDiscardConfirmOpen}
        onClose={closeMultiDiscardConfirm}
        onConfirm={confirmAndDiscardSelected}
        title="Descartar Múltiplos Itens?"
        message={`Tem certeza que deseja descartar permanentemente os ${selectedItemIds.size} itens selecionados?`}
      />
    </Modal>
  );
};

export default InventoryModal;
