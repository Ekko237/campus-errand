import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, animate, useMotionValue, useTransform, useReducedMotion } from 'motion/react'
import { Wallet, CaretRight, ArrowRight, ArrowCounterClockwise, ShieldWarning, ListBullets } from '@phosphor-icons/react'
import { useStore, useMe } from '../store'
import { levelOf, nextLevel, iconUrl, posterTierOf, posterNextTier } from '../data'
import { Avatar, VerifiedBadge, Panel, Btn, Empty, ago } from '../ui'

function CountUp({ value }) {
  const reduce = useReducedMotion()
  const mv = useMotionValue(value)
  const out = useTransform(mv, (v) => Math.round(v))
  useEffect(() => {
    if (reduce) { mv.set(value); return }
    const c = animate(mv, value, { duration: 0.9, ease: [0.16, 1, 0.3, 1] })
    return () => c.stop()
  }, [value, reduce, mv])
  return <motion.span>{out}</motion.span>
}

export default function Me() {
  const { state, act } = useStore()
  const me = useMe()
  const nav = useNavigate()
  const reduce = useReducedMotion()
  const isPoster = me.id === 'poster'
  const posted = state.tasks.filter((t) => t.posterId === 'poster').length
  const good = me.ratings.filter((r) => r >= 4).length
  const rate = me.ratings.length ? Math.round((good / me.ratings.length) * 100) + '%' : '暂无'
  const lv = me.credit != null ? (me.id === 'poster' ? posterTierOf(me.credit) : levelOf(me.credit)) : null
  const nx = me.credit != null ? (me.id === 'poster' ? posterNextTier(me.credit) : nextLevel(me.credit)) : null
  const badges = [
    { img: 'trust-verify', alt: '带对勾的学生证', name: '校园认证', on: me.verified },
    { img: 'badge-first', alt: '插在包裹旁的小旗', name: '首单完成', on: isPoster ? state.tasks.some((t) => t.posterId === 'poster' && t.status === 'completed') : me.done >= 1 },
    { img: 'badge-praise', alt: '带星星的点赞徽章', name: '好评 3 次', on: good >= 3 },
    { img: 'level-reliable', alt: '带对勾的绿色盾牌', name: '信用可靠', on: (me.credit ?? 0) >= 72 },
    { img: 'level-gold', alt: '带皇冠的金牌', name: '金牌信用', on: (me.credit ?? 0) >= 85 },
  ]
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <Avatar who={me.id} name={me.name} size={64} />
        <div className="min-w-0">
          <p className="text-sm text-muted">{me.role}账号（示例）</p>
          <p className="text-2xl font-bold">{me.name}</p>
          <div className="mt-1">{me.verified ? <VerifiedBadge /> : <span className="rounded-full bg-sunken px-2.5 py-1 text-sm font-medium text-muted">未认证，只能浏览</span>}</div>
        </div>
      </div>

      {me.verified ? (
        <Link to="/app/credit" className="block rounded-2xl bg-accent-soft p-5">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[15px] font-semibold">{me.id === 'poster' ? '发单人信用' : '跑腿人信用'}</p>
              <p className="tnum text-6xl font-bold leading-none tracking-tight text-accent"><CountUp value={me.credit} /></p>
            </div>
            <div className="flex flex-col items-end text-right">
              <img src={iconUrl(lv.badge)} width={48} height={48} alt={lv.alt} className="mb-1 size-12 object-contain" />
              <p className="text-xl font-bold">「{lv.name}」</p>
              <p className="text-sm text-muted">{lv.desc}</p>
            </div>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface" role="progressbar" aria-label="距下一等级" aria-valuemin={lv.min} aria-valuemax={nx ? nx.min : 100} aria-valuenow={me.credit}>
            <motion.div className="h-full rounded-full bg-accent" initial={reduce ? false : { width: 0 }} animate={{ width: `${nx ? Math.max(6, ((me.credit - lv.min) / (nx.min - lv.min)) * 100) : 100}%` }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }} />
          </div>
          <p className="mt-3 flex items-center justify-between gap-3 text-[15px]">
            <span>{nx ? `再 +${nx.min - me.credit} 分升到「${nx.name}」，${nx.desc}` : '已是最高等级'}</span>
            <ArrowRight size={18} className="shrink-0 text-accent" />
          </p>
        </Link>
      ) : (
        <Panel className="p-5">
          <p className="text-lg font-semibold">完成校园认证，开始接单</p>
          <p className="mt-1 text-[15px] text-muted">认证后获得初始信用 70 分和认证徽章。</p>
          <Btn className="mt-4" onClick={() => nav('/app/verify')}>去认证</Btn>
        </Panel>
      )}

      <dl className="grid grid-cols-3 divide-x divide-line rounded-2xl bg-surface py-4 ring-1 ring-line">
        {[[isPoster ? '发布单数' : '完成单数', isPoster ? posted : me.done], ['好评率', rate], [me.role === '跑腿人' ? '累计收入' : '托管中', me.role === '跑腿人' ? `¥${me.ledger.filter((l) => l.amount > 0).reduce((a, l) => a + l.amount, 0)}` : `¥${me.frozen}`]].map(([k, v]) => (
          k === '累计收入' || k === '托管中' ? (
            <Link key={k} to="/app/wallet" className="group text-center transition active:scale-[0.97]">
              <dd className="tnum text-2xl font-bold">{v}</dd>
              <dt className="mt-0.5 inline-flex items-center gap-0.5 text-sm text-accent">{k}<CaretRight size={12} weight="bold" className="transition-transform group-hover:translate-x-0.5" /></dt>
            </Link>
          ) : (
            <div key={k} className="text-center">
              <dd className="tnum text-2xl font-bold">{v}</dd>
              <dt className="mt-0.5 text-sm text-muted">{k}</dt>
            </div>
          )
        ))}
      </dl>

      <section>
        <h2 className="mb-3 text-lg font-bold">徽章</h2>
        <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4">
          {badges.map((b) => (
            <div key={b.name} className={`flex w-24 shrink-0 flex-col items-center gap-2 rounded-2xl p-3 text-center ${b.on ? 'bg-accent-soft' : 'bg-sunken opacity-60'}`}>
              <img src={iconUrl(b.img)} width={44} height={44} alt={b.alt} className={`size-11 object-contain ${b.on ? '' : 'grayscale'}`} />
              <span className="text-sm font-semibold">{b.name}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">{me.role === '跑腿人' ? '收入流水' : '钱包流水'}</h2>
          <Link to="/app/wallet" className="inline-flex items-center gap-1 text-sm font-semibold text-accent">按月 / 按年查看<CaretRight size={14} weight="bold" /></Link>
        </div>
        {me.ledger.length === 0 ? (
          <Panel><Empty img="empty-wallet" alt="只有一枚硬币的钱包" title="还没有流水" hint="完成第一单后，赏金会从托管放到这里。" /></Panel>
        ) : (
          <Panel className="divide-y divide-line">
            {[...me.ledger].sort((a, b) => b.at - a.at).slice(0, 3).map((l, i) => (
              <div key={i} className="flex items-center gap-3 p-4">
                <div className="min-w-0 flex-1"><p className="truncate text-[15px] font-medium">{l.label}</p><p className="text-sm text-muted">{ago(l.at)}</p></div>
                <span className={`tnum text-lg font-bold ${l.amount > 0 ? 'text-accent' : ''}`}>{l.amount > 0 ? '+' : ''}{l.amount}</span>
              </div>
            ))}
            <Link to="/app/wallet" className="flex items-center justify-between p-4 text-[15px] font-semibold text-accent">
              <span className="inline-flex items-center gap-1.5"><Wallet size={18} />全部 {me.ledger.length} 条，可用 ¥{me.balance}</span>
              <CaretRight size={16} weight="bold" />
            </Link>
          </Panel>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">信用记录</h2>
          <Link to="/app/credit" className="text-sm font-semibold text-accent">规则说明</Link>
        </div>
        {me.creditLog.length === 0 ? (
          <Panel><Empty img="empty-orders" alt="空的写字板" title="还没有信用记录" hint="认证后会有初始 70 分，之后每一单都会记在这里。" /></Panel>
        ) : (
          <Panel className="divide-y divide-line">
            {me.creditLog.slice(0, 8).map((l, i) => (
              <div key={i} className="flex items-center gap-3 p-4">
                <div className="min-w-0 flex-1"><p className="truncate text-[15px] font-medium">{l.label}</p><p className="text-sm text-muted">{ago(l.at)}</p></div>
                {l.delta !== 0 && <span className={`tnum text-lg font-bold ${l.delta > 0 ? 'text-accent' : 'text-danger'}`}>{l.delta > 0 ? '+' : ''}{l.delta}</span>}
              </div>
            ))}
          </Panel>
        )}
      </section>

      <Panel className="flex items-center gap-3 p-4">
        <ShieldWarning size={24} className="shrink-0 text-muted" />
        <p className="flex-1 text-[15px] text-muted">演示数据存在本机浏览器，可随时恢复初始状态。</p>
        <Btn size="sm" variant="ghost" onClick={() => { act('reset'); nav('/app') }}><ArrowCounterClockwise size={16} weight="bold" />重置</Btn>
      </Panel>
    </div>
  )
}
