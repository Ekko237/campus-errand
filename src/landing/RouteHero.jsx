import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion, useMotionValue, useTransform, useMotionValueEvent, useInView, animate } from 'motion/react'
import { ArrowDown } from '@phosphor-icons/react'
import { B, BUILDINGS, seedTasks, detourMin } from '../data'

const ease = [0.16, 1, 0.3, 1]
const icon = (name) => `${import.meta.env.BASE_URL}icons/${name}.webp`
const W = 600, H = 440
// 学弟下课的路：一教 → 驿站 → 梅园。驿站正好在他的路上，走到一半（p = 0.5）
const RUN = 'M90 90 L90 220 L500 220 L500 326'
// 你的需求：驿站 → 梅园，和他后半程完全重合
const NEED = 'M300 220 L500 220 L500 326'
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
        <g fill="var(--sunken)">
          <rect x="118" y="114" width="156" height="80" rx="16" />
          <rect x="326" y="114" width="148" height="80" rx="16" />
          <rect x="118" y="246" width="156" height="88" rx="16" />
          <rect x="326" y="246" width="148" height="88" rx="16" />
          <rect x="526" y="114" width="60" height="80" rx="16" />
          <rect x="14" y="246" width="50" height="88" rx="16" />
        </g>
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
          <motion.div key="c" className="absolute right-[22%] top-[71%] md:right-[21%] md:top-[70%]" initial={reduce ? false : { opacity: 0, y: 10, scale: 0.92 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }} transition={{ type: 'spring', stiffness: 420, damping: 26 }}>
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
    <section id="top" className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-20 pt-8 md:px-8 md:pb-28 md:pt-14 lg:grid-cols-12 lg:gap-12">
      <div className="lg:col-span-5">
        <h1 className="text-[46px] font-bold leading-[1.08] tracking-[-0.035em] md:text-[clamp(56px,6.4vw,76px)] lg:text-[clamp(48px,4.6vw,68px)]">
          <span className="block overflow-hidden pb-1"><motion.span className="block" {...line(0)}>本来就要经过，</motion.span></span>
          <span className="block overflow-hidden pb-[0.3em]"><motion.span className="block" {...line(1)}><DashUnder>顺手</DashUnder>捎一下</motion.span></span>
        </h1>
        <motion.p {...fade(0.35)} className="mt-4 max-w-[30ch] text-lg leading-relaxed text-muted md:text-xl">
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

// 收尾：同一张校园图上，8 个示例单的路线依次亮起；对「一教下课回梅园」顺路的，变绿并标出多走几分钟
const MX = (x) => 70 + ((x + 600) / 1580) * 860
const MY = (y) => 60 + ((y + 380) / 1280) * 600
const ME = { from: 'jiao1', to: 'mei5' }
const curve = (a, b) => {
  const x1 = MX(a.x), y1 = MY(a.y), x2 = MX(b.x), y2 = MY(b.y)
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, dx = x2 - x1, dy = y2 - y1
  return `M${x1} ${y1} Q${mx - dy * 0.18} ${my + dx * 0.18} ${x2} ${y2}`
}
const SHORT = { cainiao: '菜鸟驿站', sf: '顺丰点', jd: '京东柜', canteen1: '一食堂', canteen2: '二食堂', market: '超市', gate: '北门', lib: '图书馆', jiao1: '一教', hall: '报告厅', gym: '体育馆', zhu3: '竹园', mei5: '梅园', tao2: '桃园', lan1: '兰园', yan: '研究生公寓' }

