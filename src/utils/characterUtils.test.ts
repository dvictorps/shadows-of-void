import { createCharacter, createNewCharacter, restoreStats } from './characterUtils';
import type { CharacterClass, ItemRarity, WeaponClassification } from '../types/gameData';
import { ModifierType } from '../types/gameData';
import { calculateEffectiveStats } from './statUtils/weapon';
import { describe, it, expect } from 'vitest';

describe('characterUtils', () => {
  it('cria personagem Guerreiro corretamente', () => {
    const char = createCharacter(1, 'Warrior', 'Guerreiro', 60);
    expect(char.class).toBe('Guerreiro');
    expect(char.strength).toBeGreaterThanOrEqual(10);
    expect(char.currentAreaId).toBe('cidade_principal');
    expect(char.healthPotions).toBe(3);
    expect(char.equipment).toBeDefined();
  });

  it('cria personagem Ladino corretamente', () => {
    const char = createCharacter(2, 'Rogue', 'Ladino', 50);
    expect(char.class).toBe('Ladino');
    expect(char.dexterity).toBeGreaterThanOrEqual(10);
    expect(char.currentAreaId).toBe('cidade_principal');
    expect(char.healthPotions).toBe(3);
  });

  it('cria personagem Mago corretamente', () => {
    const char = createCharacter(3, 'Mage', 'Mago', 25);
    expect(char.class).toBe('Mago');
    expect(char.intelligence).toBeGreaterThanOrEqual(10);
    expect(char.maxMana).toBeGreaterThan(0);
    expect(char.currentMana).toBe(char.maxMana);
    expect(char.currentAreaId).toBe('cidade_principal');
    expect(char.healthPotions).toBe(3);
  });

  it('cria personagem hardcore corretamente', () => {
    const char = createNewCharacter(4, 'Hardcore', 'Guerreiro', true);
    expect(char.isHardcore).toBe(true);
    expect(char.class).toBe('Guerreiro');
    expect(char.currentAreaId).toBe('cidade_principal');
    expect(char.healthPotions).toBe(3);
  });

  it('atribui equipamentos iniciais corretamente', () => {
    const warrior = createCharacter(5, 'Warrior', 'Guerreiro', 60);
    expect(warrior.equipment.weapon1).toBeDefined();
    const mage = createCharacter(6, 'Mage', 'Mago', 25);
    expect(mage.equipment).toBeDefined();
  });

  it('restaura stats corretamente para um mago real com equipamentos', () => {
    const phpMago = {
      id: 1752433746941,
      name: "Php",
      class: "Mago" as CharacterClass,
      isHardcore: false,
      level: 10,
      currentXP: 34,
      currentAct: 1,
      currentAreaId: "cidade_principal",
      unlockedAreaIds: [
        "cidade_principal",
        "colinas_ecoantes",
        "nevoeiro",
        "bosque_nebuloso",
        "bosque_do_luar",
        "floresta_sombria"
      ],
      strength: 5,
      dexterity: 5,
      intelligence: 25,
      baseMaxHealth: 88,
      maxHealth: 88,
      minBaseDamage: 1,
      maxBaseDamage: 3,
      armor: 3,
      evasion: 5,
      barrier: 0,
      baseMaxMana: 50,
      maxMana: 113,
      currentMana: 10,
      currentHealth: 10,
      currentBarrier: 0,
      fireResistance: 0,
      coldResistance: 0,
      lightningResistance: 0,
      voidResistance: 0,
      criticalStrikeChance: 5,
      criticalStrikeMultiplier: 150,
      projectileDamage: 0,
      spellDamage: 0,
      fireDamage: 0,
      coldDamage: 0,
      lightningDamage: 0,
      voidDamage: 0,
      movementSpeed: 0,
      attackSpeed: 1,
      castSpeed: 1,
      healthPotions: 1,
      teleportStones: 4,
      blockChance: 0,
      inventory: [],
      equipment: {
        bodyArmor: {
          baseId: "barrier_armour_t1",
          name: "Mágico Robe de Seda",
          itemType: "BodyArmor",
          icon: "/sprites/armours/barrier/barrier_armour.png",
          minLevel: 1,
          maxLevel: 19,
          baseBarrier: 40,
          requirements: {
            level: 1,
            intelligence: 10
          },
          allowedModifiers: [],
          id: "05d80b89-3ed6-49f1-aac9-dc0e82a82a33",
          rarity: "Mágico" as ItemRarity,
          modifiers: [
            { type: ModifierType.IncreasedLocalBarrier, value: 10 },
            { type: ModifierType.Dexterity, value: 1 }
          ],
          implicitModifier: null
        },
        weapon1: {
          baseId: "arcane_staff_base",
          name: "Mágico Cajado Arcano",
          itemType: "Staff",
          classification: "Spell" as WeaponClassification,
          icon: "/sprites/weapons/spells/magical_sceptre.png",
          baseSpellMinDamage: 10,
          baseSpellMaxDamage: 20,
          baseAttackSpeed: 0.9,
          baseCriticalStrikeChance: 6,
          minLevel: 1,
          requirements: {
            level: 5,
            intelligence: 15
          },
          allowedModifiers: [],
          id: "cf447e3c-6a95-4190-bacb-19e95a55e709",
          rarity: "Mágico" as ItemRarity,
          modifiers: [
            { type: ModifierType.IncreasedSpellDamage, value: 10 },
            { type: ModifierType.IncreasedColdDamage, value: 10 }
          ],
          implicitModifier: null
        },
        ring1: {
          baseId: "skull_ring_t1",
          name: "Anel do Oculto",
          itemType: "Ring",
          icon: "/sprites/jewelry/rings/skull_ring.png",
          minLevel: 1,
          requirements: {
            level: 1
          },
          allowedModifiers: [],
          implicitModifierPool: [
            { type: "IncreasedCastSpeed", weight: 1 },
            { type: "IncreasedSpellDamage", weight: 1 },
            { type: "AddsFlatSpellFireDamage", weight: 1 },
            { type: "AddsFlatSpellColdDamage", weight: 1 },
            { type: "AddsFlatSpellLightningDamage", weight: 1 },
            { type: "AddsFlatSpellVoidDamage", weight: 1 }
          ],
          id: "fb367c9a-85cf-4e7c-b185-77af0f81c048",
          rarity: "Normal" as ItemRarity,
          modifiers: [],
          implicitModifier: { type: ModifierType.AddsFlatSpellColdDamage, value: 2 }
        },
        weapon2: null,
        belt: {
          baseId: "knowledge_belt_t1",
          name: "Mágico Cinto do Conhecimento",
          itemType: "Belt",
          icon: "/sprites/jewelry/belts/knowledge_belt.png",
          minLevel: 1,
          requirements: {
            level: 1
          },
          allowedModifiers: [],
          implicitModifierPool: [
            { type: "Strength", weight: 1 },
            { type: "Dexterity", weight: 1 },
            { type: "Intelligence", weight: 1 }
          ],
          id: "5f1e3bb3-0727-47f1-8282-bde4305b06a9",
          rarity: "Mágico" as ItemRarity,
          modifiers: [ { type: ModifierType.FlatLocalArmor, value: 5 } ],
          implicitModifier: { type: ModifierType.Intelligence, value: 3 }
        },
        ring2: {
          baseId: "skull_ring_t1",
          name: "Mágico Anel do Oculto",
          itemType: "Ring",
          icon: "/sprites/jewelry/rings/skull_ring.png",
          minLevel: 1,
          requirements: {
            level: 3
          },
          allowedModifiers: [],
          implicitModifierPool: [
            { type: "IncreasedCastSpeed", weight: 1 },
            { type: "IncreasedSpellDamage", weight: 1 },
            { type: "AddsFlatSpellFireDamage", weight: 1 },
            { type: "AddsFlatSpellColdDamage", weight: 1 },
            { type: "AddsFlatSpellLightningDamage", weight: 1 },
            { type: "AddsFlatSpellVoidDamage", weight: 1 }
          ],
          id: "784a4e8f-26ba-4872-98af-e499e68798ce",
          rarity: "Mágico" as ItemRarity,
          modifiers: [ { type: ModifierType.FlatLocalBarrier, value: 6 } ],
          implicitModifier: { type: ModifierType.AddsFlatSpellColdDamage, value: 2 }
        },
        helm: {
          baseId: "barrier_helmet_t1",
          name: "Tiara de Seda",
          itemType: "Helm",
          icon: "/sprites/armours/barrier/barrier_helmet.png",
          minLevel: 1,
          maxLevel: 24,
          baseBarrier: 36,
          requirements: {
            level: 2,
            intelligence: 10
          },
          allowedModifiers: [],
          id: "ba9704d8-0a64-4344-b0fb-d58ccc49b514",
          rarity: "Normal" as ItemRarity,
          modifiers: [],
          implicitModifier: null
        },
        amulet: {
          baseId: "crystal_amulet_t1",
          name: "Amuleto de Cristal",
          itemType: "Amulet",
          icon: "/sprites/jewelry/amulets/crystal_amulet.png",
          minLevel: 5,
          requirements: {
            level: 5
          },
          allowedModifiers: [],
          implicitModifierPool: [
            { type: "FlatLocalArmor", weight: 1 },
            { type: "FlatLocalEvasion", weight: 1 },
            { type: "FlatLocalBarrier", weight: 1 },
            { type: "MaxHealth", weight: 1 }
          ],
          id: "a64ac367-d6b2-49c3-b8f4-e0532f42acdb",
          rarity: "Normal" as ItemRarity,
          modifiers: [],
          implicitModifier: { type: ModifierType.FlatLocalEvasion, value: 10 }
        },
        gloves: {
          baseId: "barrier_gloves_t1",
          name: "Mágico Luvas de Seda",
          itemType: "Gloves",
          icon: "/sprites/armours/barrier/barrier_gloves.png",
          minLevel: 4,
          maxLevel: 20,
          baseBarrier: 24,
          requirements: {
            level: 4,
            intelligence: 10
          },
          allowedModifiers: [],
          id: "738a55ab-71c4-4a9d-8bcb-94147013f88f",
          rarity: "Mágico" as ItemRarity,
          modifiers: [ { type: ModifierType.AddsFlatPhysicalDamage, valueMin: 1, valueMax: 1 } ],
          implicitModifier: null
        }
      }
    };
    const restaurado = restoreStats(phpMago);
    expect(restaurado.currentHealth).toBe(restaurado.maxHealth);
    expect(restaurado.currentMana).toBe(restaurado.maxMana);
    expect(restaurado.healthPotions).toBe(3);
    expect(restaurado.currentBarrier).toBeGreaterThan(0);
  });

  it('mago inicia com barrier base + equipamento (robe)', () => {
    const mage = createNewCharacter(123, 'MageTest', 'Mago', false);
    // O robe inicial tem 40 de barrier, o base do mago é 40, bônus de inteligência inicial (10%) = 88
    expect(mage.currentBarrier).toBe(88);
  });

  it('spell damage de anéis deve ser aplicado no DPS', () => {
    // Criar um mago básico
    const baseMage = createNewCharacter(456, 'SpellDamageMage', 'Mago', false);
    
    // A função calculateEffectiveStats já foi importada no topo do arquivo
    
    // Calcular stats sem spell damage adicional
    const baseStats = calculateEffectiveStats(baseMage);
    
    // Adicionar um anel com spell damage
    const mageWithSpellRing = {
      ...baseMage,
      equipment: {
        ...baseMage.equipment,
        ring1: {
          baseId: "skull_ring_t1",
          name: "Anel Teste",
          itemType: "Ring",
          icon: "/sprites/jewelry/rings/skull_ring.png",
          modifiers: [],
          implicitModifier: {
            type: ModifierType.AddsFlatSpellFireDamage,
            valueMin: 8,
            valueMax: 15
          },
          id: "test-ring",
          rarity: "Normal" as ItemRarity
        }
      }
    };
    
    // Calcular stats com spell damage
    const statsWithSpellDamage = calculateEffectiveStats(mageWithSpellRing);
    
    console.log('Base Stats:', {
      minDamage: baseStats.minDamage,
      maxDamage: baseStats.maxDamage,
      dps: baseStats.dps,
      globalFlatMinFire: baseStats.globalFlatMinFire,
      globalFlatMaxFire: baseStats.globalFlatMaxFire
    });
    
    console.log('Stats with Spell Ring:', {
      minDamage: statsWithSpellDamage.minDamage,
      maxDamage: statsWithSpellDamage.maxDamage,
      dps: statsWithSpellDamage.dps,
      globalFlatMinFire: statsWithSpellDamage.globalFlatMinFire,
      globalFlatMaxFire: statsWithSpellDamage.globalFlatMaxFire
    });
    
    // Verificar se o spell damage foi aplicado nos stats globais
    expect(statsWithSpellDamage.globalFlatMinFire).toBe(8);
    expect(statsWithSpellDamage.globalFlatMaxFire).toBe(15);
    
    // Verificar se o dano total aumentou
    expect(statsWithSpellDamage.minDamage).toBeGreaterThan(baseStats.minDamage);
    expect(statsWithSpellDamage.maxDamage).toBeGreaterThan(baseStats.maxDamage);
    
    // Verificar se o DPS aumentou
    expect(statsWithSpellDamage.dps).toBeGreaterThan(baseStats.dps);
    
    // Verificar que o aumento é pelo menos o valor mínimo do spell damage
    expect(statsWithSpellDamage.minDamage - baseStats.minDamage).toBeGreaterThanOrEqual(8);
    expect(statsWithSpellDamage.maxDamage - baseStats.maxDamage).toBeGreaterThanOrEqual(15);
  });

  it('modificadores percentuais de spell damage devem funcionar', () => {
    // Criar um mago básico
    const baseMage = createNewCharacter(789, 'PercentSpellMage', 'Mago', false);
    
    // Calcular stats base
    const baseStats = calculateEffectiveStats(baseMage);
    
    // Adicionar anel com % spell damage e % fire damage
    const mageWithPercentRings = {
      ...baseMage,
      equipment: {
        ...baseMage.equipment,
        ring1: {
          baseId: "skull_ring_t1",
          name: "Anel de % Spell",
          itemType: "Ring",
          icon: "/sprites/jewelry/rings/skull_ring.png",
          modifiers: [{
            type: ModifierType.IncreasedSpellDamage,
            value: 10 // 10% spell damage
          }],
          implicitModifier: {
            type: ModifierType.IncreasedFireDamage,
            value: 5 // 5% fire damage
          },
          id: "test-percent-ring",
          rarity: "Mágico" as ItemRarity
        }
      }
    };
    
    const statsWithPercent = calculateEffectiveStats(mageWithPercentRings);
    
    console.log('Base Stats:', {
      minDamage: baseStats.minDamage,
      maxDamage: baseStats.maxDamage,
      dps: baseStats.dps,
      increaseSpellDamagePercent: baseStats.increaseSpellDamagePercent,
      increaseFireDamagePercent: baseStats.increaseFireDamagePercent
    });
    
    console.log('Stats with % Rings:', {
      minDamage: statsWithPercent.minDamage,
      maxDamage: statsWithPercent.maxDamage,
      dps: statsWithPercent.dps,
      increaseSpellDamagePercent: statsWithPercent.increaseSpellDamagePercent,
      increaseFireDamagePercent: statsWithPercent.increaseFireDamagePercent
    });
    
    // Verificar se os percentuais foram aplicados
    expect(statsWithPercent.increaseSpellDamagePercent).toBe(10);
    expect(statsWithPercent.increaseFireDamagePercent).toBe(5);
    
    // Verificar se o dano aumentou proporcionalmente
    expect(statsWithPercent.minDamage).toBeGreaterThan(baseStats.minDamage);
    expect(statsWithPercent.maxDamage).toBeGreaterThan(baseStats.maxDamage);
    expect(statsWithPercent.dps).toBeGreaterThan(baseStats.dps);
    
    // O aumento deve ser pelo menos 10% (spell damage)
    // O 5% fire damage não se aplica totalmente porque a instância ativa é gelo
    const expectedMinIncrease = baseStats.minDamage * 0.10; // Apenas 10% do spell damage
    const actualMinIncrease = statsWithPercent.minDamage - baseStats.minDamage;
    expect(actualMinIncrease).toBeGreaterThanOrEqual(expectedMinIncrease * 0.95); // Margem de 5%
  });
}); 