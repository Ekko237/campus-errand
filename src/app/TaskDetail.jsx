import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'motion/react'
import { ArrowLeft, MapPin, Clock, LockKey, LockKeyOpen, EyeSlash, Phone, Package, House, ShieldCheck, Camera, Numpad, Check, Scales, Warning, FileX } from '@phosphor-icons/react'
import { useStore } from '../store'
import { B, dist, fmtDist, RUNNER_HOME, minCreditFor, levelOf } from '../data'
import { Btn, Panel, TypeTag, UrgentTag, VerifiedBadge, Sheet, Stars, Empty, Field, inputCls, left, clock, spring } from '../ui'

const STEPS = ['发布', '接单', '进行中', '送达', '确认', '互评']
function stepIndex(t) {
  if (t.status === 'open') return 0
  if (t.status === 'ongoing') return t.picked ? 2 : 1
  if (t.status === 'delivered' || t.status === 'disputed') return 3
  if (t.status === 'completed') return t.ratingByPoster || t.ratingByRunner ? 5 : 4
  return 0
}
const STATUS_TEXT = { open: '待接单', ongoing: '进行中', delivered: '待确认', completed: '已完成', disputed: '申诉中', refunded: '已退款', cancelled: '已取消' }

function Stepper({ t }) {
  const reduce = useReducedMotion()
  const idx = stepIndex(t)
  const off = t.status === 'cancelled' || t.status === 'refunded'
  return (
    <ol className="grid grid-cols-6 gap-1" aria-label="订单进度">
      {STEPS.map((s, i) => {
        const done = !off && i <= idx
        return (
          <li key={s} className="flex flex-col items-center gap-1.5">
            <motion.span initial={false} animate={{ scale: done && i === idx && !reduce ? [1, 1.25, 1] : 1 }} transition={{ duration: 0.4 }}
              className={`grid size-7 place-items-center rounded-full text-xs font-bold ${done ? 'bg-accent text-on-accent' : 'bg-sunken text-muted'}`}>
              {done && i < idx ? <Check size={14} weight="bold" /> : i + 1}
            </motion.span>
            <span className={`text-xs font-semibold ${done ? 'text-ink' : 'text-muted'}`}>{s}</span>
          </li>
        )
      })}
    </ol>
  )
}

function privacyMode(t, role) {
  if (role === 'poster' && t.posterId === 'poster') return 'owner'
  if (role === 'runner' && t.runnerId === 'runner') {
    if (['ongoing', 'delivered', 'disputed'].includes(t.status)) return 'open'
    return 'hidden'
  }
  return 'locked'
}

function PrivateInfo({ t, role }) {
  const mode = privacyMode(t, role)
  const rows = [
    t.private?.code && [Package, '取件码', t.private.code, t.private.code.replace(/\d/g, '*')],
    [House, '宿舍号', t.private?.room, (t.private?.room || '').replace(/\d+/g, '***')],
    [Phone, '联系电话', `${t.private?.phone}（虚拟号）`, '170 **** ****'],
  ].filter(Boolean)
  const [HIcon, htext] = {
    owner: [LockKey, '你填写的隐私信息，接单后才对跑腿人可见'],
    open: [LockKeyOpen, '已接单，以下信息对你可见。订单结束后自动隐藏'],
    hidden: [EyeSlash, '订单已结束，隐私信息已自动隐藏'],
    locked: [LockKey, '接单后才能看到取件码、宿舍号和电话'],
  }[mode]
  const show = mode === 'owner' || mode === 'open'
  return (
    <Panel className="p-4">
      <p className="flex items-center gap-2 text-[15px] font-semibold"><HIcon size={20} className="text-accent" />{htext}</p>
      <dl className="mt-3 space-y-2.5">
        {rows.map(([Icon, k, v, masked]) => (
          <div key={k} className="flex items-center gap-3">
            <Icon size={20} className="shrink-0 text-muted" />
            <dt className="w-16 shrink-0 text-[15px] text-muted">{k}</dt>
            <dd className={`tnum text-[15px] font-semibold ${show ? '' : 'select-none text-muted blur-[3px]'}`} aria-label={show ? undefined : '已隐藏'}>{show ? v : masked}</dd>
          </div>
        ))}
      </dl>
    </Panel>
  )
}

