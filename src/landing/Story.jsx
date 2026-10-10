import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion, animate, useMotionValue, useTransform } from 'motion/react'
import { routePath, PLACES } from '../campusMap'

// 一单的滚动叙事：同一张校园地图和同一张订单卡一直在场。往下滚，地图的镜头跟着这一步移动，
// 阿远沿路走、路线一点点画出来，订单状态、钱和两个人的信用一格一格变；旁边的文字讲这一步背后的产品设计。
// 场景、六步、信任、双向信用都在这一条线上讲完。
const icon = (name) => `${import.meta.env.BASE_URL}icons/${name}.webp`
const img = (name) => `${import.meta.env.BASE_URL}images/${name}.webp`
const ease = [0.16, 1, 0.3, 1]
const MW = 1600, MH = 900
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v))

// 阿远下课的路：一教门口的路面 → 沿主路往西 → 梅园门口的路面；驿站就在这条路边
const PTS = routePath('jiao1', 'mei5').pts.slice(1, -1)
const LEN = PTS.slice(1).reduce((n, [x, y], k) => n + Math.hypot(x - PTS[k][0], y - PTS[k][1]), 0)
const F = (PTS[0][0] - PLACES.cainiao.door[0]) / LEN // 走到驿站门口时在整条路上的位置
const D = PTS.map(([x, y], k) => `${k ? 'L' : 'M'}${x} ${y}`).join(' ')
const NEED = routePath('cainiao', 'mei5').pts.slice(1, -1).map(([x, y], k) => `${k ? 'L' : 'M'}${x} ${y}`).join(' ')
const at = (f) => {
  let t = f * LEN
  for (let k = 1; k < PTS.length; k++) {
    const [ax, ay] = PTS[k - 1], [bx, by] = PTS[k]
    const l = Math.hypot(bx - ax, by - ay)
    if (t <= l || k === PTS.length - 1) { const u = l ? Math.min(1, t / l) : 0; return [ax + (bx - ax) * u, ay + (by - ay) * u] }
    t -= l
  }
  return PTS[PTS.length - 1]
}
const STATION = [PLACES.cainiao.door[0], PLACES.cainiao.door[1] + 6]
const MEI = PLACES.mei5.door
const ICHI = PLACES.jiao1.door
const XM = [MEI[0] - 50, MEI[1] + 80] // 小满站在梅园楼前
// 送到以后停在梅园门口右边一点，不和小满的头像叠在一起
const END = 0.93

// 七段：每段一句话的事 + 被划掉的那种「怕」 + 背后的产品设计
export const CH = [
  {
    k: 'scene', icon: 'type-express-v1', alt: '纸箱快递', kicker: '跟着一单往下走',
    t: '快递在驿站，你在宿舍',
    d: '小满三个快递在菜鸟驿站放了三天，驿站 18:00 关门。找室友要欠人情，找陌生人又怕取件码被乱用。',
    note: ['为什么叫「顺路」', '不是多找一个跑腿的人，是让本来就要经过驿站的同学，顺手带上。'],
  },
  {
    k: 'publish', icon: 'trust-escrow-v1', alt: '护着硬币的盾牌', kicker: '发布', fear: '怕付了钱没人管',
    t: '发一单 ¥5，钱先冻结',
    d: '选「取快递」模板，填楼栋和截止时间。赏金在发布那一刻就冻结在平台，谁也拿不走。',
    note: ['赏金托管', '确认送达才放款；发单人 2 小时不确认，系统自动放款，跑腿的人也不怕白跑。'],
  },
  {
    k: 'match', icon: 'trust-verify-v1', alt: '带对勾的学生证', kicker: '顺路', fear: '怕对方是校外的人',
    t: '阿远一教下课，正好顺路',
    d: '阿远 17:50 在一教下课，本来就要走回梅园，路过驿站只多走 1 分钟。大厅把顺他路的单排在最前面。',
    note: ['认证和门槛', '学号或 .edu.cn 邮箱认证后才能接单；信用 72 分以上，才能接 ¥15 以内的单。'],
  },
  {
    k: 'code', icon: 'trust-privacy-v1', alt: '挂锁和钥匙', kicker: '接单', fear: '怕取件码和宿舍号被乱传',
    t: '接单那一刻，取件码才出现',
    d: '阿远接单，到驿站报 6-2-3108 取件。接单之前，大厅里只看得到「梅园」，楼号和门牌都打了码。',
    note: ['隐私分级', '取件码和宿舍号只给接单的人看，订单结束自动收回；电话一律走虚拟号。'],
  },
  {
    k: 'deliver', icon: 'trust-dispute-v1', alt: '天平', kicker: '送达', fear: '怕出了问题说不清',
    t: '捎着快递走回梅园',
    d: '绿色这一段，是阿远捎着你的快递走的路。到楼下当面报 4 位送达码，或者拍照放门口。',
    note: ['送达凭证与申诉', '送达码当面核验，或拍照留证；有问题就申诉，申诉期间钱继续冻结，平台判责。'],
  },
  {
    k: 'pay', icon: 'step-confirm-v1', alt: '两只手传递硬币', kicker: '放款', fear: '怕钱放了，信息还留在别人手里',
    t: '确认收货，¥5 放给阿远',
    d: '小满看过东西没问题，点一下确认，托管的 ¥5 当场转给阿远。',
    note: ['放款即收回', '钱放出去的同一刻，取件码和宿舍号对阿远隐藏，这单的隐私不留在别人手机里。'],
  },
  {
    k: 'credit', icon: 'trust-credit-v1', alt: '带上升箭头的奖牌', kicker: '互评', fear: '怕碰上不靠谱的人',
    t: '两个人的信用，一起涨',
    d: '互相打分之后，阿远 70 → 73，小满 88 → 90。下次阿远能接更贵的单，小满的单也更快有人接。',
    note: ['双向信用', '跑腿人按时 +2、爽约 -5、被判责 -8；发单人按时确认 +1、超时不确认 -2。不能充值，也刷不了。'],
  },
]

