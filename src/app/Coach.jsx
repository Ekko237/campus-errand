import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation } from 'react-router-dom'
import { useReducedMotion } from 'motion/react'
import { ArrowFatUp } from '@phosphor-icons/react'
import { useStore } from '../store'
import { tourStep } from './TourBar'

// 「指哪点哪」：导览每一步都在屏幕上圈出要点的那个东西，旁边一个小气泡写清楚点它干什么，其余地方轻轻压暗。
// 压暗那一层不挡点击；点到别处不报错，气泡晃一下，提醒该点哪。
// 找目标的顺序：身份不对 → 顶上的身份切换；不在这一步的页面 → 底部 / 左边导航里对应的标签，或导览条上的「带我去」；
// 在页面上 → 弹窗里的主按钮、送达码输入框、评价星星，最后是导览条已经圈好的那个按钮。

const ROLE = { poster: '发单人', runner: '跑腿人' }
// 切身份那一下要说清楚切过去干什么
const WHY = { 2: '先做校园认证', 3: '去接这一单', 4: '去取件', 5: '去送达', 6: '确认收货、放款', 7: '给跑腿人打分', 8: '给发单人打分' }
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
  const dlg = [...document.querySelectorAll('[role=dialog]:not([data-closing])')].filter(vis).pop()
  if (dlg) {
    const code = dlg.querySelector('input[aria-label="4 位送达码"]')
    const t = state.tasks.find((x) => x.id === state.tour.taskId)
    if (code && t && code.value !== t.deliverCode) {
      const pre = code.value && t.deliverCode.startsWith(code.value) ? code.value : ''
      return { el: code.parentElement, text: pre ? `前两位已填好，再输入 ${t.deliverCode.slice(pre.length)}` : `输入发单人告诉你的送达码：${t.deliverCode}`, input: true }
    }
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
  let focus = document.querySelector('.tour-focus')
  if (!focus) {
    const root = document.querySelector('[data-tour-root]') || document.querySelector('main') || document.body
    focus = root.querySelector('[data-tour-target]') || [...root.querySelectorAll('button')].find((x) => x.classList.contains('bg-accent') && !x.disabled && x.offsetParent)
    const r = focus?.getBoundingClientRect()
    if (!r || r.top < 0 || r.bottom > innerHeight) return null
  }
  if (focus.matches('[data-tour-target]')) {
    const submit = [...focus.querySelectorAll('button')].pop()
    if (submit?.disabled) { const five = focus.querySelector('[role=radio][aria-label="5 星"]'); return five && { el: five, text: '点第 5 颗星，给个好评', input: true } }
    return submit && { el: submit, text: '点这里：提交评价' }
  }
  const t = label(focus)
  return { el: focus, text: step.n === 1 ? '已替你填好，点这里：发布' : `点这里：${t}` }
}

