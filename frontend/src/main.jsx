import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { hydratePassageStorage } from './passageStorage'
import { hydrateReadProgress } from './readProgress'

hydrateReadProgress()
  .then(() => hydratePassageStorage())
  .finally(() => {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
