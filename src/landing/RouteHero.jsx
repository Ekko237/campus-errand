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

// 收尾：同一张校园图上，8 个示例单的路线；选一条「我正要走的路」，顺路的单变绿并标出多走几分钟（都是按数据实时算的）
const PX = (x) => 13 + ((x + 600) / 1580) * 74
const PY = (y) => 7 + ((y + 380) / 1280) * 84
const SHORT = { cainiao: '菜鸟驿站', sf: '顺丰点', jd: '京东柜', canteen1: '一食堂', canteen2: '二食堂', market: '教育超市', gate: '北门', lib: '图书馆', jiao1: '一教', hall: '报告厅', gym: '体育馆', zhu3: '竹园', mei5: '梅园', tao2: '桃园', lan1: '兰园', yan: '研究生公寓' }
const ROUTES = [
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
  const tasks = seedTasks().map((t) => ({ ...t, m: detourMin(R.from, R.to, t) }))
  const hits = tasks.filter((t) => t.m <= 5).sort((a, b) => a.m - b.m)
  const pick = (i) => { setTouched(true); setRi(i) }
  return (
    <div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="选一条你正要走的路">
        {ROUTES.map((x, i) => (
          <button key={x.label} onClick={() => pick(i)} aria-pressed={i === ri}
            className={`relative h-10 whitespace-nowrap rounded-full px-4 text-[15px] font-semibold transition-colors ${i === ri ? 'text-bg' : 'bg-surface text-ink ring-1 ring-line'}`}>
            {i === ri && <motion.span layoutId="route-chip" transition={{ type: 'spring', stiffness: 420, damping: 34 }} className="absolute inset-0 rounded-full bg-ink" />}
            <span className="relative">{x.label}</span>
          </button>
        ))}
      </div>
      <p className="mt-4 max-w-[40ch] text-lg leading-relaxed text-muted md:text-xl" aria-live="polite">
        此刻 {tasks.length} 个示例单里，有 <b className="text-accent">{hits.length} 个</b>顺路，捎上多走 {!hits.length ? 0 : hits[0].m === hits[hits.length - 1].m ? hits[0].m : `${hits[0].m} 到 ${hits[hits.length - 1].m}`} 分钟。
      </p>
      <div ref={box} className="relative mt-6 hidden w-full overflow-hidden rounded-[28px] bg-surface ring-1 ring-line md:block md:aspect-[4/3] lg:aspect-[2/1]"
        style={{ backgroundImage: 'linear-gradient(var(--bg) 2px, transparent 2px), linear-gradient(90deg, var(--bg) 2px, transparent 2px)', backgroundSize: '56px 56px' }}
        role="img" aria-label={`示意地图：沿「${R.label}」这条路，${hits.length} 个示例单顺路`}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full" aria-hidden="true">
          {tasks.filter((t) => t.from !== t.to).map((t) => {
            const hit = t.m <= 5
            return (
              <motion.line key={t.id} x1={PX(B[t.from].x)} y1={PY(B[t.from].y)} x2={PX(B[t.to].x)} y2={PY(B[t.to].y)} vectorEffect="non-scaling-stroke" strokeLinecap="round"
                initial={false} animate={{ stroke: hit ? 'var(--accent)' : 'var(--line)', strokeWidth: hit ? 6 : 2.5 }} transition={{ duration: 0.4 }} />
            )
          })}
          <motion.line key={R.label} x1={PX(B[R.from].x)} y1={PY(B[R.from].y)} x2={PX(B[R.to].x)} y2={PY(B[R.to].y)} vectorEffect="non-scaling-stroke" stroke="var(--ink)" strokeWidth="3.5" strokeDasharray="1 9" strokeLinecap="round"
            initial={reduce ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.7, ease }} />
        </svg>
        {tasks.filter((t) => t.from === t.to).map((t) => (
          <motion.span key={t.id} aria-hidden="true" className="absolute size-9 -translate-x-1/2 -translate-y-1/2 rounded-full md:size-11" style={{ left: `${PX(B[t.from].x)}%`, top: `${PY(B[t.from].y)}%` }}
            initial={false} animate={{ boxShadow: t.m <= 5 ? 'inset 0 0 0 4px var(--accent)' : 'inset 0 0 0 2px var(--line)' }} />
        ))}
        {BUILDINGS.map((b) => {
          const mine = b.id === R.from || b.id === R.to
          return (
            <span key={b.id} className={`absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 transition-colors md:text-[13px] ${mine ? 'z-10 bg-ink text-bg ring-ink' : 'bg-surface/95 text-muted ring-line'}`}
              style={{ left: `${PX(b.x)}%`, top: `${PY(b.y)}%` }}>{SHORT[b.id]}</span>
          )
        })}
        <AnimatePresence mode="popLayout">
          {hits.map((t, i) => (
            <motion.span key={R.label + t.id} initial={reduce ? false : { opacity: 0, y: 6, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, transition: { duration: 0.15 } }}
              transition={{ type: 'spring', stiffness: 420, damping: 24, delay: 0.5 + i * 0.18 }}
              className={`tnum absolute z-20 hidden -translate-x-1/2 whitespace-nowrap rounded-full bg-accent px-2.5 py-1 text-sm font-bold text-on-accent shadow-[0_8px_18px_-8px_rgba(11,122,85,0.7)] md:block ${i % 2 ? 'translate-y-[70%]' : '-translate-y-[170%]'}`}
              style={{ left: `${PX(B[t.from].x)}%`, top: `${PY(B[t.from].y)}%` }}>¥{t.reward} · 多走 {t.m} 分钟</motion.span>
          ))}
        </AnimatePresence>
      </div>
      <SubwayLine R={R} hits={hits} reduce={reduce} />
      <div className="mt-3 hidden flex-wrap gap-x-5 md:flex gap-y-1 text-sm text-muted">
        <span className="inline-flex items-center gap-1.5"><i className="h-1 w-5 rounded-full bg-ink/80" />你正要走的路</span>
        <span className="inline-flex items-center gap-1.5"><i className="h-1.5 w-5 rounded-full bg-accent" />顺路的单</span>
        <span className="inline-flex items-center gap-1.5"><i className="h-0.5 w-5 rounded-full bg-line" />不顺路</span>
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
    <div className="mt-6 rounded-[24px] bg-surface p-4 ring-1 ring-line md:hidden">
      <ol key={R.label} className="relative space-y-3">
        <span aria-hidden="true" className="absolute bottom-4 left-[11px] top-4 w-[3px] rounded-full bg-ink/80" />
        {end(SHORT[R.from], '出发')}
        {stops.map((t, i) => (
          <motion.li key={t.id} initial={reduce ? false : { opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ type: 'spring', stiffness: 420, damping: 30, delay: 0.15 + i * 0.12 }}
            className="relative flex items-center gap-3">
            <span className="z-10 ml-[3px] size-[18px] shrink-0 rounded-full bg-accent ring-4 ring-bg" />
            <span className="min-w-0 flex-1 rounded-2xl bg-accent-soft px-3 py-2">
              <span className="block text-[15px] font-semibold leading-snug">{t.title}</span>
              <span className="tnum mt-0.5 block text-sm text-accent">在{SHORT[t.from]}顺手{{ express: '取', buy: '买', seat: '占', food: '拿', other: '带' }[t.type] || '带'} · 多走 {t.m} 分钟 · ¥{t.reward}</span>
            </span>
          </motion.li>
        ))}
        {end(SHORT[R.to], '到达')}
      </ol>
    </div>
  )
}
