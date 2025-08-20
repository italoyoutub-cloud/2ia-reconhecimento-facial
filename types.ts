
export interface School {
  id: string;
  name: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'professor' | 'operador';
  schoolId?: string;
  created_at: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface Student {
  id: string;
  name: string;
  turma: string;
  schoolId: string;
  embedding: number[];
  photo: string; // base64 data URL
}

export interface RecognitionEvent {
  id: string;
  studentId: string;
  schoolId: string;
  timestamp: number;
}

// Minimal type definitions for Human.js loaded from CDN
export interface FaceResult {
  embedding: number[];
  faceScore: number;
  boxScore: number;
  box: [number, number, number, number];
  age: number;
  gender: string;
  genderScore: number;
  emotion: { score: number; emotion: string }[];
  mesh: number[][];
  iris: number;
}

export interface HumanResult {
  face: FaceResult[];
}

export interface Human {
  load: () => Promise<void>;
  warmup: () => Promise<void>;
  detect: (input: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement) => Promise<HumanResult>;
  match: {
    similarity: (embedding1: number[], embedding2: number[]) => number;
    distance: (embedding1: number[], embedding2: number[]) => number;
  };
  tf: any;
  models: {
    loaded: () => string[];
  };
  result: HumanResult;
  draw: {
    canvas: (input: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement, output: HTMLCanvasElement) => void;
    all: (canvas: HTMLCanvasElement, result: HumanResult) => Promise<void>;
  };
}

export type HumanConstructor = new (config: any) => Human;