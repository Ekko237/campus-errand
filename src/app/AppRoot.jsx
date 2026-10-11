import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Routes, Route, NavLink, Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import { ListMagnifyingGlass, PlusCircle, UserCircle } from '@phosphor-icons/react'
import { StoreProvider, useStore } from '../store'
import { ViewHost, ViewToggle, EMBED } from './ViewMode'
import { OpenTaskCtx } from './openTask'
import { Sheet, Btn, spring, gi } from '../ui'
import Hall from './Hall'
import Publish from './Publish'
import TaskDetail from './TaskDetail'
import Orders from './Orders'
import Me from './Me'
import Verify from './Verify'
import CreditRules from './CreditRules'
import Wallet from './Wallet'
import TourBar from './TourBar'
import DemoPanel from './DemoPanel'
const Receipt = gi('receipt')
const CheckCircle = gi('check')
const WarningCircle = gi('alert')
const Megaphone = gi('megaphone')
const PersonSimpleRun = gi('runner')
const SealCheck = gi('seal')

export default function AppRoot() {
  // 框里的原型（?embed=）直接是 App；最外层先由 ViewHost 决定铺开还是放进框里
  const app = <StoreProvider><Shell /></StoreProvider>
  return EMBED ? app : <ViewHost>{app}</ViewHost>
}

