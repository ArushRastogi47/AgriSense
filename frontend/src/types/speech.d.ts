interface SpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: any) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

interface Window {
  webkitSpeechRecognition?: { new(): SpeechRecognition };
  SpeechRecognition?: { new(): SpeechRecognition };
}
