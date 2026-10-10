import RouteHero, { CampusRoutes, ROUTES } from './RouteHero'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  motion, AnimatePresence, useReducedMotion, useScroll, useTransform, useSpring, useMotionValue, useInView, animate, useMotionValueEvent,
} from 'motion/react'
import { ArrowRight, ArrowLeft, ArrowDown, CaretLeft, CaretRight, Plus, ArrowCounterClockwise } from '@phosphor-icons/react'
import { RULES_PLUS, RULES_MINUS, POSTER_RULES_PLUS, POSTER_RULES_MINUS, LEVELS, POSTER_TIERS, TYPES, seedTasks, detourMin } from '../data'
import { useNavigate } from 'react-router-dom'
import { gi } from '../ui'
const LockKey = gi('lock')
const LockKeyOpen = gi('lock-open')
const EyeSlash = gi('eye-off')

const ease = [0.16, 1, 0.3, 1]
const img = (name) => `${import.meta.env.BASE_URL}images/${name}.webp`
const icon = (name) => `${import.meta.env.BASE_URL}icons/${name}.webp`
// 段落间距：手机 py-20，平板 py-28，桌面 py-32（第二阶段间距规范）
const SECTION = 'px-4 py-20 md:px-8 md:py-28 lg:py-32'

function Reveal({ children, className = '', delay = 0, as = 'div', y = 12 }) {
  const reduce = useReducedMotion()
  const M = motion[as]
  return (
    <M className={className} initial={reduce ? false : { opacity: 0.4, y }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0, margin: '0px 0px 40% 0px' }} transition={{ duration: 0.3, delay: Math.min(delay, 0.05), ease }}>
      {children}
    </M>
  )
}

// 磁吸：按钮轻轻跟随指针，给「可点」一个手感；触屏和减弱动效时不启用
function Magnetic({ children, strength = 0.28 }) {
  const reduce = useReducedMotion()
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 220, damping: 16 })
  const sy = useSpring(y, { stiffness: 220, damping: 16 })
  const move = (e) => {
    if (reduce || e.pointerType !== 'mouse') return
    const r = e.currentTarget.getBoundingClientRect()
    x.set((e.clientX - (r.left + r.width / 2)) * strength)
    y.set((e.clientY - (r.top + r.height / 2)) * strength)
  }
  const leave = () => { x.set(0); y.set(0) }
  return <motion.div onPointerMove={move} onPointerLeave={leave} style={{ x: sx, y: sy }} className="inline-block">{children}</motion.div>
}

function Cta({ size = 'lg', className = '' }) {
  const big = size === 'lg'
  return (
    <Magnetic strength={big ? 0.28 : 0.15}>
      <Link to="/app" className={`group relative inline-flex items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-full bg-accent font-semibold text-on-accent shadow-[0_10px_30px_-12px_rgba(11,122,85,0.7)] transition active:scale-[0.97] ${big ? 'h-14 px-7 text-[17px]' : 'h-10 px-4 text-[15px]'} ${className}`}>
        <span aria-hidden="true" className="absolute inset-0 -translate-x-full bg-ink/15 transition-transform duration-500 ease-out group-hover:translate-x-0" />
        <span className="relative">体验原型</span>
        <ArrowRight size={big ? 20 : 16} weight="bold" className="relative transition-transform duration-300 group-hover:translate-x-1" />
      </Link>
    </Magnetic>
  )
}

function Anchor({ to, children, onClick, ...p }) {
  const go = (e) => {
    e.preventDefault()
    onClick?.()
    document.getElementById(to)?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  }
  return <a href="#/" onClick={go} {...p}>{children}</a>
}

const H2 = ({ children, className = '' }) => (
  <h2 className={`font-display text-balance text-[34px] leading-[1.12] md:text-[44px] xl:text-[50px] ${className}`}>{children}</h2>
)
const Br = () => <br className="hidden md:inline" />
const Lead = ({ children, className = '' }) => <p className={`mt-5 max-w-[38ch] text-lg leading-relaxed text-muted md:text-xl ${className}`}>{children}</p>

// 贯穿全站的那条路：宽屏左边一条虚线，每一段是一个站，往下滚它就被走成绿色，小人跟着走
const STOPS = [['top', '一条路'], ['routes', '整个校园'], ['scenes', '场景'], ['loop', '一单'], ['trust', '信任'], ['credit', '信用'], ['safety', '底线']]
function PageRoute() {
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll()
  const fill = useSpring(scrollYProgress, { stiffness: 140, damping: 26 })
  const top = useTransform(fill, (v) => `${v * 100}%`)
  const [stops, setStops] = useState([])
  const [prog, setProg] = useState(0)
  useMotionValueEvent(scrollYProgress, 'change', setProg)
  useEffect(() => {
    const measure = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight || 1
      setStops(STOPS.map(([id, label]) => {
        const el = document.getElementById(id)
        return el ? { id, label, f: Math.min(1, Math.max(0, (el.getBoundingClientRect().top + window.scrollY - 80) / max)) } : null
      }).filter(Boolean))
    }
    measure()
    const t = setTimeout(measure, 1200)
    window.addEventListener('resize', measure)
    return () => { clearTimeout(t); window.removeEventListener('resize', measure) }
  }, [])
  return (
    <nav aria-label="页面路线" className="fixed bottom-10 left-6 top-24 z-20 hidden w-28 min-[1560px]:block">
      <span aria-hidden="true" className="absolute bottom-0 left-[7px] top-0 border-l-2 border-dashed border-line" />
      <motion.span aria-hidden="true" style={{ scaleY: fill }} className="absolute bottom-0 left-[6px] top-0 w-[4px] origin-top rounded-full bg-accent" />
      {stops.map((s) => (
        <Anchor key={s.id} to={s.id} className="group absolute left-0 flex -translate-y-1/2 items-center gap-2" style={{ top: `${s.f * 100}%` }}>
          <span className={`size-4 rounded-full ring-4 ring-bg transition-colors ${prog >= s.f - 0.002 ? 'bg-accent' : 'bg-surface [box-shadow:inset_0_0_0_2px_var(--line)]'}`} />
          <span className="whitespace-nowrap text-xs font-semibold text-muted opacity-0 transition-opacity group-hover:opacity-100">{s.label}</span>
        </Anchor>
      ))}
      {!reduce && (
        <motion.span aria-hidden="true" style={{ top }} className="absolute left-[-9px] grid size-8 -translate-y-1/2 place-items-center rounded-full bg-surface shadow-[0_6px_16px_-6px_rgba(17,40,30,0.5)] ring-[3px] ring-ink">
          <img src={icon('avatar-runner-v1')} width={24} height={24} alt="" className="size-6 rounded-full" />
        </motion.span>
      )}
    </nav>
  )
}

function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 26 })
  return <motion.div aria-hidden="true" style={{ scaleX }} className="fixed inset-x-0 top-0 z-50 h-[3px] origin-left bg-accent" />
}

