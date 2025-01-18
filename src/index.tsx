import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Popup from './components/popup/Popup'
import './index.css'

const root = createRoot(document.getElementById('root')!)
root.render(
  <StrictMode>
    <Popup />
  </StrictMode>
)
