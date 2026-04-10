"use client";
import React, { useState, useEffect } from 'react';

interface VoiceSearchProps {
  onResult: (text: string) => void;
  className?: string;
}

export default function VoiceSearch({ onResult, className }: VoiceSearchProps) {
  const [isListening, setIsListening] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setSupported(true);
      }
    }
  }, []);

  const handleToggleListen = () => {
    if (!supported) {
      alert("Voice search is not supported in this browser. Please try Chrome or Safari.");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-IN';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      if (event.error === 'not-allowed') {
        alert("Microphone access was denied. Please enable microphone permissions in your browser settings and try again.");
      } else if (event.error === 'network') {
        alert("Network error. Please check your internet connection.");
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
    }
  };

  if (!supported) return null;

  return (
    <button 
      type="button"
      className={`voice-search-btn ${isListening ? 'listening' : ''} ${className || ''}`}
      onClick={handleToggleListen}
      title="Search by voice"
    >
      <svg 
        width="20" 
        height="20" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke={isListening ? "#ef4444" : "currentColor"} 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
        <line x1="12" y1="19" x2="12" y2="23"></line>
        <line x1="8" y1="23" x2="16" y2="23"></line>
      </svg>
      {isListening && <span className="listening-pulse"></span>}
    </button>
  );
}
