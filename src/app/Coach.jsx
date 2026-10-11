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
// 收起立刻收（不淡出，免得旧圈在旧位置多停一会儿）；出来时再淡入
const hide = (...els) => els.forEach((e) => { e.style.transition = 'none'; e.style.opacity = '0' })
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
    // 只在认证这一栏里找（电脑版右栏还开着订单详情，别圈到那边去）；正在核验时先不指
    const root = document.querySelector('[data-tour-root]') || document.querySelector('main')
    if ([...root.querySelectorAll('button')].some((b) => b.innerText.includes('核验中'))) return null
    const btn = [...root.querySelectorAll('button')].find((b) => b.classList.contains('bg-accent') && !b.disabled && vis(b))
    return btn && { el: btn, text: label(btn).includes('提交') ? '已替你填好，点这里：提交认证' : `点这里：${label(btn)}` }
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
  // 最近一次操作是键盘还是鼠标 / 手指
  const kbd = useRef(false)
  useEffect(() => {
    const k = (e) => { if (e.key === 'Tab' || e.key === 'Enter' || e.key === ' ') kbd.current = true }
    const ptr = () => { kbd.current = false }
    window.addEventListener('keydown', k, true); window.addEventListener('pointerdown', ptr, true)
    return () => { window.removeEventListener('keydown', k, true); window.removeEventListener('pointerdown', ptr, true) }
  }, [])
  // 目标得先停稳：滚动、弹层上滑、页面换位的那几帧不画圈，停住 0.2 秒再出来，免得圈落在错的地方
  const still = useRef({})
  const on = state.tour.active
  useEffect(() => {
    if (!on) return
    let raf = 0
    const tick = () => {
      raf = requestAnimationFrame(tick)
      const hit = resolve(state, pathname)
      const R = ring.current, T = tip.current, A = arrow.current, P = point.current
      if (!R || !T || !A || !P) return
      if (held.current && hit && (hit.el === held.current.el || hit.el.contains(held.current.el)) && Date.now() - held.current.at < 1500) { hide(R, T, P); return }
      if (!hit || !vis(hit.el)) { hide(R, T, P); cur.current = null; return }
      held.current = null
      const r1 = hit.el.getBoundingClientRect(), now = Date.now(), st = still.current
      if (st.el !== hit.el || Math.abs(st.x - r1.left) > 1 || Math.abs(st.y - r1.top) > 1) { still.current = { el: hit.el, x: r1.left, y: r1.top, at: now }; hide(R, T, P); return }
      if (now - st.at < 200) return
      // 用键盘走的人：换到新目标时把焦点放过去，Tab 不用从头数
      if (cur.current !== hit.el && kbd.current) { const f = hit.el.matches('button, a, input, select, textarea') ? hit.el : hit.el.querySelector('button, a, input, select, textarea'); f?.focus({ preventScroll: true }) }
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
      if ((r0.top < 0 || r0.bottom > innerHeight) && scrolled.current !== hit.el && hit.el.closest('[role=dialog]')) { scrolled.current = hit.el; hit.el.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' }) }
      // 页面上的目标被顶栏或底部导航挡住（矮屏、放大）：滚到可见区域中间，只滚一次
      if (scrolled.current !== hit.el && !hit.el.closest('[role=dialog], header, nav[aria-label="主导航"], [data-tour-bar]')) {
        const hb = (document.querySelector('[data-tour-bar]') || document.querySelector('header'))?.getBoundingClientRect().bottom ?? 0
        const nt = document.querySelector('nav[aria-label="主导航"]')?.getBoundingClientRect().top ?? innerHeight
        const ft = nt > innerHeight / 2 ? nt : innerHeight
        if (r0.top < hb + 8 || r0.bottom > ft - 8) { scrolled.current = hit.el; hit.el.style.scrollMargin = `${hb + 16}px 0 ${innerHeight - ft + 24}px`; hit.el.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' }) }
      }
      const r = hit.el.getBoundingClientRect()
      const dlg = !!hit.el.closest('[role=dialog]')
      const pad = 6
      const rad = Math.min(parseFloat(getComputedStyle(hit.el).borderTopLeftRadius) || 12, r.height / 2) + pad
      // 圈贴着屏幕边（底部导航、顶栏）时收进屏幕里，不被切掉
      const E = 11, L = Math.max(E, r.left - pad), Tp = Math.max(E, r.top - pad), Rt = Math.min(innerWidth - E, r.right + pad), Bt = Math.min(innerHeight - E, r.bottom + pad)
      Object.assign(R.style, { transition: '', opacity: '1', left: `${L}px`, top: `${Tp}px`, width: `${Rt - L}px`, height: `${Bt - Tp}px`, borderRadius: `${rad}px`,
        boxShadow: dlg ? '0 0 0 3px var(--accent), 0 0 0 9px color-mix(in srgb, var(--accent) 25%, transparent)' : '0 0 0 3px var(--accent), 0 0 0 9px color-mix(in srgb, var(--accent) 25%, transparent), 0 0 0 200vmax rgba(12, 24, 18, 0.32)' })
      // 气泡：下面放得下就放下面，否则放上面；左右夹在屏幕里；箭头对着目标中间
      const tw = T.offsetWidth, th = T.offsetHeight, gap = 48, m = 8
      const navTop = document.querySelector('nav[aria-label="主导航"]')?.getBoundingClientRect().top ?? innerHeight
      const floor = (navTop > innerHeight / 2 && !hit.nav ? navTop : innerHeight) - m
      const barB = document.querySelector('[data-tour-bar]')?.getBoundingClientRect().bottom ?? 0
      const ceil = Math.max(m, hit.el.closest('header, [data-tour-bar]') ? m : barB + 8)
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2
      // 顶栏里的目标（身份切换、导览条按钮）：宽屏放左边，手机放到导览条下面
      const inHead = !!hit.el.closest('header, [data-tour-bar]')
      // 候选位置：下 / 上（居中、往左错、往右错）、左、右
      const cands = []
      for (const k of [0, -0.4, 0.4]) {
        const lx = Math.max(m, Math.min(innerWidth - tw - m, cx - tw / 2 + k * tw))
        cands.push({ kind: 'down', k, left: lx, top: r.bottom + pad + gap }, { kind: 'up', k, left: lx, top: r.top - pad - gap - th })
      }
      cands.push({ kind: 'left', k: 0, left: r.left - pad - gap - tw, top: cy - th / 2 }, { kind: 'right', k: 0, left: r.right + pad + gap, top: cy - th / 2 })
      // 打分：伸出屏幕、压到导览条或底部导航不行；压到目标本身和它紧挨着的说明小字（提示、标签、错误信息）重罚；其余按盖住几处文字算
      const near = () => {
        const out = []
        for (const y of [r.bottom + 10, r.bottom + 26, r.bottom + 42, r.top - 12, r.top - 28]) for (const fx of [0.15, 0.5, 0.85]) {
          const e = document.elementFromPoint(r.left + r.width * fx, y)
          if (e && !hit.el.contains(e) && (e.innerText || '').trim() && e.getBoundingClientRect().height < 64 && !e.closest('[data-tour-bar], header, nav')) out.push(e.getBoundingClientRect())
        }
        return out
      }
      const score = (c) => {
        const L = c.left, T0 = c.top, R = L + tw, B = T0 + th
        if (L < m - 0.5 || R > innerWidth - m + 0.5 || T0 < ceil || B > floor) return 1e6
        const hitR = (q) => q.left < R - 1 && q.right > L + 1 && q.top < B - 1 && q.bottom > T0 + 1
        let sc = hitR({ left: r.left - pad, right: r.right + pad, top: r.top - pad, bottom: r.bottom + pad }) ? 1000 : 0
        for (const q of c.hints) if (hitR(q)) sc += 40
        for (const fx of [0.08, 0.3, 0.5, 0.7, 0.92]) for (const fy of [0.2, 0.5, 0.8]) {
          const e = document.elementFromPoint(L + tw * fx, T0 + th * fy)
          if (e && !e.closest('[data-tour-bar]') && (e.innerText || '').trim() && e.children.length < 3) sc += 1
        }
        return sc + Math.abs(c.k) * 2 + (c.kind === 'left' || c.kind === 'right' ? 3 : 0) + (c.kind === 'up' ? 0.5 : 0)
      }
      const isNew = side0.current.el !== hit.el || side0.current.text !== hit.text
      // 紧挨着目标的说明文字（提示、标签、勾选项、错误信息）：气泡也可以放到它们外侧，箭头跨过说明指到目标
      const hints0 = inHead || !isNew ? [] : near()
      const lowB = Math.max(r.bottom, ...hints0.filter((q) => q.top >= r.bottom - 2).map((q) => q.bottom))
      const highT = Math.min(r.top, ...hints0.filter((q) => q.bottom <= r.top + 2).map((q) => q.top))
      if (lowB > r.bottom) cands.push({ kind: 'down', k: 0, dy: lowB - r.bottom + 16, left: Math.max(m, Math.min(innerWidth - tw - m, cx - tw / 2)), top: lowB + 16 })
      if (highT < r.top) cands.push({ kind: 'up', k: 0, dy: r.top - highT + 16, left: Math.max(m, Math.min(innerWidth - tw - m, cx - tw / 2)), top: highT - 16 - th })
      // 同一个目标只挑一次位置（记下是哪一种），之后每一帧按这种放，滚动时不来回翻
      if (isNew) {
        let pick = null
        if (!inHead) pick = cands.map((c) => ({ c, s: score({ ...c, hints: hints0 }) })).sort((a1, b1) => a1.s - b1.s)[0]
        side0.current = { el: hit.el, text: hit.text, kind: pick && pick.s < 1e6 ? pick.c.kind : null, k: pick ? pick.c.k : 0, dy: pick?.c.dy }
      }
      const side = inHead ? r.top < 140 && r.left - pad - gap - tw >= m && innerWidth >= 768 : side0.current.kind === 'left' || side0.current.kind === 'right'
      const sideR = !inHead && side0.current.kind === 'right'
      const below = r.bottom + pad + gap + th <= floor
      const down = inHead ? !side : side0.current.kind ? side0.current.kind === 'down' : below || r.top < innerHeight / 2
      const dyy = !inHead && side0.current.dy ? Math.max(side0.current.dy, pad + gap) : pad + gap
      const top = side ? cy - th / 2 : down ? r.bottom + dyy : r.top - dyy - th
      // 手机上点顶栏（身份切换）：气泡和箭头都放到导览条下面，不盖住导览条上的字
      const pushed = !side && down && r.top < 100 && barB > r.bottom
      const top2 = pushed ? Math.max(top, barB + 48) : top
      const left = side ? (sideR ? r.right + pad + gap : r.left - pad - gap - tw) : Math.max(m, Math.min(innerWidth - tw - m, cx - tw / 2 + (side0.current.k || 0) * tw))
      Object.assign(T.style, { transition: '', opacity: '1', left: `${left}px`, top: `${Math.max(m, Math.min(innerHeight - th - m, top2))}px` })
      const ax = Math.max(14, Math.min(tw - 14, r.left + r.width / 2 - left))
      Object.assign(A.style, side ? (sideR ? { left: '-6px', right: '', top: `${th / 2 - 6}px`, bottom: '' } : { left: '', right: '-6px', top: `${th / 2 - 6}px`, bottom: '' }) : { left: `${ax - 6}px`, right: '', top: down ? '-6px' : '', bottom: down ? '' : '-6px' })
      // 大箭头：品牌绿，放在气泡和目标之间，箭尖对着目标中间；气泡在下面就朝上指，在上面就朝下指
      const tTop = Math.max(m, Math.min(innerHeight - th - m, top2))
      const px = side ? (sideR ? (r.right + pad + left) / 2 : (left + tw + r.left - pad) / 2) : Math.max(m + 18, Math.min(innerWidth - m - 18, r.left + r.width / 2))
      const py = side ? r.top + r.height / 2 : pushed ? (barB + tTop) / 2 : down ? (Math.min(r.bottom + pad, innerHeight - 3) + tTop) / 2 : (tTop + th + Math.max(r.top - pad, 3)) / 2
      Object.assign(P.style, { transition: '', opacity: '1', left: `${px - 18}px`, top: `${py - 18}px` })
      P.dataset.dir = side ? (sideR ? 'left' : 'right') : down ? 'up' : 'down'
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
      <div ref={point} aria-hidden="true" className="pointer-events-none fixed z-[71] size-9 text-accent opacity-0 transition-opacity duration-200 [filter:drop-shadow(0_0_0_#fff)_drop-shadow(0_2px_3px_rgba(0,0,0,0.35))] data-[dir=down]:rotate-180 data-[dir=right]:rotate-90 data-[dir=left]:-rotate-90">
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
