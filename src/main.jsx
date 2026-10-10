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

// 原型分包一般在首页就预加载好了；真没加载完时只留底色，不放假的骨架屏
function AppLoading() {
  return <div className="min-h-[100dvh] bg-bg" aria-label="加载中" />
}

try { sessionStorage.removeItem('stale-reload') } catch {}
// 标题字加载期间给 <html> 挂 fl（index.css 里让替身字先斜过来），得意黑到了就摘掉
{
  const done = () => document.documentElement.classList.remove('fl')
  // 字体样式表是异步挂上的，不能只等一次 load：每 100ms 看一眼有没有哪片得意黑真的加载完了
  if (document.fonts) {
    document.documentElement.classList.add('fl')
    const t0 = Date.now()
    const tick = () => ([...document.fonts].some((f) => f.family.includes('Smiley') && f.status === 'loaded') || Date.now() - t0 > 3000 ? done() : setTimeout(tick, 100))
    tick()
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/thinking" element={<Landing page="thinking" />} />
        <Route path="/app/*" element={<Suspense fallback={<AppLoading />}><AppRoot /></Suspense>} />
        <Route path="*" element={<Landing />} />
      </Routes>
    </HashRouter>
  </StrictMode>,
)
