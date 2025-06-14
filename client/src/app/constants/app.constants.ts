export const APP_CONFIG = {
  TITLE: 'portfolio-client',
  FALLBACK_TIMEOUT: 20000,
  // MODEL_PATH: '/models/batcave.glb',
  MODEL_PATH: '/models/batcave.compressed.glb',
  DRACO_DECODER_PATH: '/draco/gltf/',
  LOADING_PROGRESS_INTERVAL: 25
} as const;

export const ANIMATION_CONFIG = {
  DURATIONS: {
    FAST: 0.3,
    NORMAL: 0.6,
    SLOW: 1.0,
    VERY_SLOW: 1.5
  },
  EASING: {
    POWER_IN: 'power2.in',
    POWER_OUT: 'power2.out',
    POWER_IN_OUT: 'power2.inOut',
    SINE_OUT: 'sine.out',
    ELASTIC_OUT: 'elastic.out'
  },
  STAGGER: {
    FAST: 0.005,
    NORMAL: 0.01,
    SLOW: 0.02
  },
  DELAYS: {
    SHORT: 0.3,
    MEDIUM: 0.5,
    LONG: 0.8
  }
} as const;
export const CONSOLE_CONFIG = {
  FADE_DURATION: 0.6,
  SCALE_FROM: 0.8,
  SCALE_TO: 1,
  HEADER_OFFSET: -50,
  CONTENT_OFFSET: 50
} as const;
