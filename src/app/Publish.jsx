import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Minus, Plus, Timer, LockKey, ProhibitInset, Lightning, Wallet, CaretDown } from '@phosphor-icons/react'
import { useStore } from '../store'
import { TYPES, TYPE_KEYS, BUILDINGS, B, WINDOWS, SIZES, suggestPrice, estimateMinutes, findBanned, nextId, code4, POSTER_LIMIT, detourMin } from '../data'
import { Btn, Panel, Field, Sheet, inputCls } from '../ui'
import { ROUTES } from '../landing/RouteHero'

const groups = [...new Set(BUILDINGS.map((b) => b.group))]
function BuildingSelect({ value, onChange, id }) {
  return (
    <div className="relative">
    <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={`${inputCls} appearance-none pr-10`}>
      {groups.map((g) => (
        <optgroup key={g} label={g}>
          {BUILDINGS.filter((b) => b.group === g).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </optgroup>
      ))}
    </select>
    <CaretDown size={18} weight="bold" className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted" />
    </div>
  )
}

const defaultTitle = (f) => ({
  express: `${B[f.from]?.name} 取${SIZES.find((s) => s.id === f.size)?.label}快递`,
  buy: `${B[f.from]?.name} 帮忙带东西`,
  seat: `${B[f.from]?.name} 帮占一个座位`,
  food: `外卖帮忙送到${B[f.to]?.name}`,
  other: '顺路帮个小忙',
}[f.type])

const chip = (on) => `inline-flex h-11 items-center gap-1.5 whitespace-nowrap rounded-full px-4 text-[15px] font-semibold transition ${on ? 'bg-ink text-bg' : 'bg-surface text-ink ring-1 ring-line'}`

export default function Publish() {
  const { state, act } = useStore()
  const nav = useNavigate()
  const [sp] = useSearchParams()
  const tour = sp.get('tour') === '1'
  const poster = state.accounts.poster
  const again = state.tasks.find((t) => t.id === sp.get('again') && t.posterId === 'poster')
  const [f, setF] = useState(() => again ? {
    type: again.type, from: again.from, to: again.to, size: again.size || 's', windowId: (WINDOWS.find((w) => w.min === again.windowMin) || WINDOWS[1]).id, urgent: !!again.urgent,
    title: again.title, note: again.note || '', room: again.private?.room || '', code: '', reward: again.reward,
  } : {
    type: 'express', from: 'cainiao', to: 'mei5', size: 's', windowId: 'w60', urgent: false,
    title: '', note: tour ? '一个小件，衣服' : '', room: tour ? '梅园 5 号楼 412' : '', code: tour ? '6-2-3108' : '', reward: null,
  })
  const usual = useMemo(() => {
    const n = {}
    for (const t of state.tasks) if (t.posterId === 'poster') n[t.to] = (n[t.to] || 0) + 1
    return Object.entries(n).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([id]) => id).filter((id) => B[id])
  }, [state.tasks])
  const [touched, setTouched] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }))

  const [sLo, sHi] = suggestPrice(f)
  const reward = f.reward ?? sLo
  const win = WINDOWS.find((w) => w.id === f.windowId)
  const [eLo, eHi] = estimateMinutes({ reward, suggested: sLo, urgent: f.urgent, windowMin: win.min })
  const title = f.title || defaultTitle(f)
  const banned = useMemo(() => findBanned(title + f.note), [title, f.note])

  const errors = {
    room: !f.room.trim() ? '请填写送达的宿舍号或具体位置，接单后才对跑腿人可见' : null,
    code: f.type === 'express' && !f.code.trim() ? '代取快递需要填写取件码，接单后才对跑腿人可见' : null,
    same: f.type !== 'seat' && f.from === f.to ? '取件地点和送达地点不能是同一栋楼' : null,
    money: reward > poster.balance ? `钱包余额 ¥${poster.balance} 不够托管 ¥${reward}` : poster.credit < POSTER_LIMIT.min && reward > POSTER_LIMIT.cap ? `你的信用 ${poster.credit} 低于 ${POSTER_LIMIT.min}，单笔赏金上限 ¥${POSTER_LIMIT.cap}` : null,
    banned: banned.length ? `检测到违规内容「${banned.join('、')}」。平台禁止代考、代签到、代写作业等学术不端任务` : null,
  }
  const blocking = Object.values(errors).some(Boolean)

  if (state.role !== 'poster') {
    return (
      <Panel className="p-5 text-center">
        <p className="text-lg font-semibold">发布任务要用发单人身份</p>
        <p className="mt-1 text-muted">你现在是跑腿人视角。</p>
        <Btn className="mt-4" onClick={() => act('role', { role: 'poster' })}>切到发单人</Btn>
      </Panel>
    )
  }

  const submit = () => {
    setTouched(true)
    if (!blocking) return setConfirm(true)
    // 报错要在视线里：滚到第一条错误、轻轻抖一下，并把光标放进对应输入框
    setTimeout(() => {
      const el = document.querySelector('main [role=alert]')
      if (!el) return
      el.scrollIntoView({ block: 'center', behavior: 'smooth' })
      el.animate?.([{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(-3px)' }, { transform: 'translateX(0)' }], { duration: 320, delay: 250 })
      el.parentElement?.querySelector('input, textarea, select')?.focus({ preventScroll: true })
    }, 30)
  }
  const doPublish = () => {
    const id = nextId()
    act('publish', {
      task: {
        id, deliverCode: code4(), type: f.type, title, from: f.from, to: f.to, size: f.size, windowMin: win.min, urgent: f.urgent, reward, note: f.note.trim(),
        private: { code: f.type === 'express' ? f.code.trim() : null, room: f.room.trim(), phone: '170 0000 ' + code4() },
      },
    })
    nav(`/app/task/${id}`)
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">发布跑腿任务</h1>
        <p className="mt-1 text-[15px] text-muted">{again ? '已按上一单填好，取件码记得换成新的。' : '选模板、选楼栋，赏金先冻结托管，送达确认后才放款。'}</p>
      </div>

      <Field label="任务类型">
        <div className="flex flex-wrap gap-2">
          {TYPE_KEYS.map((k) => {
            const T = TYPES[k]
            return <button key={k} type="button" onClick={() => setF((x) => ({ ...x, type: k, title: '' }))} className={chip(f.type === k)} aria-pressed={f.type === k}><T.Icon size={18} weight="bold" />{T.label}</button>
          })}
        </div>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={f.type === 'seat' ? '占座地点' : '取件 / 购买地点'}><BuildingSelect value={f.from} onChange={(v) => setF((x) => ({ ...x, from: v, title: '' }))} /></Field>
        <Field label="送达楼栋" error={touched && errors.same}><BuildingSelect value={f.to} onChange={(v) => setF((x) => ({ ...x, to: v, title: '' }))} /></Field>
      </div>
      {usual.length > 0 && (
        <div className="-mt-2 flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted">常送到</span>
          {usual.map((id) => (
            <button key={id} type="button" onClick={() => setF((x) => ({ ...x, to: id, title: '' }))} aria-pressed={f.to === id}
              className={`inline-flex h-9 items-center rounded-full px-3.5 text-sm font-semibold transition active:scale-[0.97] ${f.to === id ? 'bg-accent-soft text-accent' : 'bg-surface ring-1 ring-line'}`}>{B[id].name}</button>
          ))}
        </div>
      )}

      <Field label="任务标题" hint="已按模板自动生成，可以改">
        <input className={inputCls} value={title} onChange={(e) => set('title')(e.target.value)} maxLength={30} />
      </Field>

      {f.type !== 'seat' && (
        <Field label="物品大小">
          <div className="flex flex-wrap gap-2">
            {SIZES.map((s) => <button key={s.id} type="button" onClick={() => setF((x) => ({ ...x, size: s.id, title: '' }))} className={chip(f.size === s.id)} aria-pressed={f.size === s.id}>{s.label}{s.add ? ` +¥${s.add}` : ''}</button>)}
          </div>
        </Field>
      )}

      <Field label="时间窗">
        <div className="flex flex-wrap gap-2">
          {WINDOWS.map((w) => <button key={w.id} type="button" onClick={() => set('windowId')(w.id)} className={chip(f.windowId === w.id)} aria-pressed={f.windowId === w.id}>{w.label}</button>)}
          <button type="button" onClick={() => set('urgent')(!f.urgent)} className={chip(f.urgent)} aria-pressed={f.urgent}><Lightning size={16} weight="fill" />加急 +¥2</button>
        </div>
      </Field>

      <Panel className="space-y-4 p-4">
        <p className="flex items-center gap-2 text-[15px] font-semibold"><LockKey size={20} className="text-accent" />隐私信息：接单后才对跑腿人可见，完成后自动隐藏</p>
        {f.type === 'express' && (
          <Field label="取件码" error={touched && errors.code}>
            <input className={inputCls} value={f.code} onChange={(e) => set('code')(e.target.value)} placeholder="例如 6-2-3108" />
          </Field>
        )}
        <Field label="宿舍号 / 具体位置" error={touched && errors.room}>
          <input className={inputCls} value={f.room} onChange={(e) => set('room')(e.target.value)} placeholder="例如 梅园 5 号楼 412" />
        </Field>
        <p className="text-sm text-muted">手机号不会给对方，双方通话走平台虚拟号。</p>
      </Panel>

      {errors.banned && (
        <div role="alert" className="flex items-center gap-3 rounded-2xl bg-danger-soft p-4 ring-1 ring-danger/30">
          <img src={`${import.meta.env.BASE_URL}icons/blocked-v1.webp`} width={64} height={64} alt="盖住试卷的禁止手势" className="size-16 shrink-0 object-contain" />
          <p className="text-[15px] font-semibold text-danger">这类任务发不出去。顺路侠是互助，不帮人作弊。</p>
        </div>
      )}
      <Field label="备注（选填）" error={errors.banned}>
        <textarea className={`${inputCls} h-24 resize-none py-3`} value={f.note} onChange={(e) => set('note')(e.target.value)} maxLength={80} placeholder="比如：放门口就行 / 微辣不要香菜" />
      </Field>
      {!errors.banned && (
        <p className="-mt-3 flex items-start gap-1.5 text-sm text-muted"><ProhibitInset size={16} className="mt-0.5 shrink-0" />代考、代签到、代写作业等任务会被拦截，不能发布。</p>
      )}

      {(() => {
        const passing = ROUTES.filter((r) => detourMin(r.from, r.to, f) <= 5)
        return (
          <div className={`flex items-center gap-3 rounded-2xl p-4 ${passing.length ? 'bg-accent-soft' : 'bg-sunken'}`}>
            <span className="flex shrink-0 -space-x-2" aria-hidden="true">
              {(passing.length ? passing : [0]).slice(0, 3).map((_, k) => <img key={k} src={`${import.meta.env.BASE_URL}icons/avatar-runner-v1.webp`} width={32} height={32} alt="" className={`size-8 rounded-full bg-surface ring-2 ring-accent-soft ${passing.length ? '' : 'opacity-40 grayscale'}`} />)}
            </span>
            <p className="text-[15px] leading-snug">{passing.length
              ? <>示例：此刻有 <b className="text-accent">{passing.length} 条</b>同学常走的路经过这一单，比如「{passing[0].label}」</>
              : <>示例：常走的路线里没有正好经过这里的，赏金高一点会更快有人接</>}</p>
          </div>
        )
      })()}

      <Panel className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[15px] font-semibold">赏金</p>
            <p className="tnum text-sm text-muted">建议 ¥{sLo} 到 ¥{sHi}（按路程、大小、加急估算）</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" aria-label="减 1 元" onClick={() => set('reward')(Math.max(1, reward - 1))} className="grid size-11 place-items-center rounded-full bg-sunken active:scale-95"><Minus size={18} weight="bold" /></button>
            <span className="tnum w-14 text-center text-2xl font-bold">¥{reward}</span>
            <button type="button" aria-label="加 1 元" onClick={() => set('reward')(Math.min(99, reward + 1))} className="grid size-11 place-items-center rounded-full bg-sunken active:scale-95"><Plus size={18} weight="bold" /></button>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3 rounded-xl bg-accent-soft p-3">
          <Timer size={26} className="shrink-0 text-accent" />
          <p className="text-[15px] leading-snug">预计 <b className="tnum">{eLo} 到 {eHi} 分钟</b>有人接单<span className="text-muted">（示例估算）</span>{reward < sLo && <span className="block text-sm text-muted">低于建议价，接单会慢一些</span>}</p>
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-sm text-muted"><Wallet size={16} />发布后从钱包冻结 ¥{reward}，当前余额 ¥{poster.balance}（示例）</p>
        {touched && errors.money && <p role="alert" className="mt-2 text-sm font-medium text-danger">{errors.money}</p>}
      </Panel>

      {touched && blocking && !errors.banned && (
        <p role="status" className="-mb-2 rounded-xl bg-danger-soft px-4 py-2.5 text-[15px] font-semibold text-danger">还差：{[errors.code && '取件码', errors.room && '宿舍号', errors.same && '楼栋选重了', errors.money && '赏金'].filter(Boolean).join('、')}</p>
      )}
      <Btn size="lg" className="w-full" onClick={submit} disabled={!!errors.banned}>冻结 ¥{reward} 并发布</Btn>

      <Sheet open={confirm} onClose={() => setConfirm(false)} title="确认发布">
        <dl className="space-y-3 text-[15px]">
          {[['任务', title], ['路线', `${B[f.from].name} 到 ${B[f.to].name}`], ['时间窗', win.label + (f.urgent ? '，加急' : '')], ['托管赏金', `¥${reward}，确认送达后放款`], ['预估接单', `${eLo} 到 ${eHi} 分钟（示例）`]].map(([k, v]) => (
            <div key={k} className="flex gap-3"><dt className="w-20 shrink-0 text-muted">{k}</dt><dd className="font-medium">{v}</dd></div>
          ))}
        </dl>
        <p className="mt-4 rounded-xl bg-sunken p-3 text-sm leading-relaxed text-muted">没人接单可以随时取消，赏金原路退回。跑腿人送达后你有 2 小时确认，超时系统自动确认放款；有问题可以申诉，申诉期间赏金继续冻结。</p>
        <Btn size="lg" className="mt-5 w-full" onClick={doPublish}>确认发布</Btn>
      </Sheet>
    </div>
  )
}