// 每段停住时阿远在路上的哪儿（null = 还没出场）
const WALK = [null, null, 0, F, END, END, END]
const STATUS = ['还没发单', '待接单', '有人顺路', '取件中', '待确认', '已放款', '已互评']
const ESCROW = ['还没付', '¥5 冻结中', '¥5 冻结中', '¥5 冻结中', '¥5 冻结中', '¥5 给了阿远', '¥5 给了阿远']
const CODE = ['还没有', '••••', '••••', '6-2-3108', '已用完', '已收回', '已收回']
const RUNNER = [70, 70, 70, 70, 70, 72, 73]
const POSTER = [88, 88, 88, 88, 88, 89, 90]
// 每段地图镜头对准哪儿：[中心 x, 中心 y, 镜头宽]，最后一段拉远看整条路
const CAM = [[720, 360, 1300], [1110, 330, 760], [1180, 300, 880], [1150, 330, 760], [700, 330, 1300], [470, 360, 960], [720, 420, 1440]]

// 把镜头换算成「整张图在画框里的位置」：画框宽高比固定，镜头外的部分裁掉
function camRect(c, aspect) {
  const [cx, cy, w0] = c
  const w = Math.min(w0, MW, MH * aspect), h = w / aspect
  return { x: clamp(cx - w / 2, 0, MW - w), y: clamp(cy - h / 2, 0, MH - h), w, h }
}
const mix = (a, b, t) => a + (b - a) * t
// 每一段前一半停在这一段的画面，后一半慢慢过渡到下一段：读字的时候画面不动，滚到段尾才往前走
const settle = (pos) => { const k = Math.floor(pos), t = pos - k; return [k, clamp((t - 0.5) / 0.5)] }
const sm = (t) => t * t * (3 - 2 * t)
function walkAt(pos) {
  const [k, t] = settle(pos)
  const a = WALK[Math.min(k, 6)], b = WALK[Math.min(k + 1, 6)]
  if (a == null && b == null) return { f: 0, o: 0 }
  if (a == null) return { f: b, o: sm(t) }
  return { f: mix(a, b ?? a, sm(t)), o: 1 }
}
function camAt(pos, aspect) {
  const [k, t] = settle(pos)
  const A = camRect(CAM[Math.min(k, 6)], aspect), B = camRect(CAM[Math.min(k + 1, 6)], aspect)
  const u = sm(t)
  return { x: mix(A.x, B.x, u), y: mix(A.y, B.y, u), w: mix(A.w, B.w, u), h: mix(A.h, B.h, u) }
}