function Escrow({ t }) {
  const map = {
    open: ['托管中', '赏金已冻结，送达确认后才放款'],
    ongoing: ['托管中', '跑腿人完成前，钱不会离开平台'],
    delivered: ['托管中', '等发单人确认收货后放款'],
    disputed: ['冻结中', '申诉处理中，暂不放款'],
    completed: ['已放款', '赏金已转给跑腿人'],
    refunded: ['已退回', '申诉成立，赏金退回发单人'],
    cancelled: ['已退回', '任务取消，赏金退回发单人'],
  }[t.status]
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-accent-soft p-4">
      <ShieldCheck size={30} weight="fill" className="shrink-0 text-accent" />
      <div className="flex-1">
        <p className="text-[15px] font-semibold">赏金托管 · {map[0]}</p>
        <p className="text-sm text-muted">{map[1]}</p>
      </div>
      <span className="tnum text-3xl font-bold">¥{t.reward}</span>
    </div>
  )
}

function DeliverSheet({ t, open, onClose }) {
  const { act } = useStore()
  const [mode, setMode] = useState('code')
  const [code, setCode] = useState('')
  const [err, setErr] = useState(null)
  const [photo, setPhoto] = useState(false)
  const [shooting, setShooting] = useState(false)
  const [late, setLate] = useState(false)
  const submit = () => {
    if (mode === 'code') {
      if (code !== t.deliverCode) return setErr(code.length < 4 ? '请输入 4 位送达码' : '送达码不对，请当面向发单人确认')
      act('deliver', { id: t.id, proof: { kind: 'code' }, late })
    } else {
      if (!photo) return setErr('请先拍一张放置位置的照片')
      act('deliver', { id: t.id, proof: { kind: 'photo', seed: 'courier-desk-0' }, late })
    }
    onClose()
  }
  const shoot = () => { setShooting(true); setErr(null); setTimeout(() => { setShooting(false); setPhoto(true) }, 700) }
  return (
    <Sheet open={open} onClose={onClose} title="提交送达凭证">
      <div className="grid grid-cols-2 rounded-full bg-sunken p-1">
        {[['code', '当面核验送达码', Numpad], ['photo', '拍照放门口', Camera]].map(([k, l, I]) => (
          <button key={k} onClick={() => { setMode(k); setErr(null) }} className={`inline-flex h-10 items-center justify-center gap-1.5 whitespace-nowrap rounded-full text-[15px] font-semibold ${mode === k ? 'bg-surface text-ink shadow-sm' : 'text-muted'}`}><I size={18} />{l}</button>
        ))}
      </div>
      {mode === 'code' ? (
        <div className="mt-5">
          <Field label="发单人的 4 位送达码" error={err} hint={`演示提示：发单人页面能看到送达码，这单是 ${t.deliverCode}`}>
            <input inputMode="numeric" maxLength={4} value={code} onChange={(e) => { setCode(e.target.value.replace(/\D/g, '')); setErr(null) }} className={`${inputCls} tnum text-center text-2xl tracking-[0.5em]`} placeholder="____" aria-label="送达码" />
          </Field>
        </div>
      ) : (
        <div className="mt-5">
          {photo ? (
            <img src={`${import.meta.env.BASE_URL}images/proof-v1.webp`} width={800} height={450} alt="送达照片（模拟）：宿舍门口放着的包裹" className="mx-auto h-40 w-auto rounded-2xl bg-sunken object-cover" />
          ) : (
            <button onClick={shoot} className="grid aspect-[16/10] w-full place-items-center rounded-2xl bg-sunken text-muted ring-1 ring-line">
              {shooting ? <span className="animate-pulse text-[15px] font-semibold">正在拍照…</span> : <span className="flex flex-col items-center gap-2 text-[15px] font-semibold"><Camera size={36} />点击拍照（模拟）</span>}
            </button>
          )}
          {err && <p role="alert" className="mt-2 text-sm font-medium text-danger">{err}</p>}
          <p className="mt-2 text-sm text-muted">照片带拍摄时间和位置水印，作为纠纷时的凭证。</p>
        </div>
      )}
      <label className="mt-5 flex items-center gap-3 rounded-xl bg-sunken p-3 text-[15px]">
        <input type="checkbox" checked={late} onChange={(e) => setLate(e.target.checked)} className="size-5 accent-[var(--accent)]" />
        <span>演示：模拟这单超时送达（看信用 -3）</span>
      </label>
      <Btn size="lg" className="mt-5 w-full" onClick={submit}>提交凭证</Btn>
    </Sheet>
  )
}

