import { Link } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion, useMotionValue, useTransform, useMotionValueEvent, useInView, animate } from 'motion/react'
import { ArrowDown } from '@phosphor-icons/react'
import { seedTasks, detourMin, detourMeters } from '../data'
import { routePath, PLACES } from '../campusMap'
import CampusMap, { SHORT, along } from './CampusMap'

const ease = [0.16, 1, 0.3, 1]
const icon = (name) => `${import.meta.env.BASE_URL}icons/${name}.webp`
// 首屏地图就是全校地图（campus-map-v2）的局部放大：同一张图、同一套坐标、同一个寻路，和下面的全景永远对得上
// 视窗：桌面裁成横幅，上下裁切线落在路上；手机屏窄，用整张图的高度，地图高一些、标签不挤
const WIDE = { X0: 40, Y0: 72, VW: 1360, VH: 736 }
const TALL = { X0: 115, Y0: 0, VW: 1300, VH: 900 }
let V = WIDE
const toD = (pts) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ')
// 阿远下课的路：一教 → 沿主路往西 → 梅园；驿站门口就在这条路边
const RUN_PTS = routePath('jiao1', 'mei5').pts
const RUN = toD(RUN_PTS)
// 你的需求：驿站 → 梅园
const NEED = toD(routePath('cainiao', 'mei5').pts)
const STATION = [PLACES.cainiao.door[0], RUN_PTS[1][1]]
// 阿远走到驿站门口那一刻，在整条路上的位置
const F = (() => { let acc = 0; for (let i = 1; i < RUN_PTS.length; i++) { const [ax, ay] = RUN_PTS[i - 1], [bx, by] = RUN_PTS[i]; const l = Math.hypot(bx - ax, by - ay); if (ay === STATION[1] && by === STATION[1] && (STATION[0] - ax) * (STATION[0] - bx) <= 0) return (acc + Math.abs(STATION[0] - ax)) / routePath('jiao1', 'mei5').len; acc += l } return 0.2 })()
const pct = (x, y) => ({ left: `${((x - V.X0) / V.VW) * 100}%`, top: `${((y - V.Y0) / V.VH) * 100}%` })
const MEI = [260, 438] // 「你」在梅园 5 号楼里
const ICHI = [1215, 158] // 一教的名牌：贴在一教楼上、起点正上方，阿远头像往左走时碰不到它

function Node({ x, y, children, className = '' }) {
  return <div className={`absolute -translate-x-1/2 -translate-y-1/2 ${className}`} style={pct(x, y)}>{children}</div>
}
function Tag({ children, strong }) {
  return <span className={`block whitespace-nowrap rounded-full px-2 py-0.5 text-[12px] font-semibold shadow-sm ring-1 md:px-2.5 md:py-1 md:text-[13px] ${strong ? 'bg-ink text-bg ring-ink' : 'bg-surface text-ink ring-line'}`}>{children}</span>
}

