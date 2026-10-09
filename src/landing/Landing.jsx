import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import {
  PersonSimpleRun, ArrowRight, ArrowDown, Megaphone, ShieldCheck, LockKeyOpen, Camera, Handshake, Star,
  IdentificationBadge, ChartLineUp, LockKey, Scales, Prohibit, TrendUp, TrendDown,
} from '@phosphor-icons/react'
import { RULES_PLUS, RULES_MINUS, LEVELS } from '../data'

const ease = [0.16, 1, 0.3, 1]
const pic = (seed, w, h) => `https://picsum.photos/seed/${seed}/${w}/${h}`

function Reveal({ children, className = '', delay = 0, as = 'div' }) {
  const reduce = useReducedMotion()
  const M = motion[as]
  return (
    <M className={className} initial={reduce ? false : { opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.6, delay, ease }}>
      {children}
    </M>
  )
}

function Cta({ size = 'lg', className = '' }) {
  return (
    <Link to="/app" className={`group inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-accent font-semibold text-on-accent transition hover:brightness-105 active:scale-[0.98] ${size === 'lg' ? 'h-14 px-7 text-[17px]' : 'h-10 px-4 text-[15px]'} ${className}`}>
      体验原型<ArrowRight size={size === 'lg' ? 20 : 16} weight="bold" className="transition-transform group-hover:translate-x-0.5" />
    </Link>
  )
}

function Anchor({ to, children, ...p }) {
  const go = (e) => {
    e.preventDefault()
    document.getElementById(to)?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  }
  return <a href="#/" onClick={go} {...p}>{children}</a>
}

const H2 = ({ children, className = '' }) => <h2 className={`text-3xl font-bold leading-tight tracking-tight md:text-4xl ${className}`}>{children}</h2>

function Nav() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 md:px-8">
        <Anchor to="top" className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <span className="grid size-8 place-items-center rounded-lg bg-accent text-on-accent"><PersonSimpleRun size={20} weight="bold" /></span>顺路侠
        </Anchor>
        <nav className="hidden items-center gap-7 text-[15px] font-medium text-muted md:flex" aria-label="页面导航">
          <Anchor to="scenes" className="hover:text-ink">场景</Anchor>
          <Anchor to="trust" className="hover:text-ink">信任机制</Anchor>
          <Anchor to="metrics" className="hover:text-ink">核心指标</Anchor>
          <Anchor to="roadmap" className="hover:text-ink">路线图</Anchor>
        </nav>
        <Cta size="sm" />
      </div>
    </header>
  )
}

function Hero() {
  const reduce = useReducedMotion()
  const item = (i) => ({ initial: reduce ? false : { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.7, delay: 0.08 * i, ease } })
  return (
    <section id="top" className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-10 md:grid-cols-12 md:px-8 md:pt-16 lg:pb-24">
      <div className="md:col-span-6">
        <motion.h1 {...item(0)} className="text-[40px] font-bold leading-[1.1] tracking-tight md:text-6xl">
          校园跑腿，<br />先认人再接单
        </motion.h1>
        <motion.p {...item(1)} className="mt-5 max-w-[30ch] text-lg leading-relaxed text-muted md:text-xl">
          校内实名认证的跑腿互助平台。赏金先托管，信用越高，能接的单越好。
        </motion.p>
        <motion.div {...item(2)} className="mt-8 flex flex-wrap gap-3">
          <Cta />
          <Anchor to="thinking" className="inline-flex h-14 items-center gap-2 whitespace-nowrap rounded-full px-6 text-[17px] font-semibold ring-1 ring-line transition hover:bg-surface active:scale-[0.98]">
            看产品思考<ArrowDown size={18} weight="bold" />
          </Anchor>
        </motion.div>
      </div>
      <motion.div className="md:col-span-6" initial={reduce ? false : { opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.9, ease }}>
        <img src={pic('errand-rain-0', 1000, 1100)} width={1000} height={1100} alt="走在校园小路上的学生" fetchPriority="high"
          className="aspect-[4/3] w-full rounded-2xl bg-sunken object-cover md:aspect-[10/11] md:max-h-[70dvh]" />
      </motion.div>
    </section>
  )
}

