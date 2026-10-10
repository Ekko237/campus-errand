import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion, animate, useMotionValue, useTransform } from 'motion/react'
import { routePath, PLACES } from '../campusMap'

// 一单的滚动叙事：同一张校园地图和同一张订单卡一直在场，往下滚一段，路线、阿远、订单状态、钱和信用就往前走一步；
// 左边（手机上是下面）的文字讲这一步背后的产品设计。场景、六步、信任、双向信用都在这一条线上讲完。
const icon = (name) => `${import.meta.env.BASE_URL}icons/${name}.webp`
const ease = [0.16, 1, 0.3, 1]

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

// 七段：每段一句话的事 + 背后的产品设计
export const CH = [
  {
    k: 'scene', icon: 'type-express-v1', alt: '纸箱快递', kicker: '17:50 · 一教还没下课',
    t: '快递在驿站，你在宿舍',
    d: '小满三个快递在菜鸟驿站放了三天，驿站 18:00 关门。找室友要欠人情，找陌生人又怕取件码被乱用。',
    note: ['为什么叫「顺路」', '不是多找一个跑腿的人，是让本来就要经过驿站的同学，顺手带上。'],
  },
  {
    k: 'publish', icon: 'step-publish-v1', alt: '带硬币的喇叭', kicker: '第 1 步 · 发布',
    t: '发一单 ¥5，钱先冻结',
    d: '选「取快递」模板，填楼栋和截止时间。赏金在发布那一刻就冻结在平台，谁也拿不走。',
    note: ['赏金托管', '确认送达才放款；发单人 2 小时不确认，系统自动放款，跑腿的人也不怕白跑。'],
  },
  {
    k: 'match', icon: 'trust-verify-v1', alt: '带对勾的学生证', kicker: '第 2 步 · 顺路的人',
    t: '一教下课的阿远，正好顺路',
    d: '阿远 17:50 在一教下课，本来就要走回梅园，路过驿站只多走 1 分钟。大厅把顺他路的单排在最前面。',
    note: ['认证和门槛', '学号或 .edu.cn 邮箱认证后才能接单；信用 72 分以上，才能接 ¥15 以内的单。'],
  },
  {
    k: 'code', icon: 'step-ongoing-v1', alt: '打开的锁和包裹', kicker: '第 3 步 · 接单',
    t: '接单那一刻，取件码才出现',
    d: '阿远接单，到驿站报 6-2-3108 取件。接单之前，大厅里只看得到「梅园」，楼号和门牌都打了码。',
    note: ['隐私分级', '取件码和宿舍号只给接单的人看，订单结束自动收回；电话一律走虚拟号。'],
  },
  {
    k: 'deliver', icon: 'step-deliver-v1', alt: '放在门口拍照的包裹', kicker: '第 4 步 · 送达',
    t: '捎着快递走回梅园',
    d: '绿色这一段，是阿远捎着你的快递走的路。到楼下当面报 4 位送达码，或者拍照放门口。',
    note: ['送达凭证与申诉', '送达码当面核验，或拍照留证；有问题就申诉，申诉期间钱继续冻结，平台判责。'],
  },
  {
    k: 'pay', icon: 'step-confirm-v1', alt: '两只手传递硬币', kicker: '第 5 步 · 放款',
    t: '确认收货，¥5 放给阿远',
    d: '小满看过东西没问题，点一下确认，托管的 ¥5 当场转给阿远。',
    note: ['放款即收回', '钱放出去的同一刻，取件码和宿舍号对阿远隐藏，这单的隐私不留在别人手机里。'],
  },
  {
    k: 'credit', icon: 'trust-credit-v1', alt: '带上升箭头的奖牌', kicker: '第 6 步 · 互评',
    t: '两个人的信用，一起涨',
    d: '互相打分之后，阿远 70 → 73，小满 88 → 90。下次阿远能接更贵的单，小满的单也更快有人接。',
    note: ['双向信用', '跑腿人按时 +2、爽约 -5、被判责 -8；发单人按时确认 +1、超时不确认 -2。不能充值，也刷不了。'],
  },
]

// 每段地图和订单卡长什么样
// 送到以后停在梅园门口右边一点，不和小满的头像叠在一起
const END = 0.93
const WALK = [null, null, 0, F, END, END, END]
const STATUS = ['还没发单', '待接单', '有人顺路', '取件中', '待确认', '已放款', '已互评']
const ESCROW = ['还没付', '¥5 冻结中', '¥5 冻结中', '¥5 冻结中', '¥5 冻结中', '¥5 已给阿远', '¥5 已给阿远']
const ESCROW_S = ['未付', '冻结 ¥5', '冻结 ¥5', '冻结 ¥5', '冻结 ¥5', '给了阿远', '给了阿远']
const CODE = ['还没有', '接单后可见', '接单后可见', '6-2-3108', '已用完', '已收回', '已收回']
const RUNNER = [70, 70, 70, 70, 70, 72, 73]
const POSTER = [88, 88, 88, 88, 88, 89, 90]

