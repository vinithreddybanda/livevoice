# LiveVoice - Real-time Speech-to-Text App

A clean, minimalistic React frontend for live speech-to-text transcription using Deepgram AI.

## Features

- 🎙️ **Real-time transcription** with Deepgram WebSocket API
- 🎵 **Audio visualizer** with waveform animation
- 🌍 **Multi-language support** with official Deepgram language codes
- 📱 **iPhone-like design** with clean, rounded interface
- ⚡ **Smooth animations** between interim and final text
- 🔧 **Error handling** for microphone access and API issues

## Setup

1. **Install dependencies** (already done):
   ```bash
   npm install
   ```

2. **Get a Deepgram API key**:
   - Sign up at [Deepgram](https://deepgram.com/)
   - Get your API key from the dashboard

3. **Configure environment**:
   - Copy `.env.example` to `.env`
   - Add your Deepgram API key:
     ```
     VITE_DEEPGRAM_API_KEY=your_actual_api_key_here
     ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

## Usage

1. Click the microphone button to start listening
2. Speak into your microphone
3. See real-time transcription with:
   - Gray italic text for interim results
   - Bold black text for final results
4. Select different languages from the settings panel
5. Clear text or stop listening as needed

## Browser Requirements

- Modern browser with WebRTC support
- Microphone permissions
- HTTPS (required for microphone access in production)

## Tech Stack

- **React 19** with TypeScript
- **Tailwind CSS** for styling
- **Deepgram SDK** for speech-to-text
- **Lucide React** for icons
- **Vite** for development and building
