# LIVEVOICEX

Real-time voice transcription app built with React, TypeScript, and Deepgram.

## What It Does

- **Live Voice Transcription**: Real-time speech-to-text using Deepgram SDK
- **Multi-Language Support**: 40+ languages with Enhanced and Nova-2 models
- **Interactive UI**: Cinematic intro with mouse interactions and audio visualizer using shader inspired by awwwards


## Tech Stack

**Frontend**
- React 18 + TypeScript + Vite
- Tailwind CSS for styling
- GSAP for animations
- Lucide React for icons
- Zustand for state management

**Audio & AI**
- Deepgram SDK for speech-to-text
- Web Audio API for real-time audio analysis
- MediaRecorder API for audio streaming

**3D Graphics**
- Three.js + React Three Fiber
- Custom GLSL shaders for background effects

## Key Features

**Audio Visualizer**
- Real-time audio level detection
- 8-bar animated visualizer
- Only active during recording
- Reduced sensitivity for smooth movement

**Language Support**
- Enhanced models: Danish, Dutch, English, French, German, Italian, Japanese, Korean, Norwegian, Polish, Portuguese, Spanish, Swedish, Tamil, Tamasheq
- Nova-2 models: Bulgarian, Catalan, Chinese variants, Czech, Estonian, Finnish, Greek, Hungarian, Indonesian, Latvian, Lithuanian, Malay, Romanian, Russian, Slovak, Thai, Turkish, Ukrainian, Vietnamese

**UI/UX Enhancements**
- Cinematic intro with 3D mouse interactions
- Always-visible mic button with loading states
- Clean text deletion (manual only)
- Left-aligned header layout
- Smooth GSAP transitions


## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Environment setup**
   Create `.env` file:
   ```
   VITE_DEEPGRAM_API_KEY=your_deepgram_api_key_here
   ```

3. **Run development server**
   ```bash
   npm run dev
   ```

## Dependencies

**Core**
- `@deepgram/sdk` - Speech-to-text API
- `@react-three/fiber` - React Three.js renderer
- `gsap` - Animation library
- `three` - 3D graphics library
- `zustand` - State management

**UI**
- `lucide-react` - Icon library
- `tailwindcss` - CSS framework

**Build Tools**
- `vite` - Build tool
- `typescript` - Type safety
- `@vitejs/plugin-react` - React support

## Key Implementations

**Audio Processing**
- Real-time frequency analysis with Web Audio API
- MediaRecorder with optimized MIME type detection
- Audio level normalization for visualizer

**State Management**
- Zustand for theme persistence
- React state for transcription and connection status
- GSAP refs for animation control

**Animation System**
- GSAP timelines for intro sequence
- Mouse-based 3D transforms on title
- Real-time audio visualizer with GSAP

**Connection Handling**
- WebSocket management with keep-alive
- Error handling and reconnection logic
- Loading states with visual feedback

That's it. No fluff.