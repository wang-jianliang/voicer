export type UserEventType = MouseEvent | TouchEvent | PointerEvent;

export interface BrowserMessage {
  type: string;
  data: any;
}

export interface VoiceModel {
  Name: string
  DisplayName: string
  LocalName: string
  ShortName: string
  Gender: string
  Locale: string
  LocaleName: string
  SampleRateHertz: string
  VoiceType: string
  Status: string
  WordsPerMinute: string
}
