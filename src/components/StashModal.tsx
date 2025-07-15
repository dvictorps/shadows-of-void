"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import Image from "next/image";
import Modal from "./Modal";
import Button from "./Button";
import { EquippableItem } from "../types/gameData";
import ItemTooltipContent from "./ItemTooltipContent";
import * as Tooltip from "@radix-ui/react-tooltip";
import {
  getRarityBorderClass,
  getRarityInnerGlowClass,
} from "../utils/itemDisplay";
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
  UniqueIdentifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
  SortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const STASH_SLOTS = 60;
const INVENTORY_SLOTS = 60;

interface StashModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerInventory: EquippableItem[];
  stashInventory: EquippableItem[];
  onMoveItemToStash: (itemId: string) => void;
  onMoveItemToInventory: (itemId: string) => void;
  onMoveSelectedToStash: (itemIds: string[]) => void;
  onMoveSelectedToInventory: (itemIds: string[]) => void;
  onMoveAllToStash: () => void;
}

interface SortableStashItemProps {
  id: string;
  item: EquippableItem;
  containerId: "player" | "stash";
  isSelected: boolean;
  onToggleSelect: (itemId: string, containerId: "player" | "stash") => void;
}

// Sortable Item component
function SortableStashItem({
  id,
  item,
  containerId,
  isSelected,
  onToggleSelect,
}: SortableStashItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    data: { containerId, item },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : "auto",
    touchAction: "none",
  };

  const baseBorderColor = getRarityBorderClass(item.rarity);
  const selectionClass = isSelected
    ? "ring-2 ring-offset-1 ring-offset-black ring-cyan-400"
    : "";
  const borderColorClass = isSelected ? "border-white" : baseBorderColor;
  const innerGlowClass = getRarityInnerGlowClass(item.rarity);
  const iconUrl = `${item.icon || "default_icon.png"}`;

  const handleClick = () => {
    onToggleSelect(id, containerId);
  };

  return (
    <Tooltip.Provider delayDuration={100}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={handleClick}
            className={`border ${borderColorClass} ${innerGlowClass} ${selectionClass} bg-transparent hover:bg-black hover:bg-opacity-30 transition-colors duration-150 flex items-center justify-center p-1 cursor-pointer w-16 h-16 rounded relative overflow-hidden`}
          >
            <div className="absolute inset-0 flex items-center justify-center p-1 pointer-events-none">
              <Image
                src={iconUrl}
                alt={item.name}
                fill
                className="object-contain w-full h-full max-w-full max-h-full filter brightness-110"
                unoptimized
              />
            </div>
          </div>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            className="w-max max-w-xs p-2 bg-gray-900 text-white text-xs rounded border border-gray-600 shadow-lg z-[70]"
            sideOffset={5}
            align="center"
          >
            <ItemTooltipContent item={item} />
            <Tooltip.Arrow className="fill-gray-900" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}

// Droppable Container Component
interface DroppableContainerProps {
  id: string;
  label: string;
  items: EquippableItem[];
  totalSlots: number;
  strategy?: SortingStrategy;
  children: React.ReactNode;
}

