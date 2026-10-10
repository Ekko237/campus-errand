import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence, animate } from 'motion/react'
import { MAP_W, MAP_H, PLACES, routePath } from '../campusMap'

const icon = (name) => `${import.meta.env.BASE_URL}icons/${name}.webp`
export const SHORT = { cainiao: '菜鸟驿站', sf: '顺丰点', jd: '京东柜', canteen1: '一食堂', canteen2: '二食堂', market: '教育超市', gate: '北门', lib: '图书馆', jiao1: '一教', hall: '学术报告厅', gym: '体育馆', zhu3: '竹园', mei5: '梅园', tao2: '桃园', lan1: '兰园', yan: '研究生公寓' }

// 地图上标点的位置：小亭子、商铺标在房子正中，其他楼标在门口
const markAt = (id) => {
  const P = PLACES[id]
  if (P.kind !== 'kiosk' && P.kind !== 'gate') return P.door
  const [x0, y0, x1, y1] = P.box
  return [(x0 + x1) / 2, (y0 + y1) / 2]
}
const toD = (pts) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ')
const pct = ([x, y]) => ({ left: `${(x / MAP_W) * 100}%`, top: `${(y / MAP_H) * 100}%` })
// 门口在路的上方还是下方：标签放在门口外侧，不压路
const outward = (id) => {
  const { door, road } = PLACES[id]
  return road[0] === 'h' ? (door[1] < road[1] ? 'up' : 'down') : 'right'
}

// 一条折线上，离某点最近的位置在整条线里占多少（0 到 1）
function along(pts, p) {
  let total = 0
  const seg = pts.slice(1).map((q, i) => { const l = Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1]); total += l; return l })
  let best = Infinity, at = 0, acc = 0
  seg.forEach((l, i) => {
    const [ax, ay] = pts[i], [bx, by] = pts[i + 1]
    const t = l ? Math.max(0, Math.min(1, ((p[0] - ax) * (bx - ax) + (p[1] - ay) * (by - ay)) / (l * l))) : 0
    const d = Math.hypot(ax + (bx - ax) * t - p[0], ay + (by - ay) * t - p[1])
    if (d < best) { best = d; at = acc + l * t }
    acc += l
  })
  return total ? at / total : 0
}
function pointAt(pts, f) {
  const seg = pts.slice(1).map((q, i) => Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1]))
  let target = f * seg.reduce((a, b) => a + b, 0)
  for (let i = 0; i < seg.length; i++) {
    if (target <= seg[i] || i === seg.length - 1) { const t = seg[i] ? Math.min(1, target / seg[i]) : 0; return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t] }
    target -= seg[i]
  }
  return pts[pts.length - 1]
}

