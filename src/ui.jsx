import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import { X, SealCheck, Lightning, Star } from '@phosphor-icons/react'
import { TYPES } from './data'

export const spring = { type: 'spring', stiffness: 260, damping: 26 }

export function Btn({ as: As = 'button', variant = 'primary', size = 'md', className = '', children, ...p }) {
  const base = 'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition active:scale-[0.98] disabled:opacity-45 disabled:active:scale-100 disabled:cursor-not-allowed'
  const sizes = { md: 'h-12 px-5 text-base', lg: 'h-14 px-7 text-[17px]', sm: 'h-10 px-4 text-[15px]' }
  const v = {
    primary: 'bg-accent text-on-accent hover:brightness-105',
    ink: 'bg-ink text-bg hover:opacity-90',
    ghost: 'bg-surface text-ink ring-1 ring-line hover:bg-sunken',
    danger: 'bg-danger-soft text-danger ring-1 ring-danger/30',
    plain: 'text-accent hover:underline px-1',
  }
  return <As className={`${base} ${sizes[size]} ${v[variant]} ${className}`} {...p}>{children}</As>
}

export function Panel({ className = '', children, ...p }) {
  return <div className={`rounded-2xl bg-surface ring-1 ring-line ${className}`} {...p}>{children}</div>
}

export function TypeTag({ type }) {
  const t = TYPES[type]
  if (!t) return null
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-sunken px-2.5 py-1 text-sm font-medium text-ink">
      <t.Icon size={16} weight="bold" />{t.label}
    </span>
  )
}

export function UrgentTag() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-ink px-2.5 py-1 text-sm font-semibold text-bg">
      <Lightning size={14} weight="fill" />加急
    </span>
  )
}

export function VerifiedBadge({ small }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full bg-accent-soft font-medium text-accent ${small ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'}`}>
      <SealCheck size={small ? 14 : 16} weight="fill" />校园认证
    </span>
  )
}

// 头像：生成图（发单人小满、跑腿人阿远），其他人回退为文字头像
export function Avatar({ who, name = '', size = 44 }) {
  if (who === 'poster' || who === 'runner') {
    return <img src={`${import.meta.env.BASE_URL}icons/avatar-${who}-v1.webp`} width={size} height={size} alt={`${name}的头像`} className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />
  }
  return (
    <span aria-hidden="true" className="grid shrink-0 place-items-center rounded-full bg-accent-soft font-bold text-accent" style={{ width: size, height: size, fontSize: size * 0.42 }}>
      {name.slice(-1)}
    </span>
  )
}

export function Sheet({ open, onClose, title, children }) {
  const reduce = useReducedMotion()
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-ink/40" onClick={onClose} />
          <motion.div
            role="dialog" aria-modal="true" aria-label={title}
            className="relative max-h-[88dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-surface p-5 pb-8 sm:rounded-2xl"
            initial={reduce ? false : { y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={reduce ? { opacity: 0 } : { y: 60, opacity: 0 }} transition={spring}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold">{title}</h2>
              <button onClick={onClose} aria-label="关闭" className="grid size-10 place-items-center rounded-full bg-sunken"><X size={20} weight="bold" /></button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function Empty({ img, alt = '', title, hint, action }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <img src={`${import.meta.env.BASE_URL}icons/${img}-v1.webp`} width={112} height={112} alt={alt} className="size-28 object-contain" />
      <p className="mt-4 text-lg font-semibold">{title}</p>
      {hint && <p className="mt-1.5 max-w-[26ch] text-base text-muted">{hint}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function Field({ label, error, hint, children }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[15px] font-semibold">{label}</span>
      {children}
      {hint && !error && <span className="text-sm text-muted">{hint}</span>}
      {error && <span role="alert" className="text-sm font-medium text-danger">{error}</span>}
    </div>
  )
}

export const inputCls = 'h-12 w-full rounded-xl bg-surface px-3.5 text-base text-ink ring-1 ring-line placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent'

export function Stars({ value, onChange, size = 30 }) {
  return (
    <div className="flex gap-1" role="radiogroup" aria-label="评分">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" role="radio" aria-checked={value === n} aria-label={`${n} 星`} onClick={() => onChange(n)}
          className={`grid size-11 place-items-center rounded-full transition active:scale-90 ${n <= value ? 'text-accent' : 'text-muted'}`}>
          <Star size={size} weight={n <= value ? 'fill' : 'regular'} />
        </button>
      ))}
    </div>
  )
}

export const ago = (t) => {
  const m = Math.round((Date.now() - t) / 60000)
  if (m < 1) return '刚刚'
  if (m < 60) return `${m} 分钟前`
  const h = Math.round(m / 60)
  return h < 24 ? `${h} 小时前` : `${Math.round(h / 24)} 天前`
}
export const left = (t) => {
  const m = Math.round((t - Date.now()) / 60000)
  if (m <= 0) return '已超时'
  if (m < 60) return `${m} 分钟内`
  const h = Math.floor(m / 60)
  return h < 24 ? `${h} 小时 ${m % 60} 分内` : `${Math.round(h / 24)} 天内`
}
export const clock = (t) => new Date(t).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
