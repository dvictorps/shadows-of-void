import { EnemyDamageType } from '../../types/gameData';
import { calculatePercentage, generateUniqueId } from '../../utils/uiUtils';

// Helper to get display name for damage type
export const getDamageTypeDisplayName = (type: EnemyDamageType): string => {
  const displayNames = {
    physical: 'Físico',
    cold: 'Frio',
    void: 'Vazio',
    fire: 'Fogo',
    lightning: 'Raio',
  };
  return displayNames[type] || type;
};

// Calculate barrier percentage
export const calculateBarrierPercentage = (
  current: number | null | undefined,
  max: number | null | undefined
): number => {
  if (!current || !max || max === 0) return 0;
  return calculatePercentage(current, max);
};

// Calculate health percentage
export const calculateHealthPercentage = (
  current: number | null | undefined,
  max: number | null | undefined
): number => {
  if (!current || !max || max === 0) return 0;
  return calculatePercentage(current, max);
};

// Generate floating damage number
export const createFloatingDamageNumber = (
  value: number,
  type: EnemyDamageType,
  container: HTMLElement
) => {
  const rect = container.getBoundingClientRect();
  const x = Math.random() * (rect.width - 40) + 20;
  const y = Math.random() * (rect.height - 40) + 20;
  
  return {
    id: generateUniqueId(),
    value,
    x,
    y,
    type,
  };
};

// Generate floating text (for MISS, etc.)
export const createFloatingText = (
  text: string,
  container: HTMLElement
) => {
  const rect = container.getBoundingClientRect();
  const x = Math.random() * (rect.width - 40) + 20;
  const y = Math.random() * (rect.height - 40) + 20;
  
  return {
    id: generateUniqueId(),
    text,
    x,
    y,
  };
};

// Check if area is town
export const isTownArea = (areaId: string | null | undefined): boolean => {
  return areaId === 'cidade_principal';
};

// Check if area is completed
export const isAreaCompleted = (enemiesKilled: number, killsRequired: number): boolean => {
  return enemiesKilled >= killsRequired;
};

// Format area progress text
export const formatAreaProgress = (enemiesKilled: number, killsRequired: number): string => {
  return `${enemiesKilled}/${killsRequired}`;
};

// Generate boss encounter key for component resets
export const generateBossEncounterKey = (enemyId: string | null): string => {
  return `boss-encounter-${enemyId || 'none'}-${Date.now()}`;
}; 