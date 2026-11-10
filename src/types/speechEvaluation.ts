export interface PhonemeScore {
  phoneme: string;
  score: number;
  isAccurate: boolean;
}

export interface SpeechEvaluationResult {
  overallScore: number;
  accuracyScore: number;
  fluencyScore: number;
  completenessScore: number;
  recognizedText: string;
  referenceText: string;
  phonemes?: PhonemeScore[];
}
