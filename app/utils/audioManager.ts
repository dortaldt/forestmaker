interface SoundAsset {
  id: string;
  url: string;
}

interface AudioSource {
  source: AudioBufferSourceNode;
  gainNode: GainNode;
  isPlaying: boolean;
}

export class AudioManager {
  private static instance: AudioManager;
  private audioContext: AudioContext | null = null;
  private audioBuffers: Map<string, AudioBuffer> = new Map();
  private activeSources: Map<string, AudioBufferSourceNode> = new Map();
  private activeGains: Map<string, GainNode> = new Map();
  private initialized = false;

  private constructor() {}

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      // Create audio context only when needed
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      // Resume audio context if it's suspended
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
    }
  }

  async loadSound(asset: SoundAsset): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (this.audioBuffers.has(asset.id)) return;

    try {
      const response = await fetch(asset.url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);
      this.audioBuffers.set(asset.id, audioBuffer);
    } catch (error) {
      console.error(`Failed to load sound ${asset.id}:`, error);
    }
  }

  async playSound(asset: SoundAsset, volume: number = 1): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    // Stop existing sound if playing
    this.stopSound(asset.id);

    try {
      const buffer = this.audioBuffers.get(asset.id);
      if (!buffer) {
        await this.loadSound(asset);
        return this.playSound(asset, volume);
      }

      const source = this.audioContext!.createBufferSource();
      const gainNode = this.audioContext!.createGain();

      source.buffer = buffer;
      source.loop = true;
      gainNode.gain.value = volume;

      source.connect(gainNode);
      gainNode.connect(this.audioContext!.destination);

      source.start(0);
      this.activeSources.set(asset.id, source);
      this.activeGains.set(asset.id, gainNode);
    } catch (error) {
      console.error(`Failed to play sound ${asset.id}:`, error);
    }
  }

  stopSound(assetId: string): void {
    const source = this.activeSources.get(assetId);
    const gain = this.activeGains.get(assetId);

    if (source) {
      try {
        source.stop();
        this.activeSources.delete(assetId);
      } catch (error) {
        console.error(`Failed to stop sound ${assetId}:`, error);
      }
    }

    if (gain) {
      this.activeGains.delete(assetId);
    }
  }

  setVolume(assetId: string, volume: number): void {
    const gain = this.activeGains.get(assetId);
    if (gain) {
      try {
        gain.gain.value = volume;
      } catch (error) {
        console.error(`Failed to set volume for sound ${assetId}:`, error);
      }
    }
  }

  stopAllSounds(): void {
    this.activeSources.forEach((_, assetId) => this.stopSound(assetId));
  }

  cleanup(): void {
    this.stopAllSounds();
    this.audioBuffers.clear();
    this.activeSources.clear();
    this.activeGains.clear();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.initialized = false;
  }
}

// Create a singleton instance
export const audioManager = AudioManager.getInstance(); 