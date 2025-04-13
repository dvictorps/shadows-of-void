import { EquippableItem } from "../types/gameData";

// Export the type alias
export type BaseItemTemplate = Omit<EquippableItem, 'id' | 'modifiers' | 'rarity' | 'itemLevel'> & {
  minLevel: number; // Minimum area/monster level for this base to drop
  requirements?: EquippableItem['requirements']; // Add optional requirements from EquippableItem
};

export const itemBases: Record<string, BaseItemTemplate> = {
  // Espadas de Duas Mãos
  basic_two_handed_sword: {
    baseId: 'basic_two_handed_sword',
    name: 'Espada de Duas Mãos',
    itemType: 'TwoHandedSword',
    classification: "Melee",
    icon: '/sprites/two_handed_sword.png',
    baseMinDamage: 5, // Reduzido
    baseMaxDamage: 10, // Reduzido
    baseAttackSpeed: 0.8,
    minLevel: 1, // Pode dropar desde o início
  },
  advanced_two_handed_sword: {
    baseId: 'advanced_two_handed_sword',
    name: 'Espada de Duas Mãos Avançada',
    itemType: 'TwoHandedSword',
    classification: "Melee",
    icon: '/sprites/two_handed_sword.png', // Usar o mesmo sprite por enquanto
    baseMinDamage: 20,
    baseMaxDamage: 40,
    baseAttackSpeed: 0.8,
    minLevel: 20,
    requirements: { level: 20, strength: 50 },
  },
  expert_two_handed_sword: {
    baseId: 'expert_two_handed_sword',
    name: 'Espada de Duas Mãos Expert',
    itemType: 'TwoHandedSword',
    classification: "Melee",
    icon: '/sprites/two_handed_sword.png', // Usar o mesmo sprite por enquanto
    baseMinDamage: 40,
    baseMaxDamage: 80,
    baseAttackSpeed: 0.8,
    minLevel: 45,
    requirements: { level: 45, strength: 100 },
  },
  // Adicionar outras bases de itens aqui (armaduras, etc.)
};

// Helper para pegar bases elegíveis por nível
export function getEligibleItemBases(level: number, type?: string): BaseItemTemplate[] {
    return Object.values(itemBases).filter(base =>
        base.minLevel <= level &&
        (!type || base.itemType === type) // Filtra por tipo se fornecido
    );
} 