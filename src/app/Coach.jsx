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
const cx0 = (r) => r.left + r.width / 2
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
  const [merge, setMerge] = useState('')
  const cur = useRef(null)
  const scrolled = useRef(null)
  const sent = useRef(null)
  const side0 = useRef({})
  // 刚点中圈住的东西：先把圈和气泡收起来，等下一个目标出来再显示，不在弹窗收起、页面切换的那一下指回旧按钮
  const held = useRef(null)
  // 窄屏时写进导览条的那句话（只在变了的时候通知导览条）
  const barText = useRef('')
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
      if (held.current && hit && (hit.el === held.current.el || hit.el.contains(held.current.el)) && Date.now() - held.current.at < 1500) { hide(R, T, P); if (barText.current !== '') { barText.current = ''; window.dispatchEvent(new CustomEvent('coach-text', { detail: '' })) } return }
      // 没有目标（奖励时刻还在播、页面在换）：导览条换回这一步的说明，不留上一步的「点这里」
      if (!hit || !vis(hit.el)) { hide(R, T, P); cur.current = null; if (barText.current !== '') { barText.current = ''; window.dispatchEvent(new CustomEvent('coach-text', { detail: '' })) } return }
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
      const tw = T.offsetWidth, th = T.offsetHeight, gap = 48, m = 8, AR = 40
      // 页面里按钮挨着按钮、字挨着字，浮在页面上的气泡放哪都会压到说明。
      // 所以「点这里：××」写进顶上的导览条（导览条在页面里占自己的位置，不压任何内容），
      // 目标上只留绿圈和一个贴在旁边空白处的箭头；弹窗里的目标，气泡放到弹窗上方压暗的空白处
      const dock = !hit.el.closest('header, [data-tour-bar]')
      if (dock) {
        const dlgEl = hit.el.closest('[role=dialog]')
        const sr = dlgEl?.getBoundingClientRect()
        if (dlgEl && sr.top >= th + AR + 16) {
          if (barText.current !== '') { barText.current = ''; window.dispatchEvent(new CustomEvent('coach-text', { detail: '' })) }
          const left = Math.max(m, Math.min(innerWidth - tw - m, cx0(r) - tw / 2)), top = sr.top - 8 - AR - th
          Object.assign(T.style, { transition: '', opacity: '1', left: `${left}px`, top: `${top}px` })
          Object.assign(A.style, { left: `${Math.max(14, Math.min(tw - 14, cx0(r) - left)) - 6}px`, right: '', top: '', bottom: '-6px' })
          Object.assign(P.style, { transition: '', opacity: '1', left: `${Math.max(m, Math.min(innerWidth - m - 36, cx0(r) - 18))}px`, top: `${top + th + 4}px` })
          P.dataset.dir = 'down'
          return
        }
        if (barText.current !== hit.text) { barText.current = hit.text; window.dispatchEvent(new CustomEvent('coach-text', { detail: hit.text })) }
        T.style.transition = 'none'; T.style.opacity = '0'
        // 箭头放哪：目标左、右、上、下贴边的几个位置，外加整行宽按钮自己左侧的空白；挑一个不压任何字、不压目标的
        if (side0.current.el !== hit.el || side0.current.text !== hit.text) {
          const cyy = r.top + r.height / 2, cxx = cx0(r)
          const opts = [['right', r.left - pad - 22, cyy], ['left', r.right + pad + 22, cyy]]
          for (const fx of [0.5, 0.85, 0.15, 0.7, 0.3]) opts.push(['down', r.left + r.width * fx, r.top - pad - 22], ['up', r.left + r.width * fx, r.bottom + pad + 22])
          // 附近的字和控件（只取叶子：文字段落、输入框、下拉框、按钮、星星、图片）
          const near2 = [...document.querySelectorAll('p, span, label, li, dd, dt, h1, h2, h3, a, button, input, select, textarea, img, [role=radio]')].filter((e) => {
            if (hit.el.contains(e) || e.contains(hit.el) || e.closest('.z-\\[70\\], .z-\\[71\\]')) return false
            const q = e.getBoundingClientRect()
            if (!q.width || !q.height || q.height > 120 || q.bottom < r.top - 80 || q.top > r.bottom + 80 || q.right < r.left - 80 || q.left > r.right + 80) return false
            return !/^(P|SPAN|LABEL|LI|DD|DT|H1|H2|H3)$/.test(e.tagName) || ((e.innerText || '').trim() && ![...e.children].some((c) => (c.innerText || '').trim()))
          }).map((e) => e.getBoundingClientRect())
          const clear = ([, x, y]) => {
            if (x < 20 || x > innerWidth - 20 || y < (document.querySelector('[data-tour-bar]')?.getBoundingClientRect().bottom ?? 0) + 20 || y > innerHeight - 20) return 99
            const a0 = { left: x - 18, right: x + 18, top: y - 18, bottom: y + 18 }
            const ov = (q) => q.left < a0.right - 1 && q.right > a0.left + 1 && q.top < a0.bottom - 1 && q.bottom > a0.top + 1
            return (ov({ left: r.left + 6, right: r.right - 6, top: r.top + 6, bottom: r.bottom - 6 }) ? 5 : 0) + near2.filter(ov).length
          }
          const ranked = opts.map((o, k) => [o, clear(o) + k * 0.01]).sort((a1, b1) => a1[1] - b1[1])[0]
          // 周围实在没有空处：这一步不画箭头，只留绿圈（「点这里」已经写在导览条上），宁可少一个箭头也不压字
          side0.current = { el: hit.el, text: hit.text, arrow: ranked[1] < 1 ? [ranked[0][0], ranked[0][1] - r.left, ranked[0][2] - r.top] : null }
        }
        if (!side0.current.arrow) { P.style.transition = 'none'; P.style.opacity = '0'; return }
        const [dir, ox, oy] = side0.current.arrow
        Object.assign(P.style, { transition: '', opacity: '1', left: `${r.left + ox - 18}px`, top: `${r.top + oy - 18}px` })
        P.dataset.dir = dir
        return
      }
      if (barText.current !== '') { barText.current = ''; window.dispatchEvent(new CustomEvent('coach-text', { detail: '' })) }
      const navTop = document.querySelector('nav[aria-label="主导航"]')?.getBoundingClientRect().top ?? innerHeight
      const floor = (navTop > innerHeight / 2 && !hit.nav ? navTop : innerHeight) - m
      const barB = document.querySelector('[data-tour-bar]')?.getBoundingClientRect().bottom ?? 0
      const inHead = !!hit.el.closest('header, [data-tour-bar]')
      const ceil = Math.max(m, inHead ? m : barB + 8)
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2
      const isNew = side0.current.el !== hit.el || side0.current.text !== hit.text
      if (isNew) {
        // 必须避开的：目标本身，以及和它同一列、上下 140px 以内的文字和控件（说明、提示、标签、勾选项、错误信息、星星）
        const guard = []
        if (!inHead) {
          for (const e of document.querySelectorAll('p, span, label, li, dd, dt, h1, h2, h3, a, button, input, select, textarea, img, [role=radio]')) {
            if (hit.el.contains(e) || e.contains(hit.el) || e.closest('header, nav, [data-tour-bar], .z-\\[70\\], .z-\\[71\\]')) continue
            const q = e.getBoundingClientRect()
            if (!q.width || !q.height || q.height > 120) continue
            const leaf = !/^(P|SPAN|LABEL|LI|DD|DT|H1|H2|H3)$/.test(e.tagName) || ((e.innerText || '').trim() && ![...e.children].some((c) => (c.innerText || '').trim()))
            if (!leaf) continue
            if (q.bottom < r.top - 140 || q.top > r.bottom + 140 || q.right < r.left - 40 || q.left > r.right + 40) continue
            guard.push({ q, t: /^(P|SPAN|LABEL|LI|DD|DT|H1|H2|H3)$/.test(e.tagName) ? (e.innerText || '').trim() : '' })
          }
        }
        // 候选位置：气泡（连同贴在它边上的箭头）放在目标的下、上、左、右；上下各有「紧挨着」和「放到说明外侧」两种
        const lowB = Math.max(r.bottom + pad, ...guard.filter((g) => g.q.top >= r.bottom - 2).map((g) => g.q.bottom))
        const highT = Math.min(r.top - pad, ...guard.filter((g) => g.q.bottom <= r.top + 2).map((g) => g.q.top))
        const lx = (k) => Math.max(m, Math.min(innerWidth - tw - m, cx - tw / 2 + k * tw))
        const cands = []
        for (const k of [0, -0.4, 0.4]) cands.push({ kind: 'down', k, off: pad + gap }, { kind: 'up', k, off: pad + gap })
        cands.push({ kind: 'down', k: 0, off: lowB - r.bottom + 8 + AR }, { kind: 'up', k: 0, off: r.top - highT + 8 + AR })
        cands.push({ kind: 'left', k: 0, off: pad + 8 + AR }, { kind: 'right', k: 0, off: pad + 8 + AR })
        const rectOf = (c) => {
          if (c.kind === 'down') { const t0 = r.bottom + c.off; return { b: [lx(c.k), t0, lx(c.k) + tw, t0 + th], a: [cx - 18, t0 - AR, cx + 18, t0] } }
          if (c.kind === 'up') { const t0 = r.top - c.off - th; return { b: [lx(c.k), t0, lx(c.k) + tw, t0 + th], a: [cx - 18, t0 + th, cx + 18, t0 + th + AR] } }
          if (c.kind === 'left') { const l0 = r.left - c.off - tw; return { b: [l0, cy - th / 2, l0 + tw, cy + th / 2], a: [l0 + tw, cy - 18, l0 + tw + AR, cy + 18] } }
          const l0 = r.right + c.off; return { b: [l0, cy - th / 2, l0 + tw, cy + th / 2], a: [l0 - AR, cy - 18, l0, cy + 18] }
        }
        const over = (q, [l, t, rr, b]) => q.left < rr - 1 && q.right > l + 1 && q.top < b - 1 && q.bottom > t + 1
        const score = (c) => {
          const { b: B0, a: A0 } = rectOf(c)
          if (B0[0] < m - 0.5 || B0[2] > innerWidth - m + 0.5 || B0[1] < ceil || B0[3] > floor || Math.min(B0[1], A0[1]) < ceil || Math.max(B0[3], A0[3]) > floor) return { s: 1e6 }
          const tgt = { left: r.left - pad, right: r.right + pad, top: r.top - pad, bottom: r.bottom + pad }
          let sc = over(tgt, B0) || over(tgt, A0) ? 1000 : 0
          const hitG = guard.filter((g) => over(g.q, B0) || over(g.q, A0))
          sc += hitG.length * 40
          // 别处的字：盖住一点也算，但很轻
          for (const fx of [0.1, 0.5, 0.9]) for (const fy of [0.25, 0.75]) { const e = document.elementFromPoint(B0[0] + tw * fx, B0[1] + th * fy); if (e && (e.innerText || '').trim() && e.children.length < 3) sc += 1 }
          return { s: sc + Math.abs(c.k) + (c.kind === 'left' || c.kind === 'right' ? 2 : 0) + c.off / 400, hitG }
        }
        let pick = null
        if (!inHead) pick = cands.map((c) => ({ c, ...score(c) })).sort((a1, b1) => a1.s - b1.s)[0]
        // 实在放不下：被压住的说明并进气泡里，内容不丢
        const merge = pick && pick.s >= 40 && pick.s < 1000 ? [...new Set(pick.hitG.map((g) => g.t).filter(Boolean))].join(' ').slice(0, 60) : ''
        side0.current = { el: hit.el, text: hit.text, kind: pick && pick.s < 1e6 ? pick.c.kind : null, k: pick ? pick.c.k : 0, off: pick?.c.off ?? pad + gap, merge }
        if (T.dataset.merge !== merge) { T.dataset.merge = merge; setMerge(merge) }
      }
      // 顶栏里的目标（身份切换、导览条按钮）：左边放得下就放左边，否则放到导览条下面
      const headSide = inHead && r.top < 140 && r.left - pad - 8 - AR - tw >= m
      const kind = inHead ? (headSide ? 'left' : 'down') : side0.current.kind || (r.bottom + pad + gap + th <= floor || r.top < innerHeight / 2 ? 'down' : 'up')
      let off = inHead ? (headSide ? pad + 8 + AR : pad + gap) : side0.current.kind ? side0.current.off : pad + gap
      // 手机上点顶栏：气泡和箭头都放到导览条下面，不盖住导览条上的字
      if (inHead && kind === 'down' && barB > r.bottom) off = Math.max(off, barB - r.bottom + 8 + AR)
      let left, top
      if (kind === 'down') { left = Math.max(m, Math.min(innerWidth - tw - m, cx - tw / 2 + (inHead ? 0 : side0.current.k) * tw)); top = r.bottom + off }
      else if (kind === 'up') { left = Math.max(m, Math.min(innerWidth - tw - m, cx - tw / 2 + side0.current.k * tw)); top = r.top - off - th }
      else if (kind === 'left') { left = r.left - off - tw; top = cy - th / 2 }
      else { left = r.right + off; top = cy - th / 2 }
      top = Math.max(m, Math.min(innerHeight - th - m, top))
      left = Math.max(m, Math.min(innerWidth - tw - m, left))
      Object.assign(T.style, { transition: '', opacity: '1', left: `${left}px`, top: `${top}px` })
      const side = kind === 'left' || kind === 'right'
      const ax = Math.max(14, Math.min(tw - 14, cx - left))
      Object.assign(A.style, kind === 'right' ? { left: '-6px', right: '', top: `${th / 2 - 6}px`, bottom: '' } : kind === 'left' ? { left: '', right: '-6px', top: `${th / 2 - 6}px`, bottom: '' } : { left: `${ax - 6}px`, right: '', top: kind === 'down' ? '-6px' : '', bottom: kind === 'down' ? '' : '-6px' })
      // 大箭头贴在气泡边上，箭尖朝着目标
      const px = kind === 'left' ? left + tw + AR / 2 : kind === 'right' ? left - AR / 2 : Math.max(m + 18, Math.min(innerWidth - m - 18, cx))
      const py = side ? cy : kind === 'down' ? top - AR / 2 : top + th + AR / 2
      Object.assign(P.style, { transition: '', opacity: '1', left: `${px - 18}px`, top: `${py - 18}px` })
      P.dataset.dir = kind === 'left' ? 'right' : kind === 'right' ? 'left' : kind === 'down' ? 'up' : 'down'
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
      const W0 = T.style.opacity === '0' ? point.current : T
      W0.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-7px)' }, { transform: 'translateX(7px)' }, { transform: 'translateX(-4px)' }, { transform: 'translateX(0)' }], { duration: 380, easing: 'ease-out' })
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
        {merge && <span className="relative mt-1 block border-t border-bg/20 pt-1 text-[13px] font-medium leading-snug opacity-80">被挡住的说明：{merge}</span>}
      </div>
    </>,
    document.body,
  )
}
