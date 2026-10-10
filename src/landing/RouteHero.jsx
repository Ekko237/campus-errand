import { useEffect, useId, useRef, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion, useMotionValue, useTransform, useMotionValueEvent, useInView, animate } from 'motion/react'
import { ArrowDown } from '@phosphor-icons/react'
import { B, BUILDINGS, seedTasks, detourMin, detourMeters } from '../data'

const ease = [0.16, 1, 0.3, 1]
const icon = (name) => `${import.meta.env.BASE_URL}icons/${name}.webp`
const W = 600, H = 440
// 学弟下课的路：一教 → 驿站 → 梅园。驿站正好在他的路上，走到一半（p = 0.5）
const RUN = 'M90 90 L90 220 L500 220 L500 326'
// 你的需求：驿站 → 梅园，和他后半程完全重合
const NEED = 'M300 220 L500 220 L500 326'
// 底图街区：楼（带窗）和绿地（几棵树）
const BLOCKS = [[118, 114, 156, 80, 'b'], [326, 114, 148, 80, 'green'], [118, 246, 156, 88, 'green'], [326, 246, 148, 88, 'b'], [526, 114, 60, 80, 'b'], [14, 246, 50, 88, 'b']]
const pct = (x, y) => ({ left: `${(x / W) * 100}%`, top: `${(y / H) * 100}%` })

function Node({ x, y, children, className = '' }) {
  return <div className={`absolute -translate-x-1/2 -translate-y-1/2 ${className}`} style={pct(x, y)}>{children}</div>
}
function Tag({ children, strong }) {
  return <span className={`block whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold shadow-sm ring-1 md:px-2.5 md:py-1 md:text-[13px] ${strong ? 'bg-ink text-bg ring-ink' : 'bg-surface text-ink ring-line'}`}>{children}</span>
}

