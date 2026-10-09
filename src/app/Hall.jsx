import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import { MapPin, Clock, LockSimple, MagnifyingGlass, WarningOctagon, ShieldCheck, ArrowRight, Lightning } from '@phosphor-icons/react'
import { useStore } from '../store'
import { TYPES, TYPE_KEYS, B, dist, fmtDist, RUNNER_HOME, levelOf, minCreditFor } from '../data'
import { TypeTag, UrgentTag, Panel, Empty, Btn, left, spring } from '../ui'

const SORTS = [['dist', '距离最近'], ['reward', '赏金最高'], ['deadline', '截止最早']]
let loadedOnce = false

export function TaskCard({ t, me, role }) {
  const d = dist(RUNNER_HOME, t.from)
  const need = minCreditFor(t.reward)
  const locked = role === 'runner' && me.verified && t.posterId !== 'poster' && (me.credit ?? 0) < need
  return (
    <Link to={`/app/task/${t.id}`} className="block rounded-2xl bg-surface p-4 ring-1 ring-line transition active:scale-[0.99] hover:ring-accent/50">
      <div className="flex items-center gap-2">
        <TypeTag type={t.type} />
        {t.urgent && <UrgentTag />}
        <span className="tnum ml-auto text-2xl font-bold tracking-tight">¥{t.reward}</span>
      </div>
      <h3 className="mt-3 text-[17px] font-semibold leading-snug">{t.title}</h3>
      <p className="mt-2 flex items-start gap-1.5 text-[15px] text-muted">
        <MapPin size={18} className="mt-0.5 shrink-0" />
        <span>{B[t.from]?.name}{t.from !== t.to && <> 到 {B[t.to]?.name}</>}</span>
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
        <span className="inline-flex items-center gap-1"><Clock size={16} />{left(t.deadline)}</span>
        <span className="tnum">距你 {fmtDist(d)}</span>
        <span>{t.posterId === 'poster' ? '我发布的' : `${t.posterName} · 信用 ${t.posterCredit}`}</span>
      </div>
      {locked && (
        <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-sunken px-3 py-1.5 text-sm font-medium text-muted">
          <LockSimple size={16} weight="bold" />需信用 ≥ {need} 才能接（你 {me.credit}）
        </p>
      )}
    </Link>
  )
}

function Skeleton() {
  return (
    <div className="space-y-3" aria-label="加载中">
      {[0, 1, 2].map((i) => (
        <div key={i} className="animate-pulse rounded-2xl bg-surface p-4 ring-1 ring-line">
          <div className="flex gap-2"><div className="h-7 w-16 rounded-full bg-sunken" /><div className="ml-auto h-7 w-12 rounded-full bg-sunken" /></div>
          <div className="mt-3 h-5 w-3/4 rounded-full bg-sunken" />
          <div className="mt-3 h-4 w-1/2 rounded-full bg-sunken" />
        </div>
      ))}
    </div>
  )
}

function RoleBanner() {
  const { state, act } = useStore()
  const me = state.accounts.runner
  const nav = useNavigate()
  if (state.role === 'poster') {
    return (
      <Panel className="flex items-center gap-3 p-3.5">
        <p className="flex-1 text-[15px] leading-snug text-muted">你在<b className="text-ink">发单人</b>视角，可以浏览和发布。想接单请切到跑腿人。</p>
        <Btn size="sm" variant="ghost" onClick={() => act('role', { role: 'runner' })}>切换</Btn>
      </Panel>
    )
  }
  if (!me.verified) {
    return (
      <Panel className="flex items-center gap-3 p-3.5">
        <ShieldCheck size={28} className="shrink-0 text-accent" />
        <p className="flex-1 text-[15px] leading-snug">未认证只能浏览。用学号或校园邮箱认证后才能接单。</p>
        <Btn size="sm" onClick={() => nav('/app/verify')}>去认证</Btn>
      </Panel>
    )
  }
  const lv = levelOf(me.credit)
  return (
    <Link to="/app/credit" className="flex items-center gap-3 rounded-2xl bg-accent-soft p-3.5">
      <span className="tnum text-3xl font-bold text-accent">{me.credit}</span>
      <p className="flex-1 text-[15px] leading-snug">信用等级<b>「{lv.name}」</b>：{lv.desc}</p>
      <ArrowRight size={18} className="text-accent" />
    </Link>
  )
}