function RateBlock({ t, by }) {
  const { act } = useStore()
  const [stars, setStars] = useState(5)
  const tagsGood = by === 'poster' ? ['准时', '沟通顺畅', '物品完好'] : ['描述准确', '确认及时', '好说话']
  const tagsBad = by === 'poster' ? ['超时', '物品有损', '态度差'] : ['描述不符', '拖延确认', '态度差']
  const [tags, setTags] = useState([])
  const opts = stars >= 4 ? tagsGood : stars <= 2 ? tagsBad : [...tagsGood.slice(0, 2), tagsBad[0]]
  const effect = stars >= 4 ? '+1' : stars <= 2 ? '-4' : '不变'
  return (
    <Panel className="p-4">
      <p className="text-[17px] font-semibold">{by === 'poster' ? '给跑腿人打分' : '给发单人打分'}</p>
      <p className="mt-0.5 text-sm text-muted">对方信用 {effect}（4 到 5 星 +1，1 到 2 星 -4）</p>
      <div className="mt-3"><Stars value={stars} onChange={(n) => { setStars(n); setTags([]) }} /></div>
      <div className="mt-3 flex flex-wrap gap-2">
        {opts.map((x) => (
          <button key={x} onClick={() => setTags((v) => (v.includes(x) ? v.filter((y) => y !== x) : [...v, x]))} aria-pressed={tags.includes(x)}
            className={`h-10 rounded-full px-4 text-[15px] font-semibold ${tags.includes(x) ? 'bg-ink text-bg' : 'bg-sunken text-ink'}`}>{x}</button>
        ))}
      </div>
      <Btn className="mt-4 w-full" onClick={() => act('rate', { id: t.id, by, stars, tags })}>提交评价</Btn>
    </Panel>
  )
}