export default function Coach() {
  const { state } = useStore()
  const { pathname } = useLocation()
  const reduce = useReducedMotion()
  const ring = useRef(null)
  const tip = useRef(null)
  const arrow = useRef(null)
  const point = useRef(null)
  const [text, setText] = useState('')
  const cur = useRef(null)
  const scrolled = useRef(null)
  const sent = useRef(null)
  const side0 = useRef({})
  // 刚点中圈住的东西：先把圈和气泡收起来，等下一个目标出来再显示，不在弹窗收起、页面切换的那一下指回旧按钮
  const held = useRef(null)
  const on = state.tour.active
  useEffect(() => {
    if (!on) return
    let raf = 0
    const tick = () => {
      raf = requestAnimationFrame(tick)
      const hit = resolve(state, pathname)
      const R = ring.current, T = tip.current, A = arrow.current, P = point.current
      if (!R || !T || !A || !P) return
      if (held.current && hit && (hit.el === held.current.el || hit.el.contains(held.current.el)) && Date.now() - held.current.at < 1500) { R.style.opacity = '0'; T.style.opacity = '0'; P.style.opacity = '0'; return }
      if (!hit || !vis(hit.el)) { R.style.opacity = '0'; T.style.opacity = '0'; P.style.opacity = '0'; cur.current = null; return }
      held.current = null
      cur.current = hit.el
      // 在外层框里左右滑着看时（手机上看电脑版）：目标换了就告诉外层，外层把它滑进屏幕
      if (window.parent !== window && sent.current !== hit.el) {
        sent.current = hit.el
        const q = hit.el.getBoundingClientRect()
        try { window.parent.postMessage({ type: 'shunluxia:coach', x0: q.left / innerWidth, x1: q.right / innerWidth }, window.location.origin) } catch { /* 拿不到外层就算了 */ }
      }
      if (hit.text !== T.dataset.text) { T.dataset.text = hit.text; setText(hit.text) }
      // 弹窗里的目标不在屏幕里：滚到中间（只滚一次，之后用户自己滑不跟着抢）
      const r0 = hit.el.getBoundingClientRect()
      if ((r0.top < 0 || r0.bottom > innerHeight) && scrolled.current !== hit.el && hit.el.closest('[role=dialog]')) { scrolled.current = hit.el; hit.el.scrollIntoView({ block: 'center' }) }
      const r = hit.el.getBoundingClientRect()
      const dlg = !!hit.el.closest('[role=dialog]')
      const pad = 6
      const rad = Math.min(parseFloat(getComputedStyle(hit.el).borderTopLeftRadius) || 12, r.height / 2) + pad
      // 圈贴着屏幕边（底部导航、顶栏）时收进屏幕里，不被切掉
      const E = 11, L = Math.max(E, r.left - pad), Tp = Math.max(E, r.top - pad), Rt = Math.min(innerWidth - E, r.right + pad), Bt = Math.min(innerHeight - E, r.bottom + pad)
      Object.assign(R.style, { opacity: '1', left: `${L}px`, top: `${Tp}px`, width: `${Rt - L}px`, height: `${Bt - Tp}px`, borderRadius: `${rad}px`,
        boxShadow: dlg ? '0 0 0 3px var(--accent), 0 0 0 9px color-mix(in srgb, var(--accent) 25%, transparent)' : '0 0 0 3px var(--accent), 0 0 0 9px color-mix(in srgb, var(--accent) 25%, transparent), 0 0 0 200vmax rgba(12, 24, 18, 0.32)' })
      // 气泡：下面放得下就放下面，否则放上面；左右夹在屏幕里；箭头对着目标中间
      const tw = T.offsetWidth, th = T.offsetHeight, gap = 48, m = 8
      const navTop = document.querySelector('nav[aria-label="主导航"]')?.getBoundingClientRect().top ?? innerHeight
      const floor = (navTop > innerHeight / 2 && !hit.nav ? navTop : innerHeight) - m
      const below = r.bottom + pad + gap + th <= floor
      const above = r.top - pad - gap - th >= m
      const side = r.top < 140 && r.left - pad - gap - tw >= m && innerWidth >= 768
      // 上下都放得下：哪边盖住的字少放哪边（气泡和圈都不接收点击，elementFromPoint 看到的就是下面的页面）
      const textAt = (y0) => {
        let n = 0
        const lft = Math.max(m, Math.min(innerWidth - tw - m, r.left + r.width / 2 - tw / 2))
        for (const fx of [0.1, 0.5, 0.9]) for (const fy of [0.2, 0.5, 0.8]) {
          const e = document.elementFromPoint(lft + tw * fx, y0 + th * fy)
          if (e && !e.closest('[data-tour-bar]') && (e.innerText || '').trim() && e.children.length < 3) n++
        }
        return n
      }
      // 同一个目标只判断一次，滚动时气泡不来回翻
      if (side0.current.el !== hit.el || side0.current.text !== hit.text) side0.current = { el: hit.el, text: hit.text, up: below && above && !hit.nav ? textAt(r.top - pad - gap - th) < textAt(r.bottom + pad + gap) : false }
      const prefer = side0.current.up && above
      const down = prefer ? false : below || (!above && r.top < innerHeight / 2)
      const top = side ? r.top + r.height / 2 - th / 2 : down ? r.bottom + pad + gap : r.top - pad - gap - th
      // 手机上点顶栏（身份切换）：气泡放到导览条下面，不盖住导览条上的字
      const barB = document.querySelector('[data-tour-bar]')?.getBoundingClientRect().bottom ?? 0
      const pushed = !side && down && r.top < 100 && barB > r.bottom
      // 箭头也放在导览条下面（导览条和气泡之间），不压导览条上的字
      const top2 = pushed ? Math.max(top, barB + 48) : top
      const left = side ? r.left - pad - gap - tw : Math.max(m, Math.min(innerWidth - tw - m, r.left + r.width / 2 - tw / 2))
      Object.assign(T.style, { opacity: '1', left: `${left}px`, top: `${Math.max(m, Math.min(innerHeight - th - m, top2))}px` })
      const ax = Math.max(14, Math.min(tw - 14, r.left + r.width / 2 - left))
      Object.assign(A.style, side ? { left: '', right: '-6px', top: `${th / 2 - 6}px`, bottom: '' } : { left: `${ax - 6}px`, right: '', top: down ? '-6px' : '', bottom: down ? '' : '-6px' })
      // 大箭头：品牌绿，放在气泡和目标之间，箭尖对着目标中间；气泡在下面就朝上指，在上面就朝下指
      const tTop = Math.max(m, Math.min(innerHeight - th - m, top2))
      const px = side ? (left + tw + r.left - pad) / 2 : Math.max(m + 18, Math.min(innerWidth - m - 18, r.left + r.width / 2))
      const py = side ? r.top + r.height / 2 : pushed ? (barB + tTop) / 2 : down ? (Math.min(r.bottom + pad, innerHeight - 3) + tTop) / 2 : (tTop + th + Math.max(r.top - pad, 3)) / 2
      Object.assign(P.style, { opacity: '1', left: `${px - 18}px`, top: `${py - 18}px` })
      P.dataset.dir = side ? 'right' : down ? 'up' : 'down'
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [on, state, pathname])
  // 点错地方：气泡晃一下
  useEffect(() => {
    if (!on) return
    const f = (e) => {
      const el = cur.current, T = tip.current
      if (el && el.contains(e.target)) { held.current = { el, at: Date.now() }; return }
      if (!el || !T || e.target.closest?.('[data-tour-bar], [role=tablist][aria-label="切换角色"]')) return
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
      <div ref={point} aria-hidden="true" className="pointer-events-none fixed z-[71] size-9 text-accent opacity-0 transition-opacity duration-200 [filter:drop-shadow(0_0_0_#fff)_drop-shadow(0_2px_3px_rgba(0,0,0,0.35))] data-[dir=down]:rotate-180 data-[dir=right]:rotate-90">
        <ArrowFatUp size={36} weight="fill" className={`${reduce ? '' : 'coach-bob'} [stroke:#fff] [stroke-width:14px] [paint-order:stroke]`} />
      </div>
      <div ref={tip} role="status" aria-live="polite" className="pointer-events-none fixed z-[71] max-w-[min(280px,calc(100vw-16px))] rounded-2xl bg-ink px-3.5 py-2.5 text-[15px] font-semibold leading-snug text-bg opacity-0 ring-2 ring-white/80 shadow-lg shadow-ink/25 transition-opacity duration-200">
        <span ref={arrow} aria-hidden="true" className="absolute size-3 rotate-45 bg-ink" />
        <span className={`relative block ${text.length <= 14 ? 'whitespace-nowrap' : '[text-wrap:pretty]'}`}>{text}</span>
      </div>
    </>,
    document.body,
  )
}
