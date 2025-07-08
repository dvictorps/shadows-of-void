import { useState, useCallback, useEffect } from "react";
import { EnemyDamageType } from "@/types/gameData";

export interface EnemyDamageNumber {
  id: string;
  value: number;
  x: number;
  y: number;
  type: EnemyDamageType;
}
export interface LastPlayerDamage { id: string; value: number; timestamp: number; isCritical: boolean; }
export interface LastLifeLeech { id: string; value: number; timestamp: number; }
export interface LastEnemyThornsDamage { id: string; value: number; timestamp: number; }
export interface FloatingText { id: string; text: string; x: number; y: number; }

export const useFloatingNumbers = () => {
  const [playerDamageTakenNumbers, setPlayerDamageTakenNumbers] = useState<EnemyDamageNumber[]>([]);
  const [lastPlayerDamage, setLastPlayerDamage] = useState<LastPlayerDamage | null>(null);
  const [lastLifeLeech, setLastLifeLeech] = useState<LastLifeLeech | null>(null);
  const [lastEnemyThornsDamage, setLastEnemyThornsDamage] = useState<LastEnemyThornsDamage | null>(null);
  const [floatingMissTexts, setFloatingMissTexts] = useState<FloatingText[]>([]);

  // Handlers
  const displayPlayerDamage = useCallback((value:number,isCritical:boolean)=>{
    setLastPlayerDamage({ value: Math.floor(value), timestamp: Date.now(), id: crypto.randomUUID(), isCritical });
  },[]);

  const displayLifeLeech = useCallback((value:number)=>{
    setLastLifeLeech({ value, timestamp: Date.now(), id: crypto.randomUUID() });
  },[]);

  const displayEnemyThornsDamage = useCallback((value:number)=>{
    setLastEnemyThornsDamage({ value, timestamp: Date.now(), id: crypto.randomUUID() });
  },[]);

  const displayEnemyDamage = useCallback((value:number,type:EnemyDamageType)=>{
    const id = crypto.randomUUID();
    const x = 15 + (Math.random()*10 -5);
    const y = 75 + (Math.random()*10 -5);
    setPlayerDamageTakenNumbers(prev=>[...prev,{id,value,x,y,type}]);
    setTimeout(()=> setPlayerDamageTakenNumbers(prev=>prev.filter(n=>n.id!==id)),800);
  },[]);

  const displayMissText = useCallback(()=>{
    const id = crypto.randomUUID();
    const x = 15 + (Math.random()*10 -5);
    const y = 75 + (Math.random()*10 -5);
    setFloatingMissTexts(prev=>[...prev,{id,text:"MISS",x,y}]);
    setTimeout(()=> setFloatingMissTexts(prev=>prev.filter(t=>t.id!==id)),800);
  },[]);

  // Timeouts for lastX states
  useEffect(()=>{ if(lastPlayerDamage){ const t=setTimeout(()=>setLastPlayerDamage(null),800); return ()=>clearTimeout(t);} },[lastPlayerDamage]);
  useEffect(()=>{ if(lastLifeLeech){ const t=setTimeout(()=>setLastLifeLeech(null),800); return ()=>clearTimeout(t);} },[lastLifeLeech]);
  useEffect(()=>{ if(lastEnemyThornsDamage){ const t=setTimeout(()=>setLastEnemyThornsDamage(null),800); return ()=>clearTimeout(t);} },[lastEnemyThornsDamage]);

  return {
    data: { playerDamageTakenNumbers, floatingMissTexts, lastPlayerDamage, lastLifeLeech, lastEnemyThornsDamage },
    actions: { displayPlayerDamage, displayLifeLeech, displayEnemyThornsDamage, displayEnemyDamage, displayMissText }
  };
}; 