// 数字滚到新值：信用分变的那一下看得见
function Roll({ v }) {
  const reduce = useReducedMotion()
  const mv = useMotionValue(v)
  const out = useTransform(mv, (x) => Math.round(x))
  useEffect(() => { const c = animate(mv, v, { duration: reduce ? 0 : 0.9, ease }); return () => c.stop() }, [v, mv, reduce])
  return <motion.span>{out}</motion.span>
}

const pp = ([x, y]) => ({ left: `${(x / MW) * 100}%`, top: `${(y / MH) * 100}%` })

function StoryMap({ i, pos, aspect, small = false }) {
  const reduce = useReducedMotion()
  // 镜头：整张图在画框里的大小和位置，跟着滚动连续变（字和头像不跟着放大，只有地图在推拉）
  const left = useTransform(pos, (p) => { const c = camAt(p, aspect); return `${(-c.x / c.w) * 100}%` })
  const top = useTransform(pos, (p) => { const c = camAt(p, aspect); return `${(-c.y / c.h) * 100}%` })
  const width = useTransform(pos, (p) => `${(MW / camAt(p, aspect).w) * 100}%`)
  const height = useTransform(pos, (p) => `${(MH / camAt(p, aspect).h) * 100}%`)
  // 阿远：位置和出场都跟着滚动走
  const wl = useTransform(pos, (p) => `${(at(walkAt(p).f)[0] / MW) * 100}%`)
  const wt = useTransform(pos, (p) => `${(at(walkAt(p).f)[1] / MH) * 100}%`)
  const wo = useTransform(pos, (p) => walkAt(p).o)
  const ws = useTransform(wo, (o) => 0.6 + 0.4 * o)
  const len = useTransform(pos, (p) => walkAt(p).f)
  const dashO = useTransform(wo, (o) => o * 0.35)
  const carry = useTransform(pos, (p) => clamp((walkAt(p).f - F) / (1 - F)))
  const carryO = useTransform(carry, (c) => (c > 0.001 ? 1 : 0))
  const hasPkg = useTransform(pos, (p) => (walkAt(p).f >= F - 0.002 && walkAt(p).o > 0.5 ? 1 : 0))
  const pkgAtStation = useTransform(hasPkg, (h) => 1 - h)
  // 开场先是驿站的照片：这件事在现实里长什么样；往下滚到第 1 步，照片淡出、地图接上
  const photo = useTransform(pos, (p) => 1 - sm(clamp((p - 0.45) / 0.45)))
  const photoScale = useTransform(pos, (p) => 1 + 0.06 * clamp(p / 0.9))
  const sw = small ? 1.4 : 1
  const tag = (txt, p) => (
    <span className={`absolute z-20 -translate-x-1/2 whitespace-nowrap rounded-full bg-surface px-2 py-0.5 font-semibold text-ink shadow-sm ring-1 ring-line ${small ? 'text-[11px]' : 'text-[13px]'}`} style={pp(p)}>{txt}</span>
  )
  return (
    <div className={`relative isolate overflow-hidden bg-sunken ring-1 ring-line ${small ? 'rounded-xl' : 'rounded-[28px]'}`} style={{ aspectRatio: aspect }} aria-hidden="true">
      <motion.div className="absolute" style={{ left, top, width, height }}>
        <svg viewBox={`0 0 ${MW} ${MH}`} className="absolute inset-0 size-full">
          <image href={img('campus-map-v2')} x="0" y="0" width={MW} height={MH} />
          <motion.path d={D} fill="none" stroke="var(--ink)" strokeWidth={10 * sw} strokeDasharray={`${4 * sw} ${18 * sw}`} strokeLinecap="round" style={{ opacity: dashO }} />
          <motion.path d={D} fill="none" stroke="var(--ink)" strokeOpacity="0.9" strokeWidth={12 * sw} strokeLinecap="round" strokeLinejoin="round" style={{ pathLength: len, opacity: wo }} />
          {/* 捎上快递之后那一段变绿：这是「顺手」的部分 */}
          <motion.path d={NEED} fill="none" stroke="var(--accent)" strokeWidth={7 * sw} strokeLinecap="round" strokeLinejoin="round" style={{ pathLength: carry, opacity: carryO }} />
          {/* 发布那一下，驿站冒一圈：这里有一单在等人 */}
          {i === 1 && !reduce && (
            <motion.circle key="ping" cx={STATION[0]} cy={STATION[1]} r="60" fill="var(--accent)" initial={{ opacity: 0.45, scale: 0.4 }} animate={{ opacity: 0, scale: 1.7 }}
              transition={{ duration: 1.3, repeat: 2, ease: 'easeOut' }} style={{ transformOrigin: `${STATION[0]}px ${STATION[1]}px` }} />
          )}
        </svg>

        {tag('一教', [ICHI[0], ICHI[1] - 120])}
        {tag('菜鸟驿站', [STATION[0], STATION[1] + 44])}
        {/* 小满在梅园：从头到尾都在，钱和信用最后落到她这边 */}
        <span className="absolute z-20 -translate-x-1/2 -translate-y-1/2" style={pp(XM)}>
          <span className={`grid place-items-center rounded-full bg-accent-soft ring-[3px] ring-accent ${small ? 'size-8' : 'size-12'}`}>
            <img src={icon('avatar-poster-v1')} width={40} height={40} alt="" className={`${small ? 'size-6' : 'size-10'} rounded-full`} />
          </span>
          <span className={`absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded-full bg-surface px-2 py-0.5 font-semibold text-ink shadow-sm ring-1 ring-line ${small ? 'text-[11px]' : 'text-[13px]'}`}>梅园 · 小满</span>
        </span>
        {/* 快递：在驿站等着，被阿远拿走以后跟着他走 */}
        <motion.span className="absolute z-10 -translate-x-1/2 -translate-y-1/2" style={{ ...pp(STATION), opacity: pkgAtStation }}>
          <motion.img src={icon('type-express-v1')} width={40} height={40} alt="" className={`block ${small ? 'size-7' : 'size-10'}`}
            initial={false} animate={{ scale: i === 1 && !reduce ? [1, 1.3, 1] : 1 }} transition={{ duration: 0.6 }} />
        </motion.span>
        {/* 阿远 */}
        <motion.span className={`absolute z-30 grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-surface ring-[3px] ring-ink ${small ? 'size-8' : 'size-12'}`}
          style={{ left: wl, top: wt, opacity: wo, scale: ws }}>
          <img src={icon('avatar-runner-v1')} width={40} height={40} alt="" className={`${small ? 'size-6' : 'size-10'} rounded-full`} />
          <motion.img src={icon('type-express-v1')} width={24} height={24} alt="" style={{ opacity: hasPkg }} className={`absolute ${small ? '-right-2.5 -top-2.5 size-5' : '-right-3.5 -top-3.5 size-7'}`} />
        </motion.span>

        {/* 每一段在地图上冒一句 */}
        <AnimatePresence>
          {i === 2 && <Bubble key="b2" p={pp([ICHI[0] - 260, ICHI[1] - 95])} small={small} dark>17:50 下课，本来就走这条路</Bubble>}
          {i === 3 && <Bubble key="b3" p={pp([STATION[0] - 150, STATION[1] - 125])} small={small} dark>报 6-2-3108 取件</Bubble>}
          {i === 5 && <Bubble key="b5" p={pp([XM[0] + 280, XM[1] - 250])} small={small} green>+¥5 到阿远</Bubble>}
          {i === 6 && <Bubble key="b6" p={pp([XM[0] + 330, XM[1] - 250])} small={small} green>阿远 +3 · 小满 +2</Bubble>}
        </AnimatePresence>
      </motion.div>
      <motion.div className="pointer-events-none absolute inset-0 z-50" style={{ opacity: photo }}>
        <motion.img src={img('scene-express-v3')} width={1200} height={800} alt="" className="size-full object-cover" style={{ scale: photoScale }} />
        <span className={`absolute rounded-full bg-surface/95 font-semibold text-ink shadow-sm ${small ? 'bottom-2 left-2 px-2 py-0.5 text-[11px]' : 'bottom-16 left-5 px-3 py-1 text-sm'}`}>傍晚 17:40 的菜鸟驿站，门口要排二十分钟</span>
      </motion.div>
    </div>
  )
}
function Bubble({ p, children, small, dark, green }) {
  const reduce = useReducedMotion()
  return (
    <motion.span initial={reduce ? false : { opacity: 0, y: 8, scale: 0.92 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4 }} transition={{ type: 'spring', stiffness: 380, damping: 24 }}
      className={`tnum absolute z-40 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full font-bold shadow-[0_10px_24px_-12px_rgba(17,40,30,0.6)] ${small ? 'px-2 py-0.5 text-[11px]' : 'px-3.5 py-1.5 text-[15px]'} ${dark ? 'bg-ink text-bg' : green ? 'bg-accent text-on-accent' : 'bg-surface'}`} style={p}>
      {children}
    </motion.span>
  )
}

