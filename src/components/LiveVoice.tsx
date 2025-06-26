import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { createClient, type ListenLiveClient } from '@deepgram/sdk';
import { gsap } from 'gsap';
import { useThemeStore } from '../lib/themeStore';
import { ThreeBackground } from './ThreeBackground';

// Deepgram language codes - Enhanced and Nova-2 models
const LANGUAGES = [
  // Enhanced model languages
  { code: 'da', name: 'Danish', model: 'enhanced' },
  { code: 'nl', name: 'Dutch', model: 'enhanced' },
  { code: 'en', name: 'English', model: 'enhanced' },
  { code: 'fr', name: 'French', model: 'enhanced' },
  { code: 'de', name: 'German', model: 'enhanced' },
  { code: 'hi', name: 'Hindi', model: 'nova-2' },
  { code: 'it', name: 'Italian', model: 'enhanced' },
  { code: 'ja', name: 'Japanese', model: 'enhanced' },
  { code: 'ko', name: 'Korean', model: 'enhanced' },
  { code: 'no', name: 'Norwegian', model: 'enhanced' },
  { code: 'pl', name: 'Polish', model: 'enhanced' },
  { code: 'pt', name: 'Portuguese', model: 'enhanced' },
  { code: 'es', name: 'Spanish', model: 'enhanced' },
  { code: 'sv', name: 'Swedish', model: 'enhanced' },
  { code: 'ta', name: 'Tamil', model: 'enhanced' },
  { code: 'taq', name: 'Tamasheq', model: 'enhanced' },
  
  // Nova-2 model languages
  { code: 'bg', name: 'Bulgarian', model: 'nova-2' },
  { code: 'ca', name: 'Catalan', model: 'nova-2' },
  { code: 'zh-CN', name: 'Chinese (Simplified)', model: 'nova-2' },
  { code: 'zh-TW', name: 'Chinese (Traditional)', model: 'nova-2' },
  { code: 'zh-HK', name: 'Chinese (Hong Kong)', model: 'nova-2' },
  { code: 'cs', name: 'Czech', model: 'nova-2' },
  { code: 'et', name: 'Estonian', model: 'nova-2' },
  { code: 'fi', name: 'Finnish', model: 'nova-2' },
  { code: 'fr-CA', name: 'French (Canada)', model: 'nova-2' },
  { code: 'de-CH', name: 'German (Switzerland)', model: 'nova-2' },
  { code: 'el', name: 'Greek', model: 'nova-2' },
  { code: 'hu', name: 'Hungarian', model: 'nova-2' },
  { code: 'id', name: 'Indonesian', model: 'nova-2' },
  { code: 'lv', name: 'Latvian', model: 'nova-2' },
  { code: 'lt', name: 'Lithuanian', model: 'nova-2' },
  { code: 'ms', name: 'Malay', model: 'nova-2' },
  { code: 'ro', name: 'Romanian', model: 'nova-2' },
  { code: 'ru', name: 'Russian', model: 'nova-2' },
  { code: 'sk', name: 'Slovak', model: 'nova-2' },
  { code: 'th', name: 'Thai', model: 'nova-2' },
  { code: 'tr', name: 'Turkish', model: 'nova-2' },
  { code: 'uk', name: 'Ukrainian', model: 'nova-2' },
  { code: 'vi', name: 'Vietnamese', model: 'nova-2' },
];

