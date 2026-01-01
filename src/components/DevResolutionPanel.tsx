import React, { useState } from 'react';
import { useGameStore } from '../game/store';
import styles from '../styles/DevResolutionPanel.module.css';

export const DevResolutionPanel: React.FC = () => {
    const { options, setSimResolution } = useGameStore();
    const [width, setWidth] = useState(options.simWidth.toString());
    const [height, setHeight] = useState(options.simHeight.toString());
    const [isOpen, setIsOpen] = useState(false);

    const handleApply = () => {
        setSimResolution(parseInt(width) || 0, parseInt(height) || 0);
    };

    const handleReset = () => {
        setWidth('0');
        setHeight('0');
        setSimResolution(0, 0);
    };

    if (!isOpen) {
        return (
            <button className={styles.toggleBtn} onClick={() => setIsOpen(true)}>
                🛠 Resol
            </button>
        );
    }

    return (
        <div className={styles.panel}>
            <div className={styles.header}>
                <span>Resolution Sim</span>
                <button className={styles.closeBtn} onClick={() => setIsOpen(false)}>×</button>
            </div>
            <div className={styles.body}>
                <div className={styles.inputGroup}>
                    <label>W:</label>
                    <input
                        type="number"
                        value={width}
                        onChange={(e) => setWidth(e.target.value)}
                        placeholder="0 = Full"
                    />
                </div>
                <div className={styles.inputGroup}>
                    <label>H:</label>
                    <input
                        type="number"
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                        placeholder="0 = Full"
                    />
                </div>
                <div className={styles.actions}>
                    <button onClick={handleApply} className={styles.applyBtn}>Apply</button>
                    <button onClick={handleReset} className={styles.resetBtn}>Reset</button>
                </div>
                <p className={styles.hint}>0 = 100%</p>
            </div>
        </div>
    );
};
