"use client";

import React from "react";
import Image from "next/image";
import Modal from "./Modal";
import Button from "./Button";
import { EquippableItem } from "../types/gameData";
import ItemTooltipContent from "./ItemTooltipContent";
import * as Tooltip from "@radix-ui/react-tooltip";
import * as Popover from "@radix-ui/react-popover";
import { useCharacterStore } from "../stores/characterStore";
import {
  getRarityBorderClass,
  getRarityInnerGlowClass,
  ONE_HANDED_WEAPON_TYPES,
  OFF_HAND_TYPES,
} from "../utils/itemUtils";

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  handleEquipItem: (
    itemToEquip: EquippableItem,
    preferredSlot?: "weapon1" | "weapon2"
  ) => void;
  handleOpenDiscardConfirm: (item: EquippableItem) => void;
  handleSwapWeapons: () => void;
}

const TOTAL_SLOTS = 60;
const COLUMNS = 8;

const InventoryModal: React.FC<InventoryModalProps> = ({
  isOpen,
  onClose,
  handleEquipItem,
  handleOpenDiscardConfirm,
  handleSwapWeapons,
}) => {
  const character = useCharacterStore((state) => state.activeCharacter);

  if (!isOpen || !character) return null;

  const { inventory = [], equipment = {} } = character;
  const weapon1 = equipment.weapon1;
  const weapon2 = equipment.weapon2;
  const isWieldingOneHander =
    weapon1 && ONE_HANDED_WEAPON_TYPES.has(weapon1.itemType);
  const isDualWieldingOneHanders =
    isWieldingOneHander &&
    weapon2 &&
    ONE_HANDED_WEAPON_TYPES.has(weapon2.itemType);
  const isWieldingOneHanderAndShield =
    isWieldingOneHander && weapon2 && OFF_HAND_TYPES.has(weapon2.itemType);
  const canSwapWeapons = isDualWieldingOneHanders;

  const handleItemAction = (
    item: EquippableItem,
    action: "equip1" | "equip2" | "equipDefault" | "discard"
  ) => {
    console.log(
      `[InventoryModal] handleItemAction called. Item: ${item.name}, Action: ${action}`
    );
    switch (action) {
      case "equip1":
        handleEquipItem(item, "weapon1");
        break;
      case "equip2":
        handleEquipItem(item, "weapon2");
        break;
      case "equipDefault":
        handleEquipItem(item);
        break;
      case "discard":
        handleOpenDiscardConfirm(item);
        break;
    }
  };

  const displayItems = inventory.slice(0, TOTAL_SLOTS);
  const emptySlotsCount = TOTAL_SLOTS - displayItems.length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Inventário"
      maxWidthClass="max-w-md md:max-w-4xl"
      actions={
        <div className="flex justify-center items-center w-full gap-4">
          {canSwapWeapons && (
            <Button
              onClick={handleSwapWeapons}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Inverter Slots de Arma
            </Button>
          )}
          <Button onClick={onClose}>Fechar</Button>
        </div>
      }
    >
      <div className="my-4 rounded mx-auto scroll-fade bg-black">
        <div
          className={`grid grid-cols-${COLUMNS} gap-2 overflow-y-auto max-h-[70vh] px-4 pt-4 pb-2 custom-scrollbar`}
        >
          {displayItems.map((item) => {
            const borderColorClass = getRarityBorderClass(item.rarity);
            const innerGlowClass = getRarityInnerGlowClass(item.rarity);
            const iconUrl = `${item.icon || "default_icon.png"}`;
            const isClickedItemOneHanded = ONE_HANDED_WEAPON_TYPES.has(
              item.itemType
            );
            const showWeaponOptions =
              isClickedItemOneHanded &&
              (isDualWieldingOneHanders || isWieldingOneHanderAndShield);

            return (
              <Popover.Root key={item.id}>
                <Tooltip.Provider delayDuration={100}>
                  <Tooltip.Root>
                    <Popover.Trigger asChild>
                      <Tooltip.Trigger asChild>
                        <div
                          className={`border ${borderColorClass} ${innerGlowClass} bg-transparent hover:bg-black hover:bg-opacity-30 transition-colors duration-150 flex items-center justify-center p-1 cursor-pointer w-24 h-24 aspect-square rounded`}
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
                            onClick={() => handleItemAction(item, "equip1")}
                          >
                            Equipar Mão Principal
                          </Button>
                        </Popover.Close>
                        <Popover.Close asChild>
                          <Button
                            className="text-xs px-2 py-1 cursor-pointer hover:bg-gray-700 w-full justify-center"
                            onClick={() => handleItemAction(item, "equip2")}
                          >
                            Equipar Mão Secundária
                          </Button>
                        </Popover.Close>
                      </>
                    ) : (
                      <Popover.Close asChild>
                        <Button
                          className="text-xs px-2 py-1 cursor-pointer hover:bg-gray-700 w-full justify-center"
                          onClick={() => handleItemAction(item, "equipDefault")}
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
                            "[InventoryModal] Discard Button Clicked for item:",
                            item.name
                          );
                          handleItemAction(item, "discard");
                        }}
                      >
                        Descartar
                      </Button>
                    </Popover.Close>
                    <Popover.Arrow className="fill-gray-800" />
                  </Popover.Content>
                </Popover.Portal>
              </Popover.Root>
            );
          })}
          {Array.from({ length: emptySlotsCount }).map((_, index) => (
            <div
              key={`empty-${index}`}
              className="border border-gray-700 bg-transparent flex items-center justify-center w-24 h-24 aspect-square rounded"
            ></div>
          ))}
        </div>
      </div>
    </Modal>
  );
};

export default InventoryModal;
