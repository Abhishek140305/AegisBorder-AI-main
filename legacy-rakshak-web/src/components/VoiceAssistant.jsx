import React, { useState, useEffect } from 'react';
import { Volume2, Mic, MicOff, Sparkles } from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../engine/regionalDictionary';

export function speakText(text, langCode = 'hi') {
  if (!('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported in this browser.');
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  const langObj = SUPPORTED_LANGUAGES.find(l => l.code === langCode);

  if (langObj) {
    utterance.lang = langObj.speechLang;
  }

  utterance.rate = 0.95;
  utterance.pitch = 1.0;

  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

export default function VoiceAssistant({ currentLang, onVoiceInput }) {
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setSpeechSupported(true);
    }
  }, []);

  const handleToggleListening = () => {
    if (!speechSupported) {
      alert("Voice input is not supported in this browser. Please type or use Chrome.");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    const langObj = SUPPORTED_LANGUAGES.find(l => l.code === currentLang);
    recognition.lang = langObj ? langObj.speechLang : 'hi-IN';
    recognition.interimResults = false;

    if (!isListening) {
      recognition.start();
      setIsListening(true);

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (onVoiceInput) {
          onVoiceInput(transcript);
        }
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };
    } else {
      recognition.stop();
      setIsListening(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleToggleListening}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border shadow-sm hover:shadow-md ${
          isListening
            ? 'bg-gradient-to-r from-coral-500 to-coral-600 text-white border-coral-500 shadow-lg shadow-coral-500/20 animate-pulse'
            : 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/20'
        }`}
        title="Speak suspicious message or URL (Voice Input)"
      >
        {isListening ? (
          <>
            <MicOff className="w-4 h-4" />
            <span className="hidden sm:inline">Listening...</span>
          </>
        ) : (
          <>
            <Mic className="w-4 h-4" />
            <span className="hidden sm:inline">Voice Input</span>
          </>
        )}
      </button>
    </div>
  );
}