export default function Hall() {
  const { state, act, loadError } = useStore()
  const reduce = useReducedMotion()
  const [type, setType] = useState('all')
  const [sort, setSort] = useState('dist')
  const [urgentOnly, setUrgentOnly] = useState(false)
  const [loading, setLoading] = useState(!loadedOnce)
  const [errDismissed, setErrDismissed] = useState(false)
  useEffect(() => {
    if (!loading) return
    const t = setTimeout(() => { loadedOnce = true; setLoading(false) }, 650)
    return () => clearTimeout(t)
  }, [loading])

  const me = state.role === 'runner' ? state.accounts.runner : state.accounts.poster
  const list = useMemo(() => {
    let l = state.tasks.filter((t) => t.status === 'open')
    if (type !== 'all') l = l.filter((t) => t.type === type)
    if (urgentOnly) l = l.filter((t) => t.urgent)
    const key = { dist: (t) => dist(RUNNER_HOME, t.from), reward: (t) => -t.reward, deadline: (t) => t.deadline }[sort]
    return [...l].sort((a, b) => key(a) - key(b))
  }, [state.tasks, type, sort, urgentOnly])

  return (
    <div className="space-y-4">
      {loadError && !errDismissed && (
        <div role="alert" className="flex items-start gap-3 rounded-2xl bg-danger-soft p-3.5 text-danger ring-1 ring-danger/30">
          <WarningOctagon size={24} weight="fill" className="shrink-0" />
          <div className="flex-1 text-[15px]">
            <p className="font-semibold">{loadError}</p>
            <p className="mt-0.5">已自动恢复为初始示例数据，可以继续体验。</p>
          </div>
          <button onClick={() => setErrDismissed(true)} className="text-sm font-semibold underline">知道了</button>
        </div>
      )}
      <RoleBanner />

      <div className="flex items-end justify-between">
        <h1 className="text-2xl font-bold tracking-tight">任务大厅</h1>
        <span className="text-sm text-muted">示例数据 · {list.length} 个待接</span>
      </div>

      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4" role="group" aria-label="按类型筛选">
        {[['all', '全部'], ...TYPE_KEYS.map((k) => [k, TYPES[k].label])].map(([k, label]) => {
          const Icon = TYPES[k]?.Icon
          return (
            <button key={k} onClick={() => setType(k)} aria-pressed={type === k}
              className={`inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-[15px] font-semibold transition ${type === k ? 'bg-ink text-bg' : 'bg-surface text-ink ring-1 ring-line'}`}>
              {Icon && <Icon size={18} weight="bold" />}{label}
            </button>
          )
        })}
      </div>

      <div className="flex items-center gap-2">
        <div className="grid flex-1 grid-cols-3 rounded-full bg-sunken p-1" role="group" aria-label="排序">
          {SORTS.map(([k, label]) => (
            <button key={k} onClick={() => setSort(k)} aria-pressed={sort === k}
              className={`h-9 whitespace-nowrap rounded-full text-sm font-semibold transition ${sort === k ? 'bg-surface text-ink shadow-sm' : 'text-muted'}`}>{label}</button>
          ))}
        </div>
        <button onClick={() => setUrgentOnly((v) => !v)} aria-pressed={urgentOnly}
          className={`inline-flex h-11 shrink-0 items-center gap-1 rounded-full px-3.5 text-sm font-semibold transition ${urgentOnly ? 'bg-ink text-bg' : 'bg-surface text-ink ring-1 ring-line'}`}>
          <Lightning size={16} weight="fill" />加急
        </button>
      </div>

      {loading ? <Skeleton /> : list.length === 0 ? (
        <Empty Icon={MagnifyingGlass} title="这个分类暂时没人发单" hint="换个分类看看，或者自己发一单，附近顺路的同学会看到。"
          action={<Btn variant="ghost" onClick={() => { setType('all'); setUrgentOnly(false) }}>看全部任务</Btn>} />
      ) : (
        <motion.div layout={!reduce} className="space-y-3">
          <AnimatePresence initial={false}>
            {list.map((t) => (
              <motion.div key={t.id} layout={!reduce} initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={spring}>
                <TaskCard t={t} me={me} role={state.role} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
      {state.role === 'poster' && !loading && (
        <Btn className="w-full" variant="ink" onClick={() => act('role', { role: 'poster' })} as={Link} to="/app/publish">发布跑腿任务</Btn>
      )}
    </div>
  )
}