function RoleSwitch() {
  const { state, act } = useStore()
  const { pathname } = useLocation()
  // 订单页切身份：页面换成另一方能做的事，回到顶上，免得主按钮躲在吸顶栏后面
  const pick = (k) => { act('role', { role: k }); if (pathname.startsWith('/app/task/')) window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const opts = [['poster', '发单人'], ['runner', '跑腿人']]
  return (
    <div className="relative grid grid-cols-2 rounded-full bg-sunken p-1" role="tablist" aria-label="切换角色">
      {/* 滑块用 CSS 位移，不跟页面布局联动：换页、滚动时不会从别处飞过来 */}
      <span aria-hidden="true" className={`absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full bg-accent transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${state.role === 'runner' ? 'translate-x-full' : ''}`} />
      {opts.map(([k, label]) => (
        <button key={k} role="tab" aria-selected={state.role === k} onClick={() => pick(k)}
          className={`relative z-10 h-10 whitespace-nowrap rounded-full px-3 text-[15px] font-semibold transition-colors ${state.role === k ? 'text-on-accent' : 'text-muted'}`}>
          <span className="max-[440px]:hidden">我是</span>{label}
        </button>
      ))}
    </div>
  )
}

// 提示条：只留一张，最近两条合在一起，放在顶栏下面，不叠、不挡顶栏
function Toasts() {
  const { state, act } = useStore()
  const { pathname } = useLocation()
  // 订单页上每一步的结果都直接画在页面里（进度、托管卡、收尾卡），不再弹提示条压内容
  const quiet = pathname.startsWith('/app/task/') || pathname.startsWith('/app/verify')
  // 换页就清掉上一页的提示，别把旧事实带到新页面
  useEffect(() => { state.toasts.forEach((t) => act('dismissToast', { tid: t.id })) }, [pathname]) // eslint-disable-line react-hooks/exhaustive-deps
  const reduce = useReducedMotion()
  const list = state.toasts.slice(-1)
  const last = list[list.length - 1]
  useEffect(() => {
    if (!last) return
    const id = setTimeout(() => list.forEach((t) => act('dismissToast', { tid: t.id })), 2200)
    return () => clearTimeout(id)
  }, [last?.id]) // eslint-disable-line react-hooks/exhaustive-deps
  const bad = list.some((t) => t.tone === 'bad')
  return (
    <div className={`pointer-events-none fixed inset-x-0 z-50 flex justify-center px-4 ${state.tour.active ? 'bottom-[calc(10.5rem+env(safe-area-inset-bottom))] xl:bottom-32' : 'bottom-[calc(4.75rem+env(safe-area-inset-bottom))] xl:bottom-6'} xl:-translate-x-20`} aria-live="polite">
      <AnimatePresence initial={false}>
        {last && !quiet && (
          <motion.div key="toast" layout initial={reduce ? false : { y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.15 } }} transition={spring}
            className={`pointer-events-auto w-auto max-w-md space-y-1 rounded-full px-4 py-2.5 text-sm font-medium shadow-lg shadow-ink/10 ring-1 ${bad ? 'bg-danger-soft text-danger ring-danger/30' : 'bg-surface text-ink ring-line'}`}
            onClick={() => list.forEach((t) => act('dismissToast', { tid: t.id }))}>
            {list.map((t) => (
              <motion.p key={t.id} layout="position" initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start gap-2">
                {t.tone === 'bad' ? <WarningCircle size={20} weight="fill" className="mt-0.5 shrink-0" /> : <CheckCircle size={20} weight="fill" className="mt-0.5 shrink-0 text-accent" />}
                <span>{t.text}</span>
              </motion.p>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Onboarding() {
  const { state, act } = useStore()
  const nav = useNavigate()
  // 从落地页的「顺路提醒」推送点进来：说好看这条路上的单，就直接以跑腿人身份进大厅，不先弹说明
  const fromPush = useLocation().search.includes('from=remind')
  useEffect(() => { if (fromPush) { act('role', { role: 'runner' }); if (!state.onboarded) act('onboarded'); try { localStorage.setItem('shunluxia:remind', '1') } catch { /* 存不了不影响 */ } } }, [fromPush]) // eslint-disable-line react-hooks/exhaustive-deps
  const steps = [
    { src: 'brand/logo-v2.png', alt: '奔跑的顺路侠小人', t: '顶部一键切换身份', d: '一个人就能分别扮演发单人和跑腿人，把一单从头走到尾。' },
    { src: 'icons/step-publish-v1.webp', alt: '带硬币的喇叭', t: '发单先托管，接单先认证', d: '赏金发布时就冻结；没做校园认证的人只能看，不能接。' },
    { src: 'icons/step-confirm-v1.webp', alt: '两只手传递硬币', t: '送达确认才放款，互评改信用', d: '凭送达码或照片交付，确认后放款，双方互评，信用分实时变化。' },
  ]
  const start = () => {
    act('tour', { tour: { active: true, taskId: null, done: false } })
    act('role', { role: 'poster' })
    nav('/app/publish?tour=1')
  }
  return (
    <Sheet open={!state.onboarded && EMBED !== 'desk'} onClose={() => act('onboarded')} title="顺路侠怎么用">
      <ol className="space-y-4">
        {steps.map((s, i) => (
          <li key={s.t} className="flex gap-3">
            <img src={`${import.meta.env.BASE_URL}${s.src}`} width={48} height={48} alt={s.alt} className="size-12 shrink-0 rounded-xl object-contain" />
            <div>
              <p className="text-[17px] font-semibold">{i + 1}. {s.t}</p>
              <p className="mt-0.5 text-[15px] leading-relaxed text-muted">{s.d}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-4 rounded-xl bg-sunken px-3 py-2 text-sm text-muted">页面里的人名、任务、金额都是示例数据，保存在你自己的浏览器里。</p>
      <div className="mt-5 grid gap-2">
        <Btn size="lg" onClick={start}>跟着走一遍（约 2 分钟）</Btn>
        <Btn variant="ghost" onClick={() => act('onboarded')}>先自己逛逛</Btn>
      </div>
    </Sheet>
  )
}

const tabs = [
  ['/app', '大厅', 'nav-hall', true],
  ['/app/publish', '发布', 'nav-publish'],
  ['/app/orders', '订单', 'nav-orders'],
  ['/app/me', '我的', 'nav-me'],
]

// 页面转场：往里走（详情、钱包）从右边推进来，往回走从左边；底部标签之间按左右顺序滑
const TAB_ORDER = ['/app', '/app/publish', '/app/orders', '/app/me']
const depthOf = (p) => (TAB_ORDER.includes(p.replace(/\/$/, '') || '/app') ? 0 : 1)
function useDirection(pathname) {
  const prev = useRef(pathname)
  const dir = useRef(0)
  if (prev.current !== pathname) {
    const a = prev.current.replace(/\/$/, ''), b = pathname.replace(/\/$/, '')
    const da = depthOf(a), db = depthOf(b)
    dir.current = db !== da ? (db > da ? 1 : -1) : Math.sign(TAB_ORDER.indexOf(b) - TAB_ORDER.indexOf(a)) || 1
    prev.current = pathname
  }
  return dir.current
}

// 电脑版（≥1280）：网页的排法：左边导航，中间列表（大厅、订单、发布、我的），右边是点开的那一单；没点开时右边是演示面板
function useDesk() {
  const q = '(min-width: 1280px)'
  const [m, setM] = useState(() => typeof window !== 'undefined' && window.matchMedia(q).matches)
  useEffect(() => { const mm = window.matchMedia(q); const f = () => setM(mm.matches); mm.addEventListener('change', f); return () => mm.removeEventListener('change', f) }, [])
  return m
}

const LIST_ROUTES = (
  <>
    <Route index element={<Hall />} />
    <Route path="publish" element={<Publish />} />
    <Route path="orders" element={<Orders />} />
    <Route path="me" element={<Me />} />
    <Route path="verify" element={<Verify />} />
    <Route path="credit" element={<CreditRules />} />
    <Route path="wallet" element={<Wallet />} />
    <Route path="*" element={<Hall />} />
  </>
)

function DeskShell({ sub, openTask }) {
  const { state } = useStore()
  const loc = useLocation()
  const { pathname } = loc
  const reduce = useReducedMotion()
  const taskOpen = pathname.startsWith('/app/task/')
  // 点开一单时，中间留着它所在的那张列表：自己发的、自己接的在「订单」，别人的在「大厅」
  const listPath = openTask && ((state.role === 'poster' && openTask.posterId === 'poster') || (state.role === 'runner' && openTask.runnerId === 'runner')) ? '/app/orders' : '/app'
  const top = state.tour.active ? 'top-[132px]' : 'top-20'
  return (
    <div className="min-h-[100dvh] bg-bg">
      <header className="sticky top-0 z-30 border-b border-line bg-bg/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-3 px-6">
          <Link to="/" className="flex shrink-0 items-center gap-2 text-lg font-bold tracking-tight">
            <img src={`${import.meta.env.BASE_URL}brand/logo-v2.png`} width={36} height={36} alt="顺路侠标志：背着书包、夹着包裹奔跑的小人" className="size-9" />
            顺路侠
          </Link>
          <div className="flex items-center gap-2"><RoleSwitch /><ViewToggle inner /></div>
        </div>
        <TourBar wide />
      </header>
      <main className="mx-auto grid max-w-[1440px] grid-cols-[180px_minmax(0,1fr)_500px] gap-6 px-6 pb-24 pt-5">
        <nav className={`sticky ${top} self-start`} aria-label="主导航">
          <div className="grid gap-1">
            {tabs.map(([to, label, img, end]) => (
              <NavLink key={to} to={to} end={end} className={({ isActive: a0 }) => { const on = sub ? to === sub : a0; return `flex h-12 items-center gap-2.5 rounded-xl px-3 text-[15px] font-semibold transition-colors ${on ? 'bg-accent-soft text-accent' : 'text-muted hover:bg-sunken'}` }}>
                {({ isActive: a0 }) => { const on = sub ? to === sub : a0; return (<><img src={`${import.meta.env.BASE_URL}icons/${img}-v1.webp`} width={28} height={28} alt="" aria-hidden="true" className={`size-7 object-contain transition ${on ? '' : 'opacity-55 grayscale'}`} />{label}</>) }}
              </NavLink>
            ))}
          </div>
        </nav>
        <section aria-label="列表" className="min-w-0" data-tour-root={taskOpen ? undefined : ''}>
          {taskOpen ? (
            // 右边开着一单：中间的列表自己滚，不跟着详情走，随时点另一单
            <div className={`sticky ${top} overflow-y-auto overscroll-contain pr-1`} style={{ maxHeight: `calc(100dvh - ${state.tour.active ? 148 : 96}px)` }}>
              <OpenTaskCtx.Provider value={pathname.split('/').pop()}><Routes location={{ ...loc, pathname: listPath, search: '' }}>{LIST_ROUTES}</Routes></OpenTaskCtx.Provider>
            </div>
          ) : (
            <div key={pathname} className={reduce ? '' : 'page-in'} style={{ '--dx': '8px' }}><Routes>{LIST_ROUTES}</Routes></div>
          )}
        </section>
        <aside aria-label={taskOpen ? '订单详情' : '演示面板'} className="min-w-0" data-tour-root={taskOpen ? '' : undefined}>
          {taskOpen ? (
            <div key={pathname} className={reduce ? '' : 'page-in'} style={{ '--dx': '12px' }}>
              <Routes><Route path="task/:id" element={<TaskDetail />} /></Routes>
            </div>
          ) : (
            <div className={`sticky ${top} space-y-5 overflow-y-auto overscroll-contain`} style={{ maxHeight: `calc(100dvh - ${state.tour.active ? 148 : 96}px)` }}>
              {(pathname === '/app' || pathname === '/app/') && <div id="desk-map-slot" />}
              <DemoPanel />
            </div>
          )}
        </aside>
      </main>
      <Toasts />
      <Onboarding />
    </div>
  )
}

function Shell() {
  const { state } = useStore()
  const { pathname, search } = useLocation()
  // 子页面亮它的来源标签：订单详情、从订单来的认证亮「订单」；钱包、信用规则、其他认证亮「我的」
  // 认证页从某个订单跳过来（back=/app/task/ID）时，按那一单算
  const backId = pathname.startsWith('/app/verify') ? (search.match(/back=\/app\/task\/([^&]+)/) || [])[1] : null
  const openTask = (pathname.startsWith('/app/task/') || backId) && state.tasks.find((x) => x.id === (backId || pathname.split('/').pop()))
  // 还没人接的单，是从大厅点进来的：亮「大厅」
  const sub = openTask && openTask.status === 'open' && openTask.posterId !== 'poster' ? '/app'
    : pathname.startsWith('/app/task') || (pathname.startsWith('/app/verify') && search.includes('back=/app/task')) ? '/app/orders'
    : ['/app/verify', '/app/wallet', '/app/credit'].some((p) => pathname.startsWith(p)) ? '/app/me' : null
  const reduce = useReducedMotion()
  const dir = useDirection(pathname)
  const desk = useDesk()
  useLayoutEffect(() => { window.scrollTo(0, 0) }, [pathname])
  if (desk) return <DeskShell sub={sub} openTask={openTask} />
  return (
    <div className="min-h-[100dvh] bg-bg">
      <header className="sticky top-0 z-30 border-b border-line bg-bg/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-xl items-center justify-between gap-3 px-4 xl:max-w-[66rem]">
          <Link to="/" className="flex shrink-0 items-center gap-2 text-lg font-bold tracking-tight">
            <img src={`${import.meta.env.BASE_URL}brand/logo-v2.png`} width={36} height={36} alt="顺路侠标志：背着书包、夹着包裹奔跑的小人" className="size-9" />
            <span className="max-[359px]:hidden">顺路侠</span>
          </Link>
          <div className="flex items-center gap-2"><RoleSwitch /><ViewToggle inner /></div>
        </div>
        <TourBar />
      </header>
      <main className={`mx-auto max-w-xl overflow-x-clip px-4 pt-4 xl:-translate-x-20 pb-44`}>
        {/* 换页：CSS 动画（后台标签页里也会走完，不会停在半透明的中间帧） */}
        <div key={pathname} className={reduce || dir === 0 ? '' : 'page-in'} style={{ '--dx': `${12 * dir}px` }}>
        <Routes>
          <Route index element={<Hall />} />
          <Route path="publish" element={<Publish />} />
          <Route path="task/:id" element={<TaskDetail />} />
          <Route path="orders" element={<Orders />} />
          <Route path="me" element={<Me />} />
          <Route path="verify" element={<Verify />} />
          <Route path="credit" element={<CreditRules />} />
          <Route path="wallet" element={<Wallet />} />
          <Route path="*" element={<Hall />} />
        </Routes>
        </div>
      </main>
      <nav className={`fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur xl:inset-x-auto xl:bottom-auto xl:left-[calc(50%-33rem)] ${state.tour.active ? 'xl:top-[132px]' : 'xl:top-20'} xl:w-36 xl:border-0 xl:bg-transparent xl:backdrop-blur-none`} aria-label="主导航">
        <div className="mx-auto grid max-w-xl grid-cols-4 pb-[env(safe-area-inset-bottom)] xl:grid-cols-1 xl:gap-1 xl:pb-0">
          {tabs.map(([to, label, img, end]) => (
            <NavLink key={to} to={to} end={end} className={({ isActive: a0 }) => { const isActive = sub ? to === sub : a0; return `relative flex h-16 flex-col items-center justify-center gap-0.5 text-[13px] font-semibold transition-colors xl:h-12 xl:flex-row xl:justify-start xl:gap-2.5 xl:rounded-xl xl:px-3 xl:text-[15px] ${isActive ? 'text-accent xl:bg-accent-soft' : 'text-muted xl:hover:bg-sunken'}` }}>
              {({ isActive: a0 }) => { const isActive = sub ? to === sub : a0; return (<><span aria-hidden="true" className={`absolute top-0 h-[3px] w-10 rounded-b-full bg-accent transition-[opacity,transform] duration-200 xl:hidden ${isActive ? 'opacity-100' : 'scale-x-0 opacity-0'}`} /><img src={`${import.meta.env.BASE_URL}icons/${img}-v1.webp`} width={28} height={28} alt="" aria-hidden="true" className={`size-7 object-contain transition ${isActive ? 'scale-110' : 'opacity-55 grayscale'}`} />{label}</>) }}
            </NavLink>
          ))}
        </div>
      </nav>
      <Toasts />
      <Onboarding />
    </div>
  )
}
