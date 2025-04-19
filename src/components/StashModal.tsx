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
            className={`border ${borderColorClass} ${innerGlowClass} ${selectionClass} bg-transparent hover:bg-black hover:bg-opacity-30 transition-colors duration-150 flex items-center justify-center p-0.5 cursor-pointer w-10 h-10 md:w-12 md:h-12 aspect-square rounded relative`}
          >
            <Image
              src={iconUrl}
              alt={item.name}
              width={24}
              height={24}
              className="object-contain flex-shrink-0 pointer-events-none filter brightness-110"
              unoptimized
            />
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
    <div className="w-full border border-gray-700 p-3 rounded bg-black bg-opacity-20">
      <h3 className="text-center text-gray-400 mb-3 font-semibold">
        {label} ({itemCount}/{totalSlots})
      </h3>
      <SortableContext
        id={id}
        items={items.map((i) => i.id)}
        strategy={strategy}
      >
        <div
          ref={setNodeRef}
          className={`grid gap-px p-1 rounded ${
            isOver ? "bg-green-900/30" : "bg-black"
          } justify-center`}
          style={{ gridTemplateColumns: "repeat(12, auto)" }}
        >
          {children}
          {Array.from({ length: emptySlotsCount }).map((_, index) => (
            <div
              key={`empty-${id}-${index}`}
              className="border border-gray-700 bg-transparent flex items-center justify-center w-10 h-10 md:w-12 md:h-12 aspect-square rounded"
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
    if (!activeId) return null;
    return (
      playerInventory.find((i) => i.id === activeId) ||
      stashInventory.find((i) => i.id === activeId) ||
      null
    );
  }, [activeId, playerInventory, stashInventory]);

  // <<< Handlers for the new buttons >>>
  const handleGuardarSelecionados = () => {
    if (selectedPlayerItemIds.size > 0) {
      onMoveSelectedToStash(Array.from(selectedPlayerItemIds)); // <<< Call prop
      setSelectedPlayerItemIds(new Set()); // Clear selection after action
    }
  };

  const handleRetirarSelecionados = () => {
    if (selectedStashItemIds.size > 0) {
      onMoveSelectedToInventory(Array.from(selectedStashItemIds)); // <<< Call prop
      setSelectedStashItemIds(new Set()); // Clear selection after action
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Baú Compartilhado"
      maxWidthClass="max-w-4xl"
      actions={
        <div className="flex flex-wrap justify-center items-center gap-3 w-full">
          <Button
            onClick={handleGuardarSelecionados}
            disabled={selectedPlayerItemIds.size === 0}
            className="text-xs px-3 py-1 border border-blue-500 text-blue-300 hover:bg-blue-800 disabled:opacity-50"
            title="Mover itens selecionados do Inventário para o Baú"
          >
            Guardar Selec. ({selectedPlayerItemIds.size})
          </Button>
          <Button
            onClick={onMoveAllToStash}
            disabled={playerInventory.length === 0}
            className="text-xs px-3 py-1 border border-green-500 text-green-300 hover:bg-green-800 disabled:opacity-50"
            title="Mover todos os itens do Inventário para o Baú (se houver espaço)"
          >
            Guardar Tudo
          </Button>
          <Button
            onClick={handleRetirarSelecionados}
            disabled={selectedStashItemIds.size === 0}
            className="text-xs px-3 py-1 border border-yellow-500 text-yellow-300 hover:bg-yellow-800 disabled:opacity-50"
            title="Mover itens selecionados do Baú para o Inventário"
          >
            Retirar Selec. ({selectedStashItemIds.size})
          </Button>
          <Button
            onClick={onClose}
            className="text-xs px-3 py-1 border border-gray-500 text-gray-300 hover:bg-gray-700"
          >
            Fechar
          </Button>
        </div>
      }
      disableContentScroll={true}
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="my-2 flex flex-col gap-1 overflow-hidden">
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
        </div>

        <DragOverlay>
          {activeId && activeItem ? (
            <div className="w-10 h-10 md:w-12 md:h-12 p-0.5 border border-yellow-400 rounded bg-black bg-opacity-70 flex items-center justify-center">
              <Image
                src={activeItem.icon || ""}
                alt={activeItem.name || "item"}
                width={24}
                height={24}
                className="object-contain flex-shrink-0 filter brightness-110"
                unoptimized
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </Modal>
  );
};

export default StashModal;
