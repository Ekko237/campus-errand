import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Routes, Route } from 'react-router-dom'
import '@fontsource-variable/geist'
import './index.css'
import Landing from './landing/Landing.jsx'
// 部署后旧版本的分包文件会被删掉：页面若停在旧版本，按需加载原型会 404。
// 这时整页刷新一次拿到新版本；用 sessionStorage 防止反复刷新。
const AppRoot = lazy(() =>
  import('./app/AppRoot.jsx').then(
    (m) => { try { sessionStorage.removeItem('chunk-reload') } catch {} return m },
    (err) => {
      let reloaded = false
      try { reloaded = sessionStorage.getItem('chunk-reload') === '1'; sessionStorage.setItem('chunk-reload', '1') } catch {}
      if (!reloaded) { window.location.reload(); return new Promise(() => {}) }
      throw err
    },
  ),
)

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
