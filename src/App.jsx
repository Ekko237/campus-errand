import { useState } from 'react'
import { TYPES, TASKS } from './mock'

function TaskCard({ t }) {
  const ty = TYPES[t.type]
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-orange-100">
      <div className="flex items-center gap-2">
        <span className={`rounded-full px-2.5 py-1 text-sm font-medium ${ty.color}`}>{ty.icon} {ty.label}</span>
        {t.urgent && <span className="rounded-full bg-red-500 px-2.5 py-1 text-sm font-bold text-white">⚡ 加急</span>}
        <span className="ml-auto text-2xl font-bold text-orange-600">¥{t.reward}</span>
      </div>
      <h3 className="mt-3 text-lg font-semibold leading-snug">{t.title}</h3>
      <p className="mt-2 text-base text-stone-600">📍 {t.from} → {t.to}</p>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-stone-500">
        <span>⏰ {t.deadline}</span>
        <span>🚶 {t.distance >= 1000 ? (t.distance / 1000).toFixed(1) + ' km' : t.distance + ' m'}</span>
        <span>🛡️ {t.user} · 信用 {t.credit}</span>
      </div>
      <button className="mt-3 w-full rounded-xl bg-orange-500 py-3 text-base font-semibold text-white active:bg-orange-600">我来跑</button>
    </div>
  )
}

export default function App() {
  const [type, setType] = useState('all')
  const list = type === 'all' ? TASKS : TASKS.filter((t) => t.type === type)
  return (
    <div className="mx-auto min-h-screen max-w-2xl pb-28">
      <header className="bg-gradient-to-br from-orange-500 to-amber-400 px-4 pb-6 pt-8 text-white">
        <div className="text-3xl font-black tracking-tight">🏃 顺路侠</div>
        <p className="mt-2 text-lg font-medium opacity-95">校园跑腿互助：顺路帮一把，信用看得见</p>
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <span className="rounded-full bg-white/20 px-3 py-1">🎓 校园身份认证</span>
          <span className="rounded-full bg-white/20 px-3 py-1">🔒 赏金托管</span>
          <span className="rounded-full bg-white/20 px-3 py-1">⭐ 信用分</span>
        </div>
      </header>

      <main className="px-4">
        <div className="mt-5 flex items-end justify-between">
          <h2 className="text-xl font-bold">任务大厅</h2>
          <span className="text-sm text-stone-500">{list.length} 个任务等你顺路</span>
        </div>
        <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1">
          {[['all', '全部'], ...Object.entries(TYPES).map(([k, v]) => [k, v.icon + ' ' + v.label])].map(([k, label]) => (
            <button key={k} onClick={() => setType(k)}
              className={`shrink-0 rounded-full px-4 py-2 text-base font-medium ${type === k ? 'bg-stone-900 text-white' : 'bg-white text-stone-700 ring-1 ring-stone-200'}`}>
              {label}
            </button>
          ))}
        </div>
        <div className="mt-4 space-y-3">
          {list.map((t) => <TaskCard key={t.id} t={t} />)}
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-10 bg-gradient-to-t from-orange-50 via-orange-50 to-transparent px-4 pb-5 pt-6">
        <button className="mx-auto block w-full max-w-2xl rounded-2xl bg-stone-900 py-4 text-lg font-bold text-white shadow-lg active:bg-stone-700">＋ 发布跑腿任务</button>
      </div>
    </div>
  )
}
