import type { Human, HumanConstructor } from '../types';

declare const Human: { Human: HumanConstructor };

const commonConfig = {
  modelBasePath: 'https://vladmandic.github.io/human-models/models/',
  cacheSensitivity: 0,
  deallocate: true,
  async: true,
  filter: { 
    enabled: true, 
    equalization: true,
    autoBrightness: true,
  },
  face: {
    enabled: true,
    mesh: { enabled: true },
    iris: { enabled: true },
    description: { enabled: true },
    emotion: { enabled: false }
  },
  body: { enabled: false },
  hand: { enabled: false },
  gesture: { enabled: false },
};

export const detectorConfigs = {
  default: { // Equilibrado
    ...commonConfig,
    backend: 'webgl',
    face: {
      ...commonConfig.face,
      detector: { rotation: false, maxDetected: 1, skipFrames: 5, minConfidence: 0.7, iouThreshold: 0.3 },
      description: { ...commonConfig.face.description, minConfidence: 0.8 },
    },
  },
  fast: { // Rápido
    ...commonConfig,
    backend: 'wasm',
    filter: { enabled: false },
    face: {
      ...commonConfig.face,
      mesh: { enabled: false },
      iris: { enabled: false },
      detector: { rotation: false, maxDetected: 1, skipFrames: 10, minConfidence: 0.5, iouThreshold: 0.5, modelPath: 'blazeface-tiny.json' },
      description: { ...commonConfig.face.description, minConfidence: 0.7, modelPath: 'faceres-tiny.json' },
    },
  },
  sensitive: { // Sensível
    ...commonConfig,
    backend: 'webgl',
    face: {
      ...commonConfig.face,
      detector: { rotation: true, maxDetected: 1, skipFrames: 2, minConfidence: 0.6, iouThreshold: 0.1 },
      description: { ...commonConfig.face.description, minConfidence: 0.9 },
    },
  },
  lowlight: { // Pouca Luz
    ...commonConfig,
    backend: 'webgl',
    filter: { enabled: true, equalization: true, autoBrightness: true, contrast: 0.2, brightness: 0.2 },
    face: {
      ...commonConfig.face,
      detector: { rotation: false, maxDetected: 1, skipFrames: 5, minConfidence: 0.7, iouThreshold: 0.3 },
      description: { ...commonConfig.face.description, minConfidence: 0.8 },
    },
  },
  multi: { // Múltiplas Faces
    ...commonConfig,
    backend: 'webgl',
    face: {
      ...commonConfig.face,
      detector: { rotation: false, maxDetected: 5, skipFrames: 5, minConfidence: 0.5, iouThreshold: 0.1 },
      description: { ...commonConfig.face.description, minConfidence: 0.8 },
    },
  }
};

const embeddingConfig = {
  backend: 'webgl',
  modelBasePath: 'https://vladmandic.github.io/human-models/models/',
  cacheSensitivity: 0,
  deallocate: true,
  async: true,
  filter: { enabled: true, equalization: true, autoBrightness: true, contrast: 0.1, sharpness: 0.2 },
  face: {
    enabled: true,
    detector: { maxDetected: 1, minConfidence: 0.8, minSize: 80, iouThreshold: 0.01 },
    description: { enabled: true, minConfidence: 0.9, skipFrames: 1, skipTime: 0 },
    mesh: { enabled: true },
    iris: { enabled: false },
    emotion: { enabled: false }
  },
  body: { enabled: false },
  hand: { enabled: false },
  gesture: { enabled: false },
};

let detectorInstance: Human | null = null;
let currentDetectorConfigName: string | null = null;

export async function getDetectorInstance(configName: keyof typeof detectorConfigs = 'default'): Promise<Human> {
    if (detectorInstance && configName === currentDetectorConfigName) {
        return detectorInstance;
    }
    
    console.log(`Creating new Human detector instance with config: ${configName}`);
    currentDetectorConfigName = configName;
    const config = detectorConfigs[configName];
    
    // Deallocate previous instance if it exists by setting it to null, allowing GC
    detectorInstance = null;

    const newInstance = new Human.Human(config);
    await newInstance.load();
    await newInstance.warmup();
    detectorInstance = newInstance;
    return detectorInstance;
}

// Embedding instance remains a singleton with a fixed, high-quality config
let embeddingInstance: Human | null = null;
let embeddingPromise: Promise<Human> | null = null;

async function createEmbeddingInstance(): Promise<Human> {
    const human = new Human.Human(embeddingConfig);
    await human.load();
    await human.warmup();
    return human;
}

export async function getEmbeddingInstance(): Promise<Human> {
    if (embeddingInstance) return embeddingInstance;
    if (!embeddingPromise) {
        embeddingPromise = createEmbeddingInstance().then(instance => {
            embeddingInstance = instance;
            return instance;
        });
    }
    return embeddingPromise;
}