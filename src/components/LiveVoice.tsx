import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Settings } from 'lucide-react';
import { createClient, type ListenLiveClient } from '@deepgram/sdk';

// Deepgram language codes
const LANGUAGES = [
  { code: 'en-US', name: 'English (US)' },
  { code: 'en-GB', name: 'English (UK)' },
  { code: 'es-ES', name: 'Spanish (Spain)' },
  { code: 'es-419', name: 'Spanish (Latin America)' },
  { code: 'fr-FR', name: 'French' },
  { code: 'de-DE', name: 'German' },
  { code: 'it-IT', name: 'Italian' },
  { code: 'pt-BR', name: 'Portuguese (Brazil)' },
  { code: 'ru-RU', name: 'Russian' },
  { code: 'ja-JP', name: 'Japanese' },
  { code: 'ko-KR', name: 'Korean' },
  { code: 'zh-CN', name: 'Chinese (Simplified)' },
  { code: 'hi-IN', name: 'Hindi' },
  { code: 'ar-SA', name: 'Arabic' },
];

const AudioVisualizer: React.FC<{ isListening: boolean; audioLevel: number }> = ({
  isListening,
  audioLevel,
}) => {
  const bars = Array.from({ length: 20 }, (_, i) => i);

  return (
    <div className="flex items-center justify-center space-x-1 h-12 mb-6">
      {bars.map((_, index) => {
        const height = isListening
          ? Math.random() * audioLevel * 40 + 8
          : 8;
        
        return (
          <div
            key={index}
            className={`bg-gradient-to-t from-blue-500 to-blue-300 rounded-full transition-all duration-150 ease-out ${
              isListening ? 'opacity-100' : 'opacity-30'
            }`}
            style={{
              width: '3px',
              height: `${height}px`,
              animationDelay: `${index * 50}ms`,
            }}
          />
        );
      })}
    </div>
  );
};

export const LiveVoice: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [finalText, setFinalText] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('en-US');
  const [error, setError] = useState('');
  const [audioLevel, setAudioLevel] = useState(0.5);
  const [showSettings, setShowSettings] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const connectionRef = useRef<ListenLiveClient | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

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

  const startListening = async () => {
    try {
      setError('');
      setConnectionStatus('connecting');
      
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
      console.log('API Key available:', !!apiKey);
      console.log('API Key length:', apiKey?.length);
      
      if (!apiKey) {
        setError('Deepgram API key not found. Please check your .env file.');
        setConnectionStatus('disconnected');
        return;
      }
      
      const deepgram = createClient(apiKey);
      
      const socket = deepgram.listen.live({
        model: 'nova',
        language: selectedLanguage,
        smart_format: true,
        interim_results: true,
      });

      socket.on("open", () => {
        console.log("client: connected to websocket");
        setConnectionStatus('connected');
        
        // Set up MediaRecorder after connection is open
        const options: MediaRecorderOptions = {};
        
        // Try different MIME types based on browser support
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          options.mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          options.mimeType = 'audio/webm';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          options.mimeType = 'audio/mp4';
        }
        
        mediaRecorderRef.current = new MediaRecorder(stream, options);

        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0 && connectionRef.current) {
            console.log(`Sending audio data: ${event.data.size} bytes`);
            connectionRef.current.send(event.data);
          }
        };

        mediaRecorderRef.current.onerror = (event) => {
          console.error('MediaRecorder error:', event);
          setError('Recording error occurred');
        };

        mediaRecorderRef.current.start(100); // Send data every 100ms for more responsiveness
        setIsListening(true);
      });

      socket.on("Results", (data) => {
        const transcript = data.channel.alternatives[0]?.transcript || '';
        
        if (transcript !== '') {
          if (data.is_final) {
            setFinalText(prev => prev + ' ' + transcript);
            setInterimText('');
          } else {
            setInterimText(transcript);
          }
        }
      });

      socket.on("error", (error) => {
        console.error('Deepgram error details:', error);
        console.error('Error type:', typeof error);
        console.error('Error keys:', Object.keys(error));
        setError(`Connection error: ${error.error?.message || 'Unknown error'}`);
        setConnectionStatus('disconnected');
      });

      socket.on("warning", (warning) => {
        console.warn('Deepgram warning:', warning);
      });

      socket.on("Metadata", (metadata) => {
        console.log('Deepgram metadata:', metadata);
      });

      socket.on("close", (event) => {
        console.log('Deepgram connection closed:', event);
        setConnectionStatus('disconnected');
        if (event.code !== 1000) {
          setError('Connection lost. Please try again.');
        }
        setIsListening(false);
      });

      connectionRef.current = socket;
      
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Failed to access microphone. Please check permissions.');
      setConnectionStatus('disconnected');
    }
  };

  const stopListening = () => {
    setIsListening(false);
    setConnectionStatus('disconnected');
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Live Voice</h1>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <Settings className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="mb-6 p-4 bg-gray-50 rounded-2xl">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Language
            </label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isListening}
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Audio Visualizer */}
        <AudioVisualizer isListening={isListening} audioLevel={audioLevel} />

        {/* Main Button */}
        <div className="flex justify-center mb-8">
          <button
            onClick={toggleListening}
            className={`relative p-6 rounded-full transition-all duration-300 transform hover:scale-105 ${
              isListening
                ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                : 'bg-blue-500 hover:bg-blue-600'
            } shadow-lg`}
          >
            {isListening ? (
              <MicOff className="w-8 h-8 text-white" />
            ) : (
              <Mic className="w-8 h-8 text-white" />
            )}
          </button>
        </div>

        {/* Status Text */}
        <div className="text-center mb-6">
          <p className="text-sm text-gray-500">
            {connectionStatus === 'connecting' && 'Connecting...'}
            {connectionStatus === 'connected' && isListening && 'Listening...'}
            {connectionStatus === 'disconnected' && !isListening && 'Tap to start listening'}
          </p>
        </div>

        {/* Transcription Area */}
        <div className="min-h-[200px] max-h-[400px] overflow-y-auto p-6 bg-gray-50 rounded-2xl">
          {error ? (
            <div className="text-red-500 text-center text-sm">{error}</div>
          ) : (
            <div className="space-y-4">
              {/* Final Text */}
              {finalText && (
                <div className="text-lg leading-relaxed text-gray-900 font-medium">
                  {finalText}
                </div>
              )}
              
              {/* Interim Text */}
              {interimText && (
                <div className="text-lg leading-relaxed text-gray-400 italic transition-all duration-300">
                  {interimText}
                </div>
              )}

              {/* Placeholder */}
              {!finalText && !interimText && !error && (
                <div className="text-center text-gray-400 text-lg">
                  Your transcription will appear here...
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {(finalText || interimText) && (
          <div className="flex justify-center mt-6">
            <button
              onClick={clearText}
              className="px-6 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Clear Text
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveVoice;
