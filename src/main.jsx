import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Routes, Route } from 'react-router-dom'
import '@fontsource-variable/geist'
import './index.css'
import Landing from './landing/Landing.jsx'
import AppRoot from './app/AppRoot.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/app/*" element={<AppRoot />} />
        <Route path="*" element={<Landing />} />
      </Routes>
    </HashRouter>
  </StrictMode>,
)
