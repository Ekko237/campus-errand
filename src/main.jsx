import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Routes, Route } from 'react-router-dom'
import '@fontsource-variable/geist'
import './index.css'
import Landing from './landing/Landing.jsx'
const AppRoot = lazy(() => import('./app/AppRoot.jsx'))

function AppLoading() {
  return (
    <div className="mx-auto max-w-xl space-y-3 px-4 pt-24" aria-label="加载中">
      {[0, 1, 2].map((i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-sunken" />)}
    </div>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/app/*" element={<Suspense fallback={<AppLoading />}><AppRoot /></Suspense>} />
        <Route path="*" element={<Landing />} />
      </Routes>
    </HashRouter>
  </StrictMode>,
)