function Actions({ t }) {
  const { state, act } = useStore()
  const nav = useNavigate()
  const [deliver, setDeliver] = useState(false)
  const [abandon, setAbandon] = useState(false)
  const [disputeOpen, setDisputeOpen] = useState(false)
  const [reason, setReason] = useState('没收到东西')
  const role = state.role
  const runner = state.accounts.runner
  const own = t.posterId === 'poster'
  const mine = t.runnerId === 'runner'

  if (t.status === 'open') {
    if (role === 'poster') {
      return own ? (
        <div className="grid gap-2">
          <p className="text-center text-[15px] text-muted">等待同学接单。切到跑腿人可以自己接下这单试试。</p>
          <div className="grid grid-cols-2 gap-2">
            <Btn variant="ghost" onClick={() => act('cancel', { id: t.id })}>取消并退款</Btn>
            <Btn onClick={() => act('role', { role: 'runner' })}>切到跑腿人</Btn>
          </div>
        </div>
      ) : <Btn className="w-full" onClick={() => act('role', { role: 'runner' })}>切到跑腿人来接这单</Btn>
    }
    if (!runner.verified) return <Btn size="lg" className="w-full" onClick={() => nav(`/app/verify?back=/app/task/${t.id}`)}><ShieldCheck size={20} weight="bold" />认证后才能接单</Btn>
    const need = minCreditFor(t.reward)
    if (runner.credit < need) {
      return (
        <div className="text-center">
          <Btn size="lg" className="w-full" disabled><LockKey size={20} weight="bold" />需信用 ≥ {need}</Btn>
          <p className="mt-2 text-sm text-muted">你现在 {runner.credit} 分（{levelOf(runner.credit).name}），先接小额单攒信用。<Link to="/app/credit" className="font-semibold text-accent">看规则</Link></p>
        </div>
      )
    }
    return <Btn size="lg" className="w-full" onClick={() => act('accept', { id: t.id })}>接单</Btn>
  }

  if (t.status === 'ongoing') {
    if (role === 'runner' && mine) {
      return (
        <div className="grid gap-2">
          {!t.picked ? <Btn size="lg" className="w-full" onClick={() => act('pick', { id: t.id })}>我已取到，出发送达</Btn>
            : <Btn size="lg" className="w-full" onClick={() => setDeliver(true)}>提交送达凭证</Btn>}
          <Btn variant="plain" size="sm" onClick={() => setAbandon(true)}>放弃这单（信用 -5）</Btn>
          <DeliverSheet t={t} open={deliver} onClose={() => setDeliver(false)} />
          <Sheet open={abandon} onClose={() => setAbandon(false)} title="确定放弃？">
            <p className="text-[15px] leading-relaxed text-muted">接单后放弃算爽约，信用 -5，任务会重新开放给其他同学。</p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <Btn variant="ghost" onClick={() => setAbandon(false)}>再想想</Btn>
              <Btn variant="danger" onClick={() => { act('abandon', { id: t.id }); setAbandon(false) }}>确定放弃</Btn>
            </div>
          </Sheet>
        </div>
      )
    }
    return <p className="text-center text-[15px] text-muted">{t.picked ? '跑腿人已取到，正在送达' : '跑腿人已接单，正在去取件'}。{own && '送达时把送达码告诉对方。'}</p>
  }

  if (t.status === 'delivered') {
    if (role === 'poster' && own) {
      return (
        <div className="grid gap-2">
          <Btn size="lg" className="w-full" onClick={() => act('confirm', { id: t.id })}>确认送达，放款 ¥{t.reward}</Btn>
          <Btn variant="plain" size="sm" onClick={() => setDisputeOpen(true)}>有问题，申诉</Btn>
          <Sheet open={disputeOpen} onClose={() => setDisputeOpen(false)} title="发起申诉">
            <p className="text-[15px] text-muted">申诉期间赏金继续冻结，平台会核对送达凭证。</p>
            <div className="mt-4 grid gap-2">
              {['没收到东西', '物品损坏', '与描述不符'].map((r) => (
                <button key={r} onClick={() => setReason(r)} aria-pressed={reason === r} className={`h-12 rounded-xl px-4 text-left text-[15px] font-semibold ring-1 ${reason === r ? 'bg-accent-soft text-ink ring-accent' : 'bg-surface ring-line'}`}>{r}</button>
              ))}
            </div>
            <Btn size="lg" className="mt-5 w-full" onClick={() => { act('dispute', { id: t.id, reason }); setDisputeOpen(false) }}>提交申诉</Btn>
          </Sheet>
        </div>
      )
    }
    if (!own) {
      return (
        <div className="grid gap-2 text-center">
          <p className="text-[15px] text-muted">等待发单人 {t.posterName} 确认，2 小时内不确认将自动放款。</p>
          <Btn variant="ghost" onClick={() => act('confirm', { id: t.id, simulated: true })}>演示：模拟对方确认</Btn>
        </div>
      )
    }
    return <div className="grid gap-2 text-center"><p className="text-[15px] text-muted">已提交凭证，等发单人确认放款。</p><Btn variant="ghost" onClick={() => act('role', { role: 'poster' })}>切回发单人去确认</Btn></div>
  }

  if (t.status === 'disputed') {
    return (
      <Panel className="p-4">
        <p className="flex items-center gap-2 text-[15px] font-semibold"><Scales size={20} className="text-accent" />申诉处理中：{t.dispute?.reason}</p>
        <p className="mt-1 text-sm text-muted">平台核对送达凭证和聊天记录，通常 24 小时内给结果。演示里你可以直接选裁决结果：</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Btn variant="ghost" size="sm" onClick={() => act('resolve', { id: t.id, winner: 'runner' })}>凭证有效，放款</Btn>
          <Btn variant="danger" size="sm" onClick={() => act('resolve', { id: t.id, winner: 'poster' })}>申诉成立，退款</Btn>
        </div>
      </Panel>
    )
  }

  if (t.status === 'completed') {
    const blocks = []
    if (role === 'poster' && own && !t.ratingByPoster) blocks.push(<RateBlock key="p" t={t} by="poster" />)
    if (role === 'runner' && mine && !t.ratingByRunner) blocks.push(<RateBlock key="r" t={t} by="runner" />)
    if (blocks.length) return <div className="grid gap-3">{blocks}</div>
    const otherPending = (role === 'poster' && own && mine && !t.ratingByRunner) || (role === 'runner' && mine && own && !t.ratingByPoster)
    return (
      <div className="grid gap-2 text-center">
        <p className="text-[15px] text-muted">订单已完成{t.ratingByPoster ? `，发单人评价 ${t.ratingByPoster.stars} 星` : ''}{t.ratingByRunner ? `，跑腿人评价 ${t.ratingByRunner.stars} 星` : ''}。</p>
        {otherPending && <Btn variant="ghost" onClick={() => act('role', { role: role === 'poster' ? 'runner' : 'poster' })}>切换身份去互评</Btn>}
        {mine && <Btn variant="ghost" onClick={() => { act('role', { role: 'runner' }); nav('/app/me') }}>看跑腿人信用变化</Btn>}
      </div>
    )
  }
  return null
}

