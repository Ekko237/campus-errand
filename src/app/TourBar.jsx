import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import { X, ArrowRight } from '@phosphor-icons/react'
import { useStore } from '../store'
import { spring, gi } from '../ui'
const Confetti = gi('confetti')

const TOTAL = 8

// 根据演示任务的真实状态推出「下一步该谁做什么」
export function tourStep(state) {
  const { tour, accounts } = state
  if (!tour.active) return null
  const t = state.tasks.find((x) => x.id === tour.taskId)
  if (!t) return { n: 1, who: 'poster', text: '用发单人身份发布一个任务', to: '/app/publish?tour=1', cta: '去发布' }
  if (t.status === 'open') {
    if (!accounts.runner.verified) return { n: 2, who: 'runner', text: '切到跑腿人：先做校园认证，才能接单', to: `/app/verify?back=/app/task/${t.id}`, cta: '去认证' }
    return { n: 3, who: 'runner', text: '切到跑腿人，接下刚发布的这一单', to: `/app/task/${t.id}`, cta: '去接单' }
  }
  if (t.status === 'ongoing' && !t.picked) return { n: 4, who: 'runner', text: `跑腿人：取件码 ${t.private?.code || '已解锁'}，取到后点「我已取到」`, to: `/app/task/${t.id}`, cta: '去取件' }
  if (t.status === 'ongoing') return { n: 5, who: 'runner', text: '跑腿人：送到后核对发单人的送达码（演示里已代填），或拍照留证', to: `/app/task/${t.id}`, cta: '去送达' }
  if (t.status === 'delivered') return { n: 6, who: 'poster', text: '切回发单人：确认送达，托管赏金放款', to: `/app/task/${t.id}`, cta: '去确认' }
  if (t.status === 'completed' && !t.ratingByPoster) return { n: 7, who: 'poster', text: '发单人：给跑腿人打分，信用分会跟着变', to: `/app/task/${t.id}`, cta: '去评价' }
  if (t.status === 'completed' && !t.ratingByRunner) return { n: 8, who: 'runner', text: '切到跑腿人：也给发单人打分，完成双向互评', to: `/app/task/${t.id}`, cta: '去互评' }
  if (t.status === 'completed') return { n: 9, who: 'runner', text: '闭环走完了。去跑腿人「我的」看信用和收入', to: '/app/me', cta: '去看看', final: true }
  return { n: 9, who: null, text: '这单走了申诉或取消分支，演示结束', to: '/app/orders', cta: '看订单', final: true }
}

export default function TourBar() {
  const { state, act } = useStore()
  const nav = useNavigate()
  const reduce = useReducedMotion()
  const loc = useLocation()
  const step = tourStep(state)
  // 订单页自己有「切到跑腿人 / 切回发单人去确认」这类按钮，导览条就不再放第二颗
  const samePage = step && loc.pathname === step.to.split('?')[0]
  const onTask = step && loc.pathname === `/app/task/${state.tour.taskId}`
  // 第 2 步在订单页上：页面自己有「切到跑腿人」和「认证后才能接单」，一路点下去就到认证页
  const here = step && !step.final && ((samePage && (!step.who || step.who === state.role || (onTask && [3, 6, 8].includes(step.n)))) || (onTask && step.n === 2))
  // 已经是这个身份了，就不再说「切到跑腿人」
  const text = step && step.who === state.role ? step.text.replace(/^(切(到|回))?(跑腿人|发单人)[，：]?/, '') : step?.text
  const arrived = step?.final && loc.pathname === step.to
  // 每到一步：只有该点的东西被吸顶栏或导览条挡住时才滚动，而且只滚到刚好露出来，不让页面乱跳
  useEffect(() => {
    if (!here || !loc.pathname.startsWith('/app/task/')) return
    const id = setTimeout(() => {
      const el = document.querySelector('main [data-tour-target]') || [...document.querySelectorAll('main button')].find((x) => x.className.includes('bg-accent') && !x.disabled && x.offsetParent)
      if (!el) return
      const head = document.querySelector('header')?.getBoundingClientRect().bottom ?? 64
      const bar = document.querySelector('[data-tour-bar]')?.getBoundingClientRect().top ?? innerHeight
      const r = el.getBoundingClientRect()
      const top = head + 12, bottom = bar - 16
      if (r.top >= top && r.bottom <= bottom) return
      const dy = r.bottom > bottom && r.height < bottom - top ? r.bottom - bottom : r.top - top
      window.scrollBy({ top: dy, behavior: reduce ? 'auto' : 'smooth' })
    }, 350)
    return () => clearTimeout(id)
  }, [here, step?.n, loc.pathname, reduce])
  useEffect(() => { if (!arrived) return; const id = setTimeout(() => act('tour', { tour: { active: false, done: true } }), 3000); return () => clearTimeout(id) }, [arrived, act])
  const go = () => {
    if (step.who) act('role', { role: step.who })
    if (step.final) act('tour', { tour: { active: false, done: true } })
    nav(step.to)
  }
  return (
    <AnimatePresence>
      {step && (
        <motion.div key="bar" initial={reduce ? false : { y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} transition={spring}
          className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20 px-3 pb-2 xl:bottom-4">
          <div data-tour-bar className="mx-auto flex max-w-xl items-center gap-3 rounded-2xl bg-ink xl:-translate-x-20 p-3 pl-4 text-bg shadow-xl shadow-ink/20">
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold opacity-70">
                {step.final ? <span className="inline-flex items-center gap-1"><Confetti size={14} weight="fill" />完整流程</span> : `完整流程 ${Math.min(step.n, TOTAL)}/${TOTAL}`}
              </p>
              <p className="text-[15px] font-semibold leading-snug">{text}</p>
            </div>
            {!here && <button onClick={go} className="inline-flex h-11 shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-accent px-4 text-[15px] font-semibold text-on-accent active:scale-[0.98]">
              {step.cta}<ArrowRight size={16} weight="bold" />
            </button>}
            <button onClick={() => act('tour', { tour: { active: false } })} aria-label="退出演示" className="grid size-9 shrink-0 place-items-center rounded-full opacity-70 hover:opacity-100"><X size={18} weight="bold" /></button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
