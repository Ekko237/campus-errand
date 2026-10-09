import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'motion/react'
import { Check, Path, ArrowCounterClockwise } from '@phosphor-icons/react'
import { useStore } from '../store'
import { levelOf, posterTierOf } from '../data'
import { Avatar } from '../ui'

const STEPS = ['发布托管', '认证接单', '取件送达', '提交凭证', '确认放款', '发单人评价', '跑腿人回评']
function progress(t) {
  if (!t) return 0
  if (t.status === 'open') return 1
  if (t.status === 'ongoing') return t.picked ? 3 : 2
  if (t.status === 'delivered' || t.status === 'disputed') return 4
  if (t.status === 'completed') return 5 + (t.ratingByPoster ? 1 : 0) + (t.ratingByRunner ? 1 : 0)
  return 1
}

function Num({ v }) {
  const reduce = useReducedMotion()
  return (
    <motion.span key={v} initial={reduce ? false : { y: -6 }} animate={{ y: 0 }} className="tnum inline-block">
      {v}
    </motion.span>
  )
}

// 宽屏（≥1280px）右侧的演示面板：同时看到两个账号的信用和钱包，以及最近一单走到哪一步
export default function DemoPanel() {
  const { state, act } = useStore()
  const nav = useNavigate()
  const { poster, runner } = state.accounts
  // 引导进行中跟踪引导那一单，否则显示发单人最新发布的一单（tasks 按发布时间倒序）
  const t = (state.tour.active && state.tasks.find((x) => x.id === state.tour.taskId)) || state.tasks.find((x) => x.posterId === 'poster')
  const n = progress(t)
  const start = () => {
    act('tour', { tour: { active: true, taskId: null, done: false } })
    act('role', { role: 'poster' })
    nav('/app/publish?tour=1')
  }
  const accounts = [
    ['poster', poster, `余额 ¥${poster.balance}${poster.frozen ? ` · 托管冻结 ¥${poster.frozen}` : ''}`],
    ['runner', runner, `累计收入 ¥${runner.ledger.filter((l) => l.amount > 0).reduce((a, l) => a + l.amount, 0)} · 完成 ${runner.done} 单`],
  ]
  return (
    <aside className="fixed top-24 hidden w-72 space-y-4 xl:block" style={{ left: 'calc(50% + 18rem + 2rem)' }} aria-label="演示面板">
      <p className="text-sm font-semibold text-muted">演示面板 · 示例数据</p>
      {accounts.map(([k, a, sub]) => (
        <button key={k} onClick={() => act('role', { role: k })} aria-pressed={state.role === k}
          className={`flex w-full items-center gap-3 rounded-2xl p-3.5 text-left ring-1 transition ${state.role === k ? 'bg-accent-soft ring-accent' : 'bg-surface ring-line hover:bg-sunken'}`}>
          <Avatar who={k} name={a.name} size={40} />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-[15px] font-semibold">{a.name}<span className="text-sm font-normal text-muted">{a.role}</span></p>
            <p className="truncate text-sm text-muted">{sub}</p>
          </div>
          <div className="text-right">
            {a.verified ? (
              <>
                <p className="text-xl font-bold text-accent"><Num v={a.credit} /></p>
                <p className="text-xs text-muted">{(k === 'poster' ? posterTierOf : levelOf)(a.credit).name}</p>
              </>
            ) : <p className="text-xs text-muted">未认证</p>}
          </div>
        </button>
      ))}
      <div className="rounded-2xl bg-surface p-4 ring-1 ring-line">
        <p className="text-[15px] font-semibold">{t ? `最近一单：${t.title}` : '还没有发过单'}</p>
        <ol className="mt-3 space-y-2">
          {STEPS.map((s, i) => (
            <li key={s} className={`flex items-center gap-2 text-sm ${i < n ? 'text-ink' : 'text-muted'}`}>
              <span className={`grid size-5 place-items-center rounded-full ${i < n ? 'bg-accent text-on-accent' : 'bg-sunken'}`}>{i < n && <Check size={12} weight="bold" />}</span>
              {s}
            </li>
          ))}
        </ol>
        {!runner.verified && <p className="mt-3 text-xs text-muted">跑腿人还没认证，接单前会先走认证</p>}
      </div>
      <div className="grid gap-2">
        <button onClick={start} className="inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-accent text-[15px] font-semibold text-on-accent active:scale-[0.98]"><Path size={18} weight="bold" />一键体验完整流程</button>
        <button onClick={() => { act('reset'); nav('/app') }} className="inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-surface text-[15px] font-semibold ring-1 ring-line active:scale-[0.98]"><ArrowCounterClockwise size={18} weight="bold" />重置演示数据</button>
      </div>
    </aside>
  )
}