const SCENES = [
  {
    key: 'express', tab: '堆在驿站的快递', seed: 'bike-book-1',
    who: '大三，课排满的小禾',
    pain: '驿站 18:00 关门，她 17:50 才下课。三个快递放了三天，找室友要欠人情，找陌生人又怕取件码被乱用。',
    fix: '发一单 ¥5。取件码只在有人接单后才给对方看，送到后当面核验送达码，钱才放出去。',
  },
  {
    key: 'seat', tab: '早八前的图书馆座位', seed: 'parcel-rain-0',
    who: '考研，住得远的周砚',
    pain: '宿舍离图书馆一公里，每天 7:40 靠窗位就没了。住在旁边的同学顺手就能占，但不知道谁靠谱。',
    fix: '接单人的信用分公开可见。接了不去算爽约，直接扣 5 分，下次能接的单就变少。',
  },
  {
    key: 'food', tab: '晚自习的一份饭', seed: 'parcel-path-1',
    who: '一教自习的于小渔',
    pain: '不想下楼排队二十分钟，而正好在食堂吃完饭的同学，根本不知道楼上有人需要。',
    fix: '大厅按距离排序，顺路的人最先看到。加急单标出来，超时送达扣 3 分。',
  },
]

function Scenes() {
  const [k, setK] = useState('express')
  const reduce = useReducedMotion()
  const s = SCENES.find((x) => x.key === k)
  return (
    <section id="thinking" className="mx-auto max-w-6xl scroll-mt-16 px-4 py-16 md:px-8 md:py-24">
      <div id="scenes" className="scroll-mt-20">
        <Reveal><H2>三个每天都在发生的跑腿时刻</H2></Reveal>
        <Reveal delay={0.05}><p className="mt-3 max-w-[40ch] text-lg text-muted">目标用户：时间被课表切碎、又在意隐私的在校生。需求小、频次高、怕被坑。</p></Reveal>
      </div>
      <div className="no-scrollbar -mx-4 mt-8 flex gap-2 overflow-x-auto px-4" role="tablist" aria-label="用户场景">
        {SCENES.map((x) => (
          <button key={x.key} role="tab" aria-selected={k === x.key} onClick={() => setK(x.key)}
            className={`h-11 shrink-0 whitespace-nowrap rounded-full px-5 text-[15px] font-semibold transition ${k === x.key ? 'bg-ink text-bg' : 'bg-surface ring-1 ring-line hover:bg-sunken'}`}>
            {x.tab}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={s.key} role="tabpanel" initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }} transition={{ duration: 0.35, ease }}
          className="mt-6 grid gap-6 md:grid-cols-5 md:gap-10">
          <img src={pic(s.seed, 900, 640)} width={900} height={640} alt="" loading="lazy" className="aspect-[4/3] w-full rounded-2xl bg-sunken object-cover md:col-span-2 md:aspect-[4/5]" />
          <div className="flex flex-col justify-center md:col-span-3">
            <p className="text-[15px] font-semibold text-muted">{s.who}</p>
            <p className="mt-3 text-xl leading-relaxed md:text-2xl">{s.pain}</p>
            <div className="mt-6 flex gap-3 border-t border-line pt-6">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent-soft text-accent"><PersonSimpleRun size={22} weight="bold" /></span>
              <p className="text-lg leading-relaxed">{s.fix}</p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </section>
  )
}

const LOOP = [
  { Icon: Megaphone, t: '发布', d: '选模板和楼栋，赏金冻结托管' },
  { Icon: IdentificationBadge, t: '接单', d: '认证且信用够的人才能接' },
  { Icon: LockKeyOpen, t: '进行中', d: '取件码、宿舍号此时才解锁' },
  { Icon: Camera, t: '送达', d: '核验送达码或拍照留证' },
  { Icon: Handshake, t: '确认', d: '发单人确认，托管放款' },
  { Icon: Star, t: '互评', d: '双方打分，信用实时变化' },
]

function Loop() {
  const reduce = useReducedMotion()
  return (
    <section className="border-y border-line bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-16 md:px-8 md:py-20">
        <Reveal><H2>一单从发布到信用变化，六步走完</H2></Reveal>
        <ol className="relative mt-10 grid gap-6 md:grid-cols-6 md:gap-4">
          <span aria-hidden="true" className="absolute left-5 top-5 h-[calc(100%-2.5rem)] w-px bg-line md:left-5 md:right-5 md:h-px md:w-auto" />
          {LOOP.map((s, i) => (
            <motion.li key={s.t} className="relative flex gap-4 md:flex-col md:gap-3"
              initial={reduce ? false : { opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.4 }} transition={{ duration: 0.5, delay: i * 0.07, ease }}>
              <span className="relative grid size-10 shrink-0 place-items-center rounded-full bg-accent text-on-accent"><s.Icon size={20} weight="bold" /></span>
              <div>
                <p className="text-lg font-bold">{s.t}</p>
                <p className="mt-0.5 text-[15px] leading-relaxed text-muted">{s.d}</p>
              </div>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  )
}

const TRUST = [
  { Icon: IdentificationBadge, t: '校园身份认证', fear: '怕对方是校外的人', fix: '学号或 .edu.cn 邮箱认证，带徽章；没认证只能浏览，不能接单。' },
  { Icon: ChartLineUp, t: '信用分分级', fear: '怕新手接了大单搞砸', fix: '初始 70 分，按时 +2、爽约 -5；赏金越高，要求的信用越高。' },
  { Icon: ShieldCheck, t: '赏金托管', fear: '怕付了钱没人管，也怕跑完拿不到钱', fix: '发布即冻结，确认送达才放款；2 小时不确认自动放款。' },
  { Icon: LockKey, t: '隐私分级', fear: '怕取件码、宿舍号被乱传', fix: '接单后才可见，订单结束自动隐藏；电话一律走虚拟号。' },
  { Icon: Scales, t: '送达凭证与申诉', fear: '怕出了问题说不清', fix: '送达码当面核验或拍照留证；申诉期间钱继续冻结，平台判责。' },
]

function Trust() {
  return (
    <section id="trust" className="mx-auto grid max-w-6xl scroll-mt-16 gap-10 px-4 py-16 md:grid-cols-12 md:px-8 md:py-24">
      <div className="md:col-span-5">
        <div className="md:sticky md:top-28">
          <Reveal><H2>凭什么把取件码交给一个陌生同学</H2></Reveal>
          <Reveal delay={0.05}>
            <p className="mt-4 max-w-[34ch] text-lg leading-relaxed text-muted">校园跑腿最大的成本不是钱，是对陌生人的不放心。所以信任被拆成五道关，每一道只解决一种具体的怕。</p>
          </Reveal>
        </div>
      </div>
      <ul className="space-y-3 md:col-span-7">
        {TRUST.map((x, i) => (
          <Reveal as="li" key={x.t} delay={i * 0.04} className="flex gap-4 rounded-2xl bg-surface p-5 ring-1 ring-line">
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-accent-soft text-accent"><x.Icon size={24} weight="bold" /></span>
            <div>
              <p className="text-lg font-bold">{x.t}</p>
              <p className="mt-1 text-[15px] font-medium text-muted">{x.fear}</p>
              <p className="mt-2 text-base leading-relaxed">{x.fix}</p>
            </div>
          </Reveal>
        ))}
      </ul>
    </section>
  )
}

function Credit() {
  const reduce = useReducedMotion()
  const ladder = LEVELS.slice(1)
  return (
    <section className="border-y border-line bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-16 md:px-8 md:py-24">
        <Reveal><H2>信用分只能靠跑出来</H2></Reveal>
        <Reveal delay={0.05}><p className="mt-3 max-w-[44ch] text-lg text-muted">满分 100，认证后从 70 起步。不能充值，不能刷，只看履约和评价。</p></Reveal>
        <div className="mt-10 grid gap-10 md:grid-cols-2">
          {[[TrendUp, '加分', RULES_PLUS, 'text-accent'], [TrendDown, '减分', RULES_MINUS, 'text-danger']].map(([I, h, rules, c]) => (
            <Reveal key={h}>
              <p className="flex items-center gap-2 text-lg font-bold"><I size={22} weight="bold" className={c} />{h}</p>
              <ul className="mt-4 space-y-4">
                {rules.map((r) => (
                  <li key={r.label} className="flex items-baseline gap-4">
                    <span className={`tnum w-10 shrink-0 text-2xl font-bold ${c}`}>{r.delta > 0 ? '+' : ''}{r.delta}</span>
                    <span><span className="text-lg font-semibold">{r.label}</span><span className="block text-[15px] text-muted">{r.note}</span></span>
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>
        <div className="mt-14">
          <p className="text-lg font-bold">等级决定能接多大的单</p>
          <div className="mt-5 grid grid-cols-3 items-end gap-2 md:gap-4">
            {ladder.map((l, i) => (
              <motion.div key={l.name} initial={reduce ? false : { opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1, ease }}
                className={`rounded-2xl p-3 md:p-5 ${i === 2 ? 'bg-accent text-on-accent' : i === 1 ? 'bg-accent-soft' : 'bg-sunken'}`} style={{ minHeight: `${8 + i * 3}rem` }}>
                <p className="text-lg font-bold md:text-2xl">{l.name}</p>
                <p className="tnum text-sm font-semibold opacity-80">{l.min} 分以上</p>
                <p className="mt-2 text-sm leading-snug md:text-[15px]">{l.desc}</p>
              </motion.div>
            ))}
          </div>
          <p className="mt-3 text-[15px] text-muted">低于 60 分暂停接单，只能浏览。</p>
        </div>
      </div>
    </section>
  )
}

function Safety() {
  const words = ['代考', '替考', '代签到', '代点名', '代写作业', '代写论文', '代刷网课']
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 md:px-8 md:py-24">
      <Reveal className="relative overflow-hidden rounded-2xl">
        <img src={pic('canteen-morning-1', 1600, 800)} width={1600} height={800} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-[#0e1110]/78" />
        <div className="relative px-6 py-14 text-[#eceeed] md:px-14 md:py-20">
          <Prohibit size={40} weight="bold" className="text-[#3cc48f]" />
          <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight md:text-5xl">这些单，发不出去</h2>
          <p className="mt-4 max-w-[36ch] text-lg leading-relaxed opacity-90">互助不等于帮人作弊。发布时自动识别关键词并拦截，被举报核实的账号直接封禁。</p>
          <ul className="mt-8 flex flex-wrap gap-2">
            {words.map((w) => <li key={w} className="rounded-full px-4 py-2 text-[15px] font-semibold ring-1 ring-[#eceeed]/40 line-through decoration-2">{w}</li>)}
          </ul>
        </div>
      </Reveal>
    </section>
  )
}

function Metrics() {
  return (
    <section id="metrics" className="scroll-mt-16 border-y border-line bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-16 md:px-8 md:py-24">
        <Reveal><H2>看三个数，就知道平台健不健康</H2></Reveal>
        <div className="mt-10 grid gap-3 md:grid-cols-3 md:grid-rows-2">
          <Reveal className="flex flex-col justify-between rounded-2xl bg-accent p-6 text-on-accent md:col-span-2 md:row-span-2 md:p-10">
            <div>
              <p className="text-lg font-semibold opacity-90">北极星指标：履约率</p>
              <p className="tnum mt-2 text-6xl font-bold tracking-tight md:text-8xl">≥ 97%</p>
              <p className="mt-1 text-[15px] font-medium opacity-80">示例目标值</p>
            </div>
            <p className="mt-8 max-w-[44ch] text-lg leading-relaxed">按时送达且无申诉的单 ÷ 被接的单。信任平台的核心就是「接了就送到」，这个数掉了，其他都没意义。</p>
          </Reveal>
          <Reveal delay={0.05} className="rounded-2xl bg-bg p-6 ring-1 ring-line">
            <p className="text-lg font-semibold">接单率</p>
            <p className="tnum mt-1 text-4xl font-bold">≥ 85%</p>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">24 小时内被接的单 ÷ 发布的单。低了说明供给不够或定价偏低。示例目标。</p>
          </Reveal>
          <Reveal delay={0.1} className="relative overflow-hidden rounded-2xl p-6 text-[#eceeed]">
            <img src={pic('street-rain-0', 800, 600)} width={800} height={600} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />
            <div className="absolute inset-0 bg-[#0e1110]/72" />
            <div className="relative">
              <p className="text-lg font-semibold">平均接单时长</p>
              <p className="tnum mt-1 text-4xl font-bold">≤ 10 分钟</p>
              <p className="mt-3 text-[15px] leading-relaxed opacity-90">发布到被接的中位时间。跑腿要的是快，超过 10 分钟用户就会自己去。示例目标。</p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

const ROADMAP = [
  { when: '现在', t: '单校试点', d: '先做快递、代买、占座三类高频单，在一所学校跑通闭环和信用分。' },
  { when: '下个月', t: '顺路匹配', d: '按常走路线和课表空档推单，让「顺路」真的顺路，减少空跑。' },
  { when: '下学期', t: '楼长担保', d: '宿舍楼长、社团负责人做担保人，新人起步更快；上线小程序。' },
  { when: '一年内', t: '多校区', d: '同城多校共享信用，开放二手互助和拼单。' },
]

function Roadmap() {
  return (
    <section id="roadmap" className="mx-auto max-w-6xl scroll-mt-16 px-4 py-16 md:px-8 md:py-24">
      <Reveal><H2>接下来做什么</H2></Reveal>
      <div className="no-scrollbar -mx-4 mt-8 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0">
        {ROADMAP.map((r, i) => (
          <Reveal key={r.t} delay={i * 0.05} className={`w-[78%] shrink-0 snap-start rounded-2xl p-6 sm:w-[46%] md:w-[31%] ${i === 0 ? 'bg-accent-soft' : 'bg-surface ring-1 ring-line'}`}>
            <p className={`text-[15px] font-semibold ${i === 0 ? 'text-accent' : 'text-muted'}`}>{r.when}</p>
            <p className="mt-2 text-2xl font-bold">{r.t}</p>
            <p className="mt-3 text-base leading-relaxed text-muted">{r.d}</p>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

function Final() {
  return (
    <section className="border-t border-line">
      <div className="mx-auto max-w-6xl px-4 py-20 text-center md:px-8 md:py-28">
        <Reveal><h2 className="text-3xl font-bold tracking-tight md:text-5xl">自己走一遍，大约两分钟</h2></Reveal>
        <Reveal delay={0.05}><p className="mx-auto mt-4 max-w-[32ch] text-lg text-muted">顶部一键切换发单人和跑腿人，一个人就能把一单从发布走到信用变化。</p></Reveal>
        <Reveal delay={0.1} className="mt-8"><Cta /></Reveal>
      </div>
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-6 text-sm text-muted md:px-8">
          <span>顺路侠 · 校园跑腿互助平台产品原型</span>
          <span>页面中的人名、任务、金额和指标均为示例</span>
        </div>
      </footer>
    </section>
  )
}

export default function Landing() {
  return (
    <div className="min-h-[100dvh] bg-bg text-ink">
      <Nav />
      <main>
        <Hero />
        <Scenes />
        <Loop />
        <Trust />
        <Credit />
        <Safety />
        <Metrics />
        <Roadmap />
        <Final />
      </main>
    </div>
  )
}
