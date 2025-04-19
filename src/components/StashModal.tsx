"use client";

import React, { useState, useMemo } from "react";
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
  DraggableSyntheticListeners,
  UniqueIdentifier,
  Active,
  Over,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  rectSortingStrategy,
  SortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const STASH_SLOTS = 60;
const INVENTORY_SLOTS = 60;
const COLUMNS = 8;

interface StashModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerInventory: EquippableItem[];
  stashInventory: EquippableItem[];
  onMoveItemToStash: (itemId: string) => void;
  onMoveItemToInventory: (itemId: string) => void;
  // Add later: handlers for sorting within stash/inventory if needed
}

interface SortableStashItemProps {
  id: string;
  item: EquippableItem;
  containerId: "player" | "stash";
}

// Sortable Item component (Similar to InventoryModal's, but simpler for now)
function SortableStashItem({ id, item, containerId }: SortableStashItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    data: { containerId, item }, // Pass container ID and item data
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : "auto",
    touchAction: "none",
  };

  const borderColorClass = getRarityBorderClass(item.rarity);
  const innerGlowClass = getRarityInnerGlowClass(item.rarity);
  const iconUrl = `${item.icon || "default_icon.png"}`;

  return (
    <Tooltip.Provider delayDuration={100}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`border ${borderColorClass} ${innerGlowClass} bg-transparent hover:bg-black hover:bg-opacity-30 transition-colors duration-150 flex items-center justify-center p-1 cursor-grab w-20 h-20 md:w-24 md:h-24 aspect-square rounded relative`}
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
        <Tooltip.Portal>
          <Tooltip.Content
            className="w-max max-w-xs p-2 bg-gray-900 text-white text-xs rounded border border-gray-600 shadow-lg z-[70]" // Ensure high z-index
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
  strategy?: SortingStrategy; // Make strategy optional
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
          className={`grid grid-cols-${COLUMNS} gap-2 px-4 pt-4 pb-2 custom-scrollbar min-h-[180px] md:min-h-[260px] rounded ${
            isOver ? "bg-green-900/30" : "bg-black"
          }`}
        >
          {children}
          {/* Render empty slots visually */}
          {Array.from({ length: emptySlotsCount }).map((_, index) => (
            <div
              key={`empty-${id}-${index}`}
              className="border border-gray-700 bg-transparent flex items-center justify-center w-20 h-20 md:w-24 md:h-24 aspect-square rounded"
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
}) => {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        // Require mouse to move 10 pixels before initiating drag
        // Helps prevent accidental drags on click
        distance: 10,
      },
    })
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

    if (!over) return; // Dropped outside a droppable area

    const activeContainer = findContainer(active.id);
    const overContainerId = over.id.toString(); // 'player' or 'stash'
    const activeIdStr = active.id.toString();

    console.log(
      `Drag End: Item ${activeIdStr} from ${activeContainer} to ${overContainerId}`
    );

    // Check if dropped in a different container
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
      // Handle sorting within the same container if needed later
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

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Baú Compartilhado"
      maxWidthClass="max-w-6xl" // Allow wider modal
      actions={<Button onClick={onClose}>Fechar</Button>}
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="my-4 flex flex-col gap-4">
          {/* Stash Area (Top) */}
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
              />
            ))}
          </DroppableContainer>

          {/* Player Inventory Area (Bottom) */}
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
              />
            ))}
          </DroppableContainer>
        </div>

        {/* Drag Overlay for visual feedback */}
        <DragOverlay>
          {activeId && activeItem ? (
            <div className="w-20 h-20 md:w-24 md:h-24 p-1 border border-yellow-400 rounded bg-black bg-opacity-70 flex items-center justify-center">
              <Image
                src={activeItem.icon || ""}
                alt={activeItem.name || "item"}
                width={48}
                height={48}
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
