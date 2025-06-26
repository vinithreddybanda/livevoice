import { useState } from 'react'
import './App.css'
import LiveVoice from './components/LiveVoice'
import CinematicIntro from './components/CinematicIntro'

function App() {
  const [showIntro, setShowIntro] = useState(true)

  const handleIntroComplete = () => {
    setShowIntro(false)
  }

  return (
    <>
      {showIntro ? (
        <CinematicIntro onComplete={handleIntroComplete} />
      ) : (
        <LiveVoice />
      )}
    </>
  )
}

export default App