export const LiveVoice: React.FC = () => {
  const { isDark } = useThemeStore();
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [finalText, setFinalText] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [error, setError] = useState('');
  const [audioLevel, setAudioLevel] = useState(0.5);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const connectionRef = useRef<ListenLiveClient | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const keepAliveRef = useRef<NodeJS.Timeout | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const barsRef = useRef<(HTMLDivElement | null)[]>([]);

  // GSAP animations
  useEffect(() => {
    if (cardRef.current) {
      gsap.fromTo(cardRef.current, 
        { opacity: 0, y: 50, scale: 0.9 },
        { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: "back.out(1.7)" }
      );
    }
  }, []);

  useEffect(() => {
    if (buttonRef.current) {
      if (isListening) {
        gsap.to(buttonRef.current, {
          scale: 1.1,
          duration: 0.3,
          ease: "power2.out"
        });
      } else {
        gsap.to(buttonRef.current, {
          scale: 1,
          duration: 0.3,
          ease: "power2.out"
        });
      }
    }
  }, [isListening]);

  // Audio level animation
  useEffect(() => {
    if (!isListening || !analyserRef.current) return;

    const updateAudioLevel = () => {
      if (!analyserRef.current) return;
      
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);
      
      const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
      setAudioLevel(average / 255);
      
      if (isListening) {
        requestAnimationFrame(updateAudioLevel);
      }
    };

    updateAudioLevel();
  }, [isListening]);

  // Animate visualizer bars
  useEffect(() => {
    if (isListening) {
      barsRef.current.forEach((bar, index) => {
        if (bar) {
          gsap.to(bar, {
            scaleY: 1 + Math.random() * audioLevel * 3,
            duration: 0.1,
            repeat: -1,
            yoyo: true,
            delay: index * 0.05,
            ease: "power2.inOut"
          });
        }
      });
    } else {
      barsRef.current.forEach((bar) => {
        if (bar) {
          gsap.to(bar, {
            scaleY: 1,
            duration: 0.3,
            ease: "power2.out"
          });
        }
      });
    }
  }, [isListening, audioLevel]);

  const startListening = async () => {
    try {
      setError('');
      
      // Check for required APIs
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Browser does not support audio recording');
        return;
      }

      if (!MediaRecorder) {
        setError('Browser does not support MediaRecorder');
        return;
      }
      
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      });

      streamRef.current = stream;

      // Set up audio analysis
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;

      // Initialize Deepgram WebSocket
      const apiKey = import.meta.env.VITE_DEEPGRAM_API_KEY;
      
      if (!apiKey || apiKey === 'your-deepgram-api-key-here') {
        setError('Deepgram API key not configured. Please check your .env file.');
        return;
      }
      
      console.log('Starting Deepgram connection...');
      
      const deepgram = createClient(apiKey);
      
      // Get the appropriate model for the selected language
      const selectedLang = LANGUAGES.find(lang => lang.code === selectedLanguage);
      const modelToUse = selectedLang?.model || 'enhanced'; // Default to enhanced
      
      const socket = deepgram.listen.live({
        model: modelToUse,
        language: selectedLanguage,
        smart_format: true,
        interim_results: true,
        endpointing: 300, // Faster endpointing for quicker final results
        utterance_end_ms: 1000, // Shorter utterance end detection
        vad_events: true, // Voice activity detection events
      });

      socket.on("open", () => {
        console.log('Deepgram connection opened');
        
        // Set up MediaRecorder after connection is open
        const options: MediaRecorderOptions = {};
        
        // Try different MIME types based on browser support
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          options.mimeType = 'audio/webm;codecs=opus';
          console.log('Using audio/webm;codecs=opus');
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          options.mimeType = 'audio/webm';
          console.log('Using audio/webm');
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          options.mimeType = 'audio/mp4';
          console.log('Using audio/mp4');
        } else {
          console.log('Using default audio format');
        }
        
        mediaRecorderRef.current = new MediaRecorder(stream, options);

        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0 && connectionRef.current && socket.getReadyState() === 1) {
            connectionRef.current.send(event.data);
          }
        };

        mediaRecorderRef.current.onerror = (event) => {
          console.error('MediaRecorder error:', event);
          setError('Recording error occurred');
        };

        mediaRecorderRef.current.start(50); // Send data every 50ms for faster responsiveness
        setIsListening(true);
        
        // Set up keep-alive to prevent connection timeout
        keepAliveRef.current = setInterval(() => {
          if (connectionRef.current && socket.getReadyState() === 1) {
            connectionRef.current.keepAlive();
          }
        }, 5000); // Send keep-alive every 5 seconds for better connection stability
      });

      socket.on("Results", (data) => {
        console.log('Received results:', data);
        const transcript = data.channel.alternatives[0]?.transcript || '';
        
        if (transcript !== '') {
          if (data.is_final) {
            console.log('Final transcript:', transcript);
            // Add space before new final text if there's existing text
            const separator = finalText.trim() ? ' ' : '';
            setFinalText(prev => prev + separator + transcript.trim());
            setInterimText('');
          } else {
            console.log('Interim transcript:', transcript);
            setInterimText(transcript);
          }
        }
      });

      socket.on("UtteranceEnd", () => {
        // Force finalize any remaining interim text
        if (interimText.trim()) {
          const separator = finalText.trim() ? ' ' : '';
          setFinalText(prev => prev + separator + interimText.trim());
          setInterimText('');
        }
      });

      socket.on("error", (error) => {
        console.error('Deepgram error:', error);
        setError(`Connection error: ${error.error?.message || error.message || 'Unknown error'}`);
      });

      socket.on("warning", () => {
        // Handle warnings silently
      });

      socket.on("Metadata", () => {
        // Handle metadata silently
      });

      socket.on("close", (event) => {
        console.log('Deepgram connection closed:', event);
        
        // Clear keep-alive timer
        if (keepAliveRef.current) {
          clearInterval(keepAliveRef.current);
          keepAliveRef.current = null;
        }
        
        if (event.code !== 1000 && isListening) {
          setError('Connection lost. Please try again.');
        }
        
        // Don't automatically set isListening to false here to allow manual control
      });

      connectionRef.current = socket;
      
    } catch (error) {
      console.error('Error starting listening:', error);
      setError(`Failed to access microphone: ${error instanceof Error ? error.message : 'Please check permissions.'}`);
    }
  };

  const stopListening = () => {
    console.log('Stopping listening...');
    setIsListening(false);
    
    // Stop MediaRecorder first to prevent more data events
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    // Clear keep-alive timer
    if (keepAliveRef.current) {
      clearInterval(keepAliveRef.current);
      keepAliveRef.current = null;
    }
    
    // Close WebSocket connection
    if (connectionRef.current) {
      connectionRef.current.requestClose();
      connectionRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    
    setInterimText('');
  };

  const clearText = () => {
    setFinalText('');
    setInterimText('');
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <>
      <ThreeBackground isDark={isDark} isListening={isListening} />
      <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-500 ${
        isDark 
          ? 'bg-black' 
          : 'bg-white'
      }`}>
        <div 
          ref={cardRef}
          className={`backdrop-blur-xl rounded-3xl shadow-2xl border p-8 w-full max-w-md relative overflow-hidden transition-all duration-500 ${
            isDark
              ? 'bg-black/95 border-gray-800 shadow-black/50'
              : 'bg-white/95 border-gray-200 shadow-gray-500/20'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center">
                <img 
                  src="/favico.svg" 
                  alt="LiveVoice" 
                  className="w-8 h-8"
                />
              </div>
              <h1 className={`text-xl font-bold transition-colors duration-300 ${
                isDark ? 'text-white' : 'text-black'
              }`}>LiveVoice</h1>
            </div>
          </div>

          {/* Compact Control Row */}
          <div className="flex items-center justify-between mb-6 gap-3">
            {/* Mic Button */}
            <button
              ref={buttonRef}
              onClick={toggleListening}
              className={`relative p-3 rounded-full transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-xl group flex-shrink-0 ${
                isListening
                  ? isDark
                    ? 'bg-white hover:bg-gray-100 shadow-white/20'
                    : 'bg-black hover:bg-gray-900 shadow-black/20'
                  : isDark
                    ? 'bg-white hover:bg-gray-100 shadow-white/20'
                    : 'bg-black hover:bg-gray-900 shadow-black/20'
              }`}
            >
              {isListening ? (
                <MicOff className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${
                  isDark ? 'text-black' : 'text-white'
                }`} />
              ) : (
                <Mic className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${
                  isDark ? 'text-black' : 'text-white'
                }`} />
              )}
            </button>

            {/* Audio Visualizer */}
            <div className="flex items-center space-x-1 h-6 flex-1 min-w-0">
              {Array.from({ length: 8 }, (_, index) => (
                <div
                  key={index}
                  ref={(el) => { barsRef.current[index] = el; }}
                  className={`w-1 h-3 rounded-full transition-all duration-100 ease-out origin-bottom flex-shrink-0 ${
                    isDark
                      ? 'bg-white'
                      : 'bg-black'
                  } ${isListening ? 'opacity-100' : 'opacity-20'}`}
                />
              ))}
            </div>

            {/* Language Selector */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className={`text-xs px-2 py-1 border rounded-md focus:outline-none focus:ring-1 transition-all duration-200 min-w-0 ${
                  isDark
                    ? 'border-gray-700 focus:ring-white focus:border-white bg-black text-white'
                    : 'border-gray-300 focus:ring-black focus:border-black bg-white text-black'
                }`}
                disabled={isListening}
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Transcription Area */}
          <div className={`min-h-[160px] max-h-[280px] overflow-y-auto p-4 rounded-xl border relative transition-all duration-300 ${
            isDark
              ? 'bg-gray-900/80 border-gray-600/50'
              : 'bg-gray-50/80 border-gray-200/50'
          }`}>
            
            {error ? (
              <div className={`text-center text-sm p-3 rounded-lg border flex items-center justify-center gap-2 transition-all duration-300 ${
                isDark
                  ? 'text-red-400 bg-red-900/50 border-red-700/50'
                  : 'text-red-500 bg-red-50/80 border-red-200/50'
              }`}>
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                {error}
              </div>
            ) : (
              <div className="space-y-3 relative z-10">
                {/* Final Text */}
                {finalText && (
                  <div className={`text-base leading-relaxed font-medium p-3 rounded-lg border shadow-sm transition-all duration-300 ${
                    isDark
                      ? 'text-white bg-gray-800/60 border-gray-600/30'
                      : 'text-gray-900 bg-white/60 border-gray-200/30'
                  }`}>
                    {finalText}
                  </div>
                )}
                
                {/* Interim Text */}
                {interimText && (
                  <div className={`text-base leading-relaxed italic p-3 rounded-lg border transition-all duration-300 ${
                    isDark
                      ? 'text-gray-400 bg-gray-700/40 border-gray-600/30'
                      : 'text-gray-500 bg-gray-100/40 border-gray-200/30'
                  }`}>
                    {interimText}
                  </div>
                )}

                {/* Placeholder */}
                {!finalText && !interimText && !error && (
                  <div className={`text-center text-sm py-8 flex flex-col items-center gap-3 transition-colors duration-300 ${
                    isDark ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                      isDark
                        ? 'bg-gray-700'
                        : 'bg-gray-200'
                    }`}>
                      <Mic className={`w-6 h-6 transition-colors duration-300 ${
                        isDark ? 'text-gray-400' : 'text-gray-400'
                      }`} />
                    </div>
                    <div>
                      <p className="font-medium">Start speaking</p>
                      <p className={`text-xs mt-1 transition-colors duration-300 ${
                        isDark ? 'text-gray-600' : 'text-gray-400'
                      }`}>Your transcription will appear here</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {(finalText || interimText) && (
            <div className="flex justify-center mt-4">
              <button
                onClick={clearText}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-2 group ${
                  isDark
                    ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100/80'
                }`}
              >
                <div className={`w-1 h-4 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
                  isDark 
                    ? 'bg-gray-400' 
                    : 'bg-gray-600'
                }`}></div>
                Clear Text
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default LiveVoice;
