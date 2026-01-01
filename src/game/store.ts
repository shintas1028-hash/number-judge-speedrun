import { create } from 'zustand';
import type { GameState, Difficulty, GameOptions } from './types';
import { generateCondition, checkAnswer } from './conditions';
import { generateNumbers } from './generator';
import { audioManager } from './audioManager';

interface GameStore extends GameState {
    setDifficulty: (difficulty: Difficulty) => void;
    startGame: () => void;
    stopGame: () => void;
    submitAnswer: (value: number) => void;
    tick: () => void;
    pauseGame: () => void;
    resumeGame: () => void;
    resetToTitle: () => void;

    // Options Actions
    setBgmVolume: (volume: number) => void;
    setSfxVolume: (volume: number) => void;
    toggleBgmMute: () => void;
    toggleSfxMute: () => void;
    setEnableShake: (enable: boolean) => void;
    setEnableFlash: (enable: boolean) => void;
    setLanguage: (lang: 'ja' | 'en') => void;
    setSimResolution: (width: number, height: number) => void;
}

const INITIAL_TIME = 60;

// 難易度ごとの設定
export const DIFFICULTY_SETTINGS = {
    beginner: { cardCount: 3, time: 60, penalty: 5 },
    intermediate: { cardCount: 4, time: 60, penalty: 5 },
    advanced: { cardCount: 5, time: 50, penalty: 8 },
    master: { cardCount: 6, time: 45, penalty: 10 },
};

const DEFAULT_OPTIONS: GameOptions = {
    bgmVolume: 3,
    sfxVolume: 3,
    isBgmMuted: true,
    isSfxMuted: true,
    enableShake: true,
    enableFlash: true,
    language: 'ja',
    simWidth: 0,
    simHeight: 0,
};

export const useGameStore = create<GameStore>((set, get) => ({
    score: 0,
    timeLeft: INITIAL_TIME,
    isPlaying: false,
    currentNumbers: [],
    currentCondition: { id: 'default', description: '', descriptionJa: '', descriptionEn: '', check: () => false },
    difficulty: 'beginner',
    correctCount: 0,
    missCount: 0,
    options: DEFAULT_OPTIONS,

    setDifficulty: (difficulty) => set({ difficulty }),

    // Options Actions Implementation
    setBgmVolume: (volume) => {
        const newVolume = Math.max(0, Math.min(5, volume));
        set((state) => ({ options: { ...state.options, bgmVolume: newVolume } }));
        const { isBgmMuted } = get().options;
        if (!isBgmMuted) {
            audioManager.setBGMVolume(newVolume / 5);
        }
    },
    setSfxVolume: (volume) => {
        const newVolume = Math.max(0, Math.min(5, volume));
        set((state) => ({ options: { ...state.options, sfxVolume: newVolume } }));
        const { isSfxMuted } = get().options;
        if (!isSfxMuted) {
            audioManager.setSFXVolume(newVolume / 5);
        }
    },
    toggleBgmMute: () => {
        set((state) => {
            const newMuted = !state.options.isBgmMuted;
            audioManager.setBgmMuted(newMuted);
            return { options: { ...state.options, isBgmMuted: newMuted } };
        });
    },
    toggleSfxMute: () => {
        set((state) => {
            const newMuted = !state.options.isSfxMuted;
            audioManager.setSfxMuted(newMuted);
            return { options: { ...state.options, isSfxMuted: newMuted } };
        });
    },

    setEnableShake: (enable) => set((state) => ({ options: { ...state.options, enableShake: enable } })),
    setEnableFlash: (enable) => set((state) => ({ options: { ...state.options, enableFlash: enable } })),
    setLanguage: (lang) => set((state) => ({ options: { ...state.options, language: lang } })),
    setSimResolution: (width: number, height: number) =>
        set((state) => ({ options: { ...state.options, simWidth: width, simHeight: height } })),

    startGame: () => {
        const { difficulty } = get();
        const settings = DIFFICULTY_SETTINGS[difficulty];

        const initialNumbers = generateNumbers(settings.cardCount);
        const initialCondition = generateCondition(initialNumbers, difficulty);

        set({
            isPlaying: true,
            score: 0,
            timeLeft: settings.time,
            currentNumbers: initialNumbers,
            currentCondition: initialCondition,
            correctCount: 0,
            missCount: 0,
        });
        audioManager.playBGM('game');
    },

    stopGame: () => set({ isPlaying: false }),

    submitAnswer: (value: number) => {
        const { currentNumbers, currentCondition, score, timeLeft, difficulty, correctCount, missCount } = get();

        if (!currentCondition) return; // ガード節を追加

        const isCorrect = checkAnswer(value, currentNumbers, currentCondition);
        const settings = DIFFICULTY_SETTINGS[difficulty];

        // 次の問題を生成
        const nextNumbers = generateNumbers(settings.cardCount);

        // 正解の場合のみ previousAnswer として value を渡す
        // 不正解の場合は undefined となり、次の問題でメモリ条件（前の正解より...）は出題されない
        const previousAnswer = isCorrect ? value : undefined;
        const nextCondition = generateCondition(nextNumbers, difficulty, previousAnswer);

        if (isCorrect) {
            audioManager.playSFX('correct');
            set({
                score: score + 100,
                currentNumbers: nextNumbers,
                currentCondition: nextCondition,
                correctCount: correctCount + 1,
            });
        } else {
            audioManager.playSFX('wrong');
            // 不正解時の処理（ペナルティ + 次の問題へ）
            set({
                timeLeft: Math.max(0, timeLeft - settings.penalty),
                missCount: missCount + 1,
                currentNumbers: nextNumbers,
                currentCondition: nextCondition,
            });
        }
    },

    tick: () => {
        const { timeLeft, isPlaying } = get();
        if (isPlaying && timeLeft > 0) {
            set({ timeLeft: timeLeft - 1 });
        } else if (timeLeft === 0) {
            set({ isPlaying: false });
            audioManager.playBGM('result');
        }
    },

    pauseGame: () => set({ isPlaying: false }),

    resumeGame: () => set({ isPlaying: true }),

    resetToTitle: () => {
        const { difficulty } = get();
        const settings = DIFFICULTY_SETTINGS[difficulty];
        set({
            isPlaying: false,
            timeLeft: settings.time,
            score: 0,
            currentNumbers: [],
            correctCount: 0,
            missCount: 0,
        });
        audioManager.playBGM('title');
    }
}));