// 数字滚到新值：信用分变的那一下看得见
function Roll({ v }) {
  const reduce = useReducedMotion()
  const mv = useMotionValue(v)
  const out = useTransform(mv, (x) => Math.round(x))
  useEffect(() => { const c = animate(mv, v, { duration: reduce ? 0 : 0.8, ease }); return () => c.stop() }, [v, mv, reduce])
  return <motion.span>{out}</motion.span>
}

// 地图视窗：桌面是首屏那张图的同一块；手机吸顶的小图只留这条路上下一窄条
const WIDE = { X0: 40, Y0: 72, VW: 1360, VH: 736 }
const STRIP = { X0: 95, Y0: 150, VW: 1290, VH: 416 }

function StoryMap({ i, v = WIDE, small = false }) {
  const reduce = useReducedMotion()
  const sp = reduce ? { duration: 0 } : { type: 'spring', stiffness: 90, damping: 20 }
  const pct = ([x, y]) => ({ left: `${((x - v.X0) / v.VW) * 100}%`, top: `${((y - v.Y0) / v.VH) * 100}%` })
  const w = WALK[i]
  const me = at(w ?? 0)
  const carry = w == null ? 0 : Math.max(0, (w - F) / (1 - F))
  const sw = small ? 1.6 : 1
  const tag = (txt, p, cls = '') => (
    <span className={`absolute z-20 -translate-x-1/2 whitespace-nowrap rounded-full bg-surface px-2 py-0.5 font-semibold text-ink shadow-sm ring-1 ring-line ${small ? 'text-[11px]' : 'text-[13px]'} ${cls}`} style={pct(p)}>{txt}</span>
  )
  return (
    <div className={`relative overflow-hidden bg-sunken ${small ? 'aspect-[1290/416] rounded-xl' : 'aspect-[1360/736] rounded-[28px]'} ring-1 ring-line`} aria-hidden="true">
      <svg viewBox={`${v.X0} ${v.Y0} ${v.VW} ${v.VH}`} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full">
        <image href={`${import.meta.env.BASE_URL}images/campus-map-v2.webp`} x="0" y="0" width="1600" height="900" />
        {/* 阿远本来就要走的路：出现以后一直淡淡地在，走过的部分描深 */}
        <motion.path d={D} fill="none" stroke="var(--ink)" strokeOpacity="0.35" strokeWidth={10 * sw} strokeDasharray={`${4 * sw} ${18 * sw}`} strokeLinecap="round"
          initial={false} animate={{ opacity: w == null ? 0 : 1 }} transition={{ duration: reduce ? 0 : 0.4 }} />
        <motion.path d={D} fill="none" stroke="var(--ink)" strokeOpacity="0.9" strokeWidth={12 * sw} strokeLinecap="round" strokeLinejoin="round"
          initial={false} animate={{ pathLength: w ?? 0, opacity: w == null ? 0 : 1 }} transition={sp} />
        {/* 捎上快递之后那一段变绿：这是「顺手」的部分 */}
        <motion.path d={NEED} fill="none" stroke="var(--accent)" strokeWidth={7 * sw} strokeLinecap="round" strokeLinejoin="round"
          initial={false} animate={{ pathLength: carry, opacity: carry > 0 ? 1 : 0 }} transition={sp} />
        {/* 发布那一下，驿站冒一圈：这里有一单在等人 */}
        {i === 1 && !reduce && (
          <motion.circle key="ping" cx={STATION[0]} cy={STATION[1]} r="60" fill="var(--accent)" initial={{ opacity: 0.4, scale: 0.4 }} animate={{ opacity: 0, scale: 1.6 }}
            transition={{ duration: 1.2, repeat: 2, ease: 'easeOut' }} style={{ transformOrigin: `${STATION[0]}px ${STATION[1]}px` }} />
        )}
      </svg>

      {tag('一教', [ICHI[0], ICHI[1] - (small ? 110 : 120)])}
      {tag('菜鸟驿站', [STATION[0], STATION[1] + (small ? 40 : 46)])}
      {/* 小满在梅园：从头到尾都在，钱和信用最后落到她这边 */}
      <span className="absolute z-20 -translate-x-1/2 -translate-y-1/2" style={pct([MEI[0] - 50, MEI[1] + (small ? 70 : 80)])}>
        <span className={`grid place-items-center rounded-full bg-accent-soft ring-[3px] ring-accent ${small ? 'size-7' : 'size-11'}`}>
          <img src={icon('avatar-poster-v1')} width={36} height={36} alt="" className={`${small ? 'size-5' : 'size-9'} rounded-full`} />
        </span>
        <span className={`absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded-full bg-surface px-2 py-0.5 font-semibold shadow-sm ring-1 ring-line ${small ? 'text-[11px]' : 'text-[13px]'}`}>梅园 · 小满</span>
      </span>

      {/* 快递：在驿站等着，被阿远拿走以后跟着他走 */}
      {(w == null || w < F) && (
        <motion.img src={icon('type-express-v1')} width={36} height={36} alt="" className={`absolute z-10 -translate-x-1/2 -translate-y-1/2 ${small ? 'size-6' : 'size-9'}`} style={pct(STATION)}
          initial={false} animate={{ scale: i === 1 && !reduce ? [1, 1.3, 1] : 1 }} transition={{ duration: 0.6 }} />
      )}

      {/* 阿远：顺路的人出现以后，沿路走到驿站、再走回梅园 */}
      <motion.span className={`absolute z-30 grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-surface ring-[3px] ring-ink ${small ? 'size-7' : 'size-11'}`}
        initial={false} animate={{ ...pct(me), opacity: w == null ? 0 : 1, scale: w == null ? 0.6 : 1 }} transition={sp}>
        <img src={icon('avatar-runner-v1')} width={36} height={36} alt="" className={`${small ? 'size-5' : 'size-9'} rounded-full`} />
        {w != null && w >= F && <img src={icon('type-express-v1')} width={22} height={22} alt="" className={`absolute ${small ? '-right-2.5 -top-2.5 size-4' : '-right-3.5 -top-3.5 size-6'}`} />}
      </motion.span>

      {/* 每一段在地图上冒一句：顺路多走多少、钱和信用落到谁那里 */}
      <AnimatePresence>
        {i === 2 && <Bubble key="b2" p={pct([ICHI[0] - 420, ICHI[1] - (small ? 70 : 110)])} small={small} dark>顺路，只多走 1 分钟</Bubble>}
        {i === 5 && <Bubble key="b5" p={pct([MEI[0] + 300, MEI[1] - 170])} small={small} green>+¥5 给阿远</Bubble>}
        {i === 6 && <Bubble key="b6" p={pct([MEI[0] + 300, MEI[1] - 170])} small={small} green>信用 阿远 +3 · 小满 +2</Bubble>}
      </AnimatePresence>
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

// 订单卡：七格进度，状态、托管、取件码、两个人的信用
function OrderCard({ i, small = false }) {
  const reduce = useReducedMotion()
  const cell = (k, v, hot, key) => (
    <div className={`min-w-0 rounded-xl transition-colors duration-300 ${hot ? 'bg-accent-soft text-accent' : 'bg-sunken text-ink'} ${small ? 'px-2 py-1' : 'px-3 py-2'}`}>
      <p className={`whitespace-nowrap text-muted ${small ? 'text-[11px]' : 'text-xs'}`}>{k}</p>
      <AnimatePresence mode="wait" initial={false}>
        <motion.p key={key ?? v} initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}
          className={`tnum overflow-hidden text-ellipsis whitespace-nowrap font-bold ${small ? 'text-[12px]' : 'text-[17px]'}`}>{v}</motion.p>
      </AnimatePresence>
    </div>
  )
  return (
    <div className={`rounded-2xl bg-surface ring-1 ring-line ${small ? 'p-2.5' : 'p-4 shadow-[0_24px_50px_-30px_rgba(17,40,30,0.45)]'}`}>
      <div className="flex items-center gap-2">
        <img src={icon('type-express-v1')} width={28} height={28} alt="" aria-hidden="true" className={small ? 'size-6' : 'size-7'} />
        <p className={`min-w-0 flex-1 truncate font-semibold ${small ? 'text-[13px]' : 'text-[15px]'}`}>{i === 0 ? '小满的快递，还在驿站' : '菜鸟驿站取 3 个小件快递'}</p>
        <AnimatePresence mode="wait" initial={false}>
          <motion.span key={STATUS[i]} initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}
            className={`shrink-0 rounded-full px-2.5 py-0.5 font-bold ${small ? 'text-[12px]' : 'text-sm'} ${i === 0 ? 'bg-sunken text-muted' : 'bg-accent text-on-accent'}`}>{STATUS[i]}</motion.span>
        </AnimatePresence>
      </div>
      <div className={`grid grid-cols-6 gap-1 ${small ? 'mt-2' : 'mt-3'}`} aria-hidden="true">
        {CH.slice(1).map((c, k) => <span key={c.k} className={`h-1.5 rounded-full transition-colors duration-300 ${k < i ? 'bg-accent' : 'bg-sunken'}`} />)}
      </div>
      <div className={`grid gap-1.5 ${small ? 'mt-2 grid-cols-[1.15fr_1.25fr_0.8fr_0.8fr]' : 'mt-3 grid-cols-2 xl:grid-cols-4'}`}>
        {cell(small ? '托管' : '赏金托管', small ? ESCROW_S[i] : ESCROW[i], i >= 5)}
        {cell('取件码', CODE[i], i === 3)}
        {cell(small ? '阿远' : '阿远信用', <Roll v={RUNNER[i]} />, i >= 5, `r${RUNNER[i]}`)}
        {cell(small ? '小满' : '小满信用', <Roll v={POSTER[i]} />, i >= 5, `p${POSTER[i]}`)}
      </div>
    </div>
  )
}

