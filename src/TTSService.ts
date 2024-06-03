import type {VoiceModel} from "~type";
import {CHATTTS_API_URL, TTS_API_TOKEN, TTS_API_URL} from "~constants";

export async function requestSpeech(text: string, voiceModel: VoiceModel, onLoaded: (audioData: ArrayBuffer) => void) {
  try {
    const url = voiceModel.Name === 'ChatTTS' ? CHATTTS_API_URL : TTS_API_URL;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TTS_API_TOKEN}`
      },
      body: JSON.stringify({
        name: voiceModel.Name,
        text: text,
      })
    });
    const blob = await response.blob();
    console.log('audio data blob', blob);
    const reader = new FileReader();
    reader.onloadend = () => {
      console.log('audio data', reader.result);
      onLoaded(reader.result as ArrayBuffer);
    };
    reader.readAsArrayBuffer(blob);
  } catch (error) {
    return console.error('Error:', error);
  }
}