export default function TaskDetail() {
  const { id } = useParams()
  const { state } = useStore()
  const nav = useNavigate()
  const t = state.tasks.find((x) => x.id === id)
  if (!t) {
    return <Empty Icon={FileX} title="找不到这个任务" hint="可能已被取消，或演示数据被重置了。" action={<Btn variant="ghost" onClick={() => nav('/app')}>回到任务大厅</Btn>} />
  }
  const own = t.posterId === 'poster'
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={() => nav(-1)} aria-label="返回" className="grid size-10 place-items-center rounded-full bg-surface ring-1 ring-line"><ArrowLeft size={20} weight="bold" /></button>
        <span className="text-[15px] font-semibold text-muted">订单详情</span>
        <span className={`ml-auto rounded-full px-3 py-1 text-sm font-semibold ${['refunded', 'cancelled', 'disputed'].includes(t.status) ? 'bg-sunken text-ink' : 'bg-accent-soft text-accent'}`}>{STATUS_TEXT[t.status]}</span>
      </div>

      <Panel className="p-4"><Stepper t={t} /></Panel>

      <div>
        <div className="flex flex-wrap items-center gap-2"><TypeTag type={t.type} />{t.urgent && <UrgentTag />}</div>
        <h1 className="mt-3 text-2xl font-bold leading-snug tracking-tight">{t.title}</h1>
        <div className="mt-3 space-y-1.5 text-[15px] text-muted">
          <p className="flex items-start gap-1.5"><MapPin size={18} className="mt-0.5 shrink-0" />{B[t.from]?.name}{t.from !== t.to && <> 到 {B[t.to]?.name}</>}<span className="tnum">（距跑腿人 {fmtDist(dist(RUNNER_HOME, t.from))}）</span></p>
          <p className="flex items-center gap-1.5"><Clock size={18} />截止：{left(t.deadline)}</p>
        </div>
        {t.note && <p className="mt-3 rounded-xl bg-sunken p-3 text-[15px]">备注：{t.note}</p>}
      </div>

      <Escrow t={t} />

      <Panel className="flex items-center gap-3 p-4">
        <div className="flex-1">
          <p className="text-sm text-muted">发单人</p>
          <p className="flex flex-wrap items-center gap-2 text-[17px] font-semibold">{own ? state.accounts.poster.name : t.posterName}<VerifiedBadge small /></p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted">信用</p>
          <p className="tnum text-xl font-bold">{own ? state.accounts.poster.credit : t.posterCredit}</p>
        </div>
      </Panel>

      <PrivateInfo t={t} role={state.role} />

      {own && state.role === 'poster' && ['ongoing', 'delivered'].includes(t.status) && (
        <div className="flex items-center gap-3 rounded-2xl bg-ink p-4 text-bg">
          <Numpad size={26} className="shrink-0" />
          <p className="flex-1 text-[15px]">送达码，见面后告诉跑腿人</p>
          <span className="tnum text-3xl font-bold tracking-[0.2em]">{t.deliverCode}</span>
        </div>
      )}

      {t.proof && (
        <Panel className="p-4">
          <p className="text-[15px] font-semibold">送达凭证</p>
          {t.proof.kind === 'code' ? <p className="mt-1 flex items-center gap-1.5 text-[15px] text-muted"><Check size={18} className="text-accent" weight="bold" />送达码当面核验通过</p>
            : <img src={`${import.meta.env.BASE_URL}images/proof-v1.webp`} width={800} height={450} alt="送达照片（模拟）：宿舍门口放着的包裹" className="mt-2 h-32 w-auto rounded-xl bg-sunken object-cover" />}
          {t.late && <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-danger"><Warning size={16} weight="fill" />超时送达（演示）</p>}
        </Panel>
      )}

      <div className="pt-1"><Actions t={t} /></div>

      <section>
        <h2 className="mb-2 text-[17px] font-semibold">订单记录</h2>
        <ol className="space-y-3 border-l-2 border-line pl-4">
          {[...t.timeline].reverse().map((e, i) => (
            <motion.li key={e.at + e.text} initial={i === 0 ? { opacity: 0, x: -8 } : false} animate={{ opacity: 1, x: 0 }} transition={spring} className="relative">
              <span className={`absolute -left-[23px] top-1.5 size-3 rounded-full ${i === 0 ? 'bg-accent' : 'bg-line'}`} />
              <p className="text-[15px]">{e.text}</p>
              <p className="tnum text-sm text-muted">{clock(e.at)}</p>
            </motion.li>
          ))}
        </ol>
      </section>
    </div>
  )
}
