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
    if (!accounts.runner.verified) return { n: 2, who: 'runner', text: '切到跑腿人阿远：先做校园认证', to: `/app/verify?back=/app/task/${t.id}`, cta: '去认证' }
    return { n: 3, who: 'runner', text: '切到跑腿人：接下这一单', to: `/app/task/${t.id}`, cta: '去接单' }
  }
  if (t.status === 'ongoing' && !t.picked) return { n: 4, who: 'runner', text: '跑腿人：取到后点「我已取到」', to: `/app/task/${t.id}`, cta: '去取件' }
  if (t.status === 'ongoing') return { n: 5, who: 'runner', text: '跑腿人：送到后提交送达凭证', to: `/app/task/${t.id}`, cta: '去送达' }
  if (t.status === 'delivered') return { n: 6, who: 'poster', text: '切回发单人：确认放款', to: `/app/task/${t.id}`, cta: '去确认' }
  if (t.status === 'completed' && !t.ratingByPoster) return { n: 7, who: 'poster', text: '发单人：给跑腿人打分', to: `/app/task/${t.id}`, cta: '去评价' }
  if (t.status === 'completed' && !t.ratingByRunner) return { n: 8, who: 'runner', text: '切换身份去互评：也给对方打分', to: `/app/task/${t.id}`, cta: '去互评' }
  if (t.status === 'completed') return { n: 9, who: 'runner', text: '看信用和收入', to: '/app/me', cta: '去看看', final: true }
  return { n: 9, who: null, text: '这单走了申诉或取消分支，演示结束', to: '/app/orders', cta: '看订单', final: true }
}

// 导览要找的按钮在哪一块：电脑版右边开着一单时在详情栏，否则在主内容区
const root = () => document.querySelector('[data-tour-root]') || document.querySelector('main') || document.body

