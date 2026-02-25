export type GameState = 'START' | 'MAP' | 'BATTLE' | 'RESULT' | 'BOSS_BATTLE' | 'LEVEL_CLEAR';

export interface UserStats {
  level: number;
  xp: number;
  totalDefeated: number;
  accuracyHistory: number[];
  currentMapLevel: number;
}

export interface Monster {
  kanji: string;
  hp: number;
  maxHp: number;
  emoji: string;
  isBoss: boolean;
}
