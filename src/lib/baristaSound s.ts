// Barista Station Sound System
// Provides audio feedback for various barista station actions

class BaristaAudioSystem {
  private audioContext: AudioContext | null = null;

  constructor() {
    this.initAudioContext();
  }

  private initAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('Audio context not available:', error);
    }
  }

  private playTone(
    frequency: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume: number = 0.3
  ): Promise<void> {
    return new Promise((resolve) => {
      if (!this.audioContext) {
        resolve();
        return;
      }

      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

      gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        this.audioContext.currentTime + duration
      );

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);

      setTimeout(resolve, duration * 1000);
    });
  }

  // New order received - Urgent attention sound
  async playNewOrderSound() {
    if (!this.audioContext) return;

    const now = this.audioContext.currentTime;
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    // Ascending chime pattern for new order
    oscillator.frequency.setValueAtTime(659.25, now); // E5
    oscillator.frequency.setValueAtTime(783.99, now + 0.15); // G5
    oscillator.frequency.setValueAtTime(987.77, now + 0.3); // B5

    gainNode.gain.setValueAtTime(0.4, now);
    gainNode.gain.setValueAtTime(0.4, now + 0.15);
    gainNode.gain.setValueAtTime(0.4, now + 0.3);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

    oscillator.start(now);
    oscillator.stop(now + 0.6);
  }

  // Order started preparing - Acknowledgment sound
  async playStartPreparingSound() {
    await this.playTone(523.25, 0.15, 'sine', 0.25); // C5 - Short confirmation beep
  }

  // Order ready for pickup - Success sound
  async playOrderReadySound() {
    if (!this.audioContext) return;

    const now = this.audioContext.currentTime;
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    // Success melody
    oscillator.frequency.setValueAtTime(523.25, now); // C5
    oscillator.frequency.setValueAtTime(659.25, now + 0.12); // E5
    oscillator.frequency.setValueAtTime(783.99, now + 0.24); // G5
    oscillator.frequency.setValueAtTime(1046.50, now + 0.36); // C6

    gainNode.gain.setValueAtTime(0.35, now);
    gainNode.gain.setValueAtTime(0.35, now + 0.12);
    gainNode.gain.setValueAtTime(0.35, now + 0.24);
    gainNode.gain.setValueAtTime(0.35, now + 0.36);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.7);

    oscillator.start(now);
    oscillator.stop(now + 0.7);
  }

  // Order completed/served - Gentle completion sound
  async playOrderCompletedSound() {
    await this.playTone(880, 0.2, 'sine', 0.25); // A5 - Gentle ding
  }

  // Order cancelled - Alert/warning sound
  async playOrderCancelledSound() {
    if (!this.audioContext) return;

    const now = this.audioContext.currentTime;
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    // Descending pattern for cancellation
    oscillator.frequency.setValueAtTime(659.25, now); // E5
    oscillator.frequency.setValueAtTime(523.25, now + 0.12); // C5
    oscillator.frequency.setValueAtTime(392.00, now + 0.24); // G4

    gainNode.gain.setValueAtTime(0.3, now);
    gainNode.gain.setValueAtTime(0.3, now + 0.12);
    gainNode.gain.setValueAtTime(0.3, now + 0.24);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

    oscillator.start(now);
    oscillator.stop(now + 0.5);
  }

  // Button click sound - Subtle feedback
  async playButtonClick() {
    await this.playTone(800, 0.05, 'square', 0.15); // Short click
  }

  // Error sound - Alert tone
  async playErrorSound() {
    if (!this.audioContext) return;

    const now = this.audioContext.currentTime;
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    // Double beep error pattern
    oscillator.frequency.setValueAtTime(400, now);
    oscillator.frequency.setValueAtTime(400, now + 0.15);

    gainNode.gain.setValueAtTime(0.4, now);
    gainNode.gain.setValueAtTime(0, now + 0.08);
    gainNode.gain.setValueAtTime(0.4, now + 0.15);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    oscillator.start(now);
    oscillator.stop(now + 0.3);
  }

  // Multiple orders notification - Attention grabber
  async playMultipleOrdersAlert() {
    if (!this.audioContext) return;

    // Play three quick ascending tones
    await this.playTone(659.25, 0.1, 'sine', 0.35); // E5
    await new Promise(resolve => setTimeout(resolve, 50));
    await this.playTone(783.99, 0.1, 'sine', 0.35); // G5
    await new Promise(resolve => setTimeout(resolve, 50));
    await this.playTone(987.77, 0.1, 'sine', 0.35); // B5
  }
}

// Singleton instance
export const baristaAudio = new BaristaAudioSystem();

// Helper functions for common actions
export const playNewOrder = () => baristaAudio.playNewOrderSound();
export const playStartPreparing = () => baristaAudio.playStartPreparingSound();
export const playOrderReady = () => baristaAudio.playOrderReadySound();
export const playOrderCompleted = () => baristaAudio.playOrderCompletedSound();
export const playOrderCancelled = () => baristaAudio.playOrderCancelledSound();
export const playButtonClick = () => baristaAudio.playButtonClick();
export const playError = () => baristaAudio.playErrorSound();
export const playMultipleOrders = () => baristaAudio.playMultipleOrdersAlert();