// 首屏记忆点：两条路线在驿站交汇，交汇点亮起，订单成立
export function RouteMap() {
  const reduce = useReducedMotion()
  const box = useRef(null)
  const path = useRef(null)
  const inView = useInView(box, { amount: 0.3 })
  const p = useMotionValue(reduce ? 1 : 0)
  const [phase, setPhase] = useState(reduce ? 3 : 0)
  const pt = (v) => {
    const el = path.current
    if (!el) return { x: 90, y: 90 }
    return el.getPointAtLength(v * el.getTotalLength())
  }
  const rx = useTransform(p, (v) => pt(v).x)
  const ry = useTransform(p, (v) => pt(v).y)
  const runLen = useTransform(p, (v) => v)
  const rl = useTransform(rx, (v) => `${(v / W) * 100}%`)
  const rt = useTransform(ry, (v) => `${(v / H) * 100}%`)
  const carry = useTransform(p, (v) => Math.max(0, Math.min(1, (v - 0.5) * 2)))
  useMotionValueEvent(p, 'change', (v) => setPhase(v < 0.499 ? 0 : v < 0.501 ? 1 : v < 0.999 ? 2 : 3))

  useEffect(() => {
    if (reduce || !inView) return
    const c = animate(p, [0, 0, 0.5, 0.5, 1, 1], { duration: 9, times: [0, 0.1, 0.4, 0.58, 0.84, 1], ease: 'easeInOut', repeat: Infinity })
    return () => c.stop()
  }, [reduce, inView, p])

  const lit = phase >= 1
  return (
    <div ref={box} className="relative aspect-[600/440] w-full overflow-hidden rounded-[28px] bg-surface ring-1 ring-line"
      role="img" aria-label="示意地图：你的快递在菜鸟驿站，学弟从一教走回梅园正好经过驿站，顺手捎上，只多走 1 分钟">
      <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 size-full" aria-hidden="true">
        {BLOCKS.map(([x, y, w, h, kind], i) => (
          <g key={i}>
            <rect x={x} y={y} width={w} height={h} rx="16" fill={kind === 'green' ? 'var(--accent-soft)' : 'var(--sunken)'} />
            {kind === 'green'
              ? [0.25, 0.6, 0.85].map((f, k) => <circle key={k} cx={x + w * f} cy={y + h * (k % 2 ? 0.35 : 0.62)} r="9" fill="var(--accent)" fillOpacity="0.28" />)
              : Array.from({ length: Math.floor((w - 24) / 20) * Math.floor((h - 24) / 22) }, (_, k) => {
                const cols = Math.floor((w - 24) / 20)
                return <rect key={k} x={x + 14 + (k % cols) * 20} y={y + 14 + Math.floor(k / cols) * 22} width="9" height="11" rx="2" fill="var(--bg)" opacity="0.9" />
              })}
          </g>
        ))}
        <g stroke="var(--bg)" strokeWidth="22" strokeLinecap="round" fill="none">
          <path d="M40 220 H560 M90 50 V400 M500 50 V400 M90 360 H500 M90 90 H500" />
        </g>
        <g stroke="var(--line)" strokeWidth="1.5" strokeDasharray="2 8" strokeLinecap="round" fill="none">
          <path d="M40 220 H560 M90 50 V400 M500 50 V400 M90 360 H500 M90 90 H500" />
        </g>
        {/* 你的需求：虚线 */}
        <motion.path d={NEED} fill="none" stroke="var(--accent)" strokeWidth="4" strokeDasharray="1 10" strokeLinecap="round"
          initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.6 }} />
        {/* 学弟走过的路 */}
        <path ref={path} d={RUN} fill="none" stroke="none" />
        <motion.path d={RUN} fill="none" stroke="var(--ink)" strokeOpacity="0.8" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" style={{ pathLength: runLen }} />
        {/* 交汇之后：带着你的快递走完，路线变成绿色实线 */}
        <motion.path d={NEED} fill="none" stroke="var(--accent)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" style={{ pathLength: carry }} />
        {/* 交汇点 */}
        <motion.circle cx="300" cy="220" r="34" fill="var(--accent)" initial={false}
          animate={lit && !reduce ? { opacity: [0.35, 0], scale: [0.6, 1.6] } : { opacity: 0 }}
          transition={{ duration: 1.1, ease: 'easeOut' }} style={{ transformOrigin: '300px 220px' }} />
      </svg>

      <Node x={130} y={118}><Tag>一教</Tag></Node>
      <Node x={300} y={220}>
        <motion.div animate={{ scale: lit ? 1.08 : 1 }} transition={{ type: 'spring', stiffness: 400, damping: 18 }}
          className={`grid size-11 place-items-center rounded-full ring-[3px] transition-colors md:size-14 ${lit ? 'bg-accent-soft ring-accent' : 'bg-surface ring-line'}`}>
          <img src={icon('type-express-v1')} width={36} height={36} alt="" className={`size-7 transition-opacity md:size-9 ${phase >= 2 ? 'opacity-30' : ''}`} />
        </motion.div>
      </Node>
      <Node x={300} y={268} className="pt-2 md:pt-3"><Tag strong={lit}>菜鸟驿站</Tag></Node>
      <Node x={500} y={360}>
        <div className={`size-11 overflow-hidden rounded-full bg-surface ring-[3px] transition-colors md:size-14 ${phase === 3 ? 'ring-accent' : 'ring-line'}`}>
          <img src={icon('avatar-poster-v1')} width={56} height={56} alt="" className="size-full object-cover" />
        </div>
      </Node>
      <Node x={500} y={410}><Tag>梅园 5 号楼 · 你</Tag></Node>
      <motion.div className="absolute z-10 -translate-x-1/2 -translate-y-[calc(50%+30px)] md:-translate-y-[calc(50%+46px)]" style={{ left: rl, top: rt }}>
        <div className={`relative size-9 rounded-full bg-surface p-0.5 ring-[3px] shadow-[0_6px_16px_-6px_rgba(17,40,30,0.5)] transition-colors md:size-11 ${phase >= 1 ? 'ring-accent' : 'ring-ink'}`}>
          <img src={icon('avatar-runner-v1')} width={44} height={44} alt="" className="size-full rounded-full object-cover" />
          <AnimatePresence>
            {phase >= 2 && (
              <motion.img key="parcel" src={icon('type-express-v1')} width={28} height={28} alt="" initial={reduce ? false : { scale: 0, y: 8 }} animate={{ scale: 1, y: 0 }} exit={{ opacity: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 20 }} className="absolute -right-3 -top-3 size-6 md:size-7" />
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <AnimatePresence>
        {phase === 0 && !reduce && (
          <motion.div key="a" className="absolute left-[21%] top-[4%] md:top-[5%]" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <p className="rounded-xl bg-surface px-2.5 py-1.5 text-[11px] leading-snug shadow-[0_8px_24px_-12px_rgba(17,40,30,0.4)] ring-1 ring-line md:px-3 md:py-2 md:text-sm">学弟在一教 17:50 下课<br />本来就要走回梅园</p>
          </motion.div>
        )}
        {(phase === 1 || phase === 2) && (
          <motion.div key="b" className="absolute left-[54%] top-[6%] md:top-[8%]" initial={{ opacity: 0, y: 10, scale: 0.92 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6 }} transition={{ type: 'spring', stiffness: 420, damping: 26 }}>
            <div className="rounded-2xl bg-ink px-3 py-2 text-bg shadow-[0_14px_30px_-14px_rgba(17,40,30,0.6)] md:px-4 md:py-3">
              <p className="text-[13px] font-bold md:text-lg">顺路，只多走 1 分钟</p>
              <p className="text-[11px] opacity-80 md:text-sm">学弟接单 · 赏金 ¥5 托管中</p>
            </div>
          </motion.div>
        )}
        {phase === 3 && (
          <motion.div key="c" className="absolute right-[31%] top-[71%] md:right-[24%] md:top-[70%]" initial={reduce ? false : { opacity: 0, y: 10, scale: 0.92 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }} transition={{ type: 'spring', stiffness: 420, damping: 26 }}>
            <div className="rounded-2xl bg-accent px-3 py-2 text-on-accent shadow-[0_14px_30px_-14px_rgba(11,122,85,0.7)] md:px-4 md:py-3">
              <p className="text-[13px] font-bold md:text-lg">送到了</p>
              <p className="tnum text-[11px] opacity-90 md:text-sm">¥5 从托管放给学弟</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function DashUnder({ children }) {
  const reduce = useReducedMotion()
  return (
    <span className="relative inline-block text-accent">
      {children}
      <svg aria-hidden="true" viewBox="0 0 200 20" preserveAspectRatio="none" className="absolute -bottom-[0.16em] left-0 h-[0.16em] w-full overflow-visible">
        <motion.path d="M4 10 H186" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeDasharray="0.1 14"
          initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.8 }} />
        <motion.circle cx="192" cy="10" r="7" fill="currentColor" initial={reduce ? false : { scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 1.1 }} style={{ transformOrigin: '192px 10px' }} />
      </svg>
    </span>
  )
}

export default function RouteHero({ Cta, Anchor }) {
  const reduce = useReducedMotion()
  const line = (i) => ({ initial: reduce ? false : { y: '105%' }, animate: { y: 0 }, transition: { duration: 0.9, delay: 0.1 + i * 0.09, ease } })
  // 副标题和按钮第一帧就在，只做一点位移，不从透明开始
  const fade = (d) => ({ initial: reduce ? false : { y: 10 }, animate: { y: 0 }, transition: { duration: 0.5, delay: d * 0.3, ease } })
  return (
    <section id="top" className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-20 pt-8 md:px-8 md:pb-28 md:pt-14 lg:min-h-[calc(100svh-64px)] lg:grid-cols-12 lg:gap-12 lg:py-10">
      <div className="lg:col-span-5">
        <h1 className="font-display text-[length:clamp(54px,4vw_+_20px,78px)] leading-[1.05]">
          <span className="block overflow-hidden pb-1"><motion.span className="block" {...line(0)}>本来就要经过，</motion.span></span>
          <span className="block overflow-hidden pb-[0.3em]"><motion.span className="block" {...line(1)}><DashUnder>顺手</DashUnder>捎一下</motion.span></span>
        </h1>
        <motion.p {...fade(0.35)} className="mt-6 max-w-[30ch] lg:mt-8 text-lg leading-relaxed text-muted md:text-xl">
          快递在驿站，你在宿舍。总有同学下课正好从驿站走回去，顺手帮你带上。校内实名，赏金先托管。
        </motion.p>
        <motion.div {...fade(0.45)} className="mt-8 flex flex-wrap items-center gap-3">
          <Cta />
          <Anchor to="scenes" className="group inline-flex h-14 items-center gap-2 whitespace-nowrap rounded-full px-5 text-[17px] font-semibold text-ink transition hover:bg-sunken">
            看产品思考<ArrowDown size={18} weight="bold" className="transition-transform group-hover:translate-y-0.5" />
          </Anchor>
        </motion.div>
      </div>
      <motion.div {...fade(0.2)} className="lg:col-span-7">
        <RouteMap />
      </motion.div>
    </section>
  )
}

// 收尾：同一张校园图上，8 个示例单的路线；选一条「我正要走的路」，顺路的单变绿并标出多走几分钟（都是按数据实时算的）
const PX = (x) => 13 + ((x + 600) / 1580) * 74
const PY = (y) => 7 + ((y + 380) / 1280) * 84
const SHORT = { cainiao: '菜鸟驿站', sf: '顺丰点', jd: '京东柜', canteen1: '一食堂', canteen2: '二食堂', market: '教育超市', gate: '北门', lib: '图书馆', jiao1: '一教', hall: '报告厅', gym: '体育馆', zhu3: '竹园', mei5: '梅园', tao2: '桃园', lan1: '兰园', yan: '研究生公寓' }
export const ROUTES = [
  { from: 'jiao1', to: 'mei5', label: '一教下课回梅园' },
  { from: 'jiao1', to: 'lan1', label: '一教去兰园' },
  { from: 'market', to: 'yan', label: '超市回研究生公寓' },
]

export function CampusRoutes() {
  const reduce = useReducedMotion()
  const box = useRef(null)
  const inView = useInView(box, { amount: 0.35 })
  const [ri, setRi] = useState(0)
  const [touched, setTouched] = useState(false)
  useEffect(() => {
    if (reduce || touched || !inView) return
    const id = setInterval(() => setRi((v) => (v + 1) % ROUTES.length), 5200)
    return () => clearInterval(id)
  }, [reduce, touched, inView])
  const R = ROUTES[ri]
  const tasks = seedTasks().map((t) => ({ ...t, m: detourMin(R.from, R.to, t), dm: detourMeters(R.from, R.to, t) }))
  const hits = tasks.filter((t) => t.m <= 5).sort((a, b) => a.m - b.m)
  const pick = (i) => { setTouched(true); setRi(i) }
  return (
    <div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="选一条你正要走的路">
        {ROUTES.map((x, i) => (
          <button key={x.label} onClick={() => pick(i)} aria-pressed={i === ri}
            className={`relative h-10 whitespace-nowrap rounded-full px-4 text-[15px] font-semibold transition-colors ${i === ri ? 'text-bg' : 'bg-surface text-ink ring-1 ring-line'}`}>
            {i === ri && <span className="absolute inset-0 rounded-full bg-ink" />}
            <span className="relative">{x.label}</span>
          </button>
        ))}
      </div>
      <p className="mt-4 max-w-[40ch] text-lg leading-relaxed text-muted md:text-xl" aria-live="polite">
        此刻 {tasks.length} 个示例单里，有 <b className="text-accent">{hits.length} 个</b>顺路，捎上多走 {!hits.length ? 0 : hits[0].m === hits[hits.length - 1].m ? hits[0].m : `${hits[0].m} 到 ${hits[hits.length - 1].m}`} 分钟。
      </p>
      <div ref={box} className="mt-6 hidden md:block"><RouteZoom R={R} hits={hits} reduce={reduce} /></div>
      <div className="mt-6 md:hidden"><RouteZoom R={R} hits={hits} reduce={reduce} ratio={0.82} vertical /></div>
      <SubwayLine R={R} hits={hits} reduce={reduce} />
      <div className="mt-3 hidden flex-wrap gap-x-5 md:flex gap-y-1 text-sm text-muted">
        <span className="inline-flex items-center gap-1.5"><i className="h-1 w-5 rounded-full bg-ink/80" />你正要走的路</span>
        <span className="inline-flex items-center gap-1.5"><i className="h-1.5 w-5 rounded-full bg-accent" />顺路的单</span>
      </div>
    </div>
  )
}

// 手机上的顺路：把你的路画成一根竖着的地铁线，顺路的单按在路上的先后挂成站点
function SubwayLine({ R, hits, reduce }) {
  const a = B[R.from], b = B[R.to]
  const vx = b.x - a.x, vy = b.y - a.y, len2 = vx * vx + vy * vy || 1
  const along = (id) => Math.max(0, Math.min(1, ((B[id].x - a.x) * vx + (B[id].y - a.y) * vy) / len2))
  const stops = [...hits].sort((p, q) => along(p.from) - along(q.from))
  const end = (name, sub) => (
    <li className="relative flex items-center gap-3 py-1">
      <span className="z-10 grid size-6 shrink-0 place-items-center rounded-full bg-ink ring-4 ring-bg"><span className="size-2 rounded-full bg-bg" /></span>
      <span className="text-[15px] font-bold">{name}</span><span className="text-sm text-muted">{sub}</span>
    </li>
  )
  return (
    <div className="mt-3 rounded-[24px] bg-surface p-4 ring-1 ring-line md:hidden">
      <ol key={R.label} className="relative space-y-3">
        <span aria-hidden="true" className="absolute bottom-4 left-[11px] top-4 w-[3px] rounded-full bg-ink/80" />
        {end(SHORT[R.from], '出发')}
        {stops.map((t, i) => (
          <motion.li key={t.id} initial={reduce ? false : { opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ type: 'spring', stiffness: 420, damping: 30, delay: 0.15 + i * 0.12 }}
            className="relative flex items-center gap-3">
            <span className="z-10 ml-[3px] size-[18px] shrink-0 rounded-full bg-accent ring-4 ring-bg" />
            <span className="min-w-0 flex-1 rounded-2xl bg-accent-soft px-3 py-2">
              <span className="block text-[15px] font-semibold leading-snug">{t.title}</span>
              <span className="tnum mt-0.5 block text-sm text-accent">{t.dm ? `多走 ${t.dm} 米` : '就在路上'} · 在{SHORT[t.from]}顺手{{ express: '取', buy: '买', seat: '占', food: '拿', other: '带' }[t.type] || '带'} · ¥{t.reward}</span>
            </span>
          </motion.li>
        ))}
        {end(SHORT[R.to], '到达')}
      </ol>
    </div>
  )
}

// 桌面：镜头缩放到「你的路 + 顺路的单」；底图是和首屏一样的街区，路线沿街走直角；一个小人沿你的路走，经过取件点时那一单弹出来
// 校园底图：每栋楼按真实位置画成不同形状，宿舍是长条、图书馆最大、体育馆是跑道，再加一片湖和草坪
const LANDMARKS = [
  ...BUILDINGS.map((b) => ({
    k: b.id, x: b.x, y: b.y, name: SHORT[b.id],
    kind: b.id === 'gym' ? 'track' : 'block',
    w: b.id === 'gym' ? 300 : b.id === 'lib' ? 230 : b.group === '宿舍区' ? 190 : b.group === '教学区' ? 200 : b.group === '取件点' ? 120 : 150,
    h: b.id === 'gym' ? 170 : b.id === 'lib' ? 150 : b.group === '宿舍区' ? 80 : b.group === '教学区' ? 120 : b.group === '取件点' ? 80 : 100,
  })),
  { k: 'lake', x: -470, y: -60, w: 280, h: 170, kind: 'lake', name: '镜湖' },
  { k: 'lawn', x: 380, y: 380, w: 260, h: 120, kind: 'green', name: '中心草坪' },
  { k: 'lawn2', x: -120, y: 380, w: 200, h: 110, kind: 'green' },
]
export function RouteZoom({ R, hits, reduce, ratio = 2.2, pills = true, vertical = false }) {
  const uid = useId().replace(/:/g, '')
  // 坐标：你的路是一条直线 A→B；竖版（手机）把整张图转到 A 在上、B 在下
  const A0 = B[R.from], B0 = B[R.to]
  const ang = vertical ? Math.PI / 2 - Math.atan2(B0.y - A0.y, B0.x - A0.x) : 0
  const rot = (q) => {
    const dx = q.x - A0.x, dy = q.y - A0.y
    return { x: dx * Math.cos(ang) - dy * Math.sin(ang), y: dx * Math.sin(ang) + dy * Math.cos(ang) }
  }
  const at0 = (id) => rot(B[id])
  const a = at0(R.from), b = at0(R.to)
  const vx = b.x - a.x, vy = b.y - a.y, len2 = vx * vx + vy * vy || 1
  const proj = (q) => Math.max(0, Math.min(1, ((q.x - a.x) * vx + (q.y - a.y) * vy) / len2))
  const foot = (q) => { const t = proj(q); return { x: a.x + vx * t, y: a.y + vy * t } }
  const along = (id) => Math.max(0.03, Math.min(0.97, proj(at0(id))))
  const ids = [R.from, R.to, ...hits.flatMap((t) => [t.from, t.to])]
  const pts = ids.map(at0)
  let x0 = Math.min(...pts.map((q) => q.x)), x1 = Math.max(...pts.map((q) => q.x))
  let y0 = Math.min(...pts.map((q) => q.y)), y1 = Math.max(...pts.map((q) => q.y))
  const pw = Math.max(x1 - x0, 260) * 0.14 + 80, ph = Math.max(y1 - y0, 160) * 0.14 + 80
  x0 -= pw; x1 += pw; y0 -= ph; y1 += ph
  const w = x1 - x0, h = y1 - y0
  if (w / h > ratio) { const d = (w / ratio - h) / 2; y0 -= d; y1 += d } else { const d = (h * ratio - w) / 2; x0 -= d; x1 += d }
  const X = (x) => ((x - x0) / (x1 - x0)) * 100
  const Y = (y) => ((y - y0) / (y1 - y0)) * 100
  const PQ = (q) => [X(q.x), Y(q.y)]
  const P = (id) => PQ(at0(id))
  const key = new Set(ids)
  const [p, setP] = useState(reduce ? 1 : 0)
  useEffect(() => {
    if (reduce) return
    setP(0)
    const c = animate(0, 1, { duration: 2.8, delay: 0.6, ease: 'easeInOut', onUpdate: setP })
    return () => c.stop()
  }, [R.label, reduce])
  const sp = { type: 'spring', stiffness: 150, damping: 26 }
  const me = { x: a.x + vx * p, y: a.y + vy * p }
  // 标签放在离你的路更远的一侧；太挤就换边，两边都挤只留圆点
  const sideOf = (q) => (((q.x - a.x) * vy - (q.y - a.y) * vx) >= 0 ? 1 : -1)
  const placed = []
  const labelSide = {}
  const near = (q, s) => placed.some((o) => Math.abs(o.x - q[0]) < (ratio < 1.5 ? 26 : 11) && Math.abs(o.y - (q[1] + s * 7)) < (ratio < 1.5 ? 6 : 7))
  ;[R.from, R.to, ...ids.filter((i) => i !== R.from && i !== R.to)].forEach((id) => {
    if (labelSide[id] !== undefined) return
    const q = P(id)
    let s = id === R.from ? -1 : id === R.to ? 1 : (vertical ? sideOf(at0(id)) : (Y(at0(id).y) < Y(foot(at0(id)).y) ? -1 : 1))
    if (near(q, s)) s = -s
    if (near(q, s) && id !== R.from && id !== R.to) { labelSide[id] = 0; return }
    labelSide[id] = s
    placed.push({ x: q[0], y: q[1] + s * 7 })
  })
  const side = (id) => labelSide[id] || 1
  // 竖版：价签挨个找空位（左边 / 右下 / 右上），和标签、别的价签都不重叠；实在放不下就不放，下面列表里有价格
  const pillPos = {}
  if (vertical) {
    const boxes = []
    const hit = (b) => b.x0 < 1 || b.x1 > 99 || boxes.some((o) => b.x0 < o.x1 && b.x1 > o.x0 && b.y0 < o.y1 && b.y1 > o.y0)
    ;[...key].forEach((id) => {
      const q = P(id)
      const w2 = SHORT[id].length * 3.6 + 5
      if (id === R.from) boxes.push({ x0: q[0] - w2 / 2, x1: q[0] + w2 / 2, y0: q[1] - 9, y1: q[1] - 2 })
      else if (id === R.to) boxes.push({ x0: q[0] - w2 / 2, x1: q[0] + w2 / 2, y0: q[1] + 2, y1: q[1] + 9 })
      else boxes.push({ x0: q[0] + 2, x1: q[0] + 2 + w2, y0: q[1] - 3, y1: q[1] + 3 })
      boxes.push({ x0: q[0] - 3, x1: q[0] + 3, y0: q[1] - 3, y1: q[1] + 3 })
    })
    ;[...hits].sort((m, n) => P(m.from)[1] - P(n.from)[1]).forEach((t) => {
      const q = P(t.from)
      const pw2 = 30
      const cands = [
        ['left', { x0: q[0] - 3 - pw2, x1: q[0] - 3, y0: q[1] - 3, y1: q[1] + 3 }],
        ['below', { x0: q[0] + 2, x1: q[0] + 2 + pw2, y0: q[1] + 3.5, y1: q[1] + 9.5 }],
        ['above', { x0: q[0] + 2, x1: q[0] + 2 + pw2, y0: q[1] - 9.5, y1: q[1] - 3.5 }],
      ]
      const ok = cands.find(([, b]) => !hit(b))
      if (ok) { pillPos[t.id] = ok[0]; boxes.push(ok[1]) }
    })
  }

  return (
    <div className="relative max-h-[560px] w-full overflow-hidden rounded-[24px] bg-surface ring-1 ring-line md:rounded-[28px]" style={{ aspectRatio: ratio }}
      role="img" aria-label={`示意地图：沿「${R.label}」这条路，${hits.length} 个示例单顺路`}>
      <svg className="absolute inset-0 size-full opacity-45" aria-hidden="true">
        <defs>
          <pattern id={`blk${uid}`} width="120" height="96" patternUnits="userSpaceOnUse">
            <rect x="10" y="10" width="100" height="76" rx="12" fill="var(--sunken)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#blk${uid})`} />
      </svg>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full" aria-hidden="true">
        {LANDMARKS.map((m) => {
          const c = rot(m)
          const w2 = (m.w / (x1 - x0)) * 100, h2 = (m.h / (y1 - y0)) * 100
          const cx = X(c.x), cy = Y(c.y)
          if (m.kind === 'lake') return <ellipse key={m.k} cx={cx} cy={cy} rx={w2 / 2} ry={h2 / 2} fill="#d9e6e1" />
          if (m.kind === 'track') return <rect key={m.k} x={cx - w2 / 2} y={cy - h2 / 2} width={w2} height={h2} rx={w2 / 2} ry={h2 / 2} fill="var(--accent-soft)" />
          return <rect key={m.k} x={cx - w2 / 2} y={cy - h2 / 2} width={w2} height={h2} rx="1.2" ry={1.2 * (x1 - x0) / (y1 - y0)} fill={m.kind === 'green' ? 'var(--accent-soft)' : '#dfe3df'} stroke="var(--surface)" strokeWidth="3" vectorEffect="non-scaling-stroke" />
        })}
        {/* 你的路：一条直线 */}
        <motion.line initial={false} animate={{ x1: X(a.x), y1: Y(a.y), x2: X(b.x), y2: Y(b.y) }} transition={sp}
          stroke="var(--ink)" strokeOpacity="0.85" strokeWidth="5" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
        {hits.map((t) => {
          const P1 = at0(t.from), D1 = at0(t.to), F1 = foot(P1), F2 = foot(D1)
          const lit = p >= along(t.from)
          return (
            <g key={t.id} opacity={lit ? 1 : 0.25}>
              {/* 包裹跟着你走的那一段：压在你的路上 */}
              <line x1={X(F1.x)} y1={Y(F1.y)} x2={X(F2.x)} y2={Y(F2.y)} stroke="var(--accent)" strokeWidth="8" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
              {/* 多走的那一点：从你的路岔出去再回来 */}
              {Math.hypot(P1.x - F1.x, P1.y - F1.y) > 12 && <line x1={X(F1.x)} y1={Y(F1.y)} x2={X(P1.x)} y2={Y(P1.y)} stroke="var(--accent)" strokeWidth="4" strokeDasharray="1 7" vectorEffect="non-scaling-stroke" strokeLinecap="round" />}
              {t.from !== t.to && Math.hypot(D1.x - F2.x, D1.y - F2.y) > 12 && <line x1={X(F2.x)} y1={Y(F2.y)} x2={X(D1.x)} y2={Y(D1.y)} stroke="var(--accent)" strokeWidth="4" strokeDasharray="1 7" vectorEffect="non-scaling-stroke" strokeLinecap="round" />}
            </g>
          )
        })}
      </svg>
      {!vertical && LANDMARKS.filter((m) => m.name && !key.has(m.k) && X(rot(m).x) > 6 && X(rot(m).x) < 94 && Y(rot(m).y) > 7 && Y(rot(m).y) < 93).map((m) => (
        <motion.span key={m.k} initial={false} animate={{ left: `${X(rot(m).x)}%`, top: `${Y(rot(m).y)}%` }} transition={sp}
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-[10px] font-semibold text-muted/70 md:text-xs">{m.name}</motion.span>
      ))}
      {hits.filter((t) => t.from === t.to).map((t) => (
        <motion.span key={t.id} aria-hidden="true" initial={false} animate={{ left: `${P(t.from)[0]}%`, top: `${P(t.from)[1]}%`, opacity: p >= along(t.from) ? 1 : 0.3 }} transition={sp}
          className="absolute size-9 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-soft/60 ring-4 ring-accent md:size-12 md:ring-[5px]" />
      ))}
      {[...key].map((id) => {
        const end = id === R.from || id === R.to
        return (
          <motion.span key={id} initial={false} animate={{ left: `${P(id)[0]}%`, top: `${P(id)[1]}%` }} transition={sp} className="absolute z-10">
            <span className={`absolute left-0 top-0 block size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-4 ring-surface ${end ? 'bg-ink' : 'bg-accent'}`} />
            {(vertical || labelSide[id] !== 0) && <span className={`absolute whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold shadow-sm md:px-2.5 md:text-[13px] ${end ? 'bg-ink text-bg' : 'bg-surface text-ink ring-1 ring-line'} ${vertical ? (id === R.from ? 'bottom-3 left-0 -translate-x-1/2' : id === R.to ? 'left-0 top-3 -translate-x-1/2' : 'left-3 top-0 -translate-y-1/2') : `left-0 -translate-x-1/2 ${side(id) < 0 ? 'bottom-3' : 'top-3'}`}`}>{SHORT[id]}</span>}
          </motion.span>
        )
      })}
      <AnimatePresence>
        {pills && hits.filter((t) => p >= along(t.from) && (!vertical || pillPos[t.id])).map((t) => {
          const q = P(t.from)
          const s = -side(t.from)
          return (
            <span key={R.label + t.id} style={{ left: `${q[0]}%`, top: `${q[1]}%` }} className={`absolute z-20 ${vertical ? { left: '-translate-x-[calc(100%+12px)] -translate-y-1/2', below: 'translate-x-2 translate-y-[12px]', above: 'translate-x-2 -translate-y-[calc(100%+12px)]' }[pillPos[t.id]] : `-translate-x-1/2 ${s < 0 ? '-translate-y-[calc(100%+12px)]' : 'translate-y-[12px]'}`}`}>
              <motion.span initial={reduce ? false : { opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 420, damping: 24 }}
                className="tnum block whitespace-nowrap rounded-full bg-accent px-2 py-0.5 text-[11px] font-bold text-on-accent shadow-[0_8px_18px_-8px_rgba(11,122,85,0.7)] md:px-3 md:py-1 md:text-sm">
              ¥{t.reward} · {t.dm ? `+${t.dm} 米` : '就在路上'}
            </motion.span>
            </span>
          )
        })}
      </AnimatePresence>
      {!reduce && p > 0 && p < 1 && (
        <span aria-hidden="true" className="absolute z-30 grid size-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-surface shadow-[0_6px_16px_-6px_rgba(17,40,30,0.5)] ring-[3px] ring-ink md:size-10"
          style={{ left: `${X(me.x)}%`, top: `${Y(me.y)}%` }}>
          <img src={icon('avatar-runner-v1')} width={32} height={32} alt="" className="size-6 rounded-full md:size-8" />
        </span>
      )}
    </div>
  )
}
