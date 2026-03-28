class SoundService {
  private static instance: SoundService;
  private sounds: Map<string, HTMLAudioElement> = new Map();
  private enabled: boolean = true;

  private constructor() {
    // Preload common sounds
    this.load('click', 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    this.load('hover', 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
    this.load('success', 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
    this.load('error', 'https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3');
    this.load('transition', 'https://assets.mixkit.co/active_storage/sfx/2567/2567-preview.mp3');
  }

  public static getInstance(): SoundService {
    if (!SoundService.instance) {
      SoundService.instance = new SoundService();
    }
    return SoundService.instance;
  }

  public load(name: string, url: string) {
    const audio = new Audio(url);
    audio.volume = 0.2;
    this.sounds.set(name, audio);
  }

  public play(name: string) {
    if (!this.enabled) return;
    const sound = this.sounds.get(name);
    if (sound) {
      sound.currentTime = 0;
      sound.play().catch(() => {
        // Ignore autoplay restrictions
      });
    }
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }
}

export const sounds = SoundService.getInstance();
