interface SoundAsset {
  id: string;
  url: string;
}

interface AudioSource {
  source: AudioBufferSourceNode;
  gainNode: GainNode;
  isPlaying: boolean;
}

// Extended AudioContext state type to include iOS-specific 'interrupted' state
type ExtendedAudioContextState = AudioContextState | 'interrupted';

export class AudioManager {
  private static instance: AudioManager;
  private _audioContext: AudioContext | null = null;
  private audioBuffers: Map<string, AudioBuffer> = new Map();
  private activeSources: Map<string, AudioBufferSourceNode> = new Map();
  private activeGains: Map<string, GainNode> = new Map();
  private initialized = false;
  private audioContextStateInterval: NodeJS.Timeout | null = null;
  private lastVisibilityState: string = 'visible';
  private recoveryAttempts: number = 0;
  private isIOS: boolean = false;
  private wasContextInterrupted: boolean = false;
  private _mainPageMasterGain: GainNode | null = null;
  
  // PiP connection function (will be set by PiPMiniPlayer)
  public connectToPiP?: (sourceNode: AudioNode) => void;

  private constructor() {
    // Check if running on iOS
    if (typeof navigator !== 'undefined') {
      this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    }
    
    // Setup document visibility event listener
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
      this.lastVisibilityState = document.visibilityState;
      
      // iOS specific: add foregrounding handler
      if (this.isIOS) {
        window.addEventListener('focus', this.handleIOSForeground.bind(this));
        window.addEventListener('pageshow', this.handleIOSForeground.bind(this));
      }
    }
  }

  // Handle iOS specific foregrounding event
  private handleIOSForeground() {
    console.log('[Audio Debug] iOS app foregrounded');
    
    // Always attempt recovery when foregrounding on iOS, regardless of flag state
    if (this._audioContext && this.isIOS) {
      console.log('[Audio Debug] Attempting recovery on iOS foreground');
      
      // Reset the flag
      this.wasContextInterrupted = false;
      
      // Force a recovery attempt regardless of current state
      this.recoverFromInterruption();
      
      // Also manually reconnect all active sounds to ensure audio is flowing
      console.log('[Audio Debug] Reconnecting all active sounds after foreground');
      this.reconnectAllSounds();
    }
  }
  
  // New method to fully clean up a sound including any duplicates
  private cleanupSound(assetId: string): void {
    // Get all nodes with this ID or that start with this ID (could have recovery duplicates)
    const nodesToClean: string[] = [];
    
    // Find all sources that match or start with assetId (to catch recovery duplicates)
    this.activeSources.forEach((_, id) => {
      if (id === assetId || id.startsWith(`${assetId}-recovery`)) {
        nodesToClean.push(id);
      }
    });
    
    console.log(`[Audio Debug] Cleaning up sound ${assetId} and ${nodesToClean.length - 1} duplicates`);
    
    // Stop each matching source
    nodesToClean.forEach(id => {
      try {
        const source = this.activeSources.get(id);
        const gain = this.activeGains.get(id);
        
        if (source) {
          source.stop();
          this.activeSources.delete(id);
        }
        
        if (gain) {
          // Disconnect from all destinations
          gain.disconnect();
          this.activeGains.delete(id);
        }
      } catch (error) {
        console.error(`[Audio Debug] Error cleaning up sound ${id}:`, error);
      }
    });
  }

  stopSound(assetId: string): void {
    // Use the more thorough cleanup method
    this.cleanupSound(assetId);
  }

  // Updated method to assign unique recovery IDs to restarted sounds
  async playSound(asset: SoundAsset, volume: number = 1): Promise<void> {
    if (!this.initialized) {
      console.log(`[Audio Debug] Initializing audio context before playing ${asset.id}`);
      await this.initialize();
    }

    // Stop existing sound if playing (using thorough cleanup)
    this.cleanupSound(asset.id);

    try {
      const buffer = this.audioBuffers.get(asset.id);
      if (!buffer) {
        console.log(`[Audio Debug] Buffer not found for ${asset.id}, loading now`);
        await this.loadSound(asset);
        return this.playSound(asset, volume);
      }

      // Ensure audio context is in a good state
      const state = this.getContextState();
      if (state === 'suspended' || state === 'interrupted') {
        console.log(`[Audio Debug] Resuming audio context before playing ${asset.id}`);
        await this._audioContext!.resume();
        
        // If still not running after resume attempt (iOS may need special handling)
        if (this.getContextState() !== 'running' && this.isIOS) {
          console.log(`[Audio Debug] Audio context still not running (${this.getContextState()}), attempting recovery`);
          await this.recoverFromInterruption();
        }
      }

      // Get a unique ID for this sound instance
      const soundInstanceId = this.wasContextInterrupted ? 
        `${asset.id}-recovery-${Date.now()}` : asset.id;

      console.log(`[Audio Debug] Creating source for ${soundInstanceId}`);
      const source = this._audioContext!.createBufferSource();
      const gainNode = this._audioContext!.createGain();

      source.buffer = buffer;
      source.loop = true;
      gainNode.gain.value = volume;

      console.log(`[Audio Debug] Connecting ${soundInstanceId} to output, volume: ${volume}`);
      source.connect(gainNode);
      
      // If we have a master gain for the main page (when PiP is active), use it
      if (this._mainPageMasterGain) {
        console.log(`[Audio Debug] Routing ${soundInstanceId} through muted main page output`);
        gainNode.connect(this._mainPageMasterGain);
      } else {
        // Otherwise connect directly to the destination
        gainNode.connect(this._audioContext!.destination);
      }
      
      // Connect to PiP if available
      if (this.connectToPiP) {
        console.log(`[Audio Debug] Connecting ${soundInstanceId} to PiP output`);
        this.connectToPiP(gainNode); // Send to PiP
      }

      console.log(`[Audio Debug] Starting playback of ${soundInstanceId}`);
      source.start(0);
      this.activeSources.set(soundInstanceId, source);
      this.activeGains.set(soundInstanceId, gainNode);
      
      // Add ended event listener 
      source.addEventListener('ended', () => {
        console.log(`[Audio Debug] Source ended naturally: ${soundInstanceId}`);
        // Cleanup this specific instance
        this.activeSources.delete(soundInstanceId);
        this.activeGains.delete(soundInstanceId);
        
        // For iOS, immediately recreate if source ends unexpectedly during interruption
        if (this.wasContextInterrupted && this.isIOS && soundInstanceId === asset.id) {
          console.log(`[Audio Debug] Auto-restarting ${asset.id} after iOS interruption`);
          // Restart with slight delay
          setTimeout(() => {
            this.playSound(asset, volume);
          }, 100);
        }
      });
    } catch (error) {
      console.error(`[Audio Debug] Failed to play sound ${asset.id}:`, error);
    }
  }

  // Updated reconnectAllSounds to be more careful about restarting sounds
  public reconnectAllSounds(): void {
    if (!this._audioContext) return;
    
    // Save current playing sounds - use Set to avoid duplicates
    const activeAssetIds = new Set<string>();
    const soundVolumes = new Map<string, number>();
    
    // Get base asset IDs (without recovery suffixes)
    this.activeSources.forEach((_, id) => {
      const baseId = id.includes('-recovery-') ? id.split('-recovery-')[0] : id;
      activeAssetIds.add(baseId);
      
      // Get the volume from the first instance we find
      if (!soundVolumes.has(baseId)) {
        const gain = this.activeGains.get(id);
        if (gain) {
          soundVolumes.set(baseId, gain.gain.value);
        }
      }
    });
    
    if (activeAssetIds.size > 0) {
      console.log(`[Audio Debug] Reconnecting ${activeAssetIds.size} unique active sounds`);
      
      // Stop ALL sounds first, including recoveries
      this.stopAllSounds();
      
      // Restart each unique sound
      activeAssetIds.forEach(id => {
        const asset = { id, url: '' }; // We already have the buffer
        const volume = soundVolumes.get(id) || 1;
        console.log(`[Audio Debug] Restarting sound ${id} at volume ${volume}`);
        this.playSound(asset, volume);
      });
    }
  }

  stopAllSounds(): void {
    console.log(`[Audio Debug] Stopping all sounds, count: ${this.activeSources.size}`);
    
    // Get a list of all source IDs first (to avoid modification during iteration)
    const allSourceIds = Array.from(this.activeSources.keys());
    
    // Use our thorough cleanup for each sound
    allSourceIds.forEach(assetId => {
      try {
        const source = this.activeSources.get(assetId);
        if (source) {
          console.log(`[Audio Debug] Stopping sound: ${assetId}`);
          source.stop();
          this.activeSources.delete(assetId);
        }
        
        const gain = this.activeGains.get(assetId);
        if (gain) {
          gain.disconnect();
          this.activeGains.delete(assetId);
        }
      } catch (error) {
        console.error(`[Audio Debug] Failed to stop sound ${assetId}:`, error);
      }
    });
  }

  // Get audio context state, including handling iOS-specific states
  private getContextState(): ExtendedAudioContextState {
    if (!this._audioContext) return 'suspended';
    return this._audioContext.state as ExtendedAudioContextState;
  }
  
  // Handle audio context interruption specifically
  private async recoverFromInterruption() {
    if (!this._audioContext) return;
    
    console.log('[Audio Debug] Recovering from audio interruption');
    
    // For iOS, we need a stronger recovery approach 
    const state = this.getContextState();
    console.log(`[Audio Debug] Current audio context state before recovery: ${state}`);
    
    try {
      // First try resume
      await this._audioContext.resume();
      console.log(`[Audio Debug] Resume attempt result: ${this.getContextState()}`);
      
      // If still not running, we need to recreate
      const newState = this.getContextState();
      if (newState !== 'running') {
        console.log('[Audio Debug] Audio context not running after resume, recreating context');
        
        // Save the current active sound IDs
        const activeSoundIds = Array.from(this.activeSources.keys());
        const activeVolumes = new Map<string, number>();
        
        // Save volumes
        this.activeGains.forEach((gain, id) => {
          activeVolumes.set(id, gain.gain.value);
        });
        
        // Stop all sounds
        this.stopAllSounds();
        
        // Close the old context
        if (this._audioContext) {
          try {
            await this._audioContext.close();
            console.log('[Audio Debug] Successfully closed old audio context');
          } catch (closeError) {
            console.error('[Audio Debug] Error closing audio context:', closeError);
          }
        }
        
        // Create a new context
        this._audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        console.log(`[Audio Debug] Created new audio context after interruption, state: ${this.getContextState()}`);
        
        // Try to force it to run
        await this._audioContext.resume();
        console.log(`[Audio Debug] New context state after resume: ${this.getContextState()}`);
        
        // Setup monitor for new context
        this.startAudioContextMonitoring();
        
        // Restart all sounds that were playing with slight delay
        setTimeout(() => {
          console.log('[Audio Debug] Restarting sounds after context recreation');
          for (const id of activeSoundIds) {
            const asset = { id, url: '' }; // We already have the buffer
            const volume = activeVolumes.get(id) || 1;
            this.playSound(asset, volume);
          }
        }, 300);
      } else {
        // If context is running but sounds might be stalled, reconnect them
        this.reconnectAllSounds();
      }
    } catch (error) {
      console.error('[Audio Debug] Failed to recover from interruption:', error);
      
      // Last resort: force restart all audio
      console.log('[Audio Debug] Attempting last resort recovery');
      try {
        this._audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        await this._audioContext.resume();
        this.startAudioContextMonitoring();
        
        // Force reconnect sounds with delay
        setTimeout(() => this.reconnectAllSounds(), 500);
      } catch (finalError) {
        console.error('[Audio Debug] Final recovery attempt failed:', finalError);
      }
    }
  }

  // Handle visibility change events
  private handleVisibilityChange() {
    if (typeof document === 'undefined') return;
    
    const newState = document.visibilityState;
    console.log(`[Audio Debug] Document visibility changed: ${this.lastVisibilityState} -> ${newState}`);
    
    // If becoming visible after being hidden
    if (newState === 'visible' && this.lastVisibilityState === 'hidden') {
      console.log('[Audio Debug] Document became visible - checking audio context');
      
      if (this._audioContext) {
        const state = this.getContextState();
        if (state === 'suspended' || state === 'interrupted') {
          console.log(`[Audio Debug] Resuming audio context after visibility change, state: ${state}`);
          this._audioContext.resume().catch(err => {
            console.error('[Audio Debug] Failed to resume audio context:', err);
          });
          
          // For iOS interruption, more aggressive recovery may be needed
          if (this.isIOS && state === 'interrupted') {
            this.recoverFromInterruption();
          }
        }
      }
    }
    
    // If becoming hidden, make sure audio context is resumed
    if (newState === 'hidden' && this._audioContext) {
      console.log(`[Audio Debug] Document hidden, audio context state: ${this.getContextState()}`);
      
      if (this.getContextState() === 'suspended') {
        console.log('[Audio Debug] Resuming suspended audio context due to visibility change');
        this._audioContext.resume().catch(err => {
          console.error('[Audio Debug] Failed to resume audio context:', err);
        });
      }
    }
    
    this.lastVisibilityState = newState;
  }

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
      console.log('[Audio Debug] Initializing audio context');
      // Create audio context only when needed
      if (!this._audioContext) {
        this._audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        console.log(`[Audio Debug] Created new audio context, state: ${this.getContextState()}`);
        
        // Add event listeners for state changes
        this._audioContext.addEventListener('statechange', () => {
          const state = this.getContextState();
          console.log(`[Audio Debug] Audio context state changed: ${state}`);
          
          // Set the interrupted flag for iOS
          if (state === 'interrupted') {
            this.wasContextInterrupted = true;
            this.recoveryAttempts = 0;
          }
        });
      }

      // Resume audio context if it's suspended
      if (this.getContextState() === 'suspended') {
        console.log('[Audio Debug] Resuming suspended audio context');
        await this._audioContext.resume();
        console.log(`[Audio Debug] Audio context resumed, state: ${this.getContextState()}`);
      }
      
      // Special handling for interrupted state (iOS)
      if (this.getContextState() === 'interrupted') {
        console.log('[Audio Debug] Handling interrupted audio context');
        this.wasContextInterrupted = true;
        await this.recoverFromInterruption();
      }

      // If context is running, we're good
      if (this.getContextState() === 'running') {
        this.initialized = true;
        
        // Start monitoring audio context state
        this.startAudioContextMonitoring();
        
        console.log('[Audio Debug] Audio context initialized successfully');
        return;
      }

      // If context is closed, create a new one
      if (this.getContextState() === 'closed') {
        console.log('[Audio Debug] Audio context closed, creating new one');
        this._audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      // Try to resume the context
      await this._audioContext.resume();
      this.initialized = true;
      console.log('[Audio Debug] Audio context successfully initialized');
      
      // Start monitoring audio context state
      this.startAudioContextMonitoring();
    } catch (error) {
      console.error('[Audio Debug] Failed to initialize audio context:', error);
      // Try to recover by creating a new context
      try {
        console.log('[Audio Debug] Attempting recovery by creating a new audio context');
        this._audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        await this._audioContext.resume();
        this.initialized = true;
        console.log('[Audio Debug] Successfully recovered audio context');
        
        // Start monitoring audio context state
        this.startAudioContextMonitoring();
      } catch (retryError) {
        console.error('[Audio Debug] Failed to recover audio context:', retryError);
      }
    }
  }
  
  // Start monitoring audio context state
  private startAudioContextMonitoring() {
    if (this.audioContextStateInterval) {
      clearInterval(this.audioContextStateInterval);
    }
    
    // For iOS, use a more frequent check
    const checkInterval = this.isIOS ? 1000 : 2000; // 1 second for iOS, 2 seconds for others
    
    this.audioContextStateInterval = setInterval(() => {
      if (!this._audioContext) return;
      
      const state = this.getContextState();
      
      // For iOS, check more frequently regardless of visibility
      if (this.isIOS) {
        // Only log every 5 checks to avoid spam
        if (this.recoveryAttempts % 5 === 0) {
          console.log(`[Audio Debug] iOS periodic check - Audio context state: ${state}`);
          console.log(`[Audio Debug] Active sound sources: ${this.activeSources.size}`);
        }
        
        // If interrupted or not running, try to recover
        if (state !== 'running') {
          console.log(`[Audio Debug] iOS audio context not running (${state}), attempting recovery`);
          
          // Limit recovery attempts to avoid infinite loops
          if (this.recoveryAttempts < 5) {
            this.recoveryAttempts++;
            this.recoverFromInterruption();
          } else if (this.recoveryAttempts === 5) {
            console.log('[Audio Debug] Max recovery attempts reached, will try again later');
            this.recoveryAttempts++;
          } else if (this.recoveryAttempts >= 10) {
            // Reset counter after a while to allow new attempts
            this.recoveryAttempts = 0;
          } else {
            this.recoveryAttempts++;
          }
        } else {
          // Reset counter when running
          this.recoveryAttempts = 0;
          
          // Check if sounds are actually playing
          if (this.activeSources.size > 0) {
            // Periodically verify all sounds are playing by reconnecting every ~30 seconds
            if (Math.random() < 0.03) { // ~3% chance each check = once per ~30 seconds on average
              console.log('[Audio Debug] Periodic iOS sound refresh');
              this.reconnectAllSounds();
            }
          }
        }
      } else {
        // For non-iOS, only check when document is hidden
        if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
          console.log(`[Audio Debug] Periodic check - Audio context state: ${state}`);
          
          // Log active sources
          console.log(`[Audio Debug] Active sound sources: ${this.activeSources.size}`);
          
          if (state === 'suspended') {
            console.log('[Audio Debug] Auto-resuming suspended audio context');
            this._audioContext.resume().catch(err => {
              console.error('[Audio Debug] Failed to auto-resume audio context:', err);
            });
          }
        }
      }
    }, checkInterval);
  }

  async loadSound(asset: SoundAsset): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (this.audioBuffers.has(asset.id)) return;

    try {
      console.log(`[Audio Debug] Loading sound: ${asset.id}`);
      const response = await fetch(asset.url);
      const arrayBuffer = await response.arrayBuffer();
      
      // Make sure audio context is in good state before decoding
      const state = this.getContextState();
      if (state === 'suspended' || state === 'interrupted') {
        console.log(`[Audio Debug] Resuming audio context before decoding ${asset.id}`);
        await this._audioContext!.resume();
      }
      
      const audioBuffer = await this._audioContext!.decodeAudioData(arrayBuffer);
      this.audioBuffers.set(asset.id, audioBuffer);
      console.log(`[Audio Debug] Sound loaded: ${asset.id}`);
    } catch (error) {
      console.error(`[Audio Debug] Failed to load sound ${asset.id}:`, error);
    }
  }

  setVolume(assetId: string, volume: number): void {
    const gain = this.activeGains.get(assetId);
    if (gain) {
      try {
        console.log(`[Audio Debug] Setting volume for ${assetId}: ${volume}`);
        gain.gain.value = volume;
      } catch (error) {
        console.error(`[Audio Debug] Failed to set volume for sound ${assetId}:`, error);
      }
    }
  }

  // Connect all active gain nodes to the PiP destination
  connectAllToPiP(): void {
    if (!this.connectToPiP) {
      console.log('[Audio Debug] Cannot connect to PiP - no connection method available');
      return;
    }
    
    console.log(`[Audio Debug] Connecting all active sources to PiP, count: ${this.activeGains.size}`);
    
    // Create a main page gain control to silence main output without affecting PiP
    const mainPageGain = this._audioContext?.createGain();
    if (mainPageGain) {
      mainPageGain.gain.value = 0; // Mute main page audio
      console.log('[Audio Debug] Created master page gain control (muted)');
      
      // Reconnect all audio nodes through our muted master gain
      this.activeGains.forEach((gainNode, id) => {
        try {
          // Disconnect from direct output to prevent duplicate audio
          gainNode.disconnect(this._audioContext!.destination);
          
          // Connect to muted main page output
          gainNode.connect(mainPageGain);
          
          // Connect to PiP destination
          if (this.connectToPiP) {
            console.log(`[Audio Debug] Connecting ${id} to PiP only`);
            this.connectToPiP(gainNode);
          }
        } catch (e) {
          console.error(`[Audio Debug] Error reconnecting ${id}:`, e);
        }
      });
      
      // Connect master gain to audio context destination
      mainPageGain.connect(this._audioContext!.destination);
      
      // Store this gain node for later restoration
      this._mainPageMasterGain = mainPageGain;
    } else {
      // Fallback to old method if we couldn't create a master gain
      this.activeGains.forEach((gainNode, id) => {
        if (this.connectToPiP) {
          console.log(`[Audio Debug] Connecting ${id} to PiP (legacy method)`);
          this.connectToPiP(gainNode);
        }
      });
    }
    
    // For iOS, make sure to attempt reconnections after PiP starts
    if (this.isIOS) {
      // Schedule multiple recovery attempts after PiP is enabled
      // This helps ensure audio doesn't cut out during PiP transitions
      const scheduleRecovery = (delay: number) => {
        setTimeout(() => {
          console.log(`[Audio Debug] PiP stabilization check at ${delay}ms`);
          if (this._audioContext && this.getContextState() !== 'running') {
            console.log('[Audio Debug] Audio needs recovery during PiP');
            this.recoverFromInterruption();
          }
          
          // Also refresh connections regardless of state
          if (this.activeSources.size > 0 && this.connectToPiP) {
            console.log('[Audio Debug] Refreshing PiP audio connections');
            this.activeGains.forEach((gainNode, id) => {
              this.connectToPiP!(gainNode);
            });
          }
        }, delay);
      };
      
      // Try at various intervals to catch different transition points
      scheduleRecovery(500);  // Quick check
      scheduleRecovery(1500); // Middle check
      scheduleRecovery(3000); // Longer check
    }
  }

  // Dedicated method for PiP audio recovery on iOS
  recoverPiPAudio(): void {
    if (!this.isIOS) return;
    
    console.log('[Audio Debug] iOS PiP audio recovery triggered');
    
    // Always try to resume context first
    if (this._audioContext) {
      this._audioContext.resume().then(() => {
        console.log(`[Audio Debug] PiP audio context resumed: ${this.getContextState()}`);
        
        // If still not running, try full recovery
        if (this.getContextState() !== 'running') {
          this.recoverFromInterruption();
        } else {
          // Just reconnect sounds if context is running
          this.reconnectAllSounds();
        }
      }).catch(err => {
        console.error('[Audio Debug] PiP audio resume failed:', err);
        // Try full recovery
        this.recoverFromInterruption();
      });
    }
  }

  cleanup(): void {
    console.log('[Audio Debug] Cleaning up AudioManager');
    this.stopAllSounds();
    this.audioBuffers.clear();
    this.activeSources.clear();
    this.activeGains.clear();
    
    // Clean up audio context monitoring
    if (this.audioContextStateInterval) {
      clearInterval(this.audioContextStateInterval);
      this.audioContextStateInterval = null;
    }
    
    // Clean up event listeners
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
      
      if (this.isIOS) {
        window.removeEventListener('focus', this.handleIOSForeground.bind(this));
        window.removeEventListener('pageshow', this.handleIOSForeground.bind(this));
      }
    }
    
    if (this._audioContext) {
      console.log('[Audio Debug] Closing audio context');
      this._audioContext.close();
      this._audioContext = null;
    }
    
    this.initialized = false;
    this.connectToPiP = undefined;
    console.log('[Audio Debug] AudioManager cleanup complete');
  }

  // Clean up PiP connections when exiting PiP mode
  clearPiPConnections(): void {
    console.log('[Audio Debug] Clearing PiP connections');
    
    // Remove the connect method
    this.connectToPiP = undefined;
    
    // Remove main page mute
    if (this._mainPageMasterGain && this._audioContext) {
      console.log('[Audio Debug] Removing main page mute');
      
      try {
        // Disconnect the master gain node
        this._mainPageMasterGain.disconnect();
        this._mainPageMasterGain = null;
      } catch (e) {
        console.error('[Audio Debug] Error removing main page mute:', e);
      }
    }
    
    // Ensure there are no duplicate sounds
    const uniqueSoundIds = new Set<string>();
    const soundVolumes = new Map<string, number>();
    
    // Get all base sound IDs (without recovery markers)
    this.activeSources.forEach((_, id) => {
      const baseId = id.includes('-recovery-') ? id.split('-recovery-')[0] : id;
      uniqueSoundIds.add(baseId);
      
      // Save the volume if we haven't seen this base ID yet
      if (!soundVolumes.has(baseId)) {
        const gain = this.activeGains.get(id);
        if (gain) {
          soundVolumes.set(baseId, gain.gain.value);
        }
      }
    });
    
    console.log(`[Audio Debug] Found ${uniqueSoundIds.size} unique sounds to check for duplicates`);
    
    // Check each unique sound for duplicates
    uniqueSoundIds.forEach(baseId => {
      this.cleanupSound(baseId);
      
      // Restart the sound if it was active
      const asset = { id: baseId, url: '' };
      const volume = soundVolumes.get(baseId) || 0.3; // Use saved volume or default
      
      console.log(`[Audio Debug] Restarting ${baseId} after PiP exit with volume ${volume}`);
      this.playSound(asset, volume);
    });
  }

  // Ensure all instances of the given sound assets are completely stopped
  public ensureAllStopped(assetIds: string[]): void {
    console.log(`[Audio Debug] Ensuring all instances of ${assetIds.join(', ')} are completely stopped`);
    
    // First pass: try normal cleanup for each asset 
    assetIds.forEach(baseId => {
      this.cleanupSound(baseId);
    });
    
    // Second pass: find any sources that might still be playing with these base IDs
    // (addresses potential race conditions with async operations)
    const allSources = Array.from(this.activeSources.keys());
    
    allSources.forEach(sourceId => {
      // Check if this source belongs to any of the asset IDs we want to stop
      const shouldStop = assetIds.some(assetId => 
        sourceId === assetId || 
        sourceId.startsWith(`${assetId}-recovery`) ||
        sourceId.includes(assetId)
      );
      
      if (shouldStop) {
        console.log(`[Audio Debug] Force stopping extra instance: ${sourceId}`);
        try {
          const source = this.activeSources.get(sourceId);
          if (source) {
            source.stop();
            this.activeSources.delete(sourceId);
          }
          
          const gain = this.activeGains.get(sourceId);
          if (gain) {
            gain.disconnect();
            this.activeGains.delete(sourceId);
          }
        } catch (e) {
          console.error(`[Audio Debug] Error force stopping: ${sourceId}`, e);
        }
      }
    });
  }
}

// Create a singleton instance
export const audioManager = AudioManager.getInstance(); 