function DroppableContainer({
  id,
  label,
  items,
  totalSlots,
  strategy = rectSortingStrategy,
  children,
}: DroppableContainerProps) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const itemCount = items.length;
  const emptySlotsCount = Math.max(0, totalSlots - itemCount);

  return (
    <div className="flex flex-col w-1/2 border border-gray-700 p-2 rounded bg-black bg-opacity-20 max-h-[70vh]">
      <h3 className="text-center text-gray-400 mb-2 font-semibold flex-shrink-0">
        {label} ({itemCount}/{totalSlots})
      </h3>
      <SortableContext
        id={id}
        items={items.map((i) => i.id)}
        strategy={strategy}
      >
        <div
          ref={setNodeRef}
          className={`flex-grow grid grid-cols-6 gap-1.5 p-2 rounded overflow-y-auto items-start scrollbar-gutter-stable ${
            isOver ? "bg-green-900/30" : "bg-black/50"
          }`}
        >
          {children}
          {Array.from({ length: emptySlotsCount }).map((_, index) => (
            <div
              key={`empty-${id}-${index}`}
              className="border border-gray-700 bg-transparent flex items-center justify-center w-16 h-16 rounded"
            ></div>
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

// Main Stash Modal Component
const StashModal: React.FC<StashModalProps> = ({
  isOpen,
  onClose,
  playerInventory,
  stashInventory,
  onMoveItemToStash,
  onMoveItemToInventory,
  onMoveSelectedToStash,
  onMoveSelectedToInventory,
  onMoveAllToStash,
}) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedPlayerItemIds, setSelectedPlayerItemIds] = useState<
    Set<string>
  >(new Set());
  const [selectedStashItemIds, setSelectedStashItemIds] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    if (isOpen) {
      setSelectedPlayerItemIds(new Set());
      setSelectedStashItemIds(new Set());
    }
  }, [isOpen]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    })
  );

  const handleToggleSelect = useCallback(
    (itemId: string, containerId: "player" | "stash") => {
      if (containerId === "player") {
        setSelectedPlayerItemIds((prev) => {
          const newSet = new Set(prev);
          if (newSet.has(itemId)) {
            newSet.delete(itemId);
          } else {
            newSet.add(itemId);
          }
          return newSet;
        });
      } else if (containerId === "stash") {
        setSelectedStashItemIds((prev) => {
          const newSet = new Set(prev);
          if (newSet.has(itemId)) {
            newSet.delete(itemId);
          } else {
            newSet.add(itemId);
          }
          return newSet;
        });
      }
    },
    []
  );

  const playerItemIds = useMemo(
    () => playerInventory.map((i) => i.id),
    [playerInventory]
  );
  const stashItemIds = useMemo(
    () => stashInventory.map((i) => i.id),
    [stashInventory]
  );

  const findContainer = (id: UniqueIdentifier | undefined) => {
    if (!id) return null;
    if (playerItemIds.includes(id.toString())) return "player";
    if (stashItemIds.includes(id.toString())) return "stash";
    return null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id.toString());
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeContainer = findContainer(active.id);
    const overContainerId = over.id.toString();
    const activeIdStr = active.id.toString();

    console.log(
      `Drag End: Item ${activeIdStr} from ${activeContainer} to ${overContainerId}`
    );

    if (
      activeContainer &&
      overContainerId &&
      activeContainer !== overContainerId
    ) {
      if (overContainerId === "stash") {
        onMoveItemToStash(activeIdStr);
      } else if (overContainerId === "player") {
        onMoveItemToInventory(activeIdStr);
      }
    } else {
      console.log(
        `Drag End: Item ${activeIdStr} dropped in same container or invalid drop.`
      );
    }
  };

  const activeItem = useMemo(() => {
    const allItems = [...playerInventory, ...stashInventory];
    return allItems.find((item) => item.id === activeId);
  }, [activeId, playerInventory, stashInventory]);

  // <<< Handlers for the new buttons >>>
  const handleGuardarSelecionados = () => {
    if (selectedPlayerItemIds.size > 0) {
      onMoveSelectedToStash(Array.from(selectedPlayerItemIds));
      setSelectedPlayerItemIds(new Set());
    }
  };

  const handleRetirarSelecionados = () => {
    if (selectedStashItemIds.size > 0) {
      onMoveSelectedToInventory(Array.from(selectedStashItemIds));
      setSelectedStashItemIds(new Set());
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Baú"
      maxWidthClass="max-w-screen-xl"
      actions={<Button onClick={onClose}>Fechar</Button>}
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-row gap-4 w-full">
          {/* Player Inventory */}
          <DroppableContainer
            id="player"
            label="Inventário"
            items={playerInventory}
            totalSlots={INVENTORY_SLOTS}
          >
            {playerInventory.map((item) => (
              <SortableStashItem
                key={item.id}
                id={item.id}
                item={item}
                containerId="player"
                isSelected={selectedPlayerItemIds.has(item.id)}
                onToggleSelect={handleToggleSelect}
              />
            ))}
          </DroppableContainer>

          {/* Action Buttons */}
          <div className="flex flex-col items-center justify-center gap-4 flex-shrink-0">
            <Button
              onClick={handleGuardarSelecionados}
              disabled={selectedPlayerItemIds.size === 0}
              className="px-2 py-1 text-sm disabled:opacity-50"
            >
              Guardar &gt;&gt;
            </Button>
            <Button
              onClick={handleRetirarSelecionados}
              disabled={selectedStashItemIds.size === 0}
              className="px-2 py-1 text-sm disabled:opacity-50"
            >
              &lt;&lt; Retirar
            </Button>
            <div className="w-full border-t border-gray-600 my-2"></div>
            <Button
              onClick={onMoveAllToStash}
              disabled={playerInventory.length === 0}
              className="px-2 py-1 text-sm text-orange-400 hover:bg-orange-900/50 disabled:opacity-50"
            >
              Guardar Tudo
            </Button>
          </div>

          {/* Stash Inventory */}
          <DroppableContainer
            id="stash"
            label="Baú"
            items={stashInventory}
            totalSlots={STASH_SLOTS}
          >
            {stashInventory.map((item) => (
              <SortableStashItem
                key={item.id}
                id={item.id}
                item={item}
                containerId="stash"
                isSelected={selectedStashItemIds.has(item.id)}
                onToggleSelect={handleToggleSelect}
              />
            ))}
          </DroppableContainer>
        </div>
        <DragOverlay>
          {activeItem && (
            <div className="w-20 h-20 p-1 bg-black/70 rounded-lg border border-yellow-400 flex items-center justify-center overflow-hidden relative">
              <div className="absolute inset-0 flex items-center justify-center p-1 pointer-events-none">
                <Image
                  src={activeItem.icon}
                  alt={activeItem.name}
                  fill
                  className="object-contain w-full h-full max-w-full max-h-full"
                />
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </Modal>
  );
};

export default StashModal;
