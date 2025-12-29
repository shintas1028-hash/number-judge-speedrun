'use client';

import React from 'react';
import { useGameStore } from '../game/store';
import styles from '../styles/SoundToggle.module.css';

export const SoundToggle: React.FC = () => {
    const { options, toggleBgmMute, toggleSfxMute } = useGameStore();

    // Check if both are muted
    const isAllMuted = options.isBgmMuted && options.isSfxMuted;

    const handleToggle = () => {
        if (isAllMuted) {
            // Unmute all
            if (options.isBgmMuted) toggleBgmMute();
            if (options.isSfxMuted) toggleSfxMute();
        } else {
            // Mute all
            if (!options.isBgmMuted) toggleBgmMute();
            if (!options.isSfxMuted) toggleSfxMute();
        }
    };

    return (
        <button
            className={`${styles.soundToggle} ${isAllMuted ? styles.muted : styles.active}`}
            onClick={handleToggle}
            aria-label={isAllMuted ? "Unmute Sound" : "Mute Sound"}
        >
            {isAllMuted ? (
                // Muted Speaker Icon
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                    <path d="M9 9v6a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
                    <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0a7 7 0 0 1 0 2"></path>
                    <line x1="12" y1="19" x2="12" y2="23"></line>
                    <line x1="8" y1="23" x2="16" y2="23"></line>
                </svg>
            ) : (
                // Speaker Icon
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                </svg>
            )}
        </button>
    );
};
