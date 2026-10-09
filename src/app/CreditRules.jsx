import { useNavigate } from 'react-router-dom'
import { ArrowLeft, TrendUp, TrendDown, ShieldCheck, LockKey, Camera, Scales } from '@phosphor-icons/react'
import { useMe } from '../store'
import { LEVELS, RULES_PLUS, RULES_MINUS, POSTER_RULES_PLUS, POSTER_RULES_MINUS, POSTER_LIMIT, POSTER_WARN, CREDIT_INIT, iconUrl } from '../data'
import { Panel } from '../ui'

export default function CreditRules() {
  const nav = useNavigate()
  const me = useMe()
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <button onClick={() => nav(-1)} aria-label="返回" className="grid size-10 place-items-center rounded-full bg-surface ring-1 ring-line"><ArrowLeft size={20} weight="bold" /></button>
        <h1 className="text-2xl font-bold tracking-tight">双向信用分怎么算</h1>
      </div>
      <p className="text-[15px] leading-relaxed text-muted">满分 100，校园认证后初始 {CREDIT_INIT} 分。发单人和跑腿人都有信用分，只由履约和评价决定，不能花钱买。</p>

      <section>
        <h2 className="mb-3 text-lg font-bold">跑腿人：等级与接单权限</h2>
        <div className="grid grid-cols-2 gap-2">
          {[...LEVELS].reverse().map((l) => {
            const cur = me.credit != null && me.credit >= l.min && (LEVELS[LEVELS.indexOf(l) + 1]?.min ?? 101) > me.credit
            return (
              <div key={l.name} className={`rounded-2xl p-4 ${cur ? 'bg-accent text-on-accent' : 'bg-surface ring-1 ring-line'}`}>
                <img src={iconUrl(l.badge)} width={48} height={48} alt={l.alt} className="mb-2 size-12 object-contain" />
                <p className="text-lg font-bold">{l.name}{cur && '（你）'}</p>
                <p className="tnum text-sm font-semibold opacity-80">{l.min === 0 ? '低于 60 分' : `${l.min} 分以上`}</p>
                <p className="mt-1 text-[15px]">{l.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        {[[TrendUp, '跑腿人加分', RULES_PLUS, 'text-accent'], [TrendDown, '跑腿人减分', RULES_MINUS, 'text-danger'], [TrendUp, '发单人加分', POSTER_RULES_PLUS, 'text-accent'], [TrendDown, '发单人减分', POSTER_RULES_MINUS, 'text-danger']].map(([I, h, rules, c]) => (
          <section key={h}>
            <h2 className="mb-3 flex items-center gap-2 text-lg font-bold"><I size={22} className={c} />{h}</h2>
            <Panel className="divide-y divide-line">
              {rules.map((r) => (
                <div key={r.label} className="flex items-center gap-3 p-4">
                  <div className="flex-1"><p className="text-[15px] font-semibold">{r.label}</p><p className="text-sm text-muted">{r.note}</p></div>
                  <span className={`tnum text-xl font-bold ${c}`}>{r.delta > 0 ? '+' : ''}{r.delta}</span>
                </div>
              ))}
            </Panel>
          </section>
        ))}
      </div>

      <p className="rounded-2xl bg-sunken p-4 text-[15px] leading-relaxed">发单人信用低于 {POSTER_LIMIT.min}，单笔赏金上限 ¥{POSTER_LIMIT.cap}；低于 {POSTER_WARN}，大厅会给跑腿人显示「发单人信用偏低」，跑腿人也可以只看信用 85 以上的发单人。</p>

      <section>
        <h2 className="mb-3 text-lg font-bold">另外四道保护</h2>
        <div className="space-y-2">
          {[['escrow', '护着硬币的盾牌', '赏金托管', '发布即冻结，确认送达才放款；2 小时不确认自动放款。'], ['privacy', '挂锁和钥匙', '隐私分级', '取件码、宿舍号、电话接单后才可见，结束自动隐藏；电话走虚拟号。'], ['proof', '拍下包裹的相机', '送达凭证', '当面核验送达码，或拍照留证，纠纷时作为依据。'], ['dispute', '天平', '申诉', '申诉期间赏金继续冻结，平台判定责任方，责任方信用 -8。']].map(([k, alt, t, d]) => (
            <Panel key={t} className="flex gap-3 p-4">
              <img src={`${import.meta.env.BASE_URL}icons/trust-${k}-v1.webp`} width={40} height={40} alt={alt} className="size-10 shrink-0 object-contain" />
              <div><p className="text-[15px] font-semibold">{t}</p><p className="text-[15px] text-muted">{d}</p></div>
            </Panel>
          ))}
        </div>
      </section>
    </div>
  )
}