// 自动滚动一律瞬移：平滑滚动那一两秒里按钮还在动，伸手去点容易点到旁边的「申诉」
export default function TourBar({ wide = false }) {
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
  const text0 = step && step.who === state.role ? step.text.replace(/^((切(到|回))?(跑腿人|发单人)(阿远)?|切换身份去互评)[，：]?/, '') : step?.text
  const arrived = step?.final && loc.pathname === step.to
  // 已经到了「我的」，就不再叫人「去我的看看」
  const text = arrived ? '导览完成' : text0
  // 每到一步：给该点的那个东西加一圈会呼吸的描边；它被顶栏或底部导航挡住时才滚动，只滚到刚好露出来
  useEffect(() => {
    if (!here) return
    let el = null
    let wait = 0
    // 停过「奖励时刻」之后那一下滚动用瞬移：滚动过程只有一帧，不会正好吞掉用户的点击
    let late = false
    // 量三次：图片（比如送达照片）加载完会把按钮往下推，0.6 秒、1.3 秒后各补一次
    const reveal = () => {
      if (!el || !(loc.pathname.startsWith('/app/task/') || loc.pathname.startsWith('/app/publish'))) return
      const head = document.querySelector('header')?.getBoundingClientRect().bottom ?? 64
      const navTop = document.querySelector('nav[aria-label="主导航"]')?.getBoundingClientRect().top ?? innerHeight
      const r0 = el.getBoundingClientRect()
      // 按钮下面紧跟的一行小字（「2 小时内确认，信用 +1」）也一起露出来
      const nx = el.nextElementSibling?.tagName === 'P' ? el.nextElementSibling.getBoundingClientRect() : null
      const r = nx && nx.top - r0.bottom < 24 ? { top: r0.top, bottom: nx.bottom, height: nx.bottom - r0.top } : r0
      const top = head + 16, bottom = (navTop > innerHeight / 2 ? navTop : innerHeight) - 96
      // 贴底常驻的按钮（发布页）本来就看得见，不滚，让人从表单顶上看起
      if (touched) return
      const hard = (navTop > innerHeight / 2 ? navTop : innerHeight) - 4
      // 按钮已经完整看得见（哪怕离底部导航只差几像素）就不动：用户可能正伸手去点
      if ((r.top >= head && r.bottom <= hard) || (el.closest('.sticky') && r.bottom <= innerHeight)) return
      // 露了一部分：只挪刚好够的那一点，不大幅跳
      if (r.bottom > head && r.top < hard) { window.scrollBy({ top: r.bottom > bottom ? r.bottom - bottom : r.top - top, behavior: 'auto' }); return }
      // 刚停过「奖励时刻」、按钮在下面：只往下挪到刚好露出按钮，取件码那张卡尽量留在眼前，不整段跳过
      if (late && r.top >= hard) { window.scrollBy({ top: r.bottom - bottom, behavior: 'auto' }); return }
      // 完全在屏幕外：把按钮所在的整块（卡片、段落）顶到导览条下面，块的标题不被切
      let dy = null
      for (let a = el.parentElement; a && a.tagName !== 'MAIN'; a = a.parentElement) {
        const ar = a.getBoundingClientRect()
        if (r.bottom - ar.top <= bottom - top) dy = ar.top - top
        else break
      }
      // 块太高放不下：把按钮放到可见区中间，它下面的小字（申诉、放弃、说明）也一起露出来
      if (dy == null) dy = r.height < bottom - top ? r.top + r.height / 2 - (top + bottom) / 2 : r.top - top
      window.scrollBy({ top: dy, behavior: 'auto' })
    }
    // 刚发生的「奖励时刻」（取件码揭晓、托管放款）：先把那张卡停在视线里 1.6 秒，再去找下一个按钮
    const timers = []
    // 用户自己动了（点、滑、按键）就不再自动滚：免得他伸手去点按钮时页面被滚走、点空
    let touched = false
    const hands = () => { touched = true }
    const evs = ['pointerdown', 'wheel', 'touchstart', 'keydown']
    evs.forEach((e) => window.addEventListener(e, hands, { passive: true, capture: true }))
    const id = setTimeout(() => {
      // 只在刚发布（下一步认证）、刚接单（下一步取件）和刚放款（下一步打分）这三步停
      // 接单那一下先把取件码卡停在视线里（接单后才看得到，是这一单的高光）；取件后先露地图，看得到阿远走到哪了
      const moment = step?.n === 5 ? root().querySelector('[data-tour-map]') : [2, 4, 7].includes(step?.n) ? root().querySelector('[data-tour-moment]') : null
      if (moment) {
        const head = document.querySelector('header')?.getBoundingClientRect().bottom ?? 64
        const mr = moment.getBoundingClientRect()
        // 订单标题和这张卡能一起放下，就从标题开始露，免得标题正好藏在顶栏下面、看不出是哪一单
        const tr = root().querySelector('h1')?.getBoundingClientRect()
        const from = tr && tr.top < mr.top && mr.bottom - tr.top <= innerHeight - head - 96 ? tr.top : mr.top
        if (!touched && (mr.top < head + 16 || mr.bottom > innerHeight - 80)) window.scrollBy({ top: from - head - 16, behavior: 'auto' })
        // 放款那条「¥5 从小满流到阿远」要播约 2.3 秒，取件码揭晓短一些
        wait = step.n === 7 ? 2600 : step.n === 5 ? 1200 : 1600
        late = true
      }
      timers.push(setTimeout(() => {
        el = root().querySelector('[data-tour-target]') || [...root().querySelectorAll('button')].find((x) => x.className.includes('bg-accent') && !x.disabled && x.offsetParent)
        if (!el) return
        el.classList.add('tour-focus')
        reveal()
        timers.push(setTimeout(reveal, 600), setTimeout(reveal, 1300))
      }, moment ? wait : 0))
    }, 350)
    return () => { clearTimeout(id); timers.forEach(clearTimeout); evs.forEach((e) => window.removeEventListener(e, hands, { capture: true })); el?.classList.remove('tour-focus') }
  }, [here, step?.n, loc.pathname, reduce, state.role])
  // 走完后导览条要收起：等用户自己滑动页面时再收，不在他伸手点东西的时候突然抽走一行、让页面往上跳
  useEffect(() => {
    if (!arrived) return
    const end = () => act('tour', { tour: { active: false, done: true } })
    const evs = ['wheel', 'touchmove', 'keydown']
    evs.forEach((e) => window.addEventListener(e, end, { passive: true, once: true }))
    return () => evs.forEach((e) => window.removeEventListener(e, end))
  }, [arrived, act])
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
          <div data-tour-bar className={`mx-auto flex min-h-12 items-center gap-3 py-1.5 ${wide ? 'max-w-[1440px] px-6' : 'max-w-xl px-4 xl:max-w-[66rem]'}`}>
            <span className="inline-flex shrink-0 items-center gap-1 text-xs font-bold opacity-60">{step.final ? <><Confetti size={18} weight="fill" className="text-accent" />走完了</> : <><span className="tnum rounded-full bg-bg/15 px-1.5 py-0.5">{step.n}/8</span>下一步：</>}</span>
            {/* 文字和订单状态同一帧换，不等旧文字淡出 */}
            <motion.p key={text} initial={reduce ? false : { opacity: 0.4 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}
              className="min-w-0 flex-1 text-[14px] font-semibold leading-snug md:text-[15px]">{text}</motion.p>
            {!here && !arrived && !loc.pathname.startsWith('/app/verify') && <button onClick={go} className="inline-flex h-9 shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-accent px-3.5 text-[14px] font-semibold text-on-accent active:scale-[0.98]">
              {step.cta}<ArrowRight size={14} weight="bold" />
            </button>}
            <button onClick={() => act('tour', { tour: { active: false } })} aria-label="退出演示" className="grid size-8 shrink-0 place-items-center rounded-full opacity-70 hover:opacity-100"><X size={16} weight="bold" /></button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
