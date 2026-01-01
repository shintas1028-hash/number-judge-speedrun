export interface Condition {
  id: string;
  description: string; // Default (JA)
  descriptionJa: string;
  descriptionEn: string;
  /**
   * 選択された数値が条件を満たすかどうかを判定する
   * @param selected ユーザーが選んだ数値
   * @param allNumbers 現在表示されている全ての数値
   */
  check: (selected: number, allNumbers: number[]) => boolean;
}

export type ConditionType = 'max' | 'min' | 'even' | 'odd';

export type Difficulty = 'beginner' | 'intermediate' | 'advanced' | 'master';

export interface GameOptions {
  bgmVolume: number; // 0-5
  sfxVolume: number; // 0-5
  isBgmMuted: boolean;
  isSfxMuted: boolean;
  enableShake: boolean;
  enableFlash: boolean;
  language: 'ja' | 'en';
  simWidth: number;
  simHeight: number;
}

export interface GameState {
  score: number;
  timeLeft: number;
  isPlaying: boolean;
  currentNumbers: number[];
  currentCondition: Condition | null;
  difficulty: Difficulty;
  correctCount: number;
  missCount: number;
  options: GameOptions;
}