const NAV_LINKS = [['scenes', '场景'], ['loop', '一单怎么走'], ['trust', '信任机制'], ['credit', '双向信用']]
function Nav({ page }) {
  const { scrollY } = useScroll()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  useMotionValueEvent(scrollY, 'change', (v) => setScrolled(v > 420))
  const home = page !== 'thinking'
  const linkCls = 'group relative py-1 transition-colors hover:text-ink'
  const under = <span className="absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 bg-ink transition-transform duration-300 group-hover:scale-x-100" />
  return (
    <header className={`sticky top-0 z-30 transition-[background-color,border-color,box-shadow] duration-300 ${scrolled || !home ? 'border-b border-line bg-bg shadow-[0_1px_0_rgba(0,0,0,0.02)]' : 'border-b border-transparent bg-bg'}`}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:px-8">
        {home ? (
          <Anchor to="top" className="flex items-center gap-2.5 text-lg font-bold tracking-tight">
            <img src={`${import.meta.env.BASE_URL}brand/logo-v2.png`} width={36} height={36} alt="顺路侠标志：背着书包、夹着包裹奔跑的小人" className="size-9" />顺路侠
          </Anchor>
        ) : (
          <Link to="/" className="group flex items-center gap-2 text-[17px] font-semibold">
            <ArrowLeft size={18} weight="bold" className="transition-transform group-hover:-translate-x-0.5" />回首页
          </Link>
        )}
        <nav className="hidden items-center gap-8 text-[15px] font-medium text-muted lg:flex" aria-label="页面导航">
          {home && NAV_LINKS.map(([to, l]) => <Anchor key={to} to={to} className={linkCls}>{l}{under}</Anchor>)}
          {home && <Link to="/thinking" className={linkCls}>产品思考{under}</Link>}
        </nav>
        <div className="flex items-center gap-2">
          <div className={`transition-opacity duration-300 ${scrolled || !home ? '' : 'max-md:pointer-events-none max-md:opacity-0'}`}><Cta size="sm" /></div>
          {home && (
            <button onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-controls="mnav" className="grid h-10 place-items-center rounded-full bg-sunken px-4 text-[15px] font-semibold active:scale-[0.97] lg:hidden">{open ? '收起' : '目录'}</button>
          )}
        </div>
      </div>
      <AnimatePresence>
        {open && <motion.button key="scrim" aria-label="关闭目录" onClick={() => setOpen(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-x-0 bottom-0 top-16 bg-ink/25 lg:hidden" />}
        {open && (
          <motion.nav key="menu" id="mnav" aria-label="页面目录" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}
            className="absolute inset-x-0 top-16 border-b border-line bg-bg px-4 pb-4 shadow-[0_20px_30px_-24px_rgba(17,40,30,0.35)] lg:hidden">
            <ol className="grid gap-1">
              {[['routes', '整个校园的顺路'], ...NAV_LINKS, ['safety', '这些单发不出去']].map(([to, l], i) => (
                <li key={to}><Anchor to={to} onClick={() => setOpen(false)} className="flex h-12 items-center gap-3 rounded-xl px-2 text-[17px] font-semibold active:bg-sunken"><span className="tnum w-5 text-sm text-muted">{i + 1}</span>{l}</Anchor></li>
              ))}
              <li><Link to="/thinking" className="flex h-12 items-center gap-3 rounded-xl px-2 text-[17px] font-semibold text-muted active:bg-sunken"><span className="w-5" />产品思考（写给评审）</Link></li>
            </ol>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  )
}

// Hero 里的「真实订单卡」：用产品自己的状态跑一遍，不是截图
// 唯一的跑马灯：一眼看到能跑哪些单、在哪些楼之间跑
function Ticker() {
  const reduce = useReducedMotion()
  const items = [
    ['type-express', '代取快递'], ['type-buy', '代买'], ['type-seat', '占座'], ['type-food', '外卖上楼'], ['type-other', '顺路捎带'],
    [null, '菜鸟驿站'], [null, '图书馆三楼'], [null, '梅园 5 号楼'], [null, '第二食堂'], [null, '学术报告厅'],
  ]
  const row = items.map(([ic, t], i) => (
    <span key={i} className="flex shrink-0 items-center gap-3 text-xl font-semibold md:text-2xl">
      {ic ? <img src={icon(ic + '-v1')} width={36} height={36} alt="" aria-hidden="true" className="size-9 object-contain" /> : <span className="size-2 rounded-full bg-line" aria-hidden="true" />}
      <span className={ic ? '' : 'text-muted'}>{t}</span>
    </span>
  ))
  return (
    <div className="overflow-hidden border-y border-line bg-surface py-6" aria-label="可以发的任务类型和常见楼栋">
      <motion.div className="flex w-max gap-12 pr-12" animate={reduce ? undefined : { x: ['0%', '-50%'] }} transition={{ duration: 38, ease: 'linear', repeat: Infinity }}>
        {row}{row}
      </motion.div>
    </div>
  )
}

const SCENES = [
  {
    key: 'express', tab: '排长队的快递驿站', short: '驿站排队', route: ['菜鸟驿站', '梅园 5 号楼', '一教下课回梅园的同学，多走 1 分钟'], img: 'scene-express-v2', alt: '校园快递驿站里排着长队，货架上堆满包裹',
    who: '大三，课排满的小禾',
    pain: '驿站傍晚要排二十分钟，她 17:50 才下课，18:00 就关门。三个快递放了三天，找室友要欠人情，找陌生人又怕取件码被乱用。',
    fix: '发一单 ¥5。取件码只在有人接单后才给对方看，送到后当面核验送达码，钱才放出去。',
  },
  {
    key: 'seat', tab: '早八前的图书馆座位', short: '早八占座', route: ['图书馆', '图书馆 3F', '去一教路过图书馆的同学，就在路上'], img: 'scene-seat-v2', alt: '清晨图书馆靠窗的空位上放着一本书',
    who: '考研，住得远的周砚',
    pain: '宿舍离图书馆一公里，每天 7:40 靠窗位就没了。住在旁边的同学顺手就能占，但不知道谁靠谱。',
    fix: '接单人的信用分公开可见。接了不去算爽约，直接扣 5 分，下次能接的单就变少。',
  },
  {
    key: 'handoff', tab: '宿舍楼下的交接', short: '楼下交接', route: ['北门', '桃园 2 号楼', '一教去兰园的同学，多走 3 分钟'], img: 'scene-handoff-v2', alt: '宿舍楼门口，两名学生交接一袋外卖',
    who: '赶作业下不了楼的于小渔',
    pain: '外卖放在北门取餐点，走回 6 楼要十分钟。正好回宿舍的同学顺手就能捎上来，可彼此不认识，也不想把宿舍号给陌生人。',
    fix: '大厅按距离排序，顺路回宿舍的人最先看到；宿舍号接单后才显示，订单结束自动隐藏。',
  },
]

function Scenes() {
  const [k, setK] = useState('express')
  const reduce = useReducedMotion()
  const s = SCENES.find((x) => x.key === k)
  useEffect(() => {
    const t = setTimeout(() => SCENES.forEach((x) => { const i = new Image(); i.src = img(x.img) }), 1500)
    return () => clearTimeout(t)
  }, [])
  return (
    <section id="scenes" className={`mx-auto max-w-7xl scroll-mt-16 ${SECTION}`}>
      <div className="grid gap-x-12 lg:grid-cols-12 lg:items-end">
        <Reveal className="lg:col-span-7"><H2>三个每天都在发生的<br />跑腿时刻</H2></Reveal>
        <Reveal delay={0.05} className="lg:col-span-5 lg:pb-1"><Lead className="lg:mt-0">课表把一天切成好几段，小事却天天有。总有同学刚好要走你那条路。</Lead></Reveal>
      </div>
      <div className="mt-12">
        <div className="grid grid-cols-3 gap-1 rounded-full bg-sunken p-1 md:inline-flex" role="tablist" aria-label="用户场景">
          {SCENES.map((x) => (
            <button key={x.key} role="tab" aria-selected={k === x.key} onClick={() => setK(x.key)}
              className={`relative h-11 shrink-0 whitespace-nowrap rounded-full px-3 text-[15px] font-semibold transition-colors md:px-5 ${k === x.key ? 'text-bg' : 'text-muted hover:text-ink'}`}>
              {k === x.key && <motion.span layoutId="scene-pill" transition={{ type: 'spring', stiffness: 380, damping: 32 }} className="absolute inset-0 rounded-full bg-ink" />}
              <span className="relative"><span className="md:hidden">{x.short || x.tab}</span><span className="hidden md:inline">{x.tab}</span></span>
            </button>
          ))}
        </div>
      </div>
      <div className="mt-8 grid gap-8 lg:grid-cols-12 lg:gap-12" role="tabpanel">
        <div className="relative overflow-hidden rounded-2xl bg-sunken lg:col-span-5">
          <AnimatePresence initial={false}>
            <motion.img key={s.img} src={img(s.img)} width={1100} height={825} alt={s.alt}
              initial={reduce ? false : { clipPath: 'inset(0 0 0 100%)' }} animate={{ clipPath: 'inset(0 0 0 0%)' }} exit={{ opacity: 0 }} transition={{ duration: 0.8, ease }}
              className="aspect-[16/10] w-full object-cover lg:absolute lg:inset-0 lg:aspect-auto lg:h-full" />
          </AnimatePresence>
          <div className="hidden lg:block lg:aspect-[5/4]" />
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={s.key} initial={reduce ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? { opacity: 0 } : { opacity: 0, y: -10 }} transition={{ duration: 0.45, ease }}
            className="flex flex-col justify-start lg:col-span-7 lg:pt-2">
            <p className="text-[15px] font-semibold text-muted">{s.who}</p>
            <p className="mt-4 text-2xl font-medium leading-[1.55] tracking-[-0.01em] md:text-[28px]">「{s.pain}」</p>
            <div className="mt-8 flex gap-4 rounded-2xl bg-accent-soft p-5 md:p-6">
              <img src={`${import.meta.env.BASE_URL}brand/logo-v2.png`} width={44} height={44} alt="" aria-hidden="true" className="size-11 shrink-0" />
              <p className="text-lg leading-relaxed">{s.fix}</p>
            </div>
            {s.route && (
              <div className="mt-4 flex items-center gap-3 rounded-2xl bg-surface p-4 ring-1 ring-line">
                <span className="whitespace-nowrap text-[15px] font-semibold">{s.route[0]}</span>
                <span aria-hidden="true" className="relative h-0.5 min-w-8 flex-1 bg-accent"><span className="absolute -left-1 -top-[5px] size-3 rounded-full bg-ink" /><span className="absolute -right-1 -top-[5px] size-3 rounded-full bg-accent" /></span>
                <span className="whitespace-nowrap text-[15px] font-semibold">{s.route[1]}</span>
              </div>
            )}
            {s.route && <p className="mt-2 px-1 text-sm text-accent">顺路的人：{s.route[2]}</p>}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}

// 滚动叙事：右侧六步往下滚，左侧那张订单卡跟着变状态
const LOOP = [
  { icon: 'step-publish', alt: '带硬币的喇叭', t: '发布', d: '选模板和楼栋，赏金先冻结托管。', status: '待接单', escrow: '¥5 冻结中', code: 'locked', credit: '发单人 88' },
  { icon: 'step-accept', alt: '接过包裹的手', t: '接单', d: '认证过、信用够的人才能接。', status: '已接单', escrow: '¥5 冻结中', code: 'open', credit: '跑腿人 70' },
  { icon: 'step-ongoing', alt: '打开的锁和包裹', t: '进行中', d: '接单后，取件码和宿舍号才对跑腿人可见，去驿站取件。', status: '送达中', escrow: '¥5 冻结中', code: 'open', credit: '跑腿人 70' },
  { icon: 'step-deliver', alt: '放在门口拍照的包裹', t: '送达', d: '当面核验送达码，或拍照留证。', status: '待确认', escrow: '¥5 冻结中', code: 'open', credit: '跑腿人 70' },
  { icon: 'step-confirm', alt: '两只手传递硬币', t: '确认', d: '发单人确认，托管放款。', status: '已放款', escrow: '¥5 已放给跑腿人', code: 'hidden', credit: '跑腿人 70 → 72' },
  { icon: 'step-rate', alt: '带星星的对话气泡', t: '互评', d: '双方互相打分，信用实时变化。', status: '已互评', escrow: '¥5 已放给跑腿人', code: 'hidden', credit: '跑腿人 73，发单人 90' },
]

function StateRow({ k, v }) {
  const reduce = useReducedMotion()
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <span className="text-[15px] text-muted">{k}</span>
      <AnimatePresence mode="wait">
        <motion.span key={v} initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="tnum text-right text-[15px] font-semibold">{v}</motion.span>
      </AnimatePresence>
    </div>
  )
}

// 六步卡里的小地图：每走一步，跑腿人在路上前进一段
const STAGE_X = [8, 8, 42, 90, 90, 90] // 一教 → 驿站 → 梅园
function StageMap({ i }) {
  const reduce = useReducedMotion()
  const sp = reduce ? { duration: 0 } : { type: 'spring', stiffness: 160, damping: 22 }
  return (
    <div className="relative mt-5 h-24 overflow-hidden rounded-xl bg-sunken" aria-hidden="true">
      <span className="absolute left-[8%] right-[10%] top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-ink/70" />
      <motion.span className="absolute left-[42%] top-1/2 h-[6px] -translate-y-1/2 rounded-full bg-accent" initial={false} animate={{ width: i >= 2 ? '48%' : '0%' }} transition={sp} />
      {[['一教', 8], ['菜鸟驿站', 42], ['梅园', 90]].map(([n, x]) => (
        <span key={n} className="absolute top-1/2" style={{ left: `${x}%` }}>
          <span className={`absolute left-0 top-0 block size-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-4 ring-sunken ${n === '菜鸟驿站' ? 'bg-accent' : 'bg-ink'}`} />
          <span className="absolute left-0 top-3 -translate-x-1/2 whitespace-nowrap text-xs font-semibold text-muted">{n}</span>
        </span>
      ))}
      <motion.img src={icon('type-express-v1')} width={28} height={28} alt="" className="absolute top-[4%] size-7 translate-x-1"
        initial={false} animate={{ left: `${i >= 2 ? STAGE_X[i] : 42}%`, scale: i === 0 ? [1, 1.2, 1] : 1, opacity: i >= 4 ? 0 : 1 }} transition={sp} />
      <motion.span className="absolute top-[34%] grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-surface ring-[3px] ring-ink"
        initial={false} animate={{ left: `${STAGE_X[i]}%`, opacity: i === 0 ? 0 : 1 }} transition={sp}>
        <img src={icon('avatar-runner-v1')} width={28} height={28} alt="" className="size-7 rounded-full" />
      </motion.span>
      {i >= 4 && (
        <motion.span key={`pay${i}`} className="tnum absolute right-[17%] top-[6%] rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-on-accent"
          initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={sp}>{i === 4 ? '+¥5' : '信用 +3'}</motion.span>
      )}
    </div>
  )
}

function OrderStage({ i }) {
  const s = LOOP[i]
  const code = s.code === 'open' ? '6-2-3108' : s.code === 'hidden' ? '订单结束，已隐藏' : '接单后可见'
  return (
    <div className="rounded-2xl bg-bg p-6 text-ink shadow-[0_30px_60px_-30px_rgba(0,0,0,0.5)]">
      <div className="flex items-center gap-2">
        <img src={icon('type-express-v1')} width={36} height={36} alt="" aria-hidden="true" className="size-9" />
        <p className="text-lg font-semibold">菜鸟驿站取 2 个小件快递</p>
      </div>
      <StageMap i={i} />
      <div className="mt-4 grid grid-cols-6 gap-1.5" aria-hidden="true">
        {LOOP.map((_, k) => (
          <motion.span key={k} className="h-2 rounded-full" animate={{ backgroundColor: k <= i ? 'var(--accent)' : 'var(--sunken)' }} transition={{ duration: 0.35 }} />
        ))}
      </div>
      <div className="mt-2 grid grid-cols-6 gap-1.5 text-center text-xs font-semibold text-muted" aria-hidden="true">
        {LOOP.map((x, k) => <span key={x.t} className={k === i ? 'text-accent' : ''}>{x.t}</span>)}
      </div>
      <div className="mt-5 divide-y divide-line border-t border-line">
        <StateRow k="状态" v={s.status} />
        <StateRow k="赏金托管" v={s.escrow} />
        <StateRow k="取件码" v={code} />
        <StateRow k="信用" v={s.credit} />
      </div>
    </div>
  )
}

function LoopStep({ s, now, past }) {
  return (
    <li className={`flex scroll-mt-40 gap-5 transition-opacity duration-300 lg:min-h-[min(16vh,150px)] lg:items-center ${now ? 'opacity-100' : past ? 'opacity-100 lg:opacity-70' : 'opacity-100 lg:opacity-75'}`}>
      <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-bg">
        <img src={icon(s.icon + '-v1')} width={48} height={48} alt={s.alt} loading="lazy" className="size-12 object-contain" />
      </span>
      <div>
        <p className="flex items-center gap-2 text-2xl font-bold md:text-3xl">{s.t}{now && <span className="rounded-full bg-on-accent px-2 py-0.5 text-xs font-bold text-accent-deep">现在</span>}</p>
        <p className="mt-2 max-w-[30ch] text-lg leading-relaxed opacity-75">{s.d}</p>
        <p className="tnum mt-3 flex flex-wrap gap-1.5 text-sm font-semibold lg:hidden">
          {[s.status, s.escrow, s.credit].map((v, k) => <span key={k} className={`whitespace-nowrap rounded-lg bg-bg px-2.5 py-1 ${k === 0 ? 'text-accent' : 'text-ink'}`}>{v}</span>)}
        </p>
      </div>
    </li>
  )
}

// 手机上的跟随订单条：吸在顶部，跟着下面的步骤变
function MiniOrder({ i }) {
  const s = LOOP[i]
  return (
    <div className="rounded-2xl bg-bg p-3 text-ink shadow-[0_16px_30px_-18px_rgba(0,0,0,0.6)]" aria-hidden="true">
      <div className="flex items-center gap-2">
        <img src={icon('type-express-v1')} width={28} height={28} alt="" className="size-7" />
        <AnimatePresence mode="wait" initial={false}>
          <motion.span key={s.status} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}
            className="rounded-full bg-accent-soft px-2.5 py-0.5 text-sm font-bold text-accent">{s.status}</motion.span>
        </AnimatePresence>
        <span className="tnum ml-auto truncate text-sm font-semibold">{s.escrow}</span>
      </div>
      <div className="mt-2.5 grid grid-cols-6 gap-1">
        {LOOP.map((_, k) => <motion.span key={k} className="h-1.5 rounded-full" animate={{ backgroundColor: k <= i ? 'var(--accent)' : 'var(--sunken)' }} transition={{ duration: 0.3 }} />)}
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
        {[['取件码', s.code === 'open' ? '6-2-3108' : s.code === 'hidden' ? '已隐藏' : '接单后可见', s.code === 'open'], ['信用', s.credit, i >= 4]].map(([k, v, hot]) => (
          <div key={k} className={`rounded-lg px-2 py-1 transition-colors ${hot ? 'bg-accent-soft text-accent' : 'bg-sunken text-muted'}`}>
            <span className="opacity-70">{k} </span>
            <AnimatePresence mode="wait" initial={false}>
              <motion.span key={v} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.18 }} className="tnum inline-block font-bold">{v}</motion.span>
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  )
}

function Loop() {
  const [active, setActive] = useState(0)
  const ol = useRef(null)
  const { scrollY } = useScroll()
  // 当前步 = 最后一个顶边越过手机吸顶条下方 / 桌面视口 55%那条线的步骤，卡片永远和正对着的那一步一致
  useMotionValueEvent(scrollY, 'change', () => {
    const items = ol.current?.children
    if (!items) return
    let k = 0
    if (window.innerWidth >= 1024) {
      const line = window.innerHeight * 0.55
      for (let j = 0; j < items.length; j++) if (items[j].getBoundingClientRect().top < line) k = j
    } else {
      // 手机：吸顶条下面第一个完整露出来的步骤
      k = items.length - 1
      for (let j = 0; j < items.length; j++) if (items[j].getBoundingClientRect().top > 140) { k = j; break }
    }
    setActive(k)
  })
  return (
    <section id="loop" className="scroll-mt-16 px-4">
      <div className="rounded-[32px] bg-accent-deep text-on-accent md:rounded-[48px]">
      <div className={`mx-auto max-w-7xl ${SECTION}`}>
        <div className="grid gap-x-12 lg:grid-cols-12 lg:items-end">
          <Reveal className="lg:col-span-7"><H2>一单从发布到信用变化，<br />六步走完</H2></Reveal>
          <Reveal delay={0.05} className="lg:col-span-5 lg:pb-1"><p className="mt-5 lg:mt-0 max-w-[38ch] text-lg leading-relaxed opacity-80 md:text-xl">往下滚，<span className="lg:hidden">每一步下面写着这单此刻的状态</span><span className="hidden lg:inline">左边这张订单会跟着走完一遍</span>：钱什么时候冻结、取件码什么时候出现、信用什么时候变。</p></Reveal>
        </div>
        <div className="mt-12 grid gap-12 lg:mt-14 lg:grid-cols-12">
          <div className="hidden lg:col-span-6 lg:block xl:col-span-5 xl:col-start-1">
            <div className="sticky top-28 xl:-mr-6"><OrderStage i={active} /></div>
          </div>
          <div className="lg:col-span-6 lg:col-start-7">
            <ol ref={ol} className="space-y-10 lg:space-y-0">
              {LOOP.map((s, k) => <LoopStep key={s.t} s={s} now={k === active} past={k < active} />)}
            </ol>
          </div>
        </div>
      </div>
      </div>
    </section>
  )
}

const TRUST = [
  { icon: 'trust-verify-v1', alt: '带对勾的学生证', t: '校园身份认证', fear: '怕对方是校外的人', fix: '学号或 .edu.cn 邮箱认证，带徽章；没认证只能浏览，不能接单。' },
  { icon: 'trust-credit-v1', alt: '带上升箭头的奖牌', t: '双向信用分', fear: '怕碰上不靠谱的人', fix: '跑腿人按时 +2、爽约 -5；发单人接单后取消、恶意申诉都 -5。赏金越高，要求的信用越高。' },
  { icon: 'trust-escrow-v1', alt: '护着硬币的盾牌', t: '赏金托管', fear: '怕付了钱没人管', fix: '发布即冻结，确认送达才放款；2 小时不确认自动放款，跑腿人也不怕白跑。' },
  { icon: 'trust-privacy-v1', alt: '挂锁和钥匙', t: '隐私分级', fear: '怕取件码和宿舍号被乱传', fix: '接单后才可见，订单结束自动隐藏；电话一律走虚拟号。' },
  { icon: 'trust-dispute-v1', alt: '天平', t: '送达凭证与申诉', fear: '怕出了问题说不清', fix: '送达码当面核验或拍照留证；申诉期间钱继续冻结，平台判责。' },
]

// 信任五道关：沿一条路排开，包裹往下走，每过一关，那一种「怕」被划掉、对应的办法亮起来
function TrustStop({ x, lit, reduce }) {
  return (
    <li className="relative flex gap-5 pb-10 last:pb-0 md:gap-6">
      <motion.span animate={{ scale: lit ? 1 : 0.92 }} transition={{ type: 'spring', stiffness: 400, damping: 22 }}
        className={`relative z-10 grid size-14 shrink-0 place-items-center rounded-2xl ring-4 ring-bg transition-colors duration-300 ${lit ? 'bg-accent-soft' : 'bg-sunken'}`}>
        <img src={icon(x.icon)} width={44} height={44} alt={x.alt} loading="lazy" className={`size-11 object-contain transition duration-300 ${lit ? '' : 'opacity-60'}`} />
      </motion.span>
      <div className="min-w-0 pt-1">
        <p className="relative inline-block text-[15px] font-semibold text-muted">
          {x.fear}
          <motion.span aria-hidden="true" className="absolute inset-x-0 top-1/2 h-0.5 origin-left rounded-full bg-accent"
            initial={false} animate={{ scaleX: lit ? 1 : 0 }} transition={{ duration: reduce ? 0 : 0.35, ease }} />
        </p>
        <p className="mt-1 text-2xl font-bold md:text-3xl">{x.t}</p>
        <p className={`mt-2 max-w-[44ch] text-lg leading-relaxed transition-opacity duration-300 ${lit ? 'opacity-100' : 'opacity-45'}`}>{x.fix}</p>
      </div>
    </li>
  )
}

// 隐私分级：同一张取件卡，接单前打码、接单后亮出、结束后收起，三秒换一次
const PRIV = [
  { k: '接单前', code: '• • ••••', room: '梅园 * 号楼 ***', tone: 'muted', who: '大厅里谁都看不到，只看到「梅园」' },
  { k: '接单后', code: '6-2-3108', room: '梅园 5 号楼 412', tone: 'open', who: '只有接下这单的同学看得到' },
  { k: '结束后', code: '6-2-3108', room: '梅园 5 号楼 412', tone: 'closed', who: '送达那一刻收回，对方再也看不到' },
]
function PrivacyDemo() {
  const reduce = useReducedMotion()
  const [i, setI] = useState(1)
  const [hold, setHold] = useState(0)
  // 自己轮播；用户点了某一段，就停在那里 8 秒再继续
  useEffect(() => {
    if (reduce) return
    const id = setTimeout(() => setI((v) => (v + 1) % PRIV.length), hold ? 8000 : 2600)
    return () => clearTimeout(id)
  }, [reduce, i, hold])
  const p = PRIV[i]
  const pick = (k) => { setI(k); setHold((h) => h + 1) }
  const val = (v) => (
    <span className="relative inline-block">
      <span className={p.tone === 'open' ? '' : 'opacity-40'}>{v}</span>
      {p.tone === 'closed' && <motion.span aria-hidden="true" initial={reduce ? false : { scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.35, delay: 0.1 }} className="absolute inset-x-0 top-1/2 h-0.5 origin-left rounded-full bg-bg" />}
    </span>
  )
  return (
    <div className="rounded-[24px] bg-ink p-5 text-bg">
      <div role="tablist" aria-label="取件信息在三个阶段的样子" className="relative grid grid-cols-3 gap-1 rounded-full bg-bg/10 p-1 text-sm font-semibold">
        {/* 滑块和文字颜色同一时长、同一缓动，切换时不会有一帧白底白字 */}
        <span aria-hidden="true" className="absolute inset-y-1 left-1 w-[calc((100%-16px)/3)] rounded-full bg-bg transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]" style={{ transform: `translateX(calc(${i} * (100% + 4px)))` }} />
        {PRIV.map((x, k) => (
          <button key={x.k} role="tab" aria-selected={k === i} onClick={() => pick(k)} className="relative grid h-9 place-items-center rounded-full active:scale-[0.97]">
            <span className={`relative transition-colors duration-300 ${k === i ? 'text-ink' : 'text-bg/70'}`}>{x.k}</span>
          </button>
        ))}
      </div>
      <div role="tabpanel" className="mt-5">
        <div className="flex items-center justify-between">
          <p className="text-sm opacity-70">取件码</p>
          {p.tone === 'closed' && <span className="inline-flex items-center gap-1 rounded-full bg-bg/10 px-2 py-0.5 text-xs font-semibold"><img src={icon('ic-lock-v1')} width={14} height={14} alt="" className="size-3.5" />已收回</span>}
        </div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={i} initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
            <p className="tnum text-4xl font-bold tracking-wide">{val(p.code)}</p>
            <div className="mt-4 flex justify-between border-t border-bg/15 pt-3 text-[15px]"><span className="opacity-70">送到</span><span className="font-semibold">{val(p.room)}</span></div>
            <p className="mt-3 text-sm opacity-80">{p.who}</p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

function Trust() {
  const reduce = useReducedMotion()
  const list = useRef(null)
  const { scrollYProgress } = useScroll({ target: list, offset: ['start 65%', 'end 55%'] })
  const fill = useTransform(scrollYProgress, [0, 1], [0, 1])
  const top = useTransform(scrollYProgress, (v) => `calc(28px + ${Math.min(1, Math.max(0, v))} * (100% - 56px))`)
  const [lit, setLit] = useState(reduce ? TRUST.length : 0)
  useMotionValueEvent(scrollYProgress, 'change', (v) => { if (!reduce) setLit(Math.floor(v * TRUST.length + 0.35)) })
  return (
    <section id="trust" className={`mx-auto max-w-7xl scroll-mt-16 ${SECTION}`}>
      <div className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-28">
            <Reveal><H2>凭什么把取件码<br />交给一个陌生同学</H2></Reveal>
            <Reveal delay={0.05}><Lead>校园跑腿最大的成本不是钱，是对陌生人的不放心。信任拆成五道关，包裹每过一关，就少一种怕。</Lead></Reveal>
            <Reveal delay={0.1}>
              <div className="mt-8 lg:mt-10"><PrivacyDemo /></div>
            </Reveal>
          </div>
        </div>
        <ol ref={list} className="relative lg:col-span-7 lg:col-start-6 lg:pt-2">
          <span aria-hidden="true" className="absolute bottom-7 left-[27px] top-7 w-0.5 -translate-x-1/2 border-l-2 border-dashed border-line" />
          {!reduce && (
            <>
              <motion.span aria-hidden="true" style={{ scaleY: fill }} className="absolute bottom-7 left-[27px] top-7 w-[3px] origin-top -translate-x-1/2 rounded-full bg-accent" />
              <motion.span aria-hidden="true" style={{ top }} className="absolute left-[27px] z-0 -ml-[15px] grid size-[30px] -translate-y-1/2 place-items-center rounded-full bg-surface shadow-[0_6px_16px_-6px_rgba(11,122,85,0.6)] ring-2 ring-accent">
                <img src={icon('type-express-v1')} width={20} height={20} alt="" className="size-5" />
              </motion.span>
            </>
          )}
          {TRUST.map((x, i) => <TrustStop key={x.t} x={x} lit={i < lit} reduce={reduce} />)}
        </ol>
      </div>
    </section>
  )
}

// 信用模拟器：点一条规则，分数和等级当场变
function Credit() {
  const reduce = useReducedMotion()
  const [who, setWho] = useState('runner')
  const start = who === 'runner' ? 70 : 88
  const [score, setScore] = useState(start)
  const [last, setLast] = useState(null)
  const mv = useMotionValue(start)
  const shown = useTransform(mv, (v) => Math.round(v))
  useEffect(() => {
    if (reduce) { mv.set(score); return }
    const c = animate(mv, score, { duration: 0.6, ease })
    return () => c.stop()
  }, [score, reduce, mv])
  const switchWho = (w) => { setWho(w); const s0 = w === 'runner' ? 70 : 88; setScore(s0); setLast(null); setHist([]) }
  const rules = who === 'runner' ? [...RULES_PLUS, ...RULES_MINUS] : [...POSTER_RULES_PLUS, ...POSTER_RULES_MINUS]
  const tiers = who === 'runner' ? LEVELS : POSTER_TIERS
  const tier = [...tiers].reverse().find((l) => score >= l.min)
  const [hist, setHist] = useState([])
  // 手机上点规则时大分数卡已经滚出屏幕：这时底部浮出一个小分数条
  const cardRef = useRef(null)
  const cardOn = useInView(cardRef, { amount: 0.25 })
  // 手机上点规则时，大分数卡如果不在屏幕里，就在顶栏下面弹 2 秒小分数条，然后自己收起
  const [flash, setFlash] = useState(0)
  useEffect(() => { if (!flash) return; const id = setTimeout(() => setFlash(0), 2200); return () => clearTimeout(id) }, [flash])
  const apply = (r) => {
    if (!cardOn) setFlash(Date.now())
    const to = Math.max(0, Math.min(100, score + r.delta))
    setScore(to); setLast(r)
    setHist((h) => [{ id: Date.now(), label: r.label, delta: r.delta, to }, ...h].slice(0, 3))
  }
  return (
    <section id="credit" className="scroll-mt-16 border-y border-line bg-surface">
      <div className={`mx-auto max-w-7xl ${SECTION}`}>
        <div className="grid gap-x-12 lg:grid-cols-12 lg:items-end">
          <Reveal className="lg:col-span-7"><H2>双向信用：<br />谁不守约谁扣分</H2></Reveal>
          <Reveal delay={0.05} className="lg:col-span-5 lg:pb-1"><Lead className="lg:mt-0">满分 100，跑腿人认证后从 70 起步，发单人小满现在 88 分；不能充值也不能刷。点任意一条规则，看分数和等级怎么变。</Lead></Reveal>
        </div>
        <div className="mt-14 grid gap-6 lg:grid-cols-12">
          <Reveal className="lg:col-span-5">
            <div ref={cardRef} className="flex flex-col rounded-2xl bg-accent p-6 text-on-accent md:p-8 lg:sticky lg:top-28 lg:h-full">
              <div className="flex items-center justify-between">
                <div className="grid grid-cols-2 rounded-full bg-on-accent/15 p-1 text-sm font-semibold">
                  {[['runner', '跑腿人'], ['poster', '发单人']].map(([k, l]) => (
                    <button key={k} onClick={() => switchWho(k)} aria-pressed={who === k} className={`h-9 whitespace-nowrap rounded-full px-4 transition-colors ${who === k ? 'bg-on-accent text-accent' : 'text-on-accent/80'}`}>{l}</button>
                  ))}
                </div>
                <button onClick={() => switchWho(who)} aria-label="重置分数" className="grid size-10 place-items-center rounded-full bg-on-accent/15 transition active:scale-90"><ArrowCounterClockwise size={18} weight="bold" /></button>
              </div>
              <div className="mt-6 flex items-end gap-4 lg:mt-10">
                <motion.span className="tnum text-[96px] font-bold leading-none tracking-[-0.04em] md:text-[120px]">{shown}</motion.span>
                <AnimatePresence mode="wait">
                  {last && (
                    <motion.span key={score + last.label} initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="tnum mb-4 rounded-full bg-on-accent/15 px-3 py-1 text-lg font-bold">{last.delta > 0 ? '+' : ''}{last.delta}</motion.span>
                  )}
                </AnimatePresence>
              </div>
              <ul className="mt-4 min-h-[3rem] space-y-1.5 text-[15px] lg:mt-6 lg:min-h-[6.5rem]" aria-live="polite">
                {hist.length === 0 && <li className="opacity-75"><span className="lg:hidden">点下面</span><span className="hidden lg:inline">点右边</span>任意一条规则，分数会在这里记一笔。</li>}
                <AnimatePresence initial={false}>
                  {hist.map((h) => (
                    <motion.li key={h.id} layout initial={reduce ? false : { opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
                      className="flex items-center justify-between gap-3 border-b border-on-accent/15 pb-1.5">
                      <span className="truncate opacity-90">{h.label}</span>
                      <span className="tnum shrink-0 font-bold">{h.delta > 0 ? '+' : ''}{h.delta} → {h.to}</span>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
              <div className="mt-auto flex items-center gap-3 pt-6">
                <img src={icon(tier.badge + '-v1')} width={56} height={56} alt={tier.alt} className="size-14 rounded-2xl bg-on-accent/90 object-contain p-1" />
                <div>
                  <p className="text-xl font-bold">「{tier.name}」</p>
                  <p className="text-[15px] opacity-85">{tier.desc}</p>
                </div>
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.05} className="lg:col-span-7">
            <AnimatePresence>
              {flash > 0 && !cardOn && (
                <motion.div key="mini" initial={reduce ? false : { y: -16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -10, opacity: 0 }} transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  className="fixed inset-x-4 top-[76px] z-30 flex items-center gap-3 rounded-full bg-accent py-2 pl-2 pr-5 text-on-accent shadow-[0_16px_30px_-12px_rgba(11,122,85,0.7)] lg:hidden" aria-hidden="true">
                  <img src={icon(tier.badge + '-v1')} width={40} height={40} alt="" className="size-10 rounded-full bg-on-accent/90 object-contain p-0.5" />
                  <span className="text-[15px] font-semibold">{who === 'runner' ? '跑腿人' : '发单人'}「{tier.name}」</span>
                  <span className="ml-auto flex items-baseline gap-2">
                    {last && <motion.span key={score + last.label} initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="tnum text-[15px] font-bold opacity-90">{last.delta > 0 ? '+' : ''}{last.delta}</motion.span>}
                    <motion.span className="tnum text-2xl font-bold">{shown}</motion.span>
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
            <ol className="relative">
              <span aria-hidden="true" className="absolute bottom-6 left-[19px] top-6 border-l-2 border-dashed border-line" />
              {rules.map((r) => {
                const here = last?.label === r.label
                return (
                  <li key={r.label} className="relative">
                    <button onClick={() => apply(r)} className="group flex w-full items-center gap-4 rounded-2xl py-3 pr-3 text-left transition hover:bg-bg active:scale-[0.99]">
                      <span className="relative z-10 grid size-10 shrink-0 place-items-center">
                        <span className={`size-4 rounded-full ring-4 ring-surface transition-transform group-hover:scale-125 ${r.delta > 0 ? 'bg-accent' : 'bg-danger'}`} />
                        {here && (
                          <motion.span layoutId="credit-walker" transition={{ type: 'spring', stiffness: 300, damping: 26 }} className="absolute inset-0 grid place-items-center rounded-full bg-surface ring-[3px] ring-ink">
                            <img src={icon('avatar-runner-v1')} width={32} height={32} alt="" className="size-8 rounded-full" />
                          </motion.span>
                        )}
                      </span>
                      <span className={`tnum w-10 shrink-0 text-2xl font-bold ${r.delta > 0 ? 'text-accent' : 'text-danger'}`}>{r.delta > 0 ? '+' : ''}{r.delta}</span>
                      <span className="min-w-0 flex-1"><span className="block text-lg font-semibold">{r.label}</span><span className="block text-[15px] text-muted">{r.note}</span>
                        {here && (
                          <motion.span key={score} initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                            className="tnum mt-2 inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1 text-sm font-bold text-accent lg:hidden">现在 {score} 分 ·「{tier.name}」</motion.span>
                        )}</span>
                    </button>
                  </li>
                )
              })}
            </ol>
            <p className="mt-4 text-[15px] text-muted">{who === 'runner' ? '跑腿人：72 分以上可接 ¥15 以内的单，85 分以上不限金额，低于 60 分暂停接单。' : '发单人：低于 70 分单笔赏金上限 ¥10，低于 75 分大厅会提醒跑腿人。'}</p>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

// 拦截演示：一张真实的发布表单，备注里自己打出「代签到」，输入框变红、拦截卡弹出、发布按钮变灰
const BAN_DEMO = ['帮忙带份早饭到一教', '下午帮我代签到一下', '图书馆三楼占个座', '帮我代写作业，价格好说']
function BanDemo() {
  const reduce = useReducedMotion()
  const ref = useRef(null)
  const on = useInView(ref, { amount: 0.4 })
  const [i, setI] = useState(1)
  const [n, setN] = useState(reduce ? BAN_DEMO[1].length : 0)
  const text = BAN_DEMO[i]
  useEffect(() => {
    if (reduce || !on) return
    if (n < text.length) { const id = setTimeout(() => setN(n + 1), 110); return () => clearTimeout(id) }
    const id = setTimeout(() => { setI((i + 1) % BAN_DEMO.length); setN(0) }, 2200)
    return () => clearTimeout(id)
  }, [n, text, on, reduce, i])
  const typed = text.slice(0, n)
  const hit = /代签到|代写作业|代考|替考|代点名/.exec(typed)
  return (
    <div ref={ref} className="rounded-[24px] bg-surface p-5 text-ink shadow-[0_30px_60px_-30px_rgba(0,0,0,0.6)]" aria-label="发布表单拦截演示">
      <p className="text-[15px] font-semibold">备注（选填）</p>
      <div className={`mt-2 min-h-12 rounded-xl px-3.5 py-3 text-base ring-1 transition-colors ${hit ? 'bg-danger-soft ring-2 ring-danger' : 'bg-bg ring-line'}`}>
        {typed}<span aria-hidden="true" className="ml-0.5 inline-block h-5 w-0.5 translate-y-1 animate-pulse bg-ink" />
      </div>
      {/* 提示区固定高度：拦截卡只淡入淡出，下面的按钮不跟着跳 */}
      <div className="relative mt-3 h-[96px] md:h-[80px]">
        <AnimatePresence initial={false} mode="wait">
          {hit ? (
            <motion.div key="ban" initial={reduce ? false : { opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
              className="absolute inset-0 flex items-center gap-3 rounded-2xl bg-danger-soft p-3 ring-1 ring-danger/30">
              <img src={icon('blocked-v1')} width={48} height={48} alt="" className="size-12 shrink-0 object-contain" />
              <p className="text-[15px] font-semibold leading-snug text-danger">检测到「{hit[0]}」。这类任务发不出去，顺路侠是互助，不帮人作弊。</p>
            </motion.div>
          ) : (
            <motion.p key="ok" initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
              className="absolute inset-0 flex items-center rounded-2xl px-1 text-[15px] text-muted">一边打字一边检查，没问题就能发布。</motion.p>
          )}
        </AnimatePresence>
      </div>
      <div className={`mt-3 grid h-12 place-items-center rounded-full text-[15px] font-semibold transition-colors ${hit ? 'bg-sunken text-muted' : 'bg-accent text-on-accent'}`}>{hit ? '不能发布' : '冻结 ¥5 并发布'}</div>
      <p className="mt-4 text-xs font-semibold text-muted">会被拦下的词</p>
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {['代考', '替考', '代签到', '代点名', '代写作业', '代刷网课'].map((w) => (
          <li key={w} className={`rounded-full px-2.5 py-1 text-xs font-semibold line-through decoration-danger decoration-2 transition-colors ${hit && hit[0] === w ? 'bg-danger text-on-accent' : 'bg-sunken text-muted'}`}>{w}</li>
        ))}
      </ul>
      <p className="mt-3 text-center text-xs text-muted">这是原型里的真实表单，可以去发布页自己试</p>
    </div>
  )
}

function Safety() {
  const reduce = useReducedMotion()
  return (
    <section id="safety" className={`mx-auto max-w-7xl scroll-mt-16 ${SECTION}`}>
      <Reveal className="relative overflow-hidden rounded-[32px] bg-ink md:rounded-[40px]">
        <div className="relative grid gap-10 px-6 py-14 text-bg md:px-14 md:py-20 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-6">
            <h2 className="font-display text-[44px] font-bold leading-[1.05] tracking-[-0.03em] md:text-7xl">这些单，<br className="md:hidden" />发不出去</h2>
            <p className="mt-5 max-w-[34ch] text-lg leading-relaxed opacity-85 md:text-xl">互助不等于帮人作弊。发布时自动识别关键词并拦截，被举报核实的账号直接封禁。</p>

          </div>
          <div className="lg:col-span-5 lg:col-start-8"><BanDemo /></div>
        </div>
      </Reveal>
    </section>
  )
}

function CountUp({ to, prefix = '', suffix = '' }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.6 })
  const reduce = useReducedMotion()
  const mv = useMotionValue(reduce ? to : 0)
  const v = useTransform(mv, (x) => `${prefix}${Math.round(x)}${suffix}`)
  useEffect(() => {
    if (!inView || reduce) return
    const c = animate(mv, to, { duration: 1.4, ease })
    return () => c.stop()
  }, [inView, reduce, to, mv])
  return <motion.span ref={ref} className="tnum">{v}</motion.span>
}

// 北极星：100 个点里 97 个按时（绿），3 个没按时（空心），进入视口时一个个点亮
function DotMatrix() {
  const reduce = useReducedMotion()
  const ref = useRef(null)
  const on = useInView(ref, { once: true, amount: 0.5 })
  // 100 条小路线：97 条按时送到（实线），3 条没按时（红色虚线）
  return (
    <div ref={ref} className="grid w-full max-w-[260px] min-w-0 grid-cols-10 gap-x-1 gap-y-2.5 md:w-max md:max-w-none md:gap-x-2" aria-hidden="true">
      {Array.from({ length: 100 }, (_, i) => {
        const bad = i === 23 || i === 58 || i === 86
        return (
          <motion.span key={i} className="flex items-center" initial={reduce ? false : { opacity: 0.12 }} animate={on ? { opacity: 1 } : {}}
            transition={{ duration: 0.2, delay: reduce ? 0 : (i % 10) * 0.025 + Math.floor(i / 10) * 0.05 }}>
            <span className={`size-1.5 rounded-full ${bad ? 'bg-[#f07a6c]' : 'bg-on-accent'}`} />
            <span className={`h-0 w-2 border-t-2 md:w-4 ${bad ? 'border-dashed border-[#f07a6c]' : 'border-on-accent/80'}`} />
            <span className={`size-1.5 rounded-full ${bad ? 'bg-[#f07a6c]' : 'bg-on-accent'}`} />
          </motion.span>
        )
      })}
    </div>
  )
}

function Metrics() {
  return (
    <section id="metrics" className="scroll-mt-16 border-y border-line bg-surface">
      <div className={`mx-auto max-w-7xl ${SECTION}`}>
        <div className="max-w-4xl"><Reveal><H2>看三个数，<br />就知道平台健不健康</H2></Reveal></div>
        <div className="mt-14 grid grid-cols-[minmax(0,1fr)] gap-3 md:grid-cols-2 lg:grid-cols-3 lg:grid-rows-2">
          <Reveal className="flex flex-col justify-between rounded-2xl bg-accent-deep p-6 text-on-accent md:col-span-2 md:p-10 lg:row-span-2">
            <div>
              <p className="text-lg font-semibold opacity-80">北极星指标：履约率</p>
              <div className="mt-6 grid gap-8 md:grid-cols-[auto_1fr] md:items-end">
                <DotMatrix />
                <div>
                  <p className="text-7xl font-bold tracking-[-0.04em] md:text-[112px] md:leading-none">97%</p>
                  <p className="mt-2 text-lg font-semibold">每 100 趟顺路，至少 97 趟按时送到</p>
                  <p className="mt-1 text-[15px] font-medium opacity-60">目标值</p>
                </div>
              </div>
            </div>
            <p className="mt-10 max-w-[44ch] text-lg leading-relaxed opacity-90">按时送达且无申诉的单 ÷ 被接的单。信任平台的核心就是「接了就送到」，这个数掉了，其他都没意义。</p>
          </Reveal>
          <Reveal delay={0.05} className="rounded-2xl bg-bg p-6 ring-1 ring-line">
            <p className="text-lg font-semibold">接单率</p>
            <p className="mt-1 text-5xl font-bold tracking-tight text-accent"><span className="mr-2 align-middle text-base font-semibold tracking-normal opacity-80">至少</span>85%</p>
            <p className="mt-4 text-[15px] leading-relaxed text-muted">24 小时内被接的单 ÷ 发布的单。低了说明供给不够或定价偏低。目标值。</p>
          </Reveal>
          <Reveal delay={0.1} className="rounded-2xl bg-bg p-6 ring-1 ring-line">
            <div>
              <p className="text-lg font-semibold">平均接单时长</p>
              <p className="mt-1 text-5xl font-bold tracking-tight text-accent"><span className="mr-2 align-middle text-base font-semibold tracking-normal opacity-80">不超过</span>10 分钟</p>
              <p className="mt-4 text-[15px] leading-relaxed text-muted">发布到被接的中位时间。跑腿要的是快，超过 10 分钟用户就会自己去。目标值。</p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

const ROADMAP = [
  { when: '现在', t: '顺路接单 + 下课提醒', d: '说一句「我正要从一教回梅园」，大厅就按捎上每单要多走几分钟排序，5 分钟以内标为顺路；下课前 5 分钟把这条路上的单推给你。' },
  { when: '下个月', t: '课表自动认路', d: '导入课表，自动认出你每天几点、从哪栋楼走回哪栋楼，不用自己设常走的路。' },
  { when: '下学期', t: '楼长担保', d: '宿舍楼长、社团负责人做担保人，新人起步更快；上线小程序。' },
  { when: '一年内', t: '多校区', d: '同城多校共享信用，开放二手互助和拼单。' },
]

function Roadmap() {
  return (
    <section id="roadmap" className={`mx-auto max-w-7xl scroll-mt-16 ${SECTION}`}>
      <Reveal><H2>接下来做什么</H2></Reveal>
      <ol className="relative mt-12 grid gap-8 lg:grid-cols-4 lg:gap-6">
        <span aria-hidden="true" className="absolute bottom-2 left-[7px] top-2 w-0.5 border-l-2 border-dashed border-line lg:bottom-auto lg:left-2 lg:right-0 lg:top-[7px] lg:h-0.5 lg:w-auto lg:border-l-0 lg:border-t-2" />
        <span aria-hidden="true" className="absolute left-[6px] top-2 h-24 w-1 rounded-full bg-accent lg:left-2 lg:top-[6px] lg:h-1 lg:w-[22%]" />
        {ROADMAP.map((r, i) => (
          <Reveal as="li" key={r.t} delay={i * 0.06} className="relative pl-10 lg:pl-0 lg:pt-10">
            <span aria-hidden="true" className={`absolute left-0 top-1 size-4 rounded-full ring-4 ring-bg lg:top-0 ${i === 0 ? 'bg-accent' : 'bg-surface ring-offset-0 [box-shadow:inset_0_0_0_2px_var(--line)]'}`} />
            <p className={`text-[15px] font-semibold ${i === 0 ? 'text-accent' : 'text-muted'}`}>{r.when}</p>
            <p className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">{r.t}</p>
            <p className="mt-3 max-w-[30ch] text-base leading-relaxed text-muted">{r.d}</p>
          </Reveal>
        ))}
      </ol>
    </section>
  )
}

// 首屏之后第二段：从「一条路」放大到「整个校园」
function Routes() {
  return (
    <section id="routes" className="mx-auto max-w-7xl scroll-mt-16 px-4 pb-4 pt-4 md:px-8 md:pb-10 md:pt-8 lg:pb-6">
      <Reveal><H2>同一时间，<br />校园里到处是顺路</H2></Reveal>
      <div className="mt-5"><CampusRoutes /></div>
    </section>
  )
}

// 结尾：选你下课常走的路，当场算出此刻有几单顺路；带着这条路进原型（大厅按它排序）
function Final({ page }) {
  const nav = useNavigate()
  const [ri, setRi] = useState(0)
  const R = ROUTES[ri]
  const n = seedTasks().filter((t) => detourMin(R.from, R.to, t) <= 5).length
  const go = () => { try { localStorage.setItem('shunluxia:myroute', JSON.stringify({ from: R.from, to: R.to })) } catch { /* 存不了就用默认路线 */ } nav('/app') }
  return (
    <section className="border-t border-line">
      <div className="mx-auto max-w-7xl px-4 py-20 md:px-8 md:py-28 lg:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal><h2 className="font-display text-balance text-[40px] font-bold leading-[1.08] tracking-[-0.035em] md:text-7xl">你下课<br />常走哪条路？</h2></Reveal>
          <Reveal delay={0.05}>
            <div className="mt-8 flex flex-wrap justify-center gap-2" role="group" aria-label="选你常走的路">
              {ROUTES.map((x, i) => (
                <button key={x.label} onClick={() => setRi(i)} aria-pressed={i === ri}
                  className={`h-11 whitespace-nowrap rounded-full px-4 text-[15px] font-semibold transition-colors active:scale-[0.97] ${i === ri ? 'bg-ink text-bg' : 'bg-surface text-ink ring-1 ring-line'}`}>{x.label}</button>
              ))}
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-8 text-lg text-muted md:text-xl" aria-live="polite">此刻路上有 <AnimatePresence mode="wait" initial={false}><motion.b key={n} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }} className="tnum inline-block text-3xl text-accent md:text-4xl">{n}</motion.b></AnimatePresence> 单顺路，<span className="whitespace-nowrap">捎上都不超过 5 分钟</span></p>
            <p className="mx-auto mt-3 max-w-[34ch] text-[15px] text-muted">在原型「我的」里打开下课提醒，下课前 5 分钟把这条路上的单推给你。</p>
          </Reveal>
          <Reveal delay={0.15} className="mt-10 flex justify-center">
            <Magnetic>
              <button onClick={go} className="group relative inline-flex h-14 items-center gap-2 overflow-hidden whitespace-nowrap rounded-full bg-accent px-7 text-[17px] font-semibold text-on-accent shadow-[0_10px_30px_-12px_rgba(11,122,85,0.7)] transition active:scale-[0.97]">
                <span className="relative">带着这条路去看看</span><ArrowRight size={20} weight="bold" className="relative transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </Magnetic>
          </Reveal>
        </div>
      </div>
      <footer className="border-t border-line">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 text-sm text-muted md:grid-cols-[1fr_auto] md:items-center md:px-8">
          <div>
            <span className="flex items-center gap-2 text-[15px] font-semibold text-ink"><img src={`${import.meta.env.BASE_URL}brand/logo-v2.png`} width={28} height={28} alt="" aria-hidden="true" className="size-7" />顺路侠 · 本来就要经过，顺手捎一下</span>
            <p className="mt-2">校园跑腿互助平台产品原型。页面中的人名、任务、金额和指标均为示例。</p>
          </div>
          <div className="grid gap-2 md:justify-items-end">
            {page !== 'thinking' ? <Link to="/thinking" className="font-semibold text-ink underline-offset-4 hover:underline">产品思考（写给评审）</Link> : <Link to="/" className="font-semibold text-ink underline-offset-4 hover:underline">回首页</Link>}
            <p>演示数据只存在这台设备的浏览器里 · <button onClick={() => { if (window.confirm('把原型里的演示数据恢复成刚打开时的样子？')) { try { Object.keys(localStorage).filter((k) => k.startsWith('shunluxia:')).forEach((k) => localStorage.removeItem(k)) } catch { /* 无痕模式下没有本地存储 */ } } }}
              className="font-semibold text-ink underline-offset-4 hover:underline">重置演示数据</button></p>
          </div>
        </div>
      </footer>
    </section>
  )
}

function ThinkingIntro() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-4 pt-14 md:px-8 md:pt-20">
      <Reveal><p className="text-[15px] font-semibold text-accent">产品思考 · 写给评审</p></Reveal>
      <Reveal delay={0.05}><h1 className="mt-3 font-display text-balance text-[44px] leading-[1.08] md:text-7xl">为什么是「顺路」</h1></Reveal>
      <div className="mt-10 grid gap-3 md:grid-cols-3">
        {[
          ['目标用户', '时间被课表切碎、又在意隐私的在校生。需求小、频次高、怕被坑。'],
          ['为什么现在没人做好', '外卖平台不进宿舍楼，校园群接龙没有托管和信用，熟人才敢托付。'],
          ['顺路解决什么', '跑腿人本来就要走这条路，多走不到 5 分钟，赏金低也愿意接，供给自然就有。'],
        ].map(([t, d], i) => (
          <Reveal key={t} delay={0.05 * i} className="rounded-2xl bg-surface p-6 ring-1 ring-line">
            <p className="text-lg font-semibold">{t}</p>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">{d}</p>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

// 首页最后：给评审的入口，学生可以略过
function ThinkingTeaser() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-4 md:px-8">
      <Link to="/thinking" className="group flex items-center justify-between gap-4 rounded-2xl bg-surface p-5 ring-1 ring-line transition hover:ring-ink/30 md:p-6">
        <span><span className="block text-[15px] font-semibold text-muted">写给评审</span><span className="mt-1 block text-lg font-semibold">目标用户、北极星指标、接下来做什么</span></span>
        <ArrowRight size={20} weight="bold" className="shrink-0 transition-transform group-hover:translate-x-1" />
      </Link>
    </section>
  )
}

export default function Landing({ page }) {
  useEffect(() => { if (page === 'thinking') window.scrollTo(0, 0) }, [page])
  // 预加载原型分包：首页停一会儿就把原型的代码取下来，点「体验原型」不再先看骨架屏
  useEffect(() => { const id = setTimeout(() => { import('../app/AppRoot') }, 1500); return () => clearTimeout(id) }, [])
  return (
    <div className="min-h-[100dvh] bg-bg text-ink">
      <ScrollProgress />
      {page !== 'thinking' && <PageRoute />}
      <Nav page={page} />
      {page === 'thinking' ? (
        <main>
          <ThinkingIntro />
          <Metrics />
          <Roadmap />
          <Final page={page} />
        </main>
      ) : (
        <main>
          <RouteHero Cta={Cta} Anchor={Anchor} />
          <Routes />
          <Scenes />
          <Loop />
          <Trust />
          <Credit />
          <Safety />
          <ThinkingTeaser />
          <Final />
        </main>
      )}
    </div>
  )
}