export function CampusRoutes() {
  const reduce = useReducedMotion()
  const box = useRef(null)
  const inView = useInView(box, { amount: 0.35, once: true })
  const on = reduce || inView
  const tasks = seedTasks().map((t) => ({ ...t, m: detourMin(ME.from, ME.to, t) }))
  const hits = tasks.filter((t) => t.m <= 5)
  const ends = new Set(tasks.flatMap((t) => [t.from, t.to]).concat([ME.from, ME.to]))
  const runner = `M${MX(B.jiao1.x)} ${MY(B.jiao1.y)} L${MX(B.cainiao.x)} ${MY(B.cainiao.y)} L${MX(B.mei5.x)} ${MY(B.mei5.y)}`
  return (
    <div>
      <p className="max-w-[40ch] text-lg leading-relaxed text-muted md:text-xl">
        以「一教下课回梅园」为例：此刻 {tasks.length} 个示例单里，有 <b className="text-accent">{hits.length} 个</b>顺路，捎上最多多走 5 分钟。
      </p>
      <div ref={box} className="relative mt-8 aspect-[1000/720] w-full overflow-hidden rounded-[20px] bg-surface ring-1 ring-line md:rounded-[28px]"
        role="img" aria-label={`示意地图：${tasks.length} 个示例单的路线，其中 ${hits.length} 个对一教回梅园的路线顺路`}>
        <svg viewBox="0 0 1000 720" className="absolute inset-0 size-full" aria-hidden="true">
          {BUILDINGS.map((b) => <circle key={b.id} cx={MX(b.x)} cy={MY(b.y)} r={ends.has(b.id) ? 7 : 5} fill="var(--line)" />)}
          {tasks.map((t, i) => {
            const hit = t.m <= 5
            const d = { initial: reduce ? false : { pathLength: 0, opacity: 0 }, animate: on ? { pathLength: 1, opacity: 1 } : {}, transition: { duration: 0.8, delay: 0.2 + i * 0.18, ease } }
            if (t.from === t.to) {
              return <motion.circle key={t.id} cx={MX(B[t.from].x)} cy={MY(B[t.from].y)} r={hit ? 18 : 14} fill="none" stroke={hit ? 'var(--accent)' : 'var(--muted)'} strokeOpacity={hit ? 1 : 0.35} strokeWidth={hit ? 5 : 2} {...d} />
            }
            return <motion.path key={t.id} d={curve(B[t.from], B[t.to])} fill="none" stroke={hit ? 'var(--accent)' : 'var(--muted)'} strokeOpacity={hit ? 1 : 0.35} strokeWidth={hit ? 6 : 2.5} strokeLinecap="round" {...d} />
          })}
          <motion.path d={runner} fill="none" stroke="var(--ink)" strokeWidth="4" strokeDasharray="2 10" strokeLinecap="round"
            initial={reduce ? false : { opacity: 0 }} animate={on ? { opacity: 0.8 } : {}} transition={{ duration: 0.6, delay: 0.1 }} />
        </svg>
        {[...ends].map((id) => (
          <span key={id} className={`absolute -translate-x-1/2 translate-y-2.5 whitespace-nowrap text-[11px] font-semibold md:text-[13px] ${id === ME.from || id === ME.to ? 'text-ink' : 'hidden text-muted sm:block'}`}
            style={{ left: `${MX(B[id].x) / 10}%`, top: `${(MY(B[id].y) / 720) * 100}%` }}>{SHORT[id]}</span>
        ))}
        {hits.map((t, i) => (
          <motion.span key={t.id} initial={reduce ? false : { opacity: 0, y: 6, scale: 0.9 }} animate={on ? { opacity: 1, y: 0, scale: 1 } : {}} transition={{ type: 'spring', stiffness: 420, damping: 24, delay: 0.4 + tasks.length * 0.18 + i * 0.15 }}
            className={`tnum absolute hidden -translate-x-1/2 whitespace-nowrap md:block rounded-full bg-accent px-2 py-0.5 text-[10px] md:px-2.5 md:py-1 ${i % 2 ? 'translate-y-[60%]' : '-translate-y-[160%]'} font-bold text-on-accent shadow-[0_8px_18px_-8px_rgba(11,122,85,0.7)] md:text-sm`}
            style={{ left: `${MX(B[t.from].x) / 10}%`, top: `${(MY(B[t.from].y) / 720) * 100}%` }}>¥{t.reward} · 多走 {t.m} 分钟</motion.span>
        ))}
        </div>
      <ul className="mt-4 space-y-2 md:hidden">
        {hits.map((t) => (
          <li key={t.id} className="flex items-center gap-3 rounded-2xl bg-surface p-3 ring-1 ring-line">
            <span className="tnum shrink-0 rounded-full bg-accent px-2.5 py-1 text-sm font-bold text-on-accent">多走 {t.m} 分钟</span>
            <span className="min-w-0 truncate text-[15px] font-medium">{t.title}</span>
            <span className="tnum ml-auto shrink-0 font-bold">¥{t.reward}</span>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted">
          <span className="inline-flex items-center gap-1.5"><i className="h-1 w-5 rounded-full bg-ink/80" />你的路</span>
          <span className="inline-flex items-center gap-1.5"><i className="h-1.5 w-5 rounded-full bg-accent" />顺路的单</span>
          <span className="inline-flex items-center gap-1.5"><i className="h-0.5 w-5 rounded-full bg-muted/40" />不顺路</span>
      </div>
    </div>
  )
}
