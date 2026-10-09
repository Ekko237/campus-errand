import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { SealCheck, IdentificationCard, EnvelopeSimple, CaretDown } from '@phosphor-icons/react'
import { useStore } from '../store'
import { Btn, Panel, Field, VerifiedBadge, inputCls } from '../ui'
import { CREDIT_INIT, code4 } from '../data'

export default function Verify() {
  const { state, act } = useStore()
  const nav = useNavigate()
  const [sp] = useSearchParams()
  const back = sp.get('back') || '/app/me'
  const who = state.role === 'poster' ? 'poster' : 'runner'
  const me = state.accounts[who]
  const [mode, setMode] = useState('id')
  const [sid, setSid] = useState('')
  const [college, setCollege] = useState('')
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(null)
  const [code, setCode] = useState('')
  const [err, setErr] = useState({})
  const [busy, setBusy] = useState(false)

  if (me.verified) {
    return (
      <Panel className="p-6 text-center">
        <img src={`${import.meta.env.BASE_URL}icons/trust-verify-v1.webp`} width={64} height={64} alt="带对勾的学生证" className="mx-auto size-16 object-contain" />
        <p className="mt-3 text-xl font-bold">{me.name} 已完成校园认证</p>
        <p className="mt-1 text-muted">认证方式：{me.verifyMethod}</p>
        <div className="mt-2"><VerifiedBadge /></div>
        <Btn className="mt-5" onClick={() => nav(back)}>继续</Btn>
      </Panel>
    )
  }

  const finish = (method) => {
    setBusy(true)
    setTimeout(() => { act('verify', { who, method }); setBusy(false); nav(back) }, 900)
  }
  const submitId = () => {
    const e = {}
    if (!/^\d{8,12}$/.test(sid)) e.sid = '学号应为 8 到 12 位数字'
    if (!college) e.college = '请选择学院'
    setErr(e)
    if (!Object.keys(e).length) finish('学号认证')
  }
  const sendCode = () => {
    if (!/^[\w.+-]+@[\w-]+(\.[\w-]+)*\.edu\.cn$/i.test(email)) return setErr({ email: '请使用以 .edu.cn 结尾的校园邮箱' })
    setErr({}); setSent(code4())
  }
  const submitEmail = () => {
    if (code !== sent) return setErr({ code: '验证码不对，请检查后重新输入' })
    finish('校园邮箱认证')
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">校园身份认证</h1>
        <p className="mt-1 text-[15px] leading-relaxed text-muted">只对本校学生开放。认证后获得徽章和初始信用 {CREDIT_INIT} 分，才能接单。未认证只能浏览。</p>
      </div>
      <div className="grid grid-cols-2 rounded-full bg-sunken p-1">
        {[['id', '学号认证', IdentificationCard], ['email', '校园邮箱', EnvelopeSimple]].map(([k, l, I]) => (
          <button key={k} onClick={() => { setMode(k); setErr({}) }} aria-pressed={mode === k} className={`inline-flex h-10 items-center justify-center gap-1.5 rounded-full text-[15px] font-semibold ${mode === k ? 'bg-surface text-ink shadow-sm' : 'text-muted'}`}><I size={18} />{l}</button>
        ))}
      </div>
      {mode === 'id' ? (
        <div className="space-y-4">
          <Field label="学号" error={err.sid} hint="示例：2023011456，演示环境不会上传">
            <input inputMode="numeric" className={inputCls} value={sid} onChange={(e) => setSid(e.target.value.replace(/\D/g, ''))} maxLength={12} placeholder="输入学号" />
          </Field>
          <Field label="学院" error={err.college}>
            <div className="relative">
            <select className={`${inputCls} appearance-none pr-10`} value={college} onChange={(e) => setCollege(e.target.value)}>
              <option value="">请选择</option>
              {['计算机学院', '经济管理学院', '外国语学院', '机械工程学院', '新闻传播学院'].map((c) => <option key={c}>{c}</option>)}
            </select>
            <CaretDown size={18} weight="bold" className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted" />
            </div>
          </Field>
          <Btn size="lg" className="w-full" onClick={submitId} disabled={busy}>{busy ? '核验中…' : '提交认证'}</Btn>
        </div>
      ) : (
        <div className="space-y-4">
          <Field label="校园邮箱" error={err.email}>
            <div className="flex gap-2">
              <input type="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value.trim())} placeholder="name@school.edu.cn" />
              <Btn variant="ghost" onClick={sendCode}>{sent ? '重发' : '发验证码'}</Btn>
            </div>
          </Field>
          {sent && (
            <Field label="验证码" error={err.code} hint={`演示：真实环境会发到邮箱，这次的验证码是 ${sent}`}>
              <input inputMode="numeric" className={`${inputCls} tnum tracking-[0.3em]`} value={code} maxLength={4} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} placeholder="4 位数字" />
            </Field>
          )}
          <Btn size="lg" className="w-full" onClick={submitEmail} disabled={!sent || busy}>{busy ? '核验中…' : '完成认证'}</Btn>
        </div>
      )}
    </div>
  )
}
