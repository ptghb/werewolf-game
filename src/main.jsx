import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import WerewolfGame from './components/WerewolfGame.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <WerewolfGame />
  </StrictMode>,
)
