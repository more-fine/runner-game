/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Language = 'en' | 'zh';

interface Translations {
  // Menu
  initializeRun: string;
  controlHint: string;
  
  // Shop
  cyberShop: string;
  availableCredits: string;
  resumeMission: string;
  gems: string;
  
  // Shop Items
  doubleJump: string;
  doubleJumpDesc: string;
  maxLifeUp: string;
  maxLifeUpDesc: string;
  repairKit: string;
  repairKitDesc: string;
  immortality: string;
  immortalityDesc: string;
  
  // Game Over
  gameOver: string;
  level: string;
  gemsCollected: string;
  distance: string;
  totalScore: string;
  runAgain: string;
  
  // Victory
  missionComplete: string;
  victoryMessage: string;
  finalScore: string;
  restartMission: string;
  
  // HUD
  speed: string;
  immortal: string;
}

const translations: Record<Language, Translations> = {
  en: {
    // Menu
    initializeRun: 'INITIALIZE RUN',
    controlHint: '[ ARROWS / BUTTONS TO MOVE ]',
    
    // Shop
    cyberShop: 'CYBER SHOP',
    availableCredits: 'AVAILABLE CREDITS:',
    resumeMission: 'RESUME MISSION',
    gems: 'GEMS',
    
    // Shop Items
    doubleJump: 'DOUBLE JUMP',
    doubleJumpDesc: 'Jump again in mid-air. Essential for high obstacles.',
    maxLifeUp: 'MAX LIFE UP',
    maxLifeUpDesc: 'Permanently adds a heart slot and heals you.',
    repairKit: 'REPAIR KIT',
    repairKitDesc: 'Restores 1 Life point instantly.',
    immortality: 'IMMORTALITY',
    immortalityDesc: 'Unlock Ability: Press Space/Tap to be invincible for 5s.',
    
    // Game Over
    gameOver: 'GAME OVER',
    level: 'LEVEL',
    gemsCollected: 'GEMS COLLECTED',
    distance: 'DISTANCE',
    totalScore: 'TOTAL SCORE',
    runAgain: 'RUN AGAIN',
    
    // Victory
    missionComplete: 'MISSION COMPLETE',
    victoryMessage: 'THE ANSWER TO THE UNIVERSE HAS BEEN FOUND',
    finalScore: 'FINAL SCORE',
    restartMission: 'RESTART MISSION',
    
    // HUD
    speed: 'SPEED',
    immortal: 'IMMORTAL',
  },
  zh: {
    // Menu
    initializeRun: '开始游戏',
    controlHint: '[ 方向键 / 按钮移动 ]',
    
    // Shop
    cyberShop: '赛博商店',
    availableCredits: '可用积分：',
    resumeMission: '继续任务',
    gems: '宝石',
    
    // Shop Items
    doubleJump: '二段跳',
    doubleJumpDesc: '在空中再次跳跃，跨越高障碍必备。',
    maxLifeUp: '生命上限提升',
    maxLifeUpDesc: '永久增加一颗心并恢复生命。',
    repairKit: '修复工具',
    repairKitDesc: '立即恢复1点生命值。',
    immortality: '无敌护盾',
    immortalityDesc: '解锁技能：按空格/点击可无敌5秒。',
    
    // Game Over
    gameOver: '游戏结束',
    level: '关卡',
    gemsCollected: '收集宝石',
    distance: '距离',
    totalScore: '总分',
    runAgain: '再来一次',
    
    // Victory
    missionComplete: '任务完成',
    victoryMessage: '宇宙的答案已被找到',
    finalScore: '最终得分',
    restartMission: '重新开始',
    
    // HUD
    speed: '速度',
    immortal: '无敌',
  }
};

interface I18nState {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof Translations) => string;
}

export const useI18n = create<I18nState>()(
  persist(
    (set, get) => ({
      language: 'en',
      setLanguage: (lang: Language) => set({ language: lang }),
      t: (key: keyof Translations) => {
        const lang = get().language;
        return translations[lang][key] || translations['en'][key] || key;
      }
    }),
    {
      name: 'runner-game-language',
    }
  )
);
