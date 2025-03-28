interface AudioSource {
  source: AudioBufferSourceNode;
  gainNode: GainNode;
  isPlaying: boolean;
}

class AudioManager {
  private context: AudioContext | null = null;
  private audioBuffers: Map<string, AudioBuffer> = new Map();
  private activeSources: Map<string, AudioSource> = new Map();

  constructor() {
    if (typeof window !== 'undefined') {
      this.context = new AudioContext();
    }
  }

  async loadSound(id: string, url: string): Promise<void> {
    if (!this.context) return;

    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
      this.audioBuffers.set(id, audioBuffer);
    } catch (error) {
      console.error(`Error loading sound ${id}:`, error);
    }
  }

  playSound(id: string, volume: number = 1): void {
    if (!this.context || !this.audioBuffers.has(id)) return;

    const buffer = this.audioBuffers.get(id);
    if (!buffer) return;

    // Stop existing sound if playing
    this.stopSound(id);

    // Create new source
    const source = this.context.createBufferSource();
    const gainNode = this.context.createGain();

    source.buffer = buffer;
    source.loop = true;
    gainNode.gain.value = volume;

    // Connect nodes
    source.connect(gainNode);
    gainNode.connect(this.context.destination);

    // Start playback
    source.start(0);

    // Store reference
    this.activeSources.set(id, {
      source,
      gainNode,
      isPlaying: true
    });
  }

  stopSound(id: string): void {
    const source = this.activeSources.get(id);
    if (source && source.isPlaying) {
      source.source.stop();
      source.isPlaying = false;
      this.activeSources.delete(id);
    }
  }

  updateVolume(id: string, volume: number): void {
    const source = this.activeSources.get(id);
    if (source) {
      source.gainNode.gain.value = volume;
    }
  }

  stopAllSounds(): void {
    this.activeSources.forEach((source, id) => {
      this.stopSound(id);
    });
  }
}

// Create a singleton instance
export const audioManager = new AudioManager(); 