// 底图是按路网画的生成图，路线全部沿路走（src/campusMap.js 里寻路）；不缩放不旋转，画框和底图一样比例，四边不会露白
export default function CampusMap({ R, hits, reduce, pills = true, walker = true, endsOnly = false, legend = false }) {
  const mine = routePath(R.from, R.to).pts
  const marks = useMemo(() => hits.map((t) => ({ t, f: along(mine, PLACES[t.from].door) })).sort((a, b) => a.f - b.f), [hits, mine])
  const [p, setP] = useState(reduce || !walker ? 1 : 0)
  useEffect(() => {
    if (reduce || !walker) { setP(1); return }
    setP(0)
    const c = animate(0, 1, { duration: 3, delay: 0.4, ease: 'easeInOut', onUpdate: setP })
    return () => c.stop()
  }, [R.from, R.to, reduce, walker])
  const me = pointAt(mine, p)
  const ends = [R.from, R.to]
  return (
    <div>
    <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[20px] bg-surface ring-1 ring-line md:rounded-[28px]"
      role="img" aria-label={`示意地图：从${SHORT[R.from]}到${SHORT[R.to]}，沿路有 ${hits.length} 个顺路的单`}>
      <img src={`${import.meta.env.BASE_URL}images/campus-map-v2.webp`} width={1600} height={900} alt="" aria-hidden="true" loading="lazy" className="absolute inset-0 size-full object-cover" />
      <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} className="absolute inset-0 size-full" aria-hidden="true">
        {/* 捎这单要绕的路：从你的路拐去取件点、送到再回来，绿色虚线 */}
        {marks.map(({ t }) => {
          const via = [...routePath(R.from, t.from).pts, ...(t.from !== t.to ? routePath(t.from, t.to).pts : []), ...routePath(t.to, R.to).pts]
          return (
            <g key={`v${t.id}`}>
              <path d={toD(via)} fill="none" stroke="var(--surface)" strokeWidth="19" strokeDasharray="1 18" strokeLinecap="round" strokeLinejoin="round" className={reduce ? '' : 'dash-flow'} />
              <path d={toD(via)} fill="none" stroke="var(--accent)" strokeWidth="12" strokeDasharray="1 18" strokeLinecap="round" strokeLinejoin="round" className={reduce ? '' : 'dash-flow'} />
            </g>
          )
        })}
        {/* 你的路：整条先淡淡画着，小人走过的部分描深 */}
        <path d={toD(mine)} fill="none" stroke="var(--ink)" strokeOpacity="0.3" strokeWidth="10" strokeDasharray="4 18" strokeLinecap="round" strokeLinejoin="round" />
        <motion.path key={`${R.from}${R.to}`} d={toD(mine)} fill="none" stroke="var(--ink)" strokeOpacity="0.88" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"
          initial={false} style={{ pathLength: p }} />
        {/* 顺路的单：取件到送达那段路，小人经过取件点时亮起 */}
        {marks.map(({ t, f }) => (
          <motion.path key={`${R.from}${R.to}${t.id}`} d={toD(routePath(t.from, t.to).pts)} fill="none" stroke="var(--accent)" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round"
            initial={false} animate={{ opacity: p >= f ? 0.95 : 0.25 }} transition={{ duration: 0.3 }} />
        ))}
      </svg>
      {marks.map(({ t, f }) => (
        <span key={t.id} aria-hidden="true" className={`absolute z-10 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-[3px] ring-surface transition-colors md:size-4 ${p >= f ? 'bg-accent' : 'bg-muted'}`} style={pct(markAt(t.from))} />
      ))}
      {ends.map((id) => (
        <span key={id} className="absolute z-20" style={pct(PLACES[id].door)}>
          <span className="absolute left-0 top-0 block size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink ring-[3px] ring-surface md:size-4" />
          <span className={`absolute left-0 -translate-x-1/2 whitespace-nowrap rounded-full bg-ink px-2 py-0.5 text-[12px] font-semibold text-bg shadow-sm md:px-2.5 md:text-[13px] ${outward(id) === 'up' ? 'bottom-2.5' : 'top-2.5'}`}>{SHORT[id]} {id === R.from ? '出发' : '到达'}</span>
        </span>
      ))}
      {!endsOnly && marks.filter(({ t }) => !ends.includes(t.from)).map(({ t }) => (
        <span key={`l${t.id}`} className="absolute z-10" style={pct(markAt(t.from))}>
          <span className={`absolute left-0 -translate-x-1/2 whitespace-nowrap rounded-full bg-surface px-1.5 py-0.5 text-[12px] font-semibold md:px-2.5 md:text-[13px] text-ink shadow-sm ring-1 ring-line ${outward(t.from) === 'up' ? 'bottom-2.5' : 'top-2.5'}`}>
            <span className="hidden md:inline">{SHORT[t.from]}</span>
            <span className="tnum md:hidden">¥{t.reward}</span>
          </span>
        </span>
      ))}
      <AnimatePresence>
        {pills && marks.filter(({ f }) => p >= f).map(({ t }) => (
          <span key={`${R.from}${R.to}${t.id}`} className="absolute z-30 hidden md:block" style={pct(markAt(t.from))}>
            <motion.span initial={reduce ? false : { opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ type: 'spring', stiffness: 420, damping: 24 }}
              className={`tnum absolute left-0 -translate-x-1/2 whitespace-nowrap rounded-full bg-accent px-3 py-1 text-sm font-bold text-on-accent shadow-[0_8px_18px_-8px_rgba(11,122,85,0.7)] ${outward(t.from) === 'up' ? 'bottom-10' : 'top-10'}`}>
              ¥{t.reward} · {t.dm ? `多走 ${t.m ?? Math.max(1, Math.ceil(t.dm / 80))} 分钟` : '就在路上'}
            </motion.span>
          </span>
        ))}
      </AnimatePresence>
      {walker && !reduce && p > 0 && p < 1 && (
        <span aria-hidden="true" className="absolute z-40 grid size-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-surface shadow-[0_6px_16px_-6px_rgba(17,40,30,0.5)] ring-[3px] ring-ink md:size-10" style={pct(me)}>
          <img src={icon('avatar-runner-v1')} width={32} height={32} alt="" className="size-5 rounded-full md:size-8" />
        </span>
      )}
    </div>
    {legend && (
      <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted md:text-sm">
        <span className="inline-flex items-center gap-1.5"><i className="h-1 w-5 rounded-full bg-ink/80" />你正要走的路</span>
        <span className="inline-flex items-center gap-1.5"><i className="size-2.5 rounded-full bg-accent" />路上能顺手捎的 {hits.length} 单（绿虚线：捎上它要绕的路）</span>
      </p>
    )}
    </div>
  )
}
