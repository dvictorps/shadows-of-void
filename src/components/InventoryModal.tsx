"use client";

import React from "react";
import Image from "next/image";
import Modal from "./Modal";
import Button from "./Button";
import { EquippableItem, EquipmentSlotId } from "../types/gameData";
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
}

const TOTAL_SLOTS = 60;
const COLUMNS = 8;

const InventoryModal: React.FC<InventoryModalProps> = ({
  isOpen,
  onClose,
  handleEquipItem,
  handleOpenDiscardConfirm,
  handleSwapWeapons,
  handleUnequipItem,
}) => {
  const character = useCharacterStore((state) => state.activeCharacter);

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
      maxWidthClass="max-w-screen-xl"
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
      <div className="my-4 flex flex-col md:flex-row gap-4 overflow-y-auto p-1">
        <div className="w-full md:w-auto md:min-w-[320px] border border-gray-700 p-3 rounded bg-black bg-opacity-20 flex-shrink-0">
          <h3 className="text-center text-gray-400 mb-3 font-semibold">
            Equipamento
          </h3>
          <div className="grid grid-cols-3 gap-2 justify-items-center">
            {equipmentSlotOrder.map((slotId) => {
              const item = equipment[slotId];
              const isEmpty = !item;
              const borderColorClass = isEmpty
                ? "border-gray-700"
                : getRarityBorderClass(item.rarity);
              const innerGlowClass = isEmpty
                ? ""
                : getRarityInnerGlowClass(item.rarity);
              const iconUrl = isEmpty
                ? ""
                : `${item.icon || "default_icon.png"}`;

              return (
                <div key={slotId} className="flex flex-col items-center w-24">
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
                              className={`border ${borderColorClass} ${innerGlowClass} bg-transparent ${
                                !isEmpty
                                  ? "hover:bg-black hover:bg-opacity-30 cursor-pointer"
                                  : "cursor-default"
                              } transition-colors duration-150 flex items-center justify-center p-1 w-24 h-24 aspect-square rounded`}
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
                              onClick={() => handleUnequipItem(slotId)}
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
            })}
          </div>
        </div>
        <div className="w-full md:flex-grow border border-gray-700 p-3 rounded bg-black bg-opacity-20">
          <h3 className="text-center text-gray-400 mb-3 font-semibold">
            Inventário ({inventory.length}/{TOTAL_SLOTS})
          </h3>
          <div className="relative rounded mx-auto scroll-fade bg-black overflow-y-auto max-h-[65vh]">
            <div
              className={`grid grid-cols-${COLUMNS} gap-2 px-4 pt-4 pb-2 custom-scrollbar`}
            >
              {displayItems.map((item) => {
                console.log(
                  `[InventoryModal Render Loop] Inspecting item from inventory: ID=${item.id}, Name=${item.name}, BaseMinDmg=${item.baseMinDamage}, BaseMaxDmg=${item.baseMaxDamage}`
                );

                const borderColorClass = getRarityBorderClass(item.rarity);
                const innerGlowClass = getRarityInnerGlowClass(item.rarity);
                const iconUrl = `${item.icon || "default_icon.png"}`;
                const isClickedItemOneHanded = ONE_HANDED_WEAPON_TYPES.has(
                  item.itemType
                );
                const isMainHandEmpty = !weapon1;
                const isMainHandOneHanded =
                  weapon1 && ONE_HANDED_WEAPON_TYPES.has(weapon1.itemType);
                const showWeaponOptions =
                  isClickedItemOneHanded &&
                  (isMainHandEmpty || isMainHandOneHanded);

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
                              onClick={() =>
                                handleItemAction(item, "equipDefault")
                              }
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
        </div>
      </div>
    </Modal>
  );
};

export default InventoryModal;
