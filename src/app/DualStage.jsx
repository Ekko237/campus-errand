import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'motion/react'
import { ArrowLeft, ArrowCounterClockwise, Check } from '@phosphor-icons/react'
import { useStore } from '../store'
import { tourStep } from './TourBar'

// 电脑宽屏的演示台：左边一台发单人小满的手机，右边一台跑腿人阿远的手机。两台里都是真实可点的原型，共用同一份数据：
// 左边发布，右边大厅马上出现；右边接单，左边状态马上变。中间是七步进度，面试官不用来回切身份就能看清双方怎么配合。
const BASE = import.meta.env.BASE_URL
const W = 390, H = 844
// 七步：对应导览的步骤号、谁来做
const STEPS = [
  [[1], '发布一单，¥5 冻结', 'poster'],
  [[2, 3], '认证并接单', 'runner'],
  [[4], '取件码揭晓，去驿站取', 'runner'],
  [[5], '送到，提交送达码', 'runner'],
  [[6], '确认收货，放款', 'poster'],
  [[7, 8], '双方互评，信用变化', 'both'],
  [[9], '走完一单', 'both'],
]

function Phone({ who, frameRef, scale, hot }) {
  const reduce = useReducedMotion()
  return (
    <figure className="flex flex-col items-center gap-3">
      <figcaption className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[15px] font-semibold transition-colors ${hot ? 'bg-accent text-on-accent' : 'bg-sunken text-ink'}`}>
        <img src={`${BASE}icons/avatar-${who}-v1.webp`} width={24} height={24} alt="" className="size-6 rounded-full bg-surface" />
        {who === 'poster' ? '发单人 · 小满（梅园 5 号楼）' : '跑腿人 · 阿远（一教下课回梅园）'}
      </figcaption>
      <motion.div animate={{ scale: hot && !reduce ? 1.01 : 1 }} transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        className={`overflow-hidden rounded-[52px] bg-ink p-3 shadow-[0_40px_80px_-40px_rgba(17,40,30,0.6)] ring-4 transition-[box-shadow] ${hot ? 'ring-accent' : 'ring-transparent'}`}
        style={{ width: W * scale + 24, height: H * scale + 24 }}>
        <div className="relative overflow-hidden rounded-[40px] bg-bg" style={{ width: W * scale, height: H * scale }}>
          <iframe ref={frameRef} title={who === 'poster' ? '发单人的手机' : '跑腿人的手机'} src={`${BASE}?as=${who}#/app`}
            className="absolute left-0 top-0 origin-top-left border-0" style={{ width: W, height: H, transform: `scale(${scale})` }} />
        </div>
      </motion.div>
    </figure>
  )
}

export default function DualStage() {
  const { state, act } = useStore()
  const left = useRef(null), right = useRef(null)
  const [scale, setScale] = useState(1)
  useEffect(() => {
    const f = () => setScale(Math.max(0.6, Math.min(1, (window.innerHeight - 150) / (H + 24))))
    f(); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f)
  }, [])
  const step = tourStep(state)
  const n = step?.n ?? 0
  const cur = STEPS.findIndex((x) => x[0].includes(n))
  const who = step && !step.final ? step.who : null
  const go = (frame, hash) => { try { frame.current.contentWindow.location.hash = hash } catch { /* 拿不到就让用户自己点 */ } }
  const start = () => {
    act('tour', { tour: { active: true, taskId: null, done: false } })
    go(left, '#/app/publish?tour=1'); go(right, '#/app')
  }
  const reset = () => {
    if (!window.confirm('把两台手机的演示数据都恢复成刚打开时的样子？')) return
    act('reset'); go(left, '#/app'); go(right, '#/app')
  }
  return (
    <div className="min-h-[100dvh] bg-bg text-ink">
      <header className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-4 px-8">
        <Link to="/" className="inline-flex items-center gap-2 text-[15px] font-semibold text-muted hover:text-ink"><ArrowLeft size={16} weight="bold" />回首页</Link>
        <p className="text-[15px] text-muted">两台手机是同一个原型的两种身份，数据实时同步：在左边发单，右边马上看得到。</p>
        <span className="w-20" />
      </header>
      <main className="mx-auto grid max-w-[1400px] grid-cols-[1fr_300px_1fr] items-start gap-8 px-8 pb-8">
        <div className="justify-self-end"><Phone who="poster" frameRef={left} scale={scale} hot={who === 'poster'} /></div>
        <section aria-label="演示进度" className="sticky top-6 mt-12 rounded-[28px] bg-surface p-5 ring-1 ring-line">
          <p className="text-sm font-semibold text-accent">一单的七步</p>
          <p className="mt-1 font-display text-[26px] leading-tight">{state.tour.active ? (step?.final ? '走完了' : '现在轮到') : '两个人怎么配合'}</p>
          {state.tour.active && step && !step.final && (
            <p className="mt-2 text-[15px] leading-relaxed"><b>{step.who === 'poster' ? '← 左边小满' : '右边阿远 →'}</b>：{step.text.replace(/^((切(到|回))?(跑腿人|发单人)(阿远)?|切换身份去互评)[，：]?/, '')}</p>
          )}
          <ol className="mt-4 grid gap-1.5">
            {STEPS.map(([, t, w], k) => {
              const done = state.tour.active && (cur > k || (step?.final && k <= 6)), now = state.tour.active && cur === k
              return (
                <li key={t} className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[15px] transition-colors ${now ? 'bg-accent-soft font-semibold text-accent' : done ? 'text-ink' : 'text-muted'}`}>
                  <span className={`grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold ${done ? 'bg-accent text-on-accent' : now ? 'bg-surface ring-2 ring-accent' : 'bg-sunken'}`}>{done ? <Check size={12} weight="bold" /> : k + 1}</span>
                  <span className="min-w-0 flex-1">{t}</span>
                  <span className="shrink-0 text-xs">{w === 'poster' ? '左' : w === 'runner' ? '右' : '两边'}</span>
                </li>
              )
            })}
          </ol>
          <div className="mt-5 grid gap-2">
            {(!state.tour.active || step?.final) && <button onClick={start} className="h-11 rounded-full bg-accent text-[15px] font-semibold text-on-accent active:scale-[0.98]">{step?.final ? '再走一遍' : '跟着走一遍（约 2 分钟）'}</button>}
            <button onClick={reset} className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-sunken text-[15px] font-semibold active:scale-[0.98]"><ArrowCounterClockwise size={16} weight="bold" />两台都恢复初始</button>
          </div>
        </section>
        <div className="justify-self-start"><Phone who="runner" frameRef={right} scale={scale} hot={who === 'runner'} /></div>
      </main>
    </div>
  )
}
