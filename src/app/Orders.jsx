import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useOpenTaskId } from './openTask'
import { ArrowRight } from '@phosphor-icons/react'
import { useStore } from '../store'
import { B } from '../data'
import { TypeTag, Empty, Btn, ago, gi } from '../ui'
const Receipt = gi('receipt')

const ACTIVE = ['open', 'ongoing', 'delivered', 'disputed']
const STATUS_TEXT = { open: '待接单', ongoing: '进行中', delivered: '待确认', completed: '已完成', disputed: '申诉中', refunded: '已退款', cancelled: '已取消' }

export default function Orders() {
  const open = useOpenTaskId()
  const loc = useLocation().pathname
  const here = open ? `/app/task/${open}` : loc
  const { state } = useStore()
  const poster = state.role === 'poster'
  const mine = state.tasks.filter((t) => (poster ? t.posterId === 'poster' : t.runnerId === 'runner'))
  const [tab, setTab] = useState(() => (mine.some((t) => ACTIVE.includes(t.status)) || !mine.length ? 'active' : 'done'))
  // 电脑版右边开着一单：页签跟着切到它所在的那一栏
  const openId = (here.match(/^\/app\/task\/(.+)$/) || [])[1]
  useEffect(() => { const t = mine.find((x) => x.id === openId); if (t) setTab(ACTIVE.includes(t.status) ? 'active' : 'done') }, [openId, mine.find((x) => x.id === openId)?.status]) // eslint-disable-line react-hooks/exhaustive-deps
  const list = mine.filter((t) => (tab === 'active' ? ACTIVE.includes(t.status) : !ACTIVE.includes(t.status)))
  return (
    <div className="space-y-5">
      <h1 className="font-display text-[28px] leading-tight">{poster ? '我发布的' : '我接的单'}</h1>
      <div className="grid grid-cols-2 rounded-full bg-sunken p-1">
        {[['active', '进行中'], ['done', '已结束']].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} aria-pressed={tab === k} className={`h-10 rounded-full text-[15px] font-semibold ${tab === k ? 'bg-surface text-ink shadow-sm' : 'text-muted'}`}>
            {l} {mine.filter((t) => (k === 'active' ? ACTIVE.includes(t.status) : !ACTIVE.includes(t.status))).length}
          </button>
        ))}
      </div>
      {list.length === 0 ? (
        <Empty img="empty-orders" alt="空的写字板" title={tab === 'active' ? '没有进行中的订单' : '还没有结束的订单'}
          hint={poster ? '发一单试试，赏金会先托管，送达确认后才放款。' : '去大厅接一单，完成后信用分和收入都会记在这里。'}
          action={<Btn as={Link} to={poster ? '/app/publish' : '/app'} variant="ghost">{poster ? '去发布' : '去大厅'}</Btn>} />
      ) : (
        <ul className="space-y-3">
          {list.map((t) => (
            <li key={t.id}>
              <Link to={`/app/task/${t.id}`} className={`flex items-center gap-3 rounded-2xl p-4 ring-1 active:scale-[0.99] ${here === `/app/task/${t.id}` ? 'bg-accent-soft ring-2 ring-accent' : 'bg-surface ring-line'}`}>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2"><TypeTag type={t.type} /><span className="text-sm font-semibold text-accent">{STATUS_TEXT[t.status]}</span></div>
                  <p className="mt-2 truncate text-[17px] font-semibold">{t.title}</p>
                  <p className="mt-0.5 text-sm text-muted">{B[t.to]?.name} · {ago(t.createdAt)}</p>
                </div>
                <span className="tnum text-xl font-bold">¥{t.reward}</span>
                <ArrowRight size={18} className="text-muted" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
