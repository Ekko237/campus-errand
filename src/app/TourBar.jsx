import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import { X, ArrowRight } from '@phosphor-icons/react'
import { useStore } from '../store'
import { gi } from '../ui'
const Confetti = gi('confetti')


// 根据演示任务的真实状态推出「下一步该谁做什么」
export function tourStep(state) {
  const { tour, accounts } = state
  if (!tour.active) return null
  const t = state.tasks.find((x) => x.id === tour.taskId)
  if (!t) return { n: 1, who: 'poster', text: '发布一个任务', to: '/app/publish?tour=1', cta: '去发布' }
  if (t.status === 'open') {
    if (!accounts.runner.verified) return { n: 2, who: 'runner', text: '切到跑腿人：先做校园认证', to: `/app/verify?back=/app/task/${t.id}`, cta: '去认证' }
    return { n: 3, who: 'runner', text: '切到跑腿人：接下这一单', to: `/app/task/${t.id}`, cta: '去接单' }
  }
  if (t.status === 'ongoing' && !t.picked) return { n: 4, who: 'runner', text: '跑腿人：取到后点「我已取到」', to: `/app/task/${t.id}`, cta: '去取件' }
  if (t.status === 'ongoing') return { n: 5, who: 'runner', text: '跑腿人：送到后提交送达凭证', to: `/app/task/${t.id}`, cta: '去送达' }
  if (t.status === 'delivered') return { n: 6, who: 'poster', text: '切回发单人：确认放款', to: `/app/task/${t.id}`, cta: '去确认' }
  if (t.status === 'completed' && !t.ratingByPoster) return { n: 7, who: 'poster', text: '发单人：给跑腿人打分', to: `/app/task/${t.id}`, cta: '去评价' }
  if (t.status === 'completed' && !t.ratingByRunner) return { n: 8, who: 'runner', text: '切到跑腿人：也给对方打分', to: `/app/task/${t.id}`, cta: '去互评' }
  if (t.status === 'completed') return { n: 9, who: 'runner', text: '看信用和收入', to: '/app/me', cta: '去看看', final: true }
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
  const text0 = step && step.who === state.role ? step.text.replace(/^(切(到|回))?(跑腿人|发单人)[，：]?/, '') : step?.text
  const arrived = step?.final && loc.pathname === step.to
  // 已经到了「我的」，就不再叫人「去我的看看」
  const text = arrived ? '导览完成' : text0
  // 每到一步：给该点的那个东西加一圈会呼吸的描边；它被顶栏或底部导航挡住时才滚动，只滚到刚好露出来
  useEffect(() => {
    if (!here) return
    let el = null
    // 量两次：图片（比如送达照片）加载完会把按钮往下推，第一次量完 0.6 秒后再补一次
    const reveal = () => {
      if (!el || !loc.pathname.startsWith('/app/task/')) return
      const head = document.querySelector('header')?.getBoundingClientRect().bottom ?? 64
      const navTop = document.querySelector('nav[aria-label="主导航"]')?.getBoundingClientRect().top ?? innerHeight
      const r = el.getBoundingClientRect()
      const top = head + 16, bottom = (navTop > innerHeight / 2 ? navTop : innerHeight) - 24
      if (r.top >= top && r.bottom <= bottom) return
      const dy = r.bottom > bottom && r.height < bottom - top ? r.bottom - bottom : r.top - top
      window.scrollBy({ top: dy, behavior: reduce ? 'auto' : 'smooth' })
    }
    const id = setTimeout(() => {
      el = document.querySelector('main [data-tour-target]') || [...document.querySelectorAll('main button')].find((x) => x.className.includes('bg-accent') && !x.disabled && x.offsetParent)
      if (!el) return
      el.classList.add('tour-focus')
      reveal()
    }, 350)
    const id2 = setTimeout(reveal, 950)
    return () => { clearTimeout(id); clearTimeout(id2); el?.classList.remove('tour-focus') }
  }, [here, step?.n, loc.pathname, reduce, state.role])
  useEffect(() => { if (!arrived) return; const id = setTimeout(() => act('tour', { tour: { active: false, done: true } }), 3000); return () => clearTimeout(id) }, [arrived, act])
  const go = () => {
    if (step.who) act('role', { role: step.who })
    if (step.final) act('tour', { tour: { active: false, done: true } })
    nav(step.to)
  }
  // 导览条是顶栏下面的一行细条，在页面流里，不浮在内容上，也就不会挡住任何按钮
  return (
    <AnimatePresence initial={false}>
      {step && (
        <motion.div key="bar" initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
          className="border-t border-line bg-ink text-bg">
          <div data-tour-bar className="mx-auto flex min-h-12 max-w-xl items-center gap-3 px-4 py-1.5 xl:max-w-[66rem]">
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-bg/15 px-2 py-0.5 text-xs font-bold">{step.final ? <><Confetti size={12} weight="fill" />走完了</> : '下一步'}</span>
            <AnimatePresence mode="wait" initial={false}>
              <motion.p key={text} initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}
                className="min-w-0 flex-1 text-[14px] font-semibold leading-snug md:text-[15px]">{text}</motion.p>
            </AnimatePresence>
            {!here && !loc.pathname.startsWith('/app/verify') && <button onClick={go} className="inline-flex h-9 shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-accent px-3.5 text-[14px] font-semibold text-on-accent active:scale-[0.98]">
              {step.cta}<ArrowRight size={14} weight="bold" />
            </button>}
            <button onClick={() => act('tour', { tour: { active: false } })} aria-label="退出演示" className="grid size-8 shrink-0 place-items-center rounded-full opacity-70 hover:opacity-100"><X size={16} weight="bold" /></button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
