'use client';

import React, { useEffect, useState } from 'react';
import { useGameStore } from '../game/store';
import { audioManager } from '../game/audioManager';
import { OptionsModal } from './OptionsModal';
import { CreditsModal } from './CreditsModal';
import { SoundToggle } from './SoundToggle'; // Import
import { DevResolutionPanel } from './DevResolutionPanel'; // New
import { TEXT_RESOURCES } from '../game/constants';
import styles from '../styles/GameScreen.module.css';

export const GameScreen: React.FC = () => {
    const {
        score,
        timeLeft,
        isPlaying,
        currentNumbers,
        currentCondition,
        correctCount,
        missCount,
        difficulty,
        options,
        setDifficulty,
        startGame,
        submitAnswer,
        pauseGame,
        resumeGame,
        resetToTitle,
    } = useGameStore();

    const [showFlash, setShowFlash] = useState<'correct' | 'wrong' | null>(null);
    const [shakeContainer, setShakeContainer] = useState(false);
    const [floatingTexts, setFloatingTexts] = useState<{ id: number; x: number; y: number; text: string; type: 'correct' | 'wrong' }[]>([]);
    const [countdown, setCountdown] = useState<number | null>(null);
    const [showPause, setShowPause] = useState(false);
    const [showOptions, setShowOptions] = useState(false);
    const [showCredits, setShowCredits] = useState(false);

    const t = TEXT_RESOURCES[options.language];

    // タイマー処理
    useEffect(() => {
        let interval: number | undefined;
        if (isPlaying) {
            interval = window.setInterval(() => {
                useGameStore.getState().tick();
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isPlaying]);

    // 初回マウント時にタイトルBGMを再生
    // 初回マウント時にタイトルBGMを再生
    useEffect(() => {
        // Audio Managerの状態をStoreと同期
        const { options } = useGameStore.getState();

        audioManager.setBgmMuted(options.isBgmMuted);
        audioManager.setSfxMuted(options.isSfxMuted);

        // 音量も一応設定
        audioManager.setBGMVolume(options.bgmVolume / 5);
        audioManager.setSFXVolume(options.sfxVolume / 5);

        if (!isPlaying && currentNumbers.length === 0) {
            audioManager.playBGM('title');
        }
    }, []);

    // エフェクトのトリガー
    useEffect(() => {
        if (correctCount > 0 && options.enableFlash) {
            setShowFlash('correct');
            setTimeout(() => setShowFlash(null), 300);
        }
    }, [correctCount, options.enableFlash]);

    useEffect(() => {
        if (missCount > 0) {
            if (options.enableFlash) {
                setShowFlash('wrong');
                setTimeout(() => setShowFlash(null), 400);
            }
            if (options.enableShake) {
                setShakeContainer(true);
                setTimeout(() => setShakeContainer(false), 400);
            }
        }
    }, [missCount, options.enableFlash, options.enableShake]);

    // ESCキーでポーズ
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isPlaying) {
                setShowPause(true);
                pauseGame();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isPlaying, pauseGame]);

    const handleStart = () => {
        // カウントダウン開始: 3, 2, 1, START!
        audioManager.stopBGM();
        setCountdown(3);
        audioManager.playSFX('countdown');

        let currentCount = 3;
        const countdownInterval = setInterval(() => {
            currentCount--;

            if (currentCount > 0) {
                // 3 -> 2 -> 1
                setCountdown(currentCount);
                audioManager.playSFX('countdown');
            } else if (currentCount === 0) {
                // START! を表示
                setCountdown(0);
                audioManager.playSFX('start');
            } else {
                // カウントダウン終了、ゲーム開始
                clearInterval(countdownInterval);
                setCountdown(null);
                startGame();
            }
        }, 1000);
    };

    const handlePause = () => {
        setShowPause(true);
        pauseGame();
    };

    const handleCardClick = (number: number, e: React.MouseEvent) => {
        if (isPlaying) {
            submitAnswer(number);

            if (!currentCondition) return;

            // check関数のシグネチャ変更に対応: 第2引数は allNumbers (currentNumbers)
            const isCorrect = currentCondition.check(number, currentNumbers);
            const text = isCorrect ? '+1 Score' : '-5 Sec';
            const type = isCorrect ? 'correct' : 'wrong';

            const newText: { id: number; x: number; y: number; text: string; type: 'correct' | 'wrong' } = {
                id: Date.now(),
                x: e.clientX,
                y: e.clientY,
                text,
                type,
            };

            setFloatingTexts((prev) => [...prev, newText]);

            setTimeout(() => {
                setFloatingTexts((prev) => prev.filter((ft) => ft.id !== newText.id));
            }, 1000);
        }
    };

    const handleQuit = () => {
        resetToTitle();
    };

    // カウントダウン中 (最優先)
    if (countdown !== null) {
        return (
            <div className={styles.container}>
                <div className={styles.countdownScreen}>
                    <div className={styles.countdownNumber}>
                        {countdown === 0 ? 'START!' : countdown}
                    </div>
                    <div className={styles.countdownRing}></div>
                </div>
            </div>
        );
    }

    // ゲーム開始前または終了後（リセット後）
    // currentNumbers が空の場合はタイトル画面を表示
    if (!isPlaying && currentNumbers.length === 0) {
        return (
            <div className={styles.container}>
                <div className={styles.titleScreen}>
                    <div className={styles.titleLogo}>
                        NUMBER JUDGE<br />SPEEDRUN
                    </div>
                    <div className={styles.titleSubtitle}>
                        {t.titleSubtitle}
                    </div>

                    <div className={styles.difficultyContainer}>
                        <p className={styles.difficultyLabel}>{t.selectDifficulty}</p>
                        <div className={styles.difficultyButtons}>
                            <button
                                className={`${styles.difficultyBtn} ${styles.diffBeginner}`}
                                onClick={() => { setDifficulty('beginner'); handleStart(); }}
                            >
                                {t.difficulty.beginner}
                                <span className={styles.diffInfo}>3 {t.cards}</span>
                            </button>
                            <button
                                className={`${styles.difficultyBtn} ${styles.diffIntermediate}`}
                                onClick={() => { setDifficulty('intermediate'); handleStart(); }}
                            >
                                {t.difficulty.intermediate}
                                <span className={styles.diffInfo}>4 {t.cards}</span>
                            </button>
                            <button
                                className={`${styles.difficultyBtn} ${styles.diffAdvanced}`}
                                onClick={() => { setDifficulty('advanced'); handleStart(); }}
                            >
                                {t.difficulty.advanced}
                                <span className={styles.diffInfo}>5 {t.cards}</span>
                            </button>
                            <button
                                className={`${styles.difficultyBtn} ${styles.diffMaster}`}
                                onClick={() => { setDifficulty('master'); handleStart(); }}
                            >
                                {t.difficulty.master}
                                <span className={styles.diffInfo}>6 {t.cards}</span>
                            </button>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'center' }}>
                        <button
                            className={styles.optionsBtn}
                            onClick={() => setShowOptions(true)}
                            style={{ background: 'transparent', border: '1px solid #00f3ff', color: '#00f3ff', padding: '0.5rem 2rem', cursor: 'pointer' }}
                        >
                            {t.options}
                        </button>
                        <button
                            className={styles.creditsBtn}
                            onClick={() => setShowCredits(true)}
                            style={{ background: 'transparent', border: '1px solid #888', color: '#888', padding: '0.5rem 2rem', cursor: 'pointer' }}
                        >
                            {t.credits}
                        </button>
                    </div>
                </div>
                {showOptions && <OptionsModal onClose={() => setShowOptions(false)} />}
                {showCredits && <CreditsModal onClose={() => setShowCredits(false)} />}
            </div>
        );
    }

    // ゲームオーバー画面
    if (!isPlaying && timeLeft === 0) {
        return (
            <div className={styles.container}>
                <div className={styles.gameOver}>
                    <h2>{t.timeUp}</h2>
                    <div className={styles.finalScore}>{t.score}: {score}</div>
                    <div className={styles.gameOverButtons}>
                        <button className={styles.startButton} onClick={handleStart}>
                            {t.retry}
                        </button>
                        <button className={styles.backButton} onClick={handleQuit}>
                            {t.backToTitle}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // スコアに応じたビジュアルレベルの取得
    const getVisualLevel = () => {
        if (score >= 3000) return styles.level4;
        if (score >= 2000) return styles.level3;
        if (score >= 1000) return styles.level2;
        return styles.level1;
    };

    const isWarning = timeLeft <= 10;

    // ポーズモーダル
    if (showPause && !isPlaying) {
        return (
            <div className={styles.container}>
                <div className={styles.gameOver}>
                    <h2 style={{ fontSize: '4rem', color: '#00f3ff' }}>{t.paused}</h2>
                    <div className={styles.gameOverButtons}>
                        <button
                            className={styles.startButton}
                            onClick={() => { setShowPause(false); resumeGame(); }}
                        >
                            {t.resume}
                        </button>
                        <button
                            className={styles.startButton}
                            onClick={() => setShowOptions(true)}
                            style={{ background: 'transparent', border: '1px solid #00f3ff', color: '#00f3ff' }}
                        >
                            {t.options}
                        </button>
                        <button
                            className={styles.backButton}
                            onClick={() => { setShowPause(false); handleQuit(); }}
                        >
                            {t.quit}
                        </button>
                    </div>
                </div>
                {showOptions && <OptionsModal onClose={() => setShowOptions(false)} />}
            </div>
        );
    }

    const containerStyle: React.CSSProperties = {};
    if (options.simWidth > 0) containerStyle.width = `${options.simWidth}px`;
    if (options.simHeight > 0) containerStyle.height = `${options.simHeight}px`;

    return (
        <div
            className={`${styles.container} ${shakeContainer ? styles['anim-shake'] : ''}`}
            style={containerStyle}
        >
            {/* Resolution Adjustment Panel (Dev) */}
            <DevResolutionPanel />

            {/* Persistent Sound Toggle */}
            <SoundToggle />

            {showFlash === 'correct' && <div className={styles['anim-flash-correct']} />}
            {showFlash === 'wrong' && <div className={styles['anim-flash-wrong']} />}

            {isWarning && <div className={styles.warningVignette} />}

            {floatingTexts.map((ft) => (
                <div
                    key={ft.id}
                    className={`${styles.floatingText} ${ft.type === 'correct' ? styles.floatCorrect : styles.floatWrong}`}
                    style={{ left: ft.x, top: ft.y }}
                >
                    {ft.text}
                </div>
            ))}

            <div className={styles.gameWrapper}>
                {/* Left Sidebar: Stats */}
                <div className={styles.leftSidebar}>
                    <div className={styles.statItem}>
                        <div className={styles.statLabel}>{t.statScore}</div>
                        <div className={styles.statValue}>{score}</div>
                    </div>
                    <div className={styles.statItem}>
                        <div className={styles.statLabel}>{t.statCorrect}</div>
                        <div className={styles.statValue} style={{ color: '#00ff00' }}>{correctCount}</div>
                    </div>
                    <div className={styles.statItem}>
                        <div className={styles.statLabel}>{t.statMiss}</div>
                        <div className={styles.statValue} style={{ color: '#ff0055' }}>{missCount}</div>
                    </div>
                </div>

                {/* Center: Game Area */}
                <div className={`${styles.gameArea} ${getVisualLevel()}`}>
                    <div className={styles.conditionBox}>
                        {options.language === 'en' ? currentCondition?.descriptionEn : currentCondition?.descriptionJa}
                    </div>

                    <div className={`${styles.timer} ${isWarning ? styles.timerWarning : ''}`}>
                        {t.timer}: {timeLeft}
                    </div>

                    <div className={`${styles.cardsContainer} ${styles[difficulty] || ''}`}>
                        {currentNumbers.map((num, index) => (
                            <div
                                key={`${index}-${num}`}
                                className={styles.card}
                                onClick={(e) => handleCardClick(num, e)}
                            >
                                {num}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Sidebar: Pause Button */}
                <div className={styles.rightSidebar}>
                    <button className={styles.pauseBtn} onClick={handlePause}>
                        {t.pauseBtn}
                    </button>
                </div>
            </div>
        </div>
    );
};
