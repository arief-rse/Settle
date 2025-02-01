import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import Popup from './components/popup/Popup'
import './index.css'

const root = createRoot(document.getElementById('root')!)
root.render(
  <StrictMode>
    <BrowserRouter>
      <Popup />
      <Toaster position="top-right" richColors />
    </BrowserRouter>
  </StrictMode>
)