// 订单卡：六格进度（点哪格跳到哪一步）、状态、托管、取件码、两个人的信用；正在变的那一格亮起来
function OrderCard({ i, go, small = false }) {
  const reduce = useReducedMotion()
  const status = (cls) => (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span key={STATUS[i]} initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}
        className={`shrink-0 rounded-full px-2.5 py-0.5 font-bold ${cls} ${i === 0 ? 'bg-sunken text-muted' : 'bg-accent text-on-accent'}`}>{STATUS[i]}</motion.span>
    </AnimatePresence>
  )
  if (small) {
    // 手机：一行，只放状态和这一步在变的那一格
    const hot = i >= 5 ? ['信用', <>阿远 <Roll v={RUNNER[i]} /> · 小满 <Roll v={POSTER[i]} /></>] : i === 3 || i === 4 ? ['取件码', CODE[i]] : ['托管', ESCROW[i]]
    return (
      <div className="flex items-center gap-2 rounded-xl bg-surface/95 px-2.5 py-1.5 text-ink shadow-[0_8px_20px_-10px_rgba(17,40,30,0.5)] ring-1 ring-line backdrop-blur">
        {status('text-[13px]')}
        <span className="shrink-0 text-[12px] font-semibold text-ink/70">{hot[0]}</span>
        <span className="tnum min-w-0 truncate text-[14px] font-bold">{hot[1]}</span>
        <span className="ml-auto flex shrink-0 gap-0.5" aria-hidden="true">{CH.slice(1).map((c, k) => <span key={c.k} className={`h-1.5 w-2.5 rounded-full ${k < i ? 'bg-accent' : 'bg-sunken'}`} />)}</span>
      </div>
    )
  }
  const cell = (k, v, hot, key, delta = 0) => (
    <div className={`relative min-w-0 rounded-xl px-3 py-2.5 transition-colors duration-300 ${hot ? 'bg-accent-soft text-accent' : 'bg-sunken text-ink'}`}>
      <p className="whitespace-nowrap text-[13px] text-muted">{k}</p>
      <AnimatePresence mode="wait" initial={false}>
        <motion.p key={key ?? v} initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }}
          className="tnum overflow-hidden text-ellipsis whitespace-nowrap text-[22px] font-bold leading-tight">{v}</motion.p>
      </AnimatePresence>
      {delta > 0 && <span className="tnum absolute right-2 top-2 rounded-full bg-accent px-1.5 text-xs font-bold leading-5 text-on-accent">+{delta}</span>}
    </div>
  )
  return (
    <div className="relative z-10 mt-2 rounded-2xl bg-surface p-4 text-ink lg:mx-5 lg:-mt-14 shadow-[0_24px_50px_-28px_rgba(17,40,30,0.55)] ring-1 ring-line">
      <div className="flex items-center gap-2">
        <img src={icon('type-express-v1')} width={28} height={28} alt="" aria-hidden="true" className="size-7" />
        <p className="min-w-0 flex-1 truncate text-[15px] font-semibold">{i === 0 ? '小满的快递，还在驿站' : '菜鸟驿站取 3 个小件快递 · 送梅园'}</p>
        {status('text-sm')}
      </div>
      <div className="mt-3 grid grid-cols-6 gap-1">
        {CH.slice(1).map((c, k) => (
          <button key={c.k} onClick={() => go(k + 1)} aria-label={`跳到「${c.kicker}」这一步`} className="group grid gap-1 pt-1 text-center">
            <span className={`h-1.5 rounded-full transition-colors duration-300 ${k < i ? 'bg-accent' : 'bg-sunken group-hover:bg-line'}`} />
            <span className={`whitespace-nowrap text-xs font-semibold ${k + 1 === i ? 'text-accent' : 'text-muted'}`}>{c.kicker}</span>
          </button>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-1.5 xl:grid-cols-4">
        {cell('赏金托管', ESCROW[i], i === 1 || i === 5)}
        {cell('取件码', CODE[i], i === 3, `c${i}`)}
        {cell('阿远信用', <Roll v={RUNNER[i]} />, i >= 5, `r${RUNNER[i]}`, RUNNER[i] - RUNNER[0])}
        {cell('小满信用', <Roll v={POSTER[i]} />, i >= 5, `p${POSTER[i]}`, POSTER[i] - POSTER[0])}
      </div>
    </div>
  )
}

function Chapter({ c, k, now, dark, flat, children }) {
  const reduce = useReducedMotion()
  return (
    <article data-ch={k} data-now={now ? '' : undefined} className={`group/ch flex flex-col ${flat ? 'py-2' : 'pb-10 pt-8 max-lg:min-h-[52svh] lg:min-h-[74svh] lg:justify-center lg:py-0'} `}>
      <div className="flex items-end gap-4">
        {k > 0 && <span className={`tnum font-display text-[56px] leading-none transition-colors duration-500 md:text-[72px] ${dark ? (now ? 'text-on-accent' : 'text-on-accent/50') : now ? 'text-accent' : 'text-accent/30'}`}>0{k}</span>}
        <p className={`flex items-center gap-2 pb-1 text-sm font-semibold ${dark ? 'text-on-accent' : 'text-accent'}`}>
          <img src={icon(c.icon)} width={32} height={32} alt={c.alt} loading="lazy" className="size-8 object-contain" />{c.kicker}
        </p>
      </div>
      {c.fear && (
        <p className={`relative mt-4 inline-block self-start text-[15px] font-semibold ${dark ? 'opacity-80' : 'opacity-60'}`}>
          {c.fear}
          <motion.span aria-hidden="true" className={`absolute inset-x-0 top-1/2 h-0.5 origin-left rounded-full ${dark ? 'bg-on-accent' : 'bg-accent'}`}
            initial={false} animate={{ scaleX: now || reduce ? 1 : 0 }} transition={{ duration: reduce ? 0 : 0.45, delay: reduce ? 0 : 0.25, ease }} />
        </p>
      )}
      {/* 标题只在逗号处换行，不把「下课」「阿远」这种词拆开 */}
      {(() => { const parts = c.t.split('，'); const T = k === 0 ? 'h2' : 'h3'; return (
        <T className={`${k === 0 ? 'mt-3' : 'mt-2'} font-display text-[32px] leading-[1.12] md:text-[44px] xl:text-[52px]`}>
          {parts.map((x, n) => <span key={n} className="inline-block whitespace-nowrap">{x}{n < parts.length - 1 ? '，' : ''}</span>)}
        </T>
      ) })()}
      <p className={`mt-4 max-w-[32ch] text-lg leading-relaxed transition-opacity duration-500 md:text-xl ${now ? 'opacity-85' : 'opacity-85 lg:opacity-45'}`}>{c.d}</p>
      <div className={`mt-6 max-w-[40ch] border-l-[3px] pl-4 transition-opacity duration-500 ${dark ? 'border-on-accent' : 'border-accent'} ${now ? '' : 'lg:opacity-45'}`}>
        <p className="text-[15px] font-bold">{c.note[0]}</p>
        <p className="mt-1 text-[15px] leading-relaxed opacity-70">{c.note[1]}</p>
      </div>
      {children}
    </article>
  )
}

// 最后一步的收尾：两个人的信用分放大，从 70、88 滚到 73、90
function Finale({ on }) {
  return (
    <div className="mt-8 grid max-w-[420px] grid-cols-2 gap-4">
      {[['阿远 · 跑腿', 70, 73], ['小满 · 发单', 88, 90]].map(([who, a, b]) => (
        <div key={who} className="rounded-2xl bg-on-accent/10 p-4 ring-1 ring-on-accent/20">
          <p className="text-sm font-semibold opacity-80">{who}</p>
          <p className="tnum mt-1 font-display text-[64px] leading-none md:text-[80px]">+<Roll v={on ? b - a : 0} /></p>
          <p className="tnum mt-2 text-sm font-bold">{a} → {b}</p>
        </div>
      ))}
    </div>
  )
}

// 关掉动效时的单段舞台：用一个固定的「位置」代替滚动
function StaticStage({ k }) {
  const pos = useMotionValue(k)
  return (
    <div>
      <StoryMap i={k} pos={pos} aspect={1.62} />
      <OrderCard i={k} go={() => {}} />
    </div>
  )
}

export default function Story() {
  const reduce = useReducedMotion()
  const [i, setI] = useState(0)
  const pos = useMotionValue(0)
  const list = useRef(null)
  // 换步那条线：桌面在视口 60% 处；手机在吸顶条下面那块可读区域的中间。以每段标题过线为准，文字读到哪、地图就到哪
  const line = () => {
    if (window.innerWidth >= 1024) return window.innerHeight * 0.68
    const b = document.querySelector('[data-story-mini]')?.getBoundingClientRect().bottom ?? 260
    return b + (window.innerHeight - b) * 0.6
  }
  // 正对着哪一段、这一段滚过了多少：用原生滚动事件算，后台标签页也准
  useEffect(() => {
    if (reduce) return
    const f = () => {
      const items = list.current?.querySelectorAll('[data-ch]')
      if (!items?.length) return
      const L = line()
      let k = 0, t = 0
      items.forEach((el, n) => {
        const h = el.querySelector('h2, h3')?.getBoundingClientRect().top ?? el.getBoundingClientRect().top
        if (h < L) { k = n; t = clamp((L - h) / el.getBoundingClientRect().height) }
      })
      setI(k)
      pos.set(k === items.length - 1 ? k : k + t)
    }
    f(); window.addEventListener('scroll', f, { passive: true }); window.addEventListener('resize', f)
    return () => { window.removeEventListener('scroll', f); window.removeEventListener('resize', f) }
  }, [reduce, pos])
  // 点订单卡上的进度格：滚到那一段的开头
  const go = (k) => {
    const el = list.current?.querySelectorAll('[data-ch]')[k]?.querySelector('h2, h3')
    if (el) window.scrollBy({ top: el.getBoundingClientRect().top - line() + 2, behavior: reduce ? 'auto' : 'smooth' })
  }
  // 放款和互评两段换成品牌深绿：一单走到最后，整段的颜色也到了高潮
  const dark = i >= 5

  if (reduce) {
    // 关掉动效：每一段配一张它自己那一刻的地图和订单，静态图文
    return (
      <section id="story" className="mx-auto max-w-7xl scroll-mt-16 px-4 py-16 md:px-8">
        <div className="divide-y divide-line">
          {CH.map((c, k) => (
            <div key={c.k} className="grid gap-6 py-6 lg:grid-cols-12 lg:items-center lg:gap-12">
              <div className="lg:col-span-5"><Chapter c={c} k={k} now flat /></div>
              <div className="lg:col-span-7"><StaticStage k={k} /></div>
            </div>
          ))}
        </div>
      </section>
    )
  }

  return (
    <section id="story" className="scroll-mt-16 px-2 md:px-4">
      <div className={`rounded-[32px] transition-colors duration-700 md:rounded-[48px] ${dark ? 'bg-accent-deep text-on-accent' : 'bg-bg text-ink'}`}>
        <div className="mx-auto max-w-7xl px-2 pb-10 md:px-4 lg:grid lg:grid-cols-12 lg:gap-12 lg:px-4 lg:pb-[12svh] xl:max-w-[calc(80rem-32px)] xl:px-0">
          {/* 手机：吸在顶栏下面的地图 + 一行订单，下面一段段文字滚过去；顶栏的「体验原型」和「目录」一直在 */}
          <div data-story-mini className={`sticky top-16 z-20 -mx-2 px-3 pb-1 pt-2 transition-colors duration-700 lg:hidden ${dark ? 'bg-accent-deep' : 'bg-bg'}`}>
            <div className="relative"><StoryMap i={i} pos={pos} aspect={1.75} small /><div className="absolute inset-x-1.5 bottom-1.5 z-10"><OrderCard i={i} go={go} small /></div></div>
            <div aria-hidden="true" className={`pointer-events-none absolute inset-x-0 top-full h-10 bg-gradient-to-b ${dark ? 'from-accent-deep' : 'from-bg'} to-transparent`} />
          </div>
          <div ref={list} className="px-2 lg:col-span-5">
            {CH.map((c, k) => <Chapter key={c.k} c={c} k={k} now={k === i} dark={dark}>{k === 6 && <Finale on={i === 6} />}</Chapter>)}
          </div>
          {/* 桌面：右边的舞台吸住，一直在场 */}
          <div className="hidden lg:col-span-7 lg:block">
            <div className="sticky top-16 flex h-[calc(100svh-64px)] flex-col justify-center py-6">
              <StoryMap i={i} pos={pos} aspect={1.62} />
              <OrderCard i={i} go={go} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
