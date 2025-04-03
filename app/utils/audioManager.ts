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
  private _audioContext: AudioContext | null = null;
  private audioBuffers: Map<string, AudioBuffer> = new Map();
  private activeSources: Map<string, AudioBufferSourceNode> = new Map();
  private activeGains: Map<string, GainNode> = new Map();
  private initialized = false;
  
  // PiP connection function (will be set by PiPMiniPlayer)
  public connectToPiP?: (sourceNode: AudioNode) => void;

  private constructor() {}

  // Public getter for audio context
  public get audioContext(): AudioContext | null {
    return this._audioContext;
  }

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
      if (!this._audioContext) {
        this._audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      // Resume audio context if it's suspended
      if (this._audioContext.state === 'suspended') {
        await this._audioContext.resume();
      }

      // If context is running, we're good
      if (this._audioContext.state === 'running') {
        this.initialized = true;
        return;
      }

      // If context is closed, create a new one
      if (this._audioContext.state === 'closed') {
        this._audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      // Try to resume the context
      await this._audioContext.resume();
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
      // Try to recover by creating a new context
      try {
        this._audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        await this._audioContext.resume();
        this.initialized = true;
      } catch (retryError) {
        console.error('Failed to recover audio context:', retryError);
      }
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
      const audioBuffer = await this._audioContext!.decodeAudioData(arrayBuffer);
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

      const source = this._audioContext!.createBufferSource();
      const gainNode = this._audioContext!.createGain();

      source.buffer = buffer;
      source.loop = true;
      gainNode.gain.value = volume;

      source.connect(gainNode);
      gainNode.connect(this._audioContext!.destination);
      
      // Connect to PiP if available
      if (this.connectToPiP) {
        gainNode.connect(this._audioContext!.destination); // Keep audio playing through main output
        this.connectToPiP(gainNode); // Also send to PiP
      }

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

  // Connect all active gain nodes to the PiP destination
  connectAllToPiP(): void {
    if (!this.connectToPiP) return;
    
    this.activeGains.forEach((gainNode) => {
      if (this.connectToPiP) {
        this.connectToPiP(gainNode);
      }
    });
  }

  cleanup(): void {
    this.stopAllSounds();
    this.audioBuffers.clear();
    this.activeSources.clear();
    this.activeGains.clear();
    if (this._audioContext) {
      this._audioContext.close();
      this._audioContext = null;
    }
    this.initialized = false;
    this.connectToPiP = undefined;
  }
}

// Create a singleton instance
export const audioManager = AudioManager.getInstance(); 