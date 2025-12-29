/**
 * AudioManager - ゲーム内のBGMと効果音を管理するシングルトンクラス
 */
class AudioManager {
    private static instance: AudioManager;
    private bgm: HTMLAudioElement | null = null;
    private currentBgm: string | null = null;
    private bgmVolume: number = 0.5;
    private sfxVolume: number = 0.7;
    private isBgmMuted: boolean = false;
    private isSfxMuted: boolean = false;

    private constructor() { }

    static getInstance(): AudioManager {
        if (!AudioManager.instance) {
            AudioManager.instance = new AudioManager();
        }
        return AudioManager.instance;
    }

    /**
     * BGMを再生する
     * @param name BGMファイル名 ('title', 'game', 'result')
     */
    playBGM(name: string): void {
        // ミュート中なら再生しない（既に再生中なら止める）
        if (this.isBgmMuted) {
            this.stopBGM();
            this.currentBgm = name; // 再生予約的なメモとして保持
            return;
        }

        // 既に同じBGMが再生中なら何もしない
        if (this.currentBgm === name && this.bgm && !this.bgm.paused) {
            return;
        }

        // 現在のBGMを停止
        this.stopBGM();

        try {
            this.bgm = new Audio(`/audio/bgm/${name}.mp3`);
            this.bgm.loop = true;
            this.bgm.volume = this.bgmVolume;
            this.currentBgm = name;

            // 音源が見つからない場合はサイレント動作
            this.bgm.addEventListener('error', () => {
                console.warn(`BGM file not found: ${name}.mp3`);
            });

            this.bgm.play().catch((error) => {
                console.warn('BGM playback failed:', error);
            });
        } catch (error) {
            console.warn('Failed to load BGM:', error);
        }
    }

    /**
     * BGMを停止する
     */
    stopBGM(): void {
        if (this.bgm) {
            this.bgm.pause();
            this.bgm.currentTime = 0;
            this.bgm = null;
        }
        // currentBgm は保持したままにする（アンミュート時に再開できるように）
    }

    /**
     * 効果音を再生する
     * @param name 効果音ファイル名 ('correct', 'wrong')
     */
    playSFX(name: string): void {
        if (this.isSfxMuted) return;

        try {
            const sfx = new Audio(`/audio/sfx/${name}.mp3`);
            sfx.volume = this.sfxVolume;

            sfx.addEventListener('error', () => {
                console.warn(`SFX file not found: ${name}.mp3`);
            });

            sfx.play().catch((error) => {
                console.warn('SFX playback failed:', error);
            });
        } catch (error) {
            console.warn('Failed to load SFX:', error);
        }
    }

    /**
     * BGMの音量を設定する
     * @param volume 0.0 ~ 1.0
     */
    setBGMVolume(volume: number): void {
        this.bgmVolume = Math.max(0, Math.min(1, volume));
        if (this.bgm) {
            this.bgm.volume = this.bgmVolume;
        }
    }

    /**
     * 効果音の音量を設定する
     * @param volume 0.0 ~ 1.0
     */
    setSFXVolume(volume: number): void {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
    }

    /**
     * BGMのミュート状態を設定する
     */
    setBgmMuted(muted: boolean): void {
        this.isBgmMuted = muted;
        if (muted) {
            this.stopBGM();
        } else if (this.currentBgm) {
            this.playBGM(this.currentBgm);
        }
    }

    /**
     * 効果音のミュート状態を設定する
     */
    setSfxMuted(muted: boolean): void {
        this.isSfxMuted = muted;
    }
}

export const audioManager = AudioManager.getInstance();