// 首屏记忆点：阿远的路经过驿站，交汇点亮起，订单成立
export function RouteMap() {
  const reduce = useReducedMotion()
  // 手机和桌面用不同视窗；渲染前定好，子组件 Node 都按它算位置
  const [small, setSmall] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 639px)').matches)
  useEffect(() => { const m = window.matchMedia('(max-width: 639px)'); const f = () => setSmall(m.matches); m.addEventListener('change', f); return () => m.removeEventListener('change', f) }, [])
  V = small ? TALL : WIDE
  const box = useRef(null)
  const path = useRef(null)
  const inView = useInView(box, { amount: 0.3 })
  const p = useMotionValue(reduce ? 1 : 0)
  const [phase, setPhase] = useState(reduce ? 3 : 0)
  const pt = (v) => {
    const el = path.current
    if (!el) return { x: RUN_PTS[0][0], y: RUN_PTS[0][1] }
    return el.getPointAtLength(v * el.getTotalLength())
  }
  const rx = useTransform(p, (v) => pt(v).x)
  const ry = useTransform(p, (v) => pt(v).y)
  const runLen = useTransform(p, (v) => v)
  const rl = useTransform(rx, (v) => `${((v - V.X0) / V.VW) * 100}%`)
  const rt = useTransform(ry, (v) => `${((v - V.Y0) / V.VH) * 100}%`)
  const carry = useTransform(p, (v) => Math.max(0, Math.min(1, (v - F) / (1 - F))))
  useMotionValueEvent(p, 'change', (v) => setPhase(v < F - 0.001 ? 0 : v < F + 0.001 ? 1 : v < 0.999 ? 2 : 3))

  useEffect(() => {
    if (reduce || !inView) return
    const c = animate(p, [0, 0, F, F, 1, 1], { duration: 9, times: [0, 0.1, 0.3, 0.48, 0.84, 1], ease: 'easeInOut', repeat: Infinity })
    return () => c.stop()
  }, [reduce, inView, p])

  const lit = phase >= 1
  return (
    <div ref={box} className="relative -mx-4 aspect-[1300/900] w-[calc(100%+2rem)] sm:aspect-[85/46] overflow-hidden bg-surface sm:mx-0 sm:w-full sm:rounded-[28px] sm:ring-1 sm:ring-line"
      role="img" aria-label="示意地图：你的快递在菜鸟驿站，阿远从一教走回梅园正好经过驿站门口，顺手捎上，只多走 1 分钟">
      <svg viewBox={`${V.X0} ${V.Y0} ${V.VW} ${V.VH}`} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full" aria-hidden="true">
        <image href={`${import.meta.env.BASE_URL}images/campus-map-v2.webp`} x="0" y="0" width="1600" height="900" />
        {/* 你的需求：驿站到梅园，绿色点线 */}
        <motion.path d={NEED} fill="none" stroke="var(--accent)" strokeWidth="10" strokeDasharray="2 20" strokeLinecap="round" strokeLinejoin="round"
          initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.6 }} />
        <path ref={path} d={RUN} fill="none" stroke="none" />
        {/* 「一教 出发」名牌到起点的一条引线 */}
        <path d={`M${ICHI[0] + 18} ${ICHI[1] + 26} L${RUN_PTS[0][0] - 6} ${RUN_PTS[0][1] - 14}`} fill="none" stroke="var(--ink)" strokeOpacity="0.55" strokeWidth="4" strokeDasharray="1 10" strokeLinecap="round" />
        {/* 整条路一直淡淡地画着，动画只是把它描深 */}
        <path d={RUN} fill="none" stroke="var(--ink)" strokeOpacity="0.3" strokeWidth="10" strokeDasharray="4 18" strokeLinecap="round" strokeLinejoin="round" />
        <motion.path d={RUN} fill="none" stroke="var(--ink)" strokeOpacity="0.9" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" style={{ pathLength: runLen }} />
        {/* 交汇之后：带着你的快递走完，变成绿色实线 */}
        {/* 绿线细一号压在黑线中间：黑色「本来就要走的路」一直看得见，绿色是「捎着你的快递」的那一段 */}
        <motion.path d={NEED} fill="none" stroke="var(--accent)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" style={{ pathLength: carry }} />
        <motion.circle cx={STATION[0]} cy={STATION[1]} r="70" fill="var(--accent)" initial={false}
          animate={lit && !reduce ? { opacity: [0.35, 0], scale: [0.6, 1.6] } : { opacity: 0 }}
          transition={{ duration: 1.1, ease: 'easeOut' }} style={{ transformOrigin: `${STATION[0]}px ${STATION[1]}px` }} />
      </svg>

      <Node x={RUN_PTS[0][0]} y={RUN_PTS[0][1]}><span className="block size-3 rounded-full bg-ink ring-4 ring-surface md:size-4" /></Node>
      <Node x={ICHI[0]} y={ICHI[1]} className="z-20 max-sm:-translate-y-[85%]"><Tag>一教 出发</Tag></Node>
      <Node x={PLACES.cainiao.door[0]} y={PLACES.cainiao.door[1] + 22}>
        <motion.div animate={{ scale: lit ? 1.08 : 1 }} transition={{ type: 'spring', stiffness: 400, damping: 18 }}
          className={`grid size-10 place-items-center rounded-full ring-[3px] transition-colors md:size-14 ${lit ? 'bg-accent-soft ring-accent' : 'bg-surface ring-line'}`}>
          <img src={icon('type-express-v1')} width={36} height={36} alt="" className={`size-6 transition-opacity md:size-9 ${phase >= 2 ? 'opacity-30' : ''}`} />
        </motion.div>
      </Node>
      <Node x={PLACES.cainiao.door[0]} y={PLACES.cainiao.door[1] + 112} className="z-20"><Tag strong={lit}>菜鸟驿站</Tag></Node>
      <Node x={MEI[0]} y={MEI[1]}>
        <div className={`relative size-10 rounded-full bg-surface ring-[3px] transition-colors md:size-14 ${phase === 3 ? 'ring-accent' : 'ring-line'}`}>
          <img src={icon('avatar-poster-v1')} width={56} height={56} alt="" className="size-full rounded-full object-cover" />
          {phase === 3 && <motion.img src={icon('type-express-v1')} width={28} height={28} alt="" initial={reduce ? false : { scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 18 }} className="absolute -right-5 -top-5 size-6 md:-right-6 md:-top-6 md:size-7" />}
        </div>
      </Node>
      <Node x={MEI[0] + 80} y={MEI[1] + 116}><Tag>梅园 5 号楼 · 你</Tag></Node>
      <motion.div className="absolute z-10 -translate-x-1/2 -translate-y-[92%]" style={{ left: rl, top: rt }} animate={{ opacity: phase === 3 ? 0 : 1 }} transition={{ duration: 0.25 }}>
        <div className={`relative size-8 rounded-full bg-surface p-0.5 ring-[3px] shadow-[0_6px_16px_-6px_rgba(17,40,30,0.5)] transition-colors md:size-11 ${phase >= 1 ? 'ring-accent' : 'ring-ink'}`}>
          <img src={icon('avatar-runner-v1')} width={44} height={44} alt="" className="size-full rounded-full object-cover" />
          <AnimatePresence>
            {phase >= 2 && (
              <motion.img key="parcel" src={icon('type-express-v1')} width={28} height={28} alt="" initial={reduce ? false : { scale: 0, y: 8 }} animate={{ scale: 1, y: 0 }} exit={{ opacity: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 20 }} className="absolute -right-3 -top-3 size-5 md:size-7" />
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {phase === 0 && !reduce && (
          <motion.div key="a" className="absolute bottom-[5%] left-[3%] max-sm:left-4 max-sm:bottom-[4%]" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <p className="rounded-xl bg-surface px-2.5 py-1.5 text-[12px] leading-snug shadow-[0_8px_24px_-12px_rgba(17,40,30,0.4)] ring-1 ring-line md:px-3 md:py-2 md:text-sm">阿远在一教 17:50 下课<br />本来就要走回梅园</p>
          </motion.div>
        )}
        {(phase === 1 || phase === 2) && (
          <motion.div key="b" className="absolute bottom-[5%] left-[3%] max-sm:left-4 max-sm:bottom-[4%]" initial={{ opacity: 0, y: 10, scale: 0.92 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6 }} transition={{ type: 'spring', stiffness: 420, damping: 26 }}>
            <div className="rounded-2xl bg-ink px-3 py-2 text-bg shadow-[0_14px_30px_-14px_rgba(17,40,30,0.6)] md:px-4 md:py-3">
              <p className="text-[13px] font-bold md:text-lg">顺路，只多走 1 分钟</p>
              <p className="text-[11px] opacity-80 md:text-sm">阿远接单 · 赏金 ¥5 托管中</p>
            </div>
          </motion.div>
        )}
        {phase === 3 && (
          <motion.div key="c" className="absolute bottom-[5%] left-[3%] max-sm:left-4 max-sm:bottom-[4%]" initial={reduce ? false : { opacity: 0, y: 10, scale: 0.92 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }} transition={{ type: 'spring', stiffness: 420, damping: 26 }}>
            <div className="rounded-2xl bg-accent px-3 py-2 text-on-accent shadow-[0_14px_30px_-14px_rgba(11,122,85,0.7)] md:px-4 md:py-3">
              <p className="text-[13px] font-bold md:text-lg">送到了</p>
              <p className="tnum text-[11px] opacity-90 md:text-sm">¥5 从托管放给阿远</p>
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
  const line = (i) => ({ initial: reduce ? false : { y: 14 }, animate: { y: 0 }, transition: { duration: 0.55, delay: 0.05 + i * 0.08, ease } })
  // 副标题和按钮第一帧就在，只做一点位移，不从透明开始
  const fade = (d) => ({ initial: reduce ? false : { y: 10 }, animate: { y: 0 }, transition: { duration: 0.5, delay: d * 0.3, ease } })
  return (
    <section id="top" className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-12 pt-8 md:px-8 md:pb-20 md:pt-12 lg:grid-cols-12 lg:gap-10 lg:pb-4 lg:pt-10 xl:pt-14">
      <div className="lg:col-span-5">
        <h1 className="font-display text-[54px] leading-[1.05] md:text-[80px] lg:text-[length:clamp(54px,4vw_+_20px,78px)]">
          <span className="block pb-1"><motion.span className="block" {...line(0)}>本来就要经过，</motion.span></span>
          <span className="block pb-[0.3em]"><motion.span className="block" {...line(1)}><DashUnder>顺手</DashUnder>捎一下</motion.span></span>
        </h1>
        <motion.p {...fade(0.35)} className="mt-6 max-w-[30ch] md:max-w-[36ch] lg:mt-8 lg:max-w-[30ch] text-lg leading-relaxed text-muted md:text-[22px] lg:text-xl">
          快递在驿站，你在宿舍。总有同学下课正好从驿站走回去，顺手帮你带上。校内实名，赏金先托管。
        </motion.p>
        <motion.div {...fade(0.45)} className="mt-8 flex flex-wrap items-center gap-3">
          <Cta />
          <Anchor to="routes" className="group inline-flex h-14 items-center gap-2 whitespace-nowrap rounded-full px-5 text-[17px] font-semibold text-ink transition hover:bg-sunken">
            看看谁顺路<ArrowDown size={18} weight="bold" className="transition-transform group-hover:translate-y-0.5" />
          </Anchor>
        </motion.div>
        {/* 「体验原型」直接按设备进合适的那种界面；想先挑的，从这里去选择页 */}
        <motion.p {...fade(0.5)} className="mt-3 text-[15px] text-muted">想先选界面？<Link to="/app/start" className="font-semibold text-ink underline decoration-line underline-offset-4 hover:decoration-ink">手机版 / 电脑版</Link></motion.p>
      </div>
      <motion.div {...fade(0.2)} className="lg:col-span-7">
        <RouteMap />
        <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-ink/80 md:text-[14px]">
          <span className="inline-flex items-center gap-1.5"><i className="h-1 w-5 rounded-full bg-ink/80" />阿远本来就要走的路</span>
          <span className="inline-flex items-center gap-1.5"><i className="h-1.5 w-5 rounded-full bg-accent" />顺手捎上你的快递</span>
        </p>
      </motion.div>
    </section>
  )
}

// 收尾：同一张校园图上，8 个示例单的路线；选一条「我正要走的路」，顺路的单变绿并标出多走几分钟（都是按数据实时算的）
const PX = (x) => 13 + ((x + 600) / 1580) * 74
const PY = (y) => 7 + ((y + 380) / 1280) * 84
export const ROUTES = [
  { from: 'jiao1', to: 'mei5', label: '一教下课回梅园', short: '一教→梅园', lock: '还有 5 分钟下课', time: '17:45', verb: '下课顺手捎上' },
  { from: 'tao2', to: 'jiao1', label: '桃园去上课', short: '桃园→一教', lock: '还有 15 分钟上课', time: '07:45', verb: '去上课顺手捎上' },
  { from: 'mei5', to: 'market', label: '梅园去超市', short: '梅园→超市', lock: '晚饭后，去超市', time: '19:30', verb: '去超市顺手捎上' },
]

// 这条路上多走不超过 5 分钟的单，按多走的分钟数排
export const routeHits = (R) => seedTasks().map((t) => ({ ...t, m: detourMin(R.from, R.to, t), dm: detourMeters(R.from, R.to, t) })).filter((t) => t.m <= 5).sort((a, b) => a.m - b.m)

export function CampusRoutes() {
  const reduce = useReducedMotion()
  const box = useRef(null)
  // 不自动换路线：正在看的清单不会在手底下被换掉，只由上面的路线按钮切
  const [ri, setRi] = useState(0)
  const R = ROUTES[ri]
  const hits = routeHits(R)
  const pick = (i) => setRi(i)
  return (
    <div>
      <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 md:gap-2 md:mx-0 md:flex-wrap md:overflow-visible md:px-0" role="group" aria-label="选一条你正要走的路">
        {ROUTES.map((x, i) => (
          <button key={x.label} onClick={() => pick(i)} aria-pressed={i === ri}
            className={`relative h-11 shrink-0 whitespace-nowrap rounded-full px-3 text-[14px] md:px-4 md:text-[15px] font-semibold transition-colors ${i === ri ? 'text-bg' : 'bg-surface text-ink ring-1 ring-line'}`}>
            {i === ri && <span className="absolute inset-0 rounded-full bg-ink" />}
            <span className="relative md:hidden">{x.short}</span><span className="relative max-md:hidden">{x.label}</span>
          </button>
        ))}
      </div>
      <p className="mt-4 max-w-[40ch] text-lg leading-relaxed text-muted md:text-xl" aria-live="polite">
        此刻 {seedTasks().length} 个单里，有 <b className="text-accent">{hits.length} 个</b>顺路，<span className="whitespace-nowrap">{!hits.length ? '' : '每单'}多走 {!hits.length ? 0 : hits[0].m === hits[hits.length - 1].m ? hits[0].m : `${hits[0].m} 到 ${hits[hits.length - 1].m}`} 分钟</span>。
      </p>
      <div className="mt-6 lg:grid lg:grid-cols-12 lg:items-start lg:gap-8">
        <div ref={box} className="lg:col-span-8"><CampusMap R={R} hits={hits} reduce={reduce} legend /></div>
        <div className="lg:col-span-4"><SubwayLine R={R} hits={hits} reduce={reduce} /></div>
      </div>
    </div>
  )
}

// 手机上的顺路：把你的路画成一根竖着的地铁线，顺路的单按在路上的先后挂成站点
function SubwayLine({ R, hits, reduce }) {
  const mine = routePath(R.from, R.to).pts
  // 按在路上的先后排，和地图上从出发到到达的顺序一致
  const stops = [...hits].sort((p, q) => along(mine, PLACES[p.from].door) - along(mine, PLACES[q.from].door))
  const end = (name, sub) => (
    <li className="relative flex items-center gap-3 py-1">
      <span className="z-10 grid size-6 shrink-0 place-items-center rounded-full bg-ink ring-4 ring-bg"><span className="size-2 rounded-full bg-bg" /></span>
      <span className="text-[15px] font-bold">{name}</span><span className="text-sm text-muted">{sub}</span>
    </li>
  )
  return (
    <div className="mt-3 rounded-[24px] bg-surface p-4 ring-1 ring-line md:hidden lg:mt-0 lg:block">
      <ol key={R.label} className="relative space-y-3">
        <span aria-hidden="true" className="absolute bottom-4 left-[11px] top-4 w-[3px] rounded-full bg-ink/80" />
        {end(SHORT[R.from], '出发')}
        {stops.map((t, i) => (
          <motion.li key={t.id} initial={reduce ? false : { opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ type: 'spring', stiffness: 420, damping: 30, delay: 0.15 + i * 0.12 }}
            className="relative flex items-center gap-3">
            <span className="tnum z-10 -ml-px grid size-[26px] shrink-0 place-items-center rounded-full bg-accent text-[13px] font-bold text-on-accent ring-4 ring-bg">{i + 1}</span>
            <span className="min-w-0 flex-1 rounded-2xl bg-accent-soft px-3 py-2">
              <span className="flex items-start justify-between gap-2"><span className="text-[15px] font-semibold leading-snug">{t.title}</span><span className="tnum shrink-0 font-bold text-accent">¥{t.reward}</span></span>
              <span className="tnum mt-0.5 flex flex-wrap gap-x-2 text-sm text-accent"><span className="whitespace-nowrap">{t.dm ? `多走 ${t.m} 分钟（${t.dm} 米）` : '就在路上'}</span><span className="whitespace-nowrap">在{SHORT[t.from]}顺手{{ express: '取', buy: '买', seat: '占', food: '拿', other: '带' }[t.type] || '带'}</span></span>
            </span>
          </motion.li>
        ))}
        {end(SHORT[R.to], '到达')}
      </ol>
      {/* 汇总：这条路上的单全捎上能拿多少 */}
      {stops.length > 0 && (
        <p className="tnum mt-4 flex items-baseline justify-between gap-3 border-t border-line pt-3 text-[15px]">
          <span className="text-muted">{stops.length} 单全捎上</span>
          <span className="font-semibold">赏金合计 <b className="text-xl text-accent">¥{stops.reduce((a, t) => a + t.reward, 0)}</b></span>
        </p>
      )}
    </div>
  )
}
