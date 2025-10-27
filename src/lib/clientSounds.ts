/**
 * Client Audio System
 * Provides delightful sound feedback for client interactions
 */

class ClientAudioSystem {
  private audioContext: AudioContext;

  constructor() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }

  private playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.3): Promise<void> {
    return new Promise((resolve) => {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = type;
      gainNode.gain.value = volume;

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);

      setTimeout(resolve, duration * 1000);
    });
  }

  // Success chime - cheerful and rewarding
  async playSuccess() {
    await this.playTone(523.25, 0.1, 'sine', 0.2); // C5
    await this.playTone(659.25, 0.1, 'sine', 0.2); // E5
    await this.playTone(783.99, 0.15, 'sine', 0.25); // G5
  }

  // Click sound - subtle and satisfying
  async playClick() {
    await this.playTone(800, 0.05, 'sine', 0.15);
  }

  // Tap sound - light and responsive
  async playTap() {
    await this.playTone(1000, 0.03, 'sine', 0.12);
  }

  // Item added - positive feedback
  async playItemAdded() {
    await this.playTone(880, 0.08, 'sine', 0.2); // A5
    await this.playTone(1046.5, 0.12, 'sine', 0.22); // C6
  }

  // Order placed - celebration sound
  async playOrderPlaced() {
    await this.playTone(523.25, 0.1); // C5
    await this.playTone(659.25, 0.1); // E5
    await this.playTone(783.99, 0.1); // G5
    await this.playTone(1046.5, 0.2); // C6
  }

  // Navigation - subtle transition
  async playNavigate() {
    await this.playTone(440, 0.06, 'sine', 0.15); // A4
    await this.playTone(554.37, 0.08, 'sine', 0.18); // C#5
  }

  // Error - gentle alert
  async playError() {
    await this.playTone(300, 0.1, 'sine', 0.18);
    await this.playTone(250, 0.15, 'sine', 0.2);
  }

  // Swipe sound - quick whoosh
  async playSwipe() {
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.1);
    oscillator.type = 'sine';
    gainNode.gain.value = 0.1;

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.1);
  }

  // Popup open - welcoming sound
  async playPopupOpen() {
    await this.playTone(659.25, 0.08, 'sine', 0.15); // E5
    await this.playTone(783.99, 0.1, 'sine', 0.18); // G5
  }

  // Popup close - dismissive sound
  async playPopupClose() {
    await this.playTone(783.99, 0.06, 'sine', 0.12); // G5
    await this.playTone(659.25, 0.08, 'sine', 0.1); // E5
  }
}

// Export singleton instance
export const clientAudio = new ClientAudioSystem();

// Export helper functions
export const playSuccess = () => clientAudio.playSuccess();
export const playClick = () => clientAudio.playClick();
export const playTap = () => clientAudio.playTap();
export const playItemAdded = () => clientAudio.playItemAdded();
export const playOrderPlaced = () => clientAudio.playOrderPlaced();
export const playNavigate = () => clientAudio.playNavigate();
export const playError = () => clientAudio.playError();
export const playSwipe = () => clientAudio.playSwipe();
export const playPopupOpen = () => clientAudio.playPopupOpen();
export const playPopupClose = () => clientAudio.playPopupClose();
