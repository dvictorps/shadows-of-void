import { EquippableItem, EquipmentSlotId } from '../types/gameData';

export const TWO_HANDED_WEAPON_TYPES = new Set([
  "TwoHandedSword",
  "TwoHandedAxe",
  "TwoHandedMace",
  "Bow",
  "Staff",
]);

export const ONE_HANDED_WEAPON_TYPES = new Set([
  "OneHandedSword",
  "OneHandedAxe",
  "OneHandedMace",
  "Dagger",
  "Wand",
  "Sceptre",
]);

export const OFF_HAND_TYPES = new Set([
  "Shield",
  "Tome",
]);

export const getEquipmentSlotForItem = (
  item: EquippableItem
): EquipmentSlotId | null => {
  if (item.itemType === "Shield") return "weapon2";
  if (item.itemType === "Helm") return "helm";
  if (item.itemType === "BodyArmor") return "bodyArmor";
  if (item.itemType === "Gloves") return "gloves";
  if (item.itemType === "Boots") return "boots";
  if (item.itemType === "Belt") return "belt";
  if (item.itemType === "Amulet") return "amulet";
  if (item.itemType === "Ring") return "ring1";
  if (ONE_HANDED_WEAPON_TYPES.has(item.itemType)) return "weapon1";
  if (TWO_HANDED_WEAPON_TYPES.has(item.itemType)) return "weapon1";
  if (OFF_HAND_TYPES.has(item.itemType)) return "weapon2";
  return null;
}; 

// Resolve o slot de equipamento para um item (migrado de itemUtils, nome diferente)
export const resolveEquipmentSlotForItem = (
  item: EquippableItem
): string | null => {
  if (item.itemType === "Shield") return "weapon2";
  if (item.itemType === "Helm") return "helm";
  if (item.itemType === "BodyArmor") return "bodyArmor";
  if (item.itemType === "Gloves") return "gloves";
  if (item.itemType === "Boots") return "boots";
  if (item.itemType === "Belt") return "belt";
  if (item.itemType === "Amulet") return "amulet";
  if (item.itemType === "Ring") return "ring1";
  if (item.itemType === "Quiver") return "quiver";
  if (item.itemType === "Tome") return "tome";
  if (item.itemType === "Shield") return "weapon2";
  if (item.itemType === "Wand" || item.itemType === "Staff" || item.itemType === "Sceptre") return "weapon1";
  if (item.itemType === "Sword" || item.itemType === "Axe" || item.itemType === "Mace" || item.itemType === "Dagger" || item.itemType === "Bow") return "weapon1";
  return null;
};

// Calcula o valor de venda de um item com base na raridade, mods e nível
export const calculateSellPrice = (item: EquippableItem): number => {
  let price = 1; // Base price for Normal
  switch (item.rarity) {
    case "Mágico": price = 3; break;
    case "Raro": price = 7; break;
    case "Lendário": price = 15; break;
  }
  // Add bonus per modifier
  price += (item.modifiers?.length ?? 0) * 1; 
  // Bônus por nível
  const itemLevel = item.requirements?.level ?? 0;
  const levelBonus = Math.floor(itemLevel / 5); // +1 Ruby a cada 5 níveis
  price += levelBonus;
  return Math.max(1, price); // Valor mínimo 1
};

