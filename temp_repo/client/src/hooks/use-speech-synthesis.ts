import { useState, useEffect, useCallback } from 'react';

interface UseSpeechSynthesisProps {
  onEnd?: () => void;
}

export function useSpeechSynthesis({ onEnd }: UseSpeechSynthesisProps = {}) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [speaking, setSpeaking] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    const synth = window.speechSynthesis;
    
    function loadVoices() {
      const availableVoices = synth.getVoices();
      setVoices(availableVoices);
      
      // Set a default voice (preferably English)
      const defaultVoice = availableVoices.find(
        voice => voice.lang.startsWith('en-')
      );
      if (defaultVoice) {
        setSelectedVoice(defaultVoice);
      }
    }

    loadVoices();
    
    // Chrome loads voices asynchronously
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      synth.cancel();
    };
  }, []);

  const speak = useCallback((text: string) => {
    const synth = window.speechSynthesis;
    
    if (speaking) {
      synth.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => {
      setSpeaking(false);
      onEnd?.();
    };
    utterance.onerror = () => {
      setSpeaking(false);
      onEnd?.();
    };

    synth.speak(utterance);
  }, [speaking, selectedVoice, onEnd]);

  const cancel = useCallback(() => {
    const synth = window.speechSynthesis;
    setSpeaking(false);
    synth.cancel();
  }, []);

  return {
    voices,
    speaking,
    selectedVoice,
    setSelectedVoice,
    speak,
    cancel
  };
}
