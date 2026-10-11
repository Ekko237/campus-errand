import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation } from 'react-router-dom'
import { useReducedMotion } from 'motion/react'
import { useStore } from '../store'
import { tourStep } from './TourBar'

// 「指哪点哪」：导览每一步都在屏幕上圈出要点的那个东西，旁边一个小气泡写清楚点它干什么，其余地方轻轻压暗。
// 压暗那一层不挡点击；点到别处不报错，气泡晃一下，提醒该点哪。
// 找目标的顺序：身份不对 → 顶上的身份切换；不在这一步的页面 → 底部 / 左边导航里对应的标签，或导览条上的「带我去」；
// 在页面上 → 弹窗里的主按钮、送达码输入框、评价星星，最后是导览条已经圈好的那个按钮。

const ROLE = { poster: '发单人', runner: '跑腿人' }
// 切身份那一下要说清楚切过去干什么
const WHY = { 2: '去接这一单', 3: '去接这一单', 4: '去取件', 5: '去送达', 6: '确认收货、放款', 7: '给跑腿人打分', 8: '给发单人打分' }
const vis = (el) => { if (!el) return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden' }
const label = (el) => (el.innerText || el.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ')

function resolve(state, path) {
  const step = tourStep(state)
  if (!step) return null
  const to = step.to.split('?')[0]
  if (step.final) {
    if (path === to) return null
    const go = document.querySelector('[data-tour-go]')
    return go && { el: go, text: '点这里：看看信用和收入' }
  }
  // 1 身份不对：圈顶上的身份切换
  if (step.who && step.who !== state.role) {
    const tab = [...document.querySelectorAll('[role=tablist][aria-label="切换角色"] [role=tab]')].find((b) => b.innerText.includes(ROLE[step.who]))
    return tab && { el: tab, text: `切到${ROLE[step.who]}，${WHY[step.n] || '继续'}` }
  }
  // 2 弹窗开着：送达码、评价、确认发布都在弹窗里
  const dlg = [...document.querySelectorAll('[role=dialog]')].filter(vis).pop()
  if (dlg) {
    const code = dlg.querySelector('input[aria-label="4 位送达码"]')
    const t = state.tasks.find((x) => x.id === state.tour.taskId)
    if (code && t && code.value !== t.deliverCode) return { el: code.parentElement, text: `输入发单人告诉你的送达码：${t.deliverCode}`, input: true }
    const btn = [...dlg.querySelectorAll('button')].filter((b) => b.classList.contains('bg-accent') && !b.disabled && vis(b)).pop()
    return btn && { el: btn, text: `点这里：${label(btn)}` }
  }
  // 3 认证页：认证完了点「现在回去接单」，没认证点「提交认证」（学号替你填好了）
  if (path.startsWith('/app/verify')) {
    const btn = [...document.querySelectorAll('main button, [data-tour-root] button')].find((b) => b.classList.contains('bg-accent') && !b.disabled && vis(b))
    return btn && { el: btn, text: label(btn).includes('提交') ? '学号和学院已替你填好，点这里：提交认证' : `点这里：${label(btn)}` }
  }
  // 4 不在这一步的页面：导航里有这一页就圈导航，没有就圈导览条上的「带我去」
  if (path !== to && !(step.n === 2 && path.startsWith('/app/task/'))) {
    const tab = [...document.querySelectorAll('nav[aria-label="主导航"] a')].find((a) => a.getAttribute('href') === `#${to}` && vis(a))
    if (tab) return { el: tab, text: `点这里：${label(tab)}`, nav: true }
    const go = document.querySelector('[data-tour-go]')
    return go && { el: go, text: `点这里：${step.cta}` }
  }
  // 5 在页面上：评价先点星，再提交
  const focus = document.querySelector('.tour-focus')
  if (!focus) return null
  if (focus.matches('[data-tour-target]')) {
    const submit = [...focus.querySelectorAll('button')].pop()
    if (submit?.disabled) { const five = focus.querySelector('[role=radio][aria-label="5 星"]'); return five && { el: five, text: '点第 5 颗星，给个好评', input: true } }
    return submit && { el: submit, text: '点这里：提交评价' }
  }
  const t = label(focus)
  return { el: focus, text: step.n === 1 ? '内容已替你填好，点这里：发布这一单' : `点这里：${t}` }
}

export default function Coach() {
  const { state } = useStore()
  const { pathname } = useLocation()
  const reduce = useReducedMotion()
  const ring = useRef(null)
  const tip = useRef(null)
  const arrow = useRef(null)
  const [text, setText] = useState('')
  const cur = useRef(null)
  const scrolled = useRef(null)
  const on = state.tour.active
  useEffect(() => {
    if (!on) return
    let raf = 0
    const tick = () => {
      raf = requestAnimationFrame(tick)
      const hit = resolve(state, pathname)
      const R = ring.current, T = tip.current, A = arrow.current
      if (!R || !T || !A) return
      if (!hit || !vis(hit.el)) { R.style.opacity = '0'; T.style.opacity = '0'; cur.current = null; return }
      cur.current = hit.el
      if (hit.text !== T.dataset.text) { T.dataset.text = hit.text; setText(hit.text) }
      // 弹窗里的目标不在屏幕里：滚到中间（只滚一次，之后用户自己滑不跟着抢）
      const r0 = hit.el.getBoundingClientRect()
      if ((r0.top < 0 || r0.bottom > innerHeight) && scrolled.current !== hit.el && hit.el.closest('[role=dialog]')) { scrolled.current = hit.el; hit.el.scrollIntoView({ block: 'center' }) }
      const r = hit.el.getBoundingClientRect()
      const dlg = !!hit.el.closest('[role=dialog]')
      const pad = 6
      const rad = Math.min(parseFloat(getComputedStyle(hit.el).borderTopLeftRadius) || 12, r.height / 2) + pad
      // 圈贴着屏幕边（底部导航、顶栏）时收进屏幕里，不被切掉
      const L = Math.max(3, r.left - pad), Tp = Math.max(3, r.top - pad), Rt = Math.min(innerWidth - 3, r.right + pad), Bt = Math.min(innerHeight - 3, r.bottom + pad)
      Object.assign(R.style, { opacity: '1', left: `${L}px`, top: `${Tp}px`, width: `${Rt - L}px`, height: `${Bt - Tp}px`, borderRadius: `${rad}px`,
        boxShadow: dlg ? '0 0 0 3px var(--accent), 0 0 0 9px color-mix(in srgb, var(--accent) 25%, transparent)' : '0 0 0 3px var(--accent), 0 0 0 9px color-mix(in srgb, var(--accent) 25%, transparent), 0 0 0 200vmax rgba(12, 24, 18, 0.32)' })
      // 气泡：下面放得下就放下面，否则放上面；左右夹在屏幕里；箭头对着目标中间
      const tw = T.offsetWidth, th = T.offsetHeight, gap = 14, m = 8
      const navTop = document.querySelector('nav[aria-label="主导航"]')?.getBoundingClientRect().top ?? innerHeight
      const floor = (navTop > innerHeight / 2 && !hit.nav ? navTop : innerHeight) - m
      const below = r.bottom + pad + gap + th <= floor
      const above = r.top - pad - gap - th >= m
      const down = below || (!above && r.top < innerHeight / 2)
      const top = down ? r.bottom + pad + gap : r.top - pad - gap - th
      const left = Math.max(m, Math.min(innerWidth - tw - m, r.left + r.width / 2 - tw / 2))
      Object.assign(T.style, { opacity: '1', left: `${left}px`, top: `${Math.max(m, Math.min(innerHeight - th - m, top))}px` })
      const ax = Math.max(14, Math.min(tw - 14, r.left + r.width / 2 - left))
      Object.assign(A.style, { left: `${ax - 6}px`, top: down ? '-6px' : '', bottom: down ? '' : '-6px' })
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [on, state, pathname])
  // 点错地方：气泡晃一下
  useEffect(() => {
    if (!on) return
    const f = (e) => {
      const el = cur.current, T = tip.current
      if (!el || !T || el.contains(e.target) || e.target.closest?.('[data-tour-bar], [role=tablist][aria-label="切换角色"]')) return
      if (e.target.closest?.('[role=dialog]') && !el.closest('[role=dialog]')) return
      if (reduce) return
      T.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-7px)' }, { transform: 'translateX(7px)' }, { transform: 'translateX(-4px)' }, { transform: 'translateX(0)' }], { duration: 380, easing: 'ease-out' })
    }
    window.addEventListener('pointerdown', f, true)
    return () => window.removeEventListener('pointerdown', f, true)
  }, [on, reduce])
  if (!on) return null
  return createPortal(
    <>
      <div ref={ring} aria-hidden="true" className={`pointer-events-none fixed z-[70] opacity-0 transition-opacity duration-200 ${reduce ? '' : 'coach-pulse'}`} />
      <div ref={tip} role="status" aria-live="polite" className="pointer-events-none fixed z-[71] max-w-[min(280px,calc(100vw-16px))] rounded-2xl bg-ink px-3.5 py-2.5 text-[15px] font-semibold leading-snug text-bg opacity-0 shadow-lg shadow-ink/25 transition-opacity duration-200">
        <span ref={arrow} aria-hidden="true" className="absolute size-3 rotate-45 bg-ink" />
        <span className="relative">{text}</span>
      </div>
    </>,
    document.body,
  )
}
