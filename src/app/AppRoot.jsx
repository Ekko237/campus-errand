import { useEffect, useRef } from 'react'
import { Routes, Route, NavLink, Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import { ListMagnifyingGlass, PlusCircle, Receipt, UserCircle, CheckCircle, WarningCircle, Path, Megaphone, PersonSimpleRun, SealCheck } from '@phosphor-icons/react'
import { StoreProvider, useStore } from '../store'
import { Sheet, Btn, spring } from '../ui'
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

export default function AppRoot() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  )
}

function RoleSwitch() {
  const { state, act } = useStore()
  const opts = [['poster', '我是发单人'], ['runner', '我是跑腿人']]
  return (
    <div className="relative grid grid-cols-2 rounded-full bg-sunken p-1" role="tablist" aria-label="切换角色">
      {opts.map(([k, label]) => (
        <button key={k} role="tab" aria-selected={state.role === k} onClick={() => act('role', { role: k })}
          className={`relative z-10 h-10 whitespace-nowrap rounded-full px-3 text-[15px] font-semibold transition-colors ${state.role === k ? 'text-on-accent' : 'text-muted'}`}>
          {state.role === k && <motion.span layoutId="role-pill" transition={spring} className="absolute inset-0 -z-10 rounded-full bg-accent" />}
          {label}
        </button>
      ))}
    </div>
  )
}

function Toast({ t }) {
  const { act } = useStore()
  const reduce = useReducedMotion()
  useEffect(() => {
    const id = setTimeout(() => act('dismissToast', { tid: t.id }), 2600)
    return () => clearTimeout(id)
  }, [t.id, act])
  return (
    <motion.div layout initial={reduce ? false : { y: -16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.15 } }} transition={spring}
      className={`pointer-events-auto flex w-full max-w-md items-start gap-2 rounded-2xl px-4 py-3 text-[15px] font-medium shadow-lg shadow-ink/10 ring-1 ${t.tone === 'bad' ? 'bg-danger-soft text-danger ring-danger/30' : 'bg-surface text-ink ring-line'}`}
      onClick={() => act('dismissToast', { tid: t.id })}>
      {t.tone === 'bad' ? <WarningCircle size={20} weight="fill" className="mt-0.5 shrink-0" /> : <CheckCircle size={20} weight="fill" className="mt-0.5 shrink-0 text-accent" />}
      <span>{t.text}</span>
    </motion.div>
  )
}

// 每条提示独立计时；同时最多露出最新的 2 条，旧的直接收起，不挡页面
function Toasts() {
  const { state } = useStore()
  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-50 flex flex-col items-center gap-2 px-4" aria-live="polite">
      <AnimatePresence initial={false}>
        {state.toasts.slice(-2).map((t) => <Toast key={t.id} t={t} />)}
      </AnimatePresence>
    </div>
  )
}

function Onboarding() {
  const { state, act } = useStore()
  const nav = useNavigate()
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
    <Sheet open={!state.onboarded} onClose={() => act('onboarded')} title="30 秒看懂顺路侠">
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
        <Btn size="lg" onClick={start}><Path size={20} weight="bold" />一键体验完整流程</Btn>
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

function Shell() {
  const { pathname } = useLocation()
  const reduce = useReducedMotion()
  const dir = useDirection(pathname)
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return (
    <div className="min-h-[100dvh] bg-bg">
      <header className="sticky top-0 z-30 border-b border-line bg-bg/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-xl items-center justify-between gap-3 px-4">
          <Link to="/" className="flex shrink-0 items-center gap-2 text-lg font-bold tracking-tight">
            <img src={`${import.meta.env.BASE_URL}brand/logo-v2.png`} width={36} height={36} alt="顺路侠标志：背着书包、夹着包裹奔跑的小人" className="size-9" />
            <span className="max-[359px]:hidden">顺路侠</span>
          </Link>
          <RoleSwitch />
        </div>
      </header>
      <main className="mx-auto max-w-xl overflow-x-clip px-4 pb-44 pt-4">
        <motion.div key={pathname} initial={reduce || dir === 0 ? false : { opacity: 0.35, x: 28 * dir }} animate={{ opacity: 1, x: 0 }}
          transition={{ type: 'spring', stiffness: 520, damping: 42, mass: 0.7 }}>
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
        </motion.div>
      </main>
      <DemoPanel />
      <TourBar />
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur" aria-label="主导航">
        <div className="mx-auto grid max-w-xl grid-cols-4 pb-[env(safe-area-inset-bottom)]">
          {tabs.map(([to, label, img, end]) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `relative flex h-16 flex-col items-center justify-center gap-0.5 text-[13px] font-semibold ${isActive ? 'text-accent' : 'text-muted'}`}>
              {({ isActive }) => (<>{isActive && <motion.span layoutId="nav-dot" transition={{ type: 'spring', stiffness: 500, damping: 34 }} className="absolute top-0 h-[3px] w-10 rounded-b-full bg-accent" />}<img src={`${import.meta.env.BASE_URL}icons/${img}-v1.webp`} width={28} height={28} alt="" aria-hidden="true" className={`size-7 object-contain transition ${isActive ? 'scale-110' : 'opacity-55 grayscale'}`} />{label}</>)}
            </NavLink>
          ))}
        </div>
      </nav>
      <Toasts />
      <Onboarding />
    </div>
  )
}