function Chapter({ c, k, now, children }) {
  return (
    <article data-ch={k} className={`flex flex-col justify-center py-10 transition-opacity duration-300 lg:min-h-[78svh] lg:py-0 ${now ? '' : 'lg:opacity-40'}`}>
      <p className="flex items-center gap-2 text-sm font-semibold text-accent">
        <img src={icon(c.icon)} width={32} height={32} alt={c.alt} loading="lazy" className="size-8 object-contain" />{c.kicker}
      </p>
      <h3 className="mt-3 font-display text-balance text-[30px] leading-[1.15] md:text-[40px]">{c.t}</h3>
      <p className="mt-3 max-w-[34ch] text-lg leading-relaxed text-ink/85 md:text-xl">{c.d}</p>
      <div className="mt-5 max-w-[40ch] border-l-[3px] border-accent pl-4">
        <p className="text-[15px] font-bold">{c.note[0]}</p>
        <p className="mt-1 text-[15px] leading-relaxed text-muted">{c.note[1]}</p>
      </div>
      {children}
    </article>
  )
}

export default function Story() {
  const reduce = useReducedMotion()
  const [i, setI] = useState(0)
  const list = useRef(null)
  // 正对着哪一段：桌面看视口一半那条线；手机看吸顶小地图下面那条线。用原生滚动事件，后台标签页也准
  useEffect(() => {
    if (reduce) return
    const f = () => {
      const items = list.current?.querySelectorAll('[data-ch]')
      if (!items) return
      const mob = window.innerWidth < 1024
      const line = mob ? (document.querySelector('[data-story-mini]')?.getBoundingClientRect().bottom ?? 260) + 80 : window.innerHeight * 0.55
      let k = 0
      items.forEach((el, n) => { if (el.getBoundingClientRect().top < line) k = n })
      setI(k)
    }
    f(); window.addEventListener('scroll', f, { passive: true }); window.addEventListener('resize', f)
    return () => { window.removeEventListener('scroll', f); window.removeEventListener('resize', f) }
  }, [reduce])

  return (
    <section id="story" className="scroll-mt-16 px-4 pb-16 pt-14 md:px-8 md:pb-24 md:pt-24">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-[40ch]">
          <h2 className="font-display text-balance text-[34px] leading-[1.12] md:text-[44px] xl:text-[50px]">跟着一单往下走</h2>
          <p className="mt-4 text-lg leading-relaxed text-muted md:text-xl">从驿站里那三个快递，到两个人的信用分。每往下滚一段，地图和订单就往前走一步。</p>
        </div>

        {reduce ? (
          // 关掉动效：每一段配一张它自己那一刻的地图和订单，静态图文
          <div className="mt-6 divide-y divide-line">
            {CH.map((c, k) => (
              <div key={c.k} className="grid gap-6 py-6 lg:grid-cols-12 lg:items-center lg:gap-12">
                <div className="lg:col-span-5"><Chapter c={c} k={k} now /></div>
                <div className="grid gap-3 lg:col-span-7"><StoryMap i={k} /><OrderCard i={k} /></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-6 lg:mt-0 lg:grid lg:grid-cols-12 lg:gap-12">
            {/* 手机：吸在顶栏下面的小地图 + 订单条，下面一段段文字滚过去 */}
            <div data-story-mini className="sticky top-16 z-10 -mx-4 bg-bg/95 px-4 pb-2 pt-2 backdrop-blur lg:hidden">
              <div className="grid gap-1.5"><StoryMap i={i} v={STRIP} small /><OrderCard i={i} small /></div>
            </div>
            <div ref={list} className="lg:col-span-5 lg:pb-[20svh]">
              {CH.map((c, k) => <Chapter key={c.k} c={c} k={k} now={k === i} />)}
            </div>
            {/* 桌面：右边的舞台吸住，一直在场 */}
            <div className="hidden lg:col-span-7 lg:block">
              <div className="sticky top-16 flex h-[calc(100svh-64px)] flex-col justify-center gap-3 py-4">
                <StoryMap i={i} />
                <OrderCard i={i} />
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
