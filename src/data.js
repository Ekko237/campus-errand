// 全部是演示用的示例数据，不代表真实统计。
import { Package, ShoppingBag, Armchair, BowlFood, DotsThreeCircle } from '@phosphor-icons/react'

export const TYPES = {
  express: { label: '快递', Icon: Package, base: 3 },
  buy: { label: '代买', Icon: ShoppingBag, base: 4 },
  seat: { label: '占座', Icon: Armchair, base: 4 },
  food: { label: '外卖', Icon: BowlFood, base: 2 },
  other: { label: '其他', Icon: DotsThreeCircle, base: 3 },
}
export const TYPE_KEYS = Object.keys(TYPES)

// 楼栋坐标单位：米（示例校园平面）
export const BUILDINGS = [
  { id: 'cainiao', name: '菜鸟驿站（东门）', group: '取件点', x: 900, y: 120 },
  { id: 'sf', name: '顺丰点（西门）', group: '取件点', x: -350, y: 300 },
  { id: 'jd', name: '京东快递柜（南门）', group: '取件点', x: 300, y: 900 },
  { id: 'canteen1', name: '第一食堂', group: '食堂/超市', x: 420, y: 260 },
  { id: 'canteen2', name: '第二食堂', group: '食堂/超市', x: 160, y: 520 },
  { id: 'market', name: '教育超市', group: '食堂/超市', x: 600, y: 480 },
  { id: 'gate', name: '北门外卖取餐点', group: '食堂/超市', x: 60, y: -260 },
  { id: 'lib', name: '图书馆', group: '教学区', x: 300, y: 50 },
  { id: 'jiao1', name: '第一教学楼', group: '教学区', x: 520, y: -80 },
  { id: 'hall', name: '学术报告厅', group: '教学区', x: 700, y: 30 },
  { id: 'gym', name: '体育馆', group: '教学区', x: -200, y: 700 },
  { id: 'zhu3', name: '竹园 3 号楼', group: '宿舍区', x: 0, y: 0 },
  { id: 'mei5', name: '梅园 5 号楼', group: '宿舍区', x: 120, y: 90 },
  { id: 'tao2', name: '桃园 2 号楼', group: '宿舍区', x: -260, y: -180 },
  { id: 'lan1', name: '兰园 1 号楼', group: '宿舍区', x: -420, y: 120 },
  { id: 'yan', name: '研究生公寓 B 栋', group: '宿舍区', x: -600, y: -380 },
]
export const B = Object.fromEntries(BUILDINGS.map((b) => [b.id, b]))
export const RUNNER_HOME = 'zhu3'

export function dist(a, b) {
  const p = B[a], q = B[b]
  if (!p || !q) return 0
  return Math.round(Math.hypot(p.x - q.x, p.y - q.y) / 10) * 10
}
export const fmtDist = (m) => (m >= 1000 ? (m / 1000).toFixed(1) + ' km' : m + ' m')

export const WINDOWS = [
  { id: 'w30', label: '30 分钟内', min: 30 },
  { id: 'w60', label: '1 小时内', min: 60 },
  { id: 'w120', label: '2 小时内', min: 120 },
  { id: 'today', label: '今天 22:00 前', min: 360 },
  { id: 'tomorrow', label: '明早 8:00 前', min: 720 },
]

export const SIZES = [
  { id: 's', label: '小件', add: 0 },
  { id: 'm', label: '中件', add: 2 },
  { id: 'l', label: '大件/重物', add: 5 },
]

// 建议价：类型底价 + 路程（每 400m +1）+ 加急 +2 + 体积
export function suggestPrice({ type, from, to, urgent, size }) {
  const d = dist(from, to) + dist(RUNNER_HOME, from) * 0.3
  const s = (TYPES[type]?.base ?? 3) + Math.floor(d / 400) + (urgent ? 2 : 0) + (SIZES.find((x) => x.id === size)?.add ?? 0)
  return [s, s + 2]
}

// 预估接单时长（示例模型）：出价越接近/高于建议价越快，加急和长时间窗更快
export function estimateMinutes({ reward, suggested, urgent, windowMin }) {
  const ratio = Math.max(0.3, reward / suggested)
  let m = 14 / Math.pow(ratio, 1.6)
  if (urgent) m *= 0.75
  if (windowMin >= 360) m *= 0.85
  const lo = Math.max(2, Math.round(m * 0.7))
  const hi = Math.max(lo + 2, Math.round(m * 1.3))
  return [lo, hi]
}

// 违规任务关键词拦截
export const BANNED = ['代考', '替考', '枪手', '代签到', '代打卡', '代点名', '代上课', '代课', '代写作业', '代写论文', '代写报告', '代做作业', '刷课', '代刷网课', '答案', '作弊']
export const findBanned = (text) => BANNED.filter((w) => text.includes(w))

// 信用规则
export const CREDIT_INIT = 70
export const LEVELS = [
  { name: '受限', min: 0, cap: 0, desc: '暂停接单，只能浏览' },
  { name: '新手', min: 60, cap: 8, desc: '可接赏金 ≤ ¥8 的单' },
  { name: '可靠', min: 72, cap: 15, desc: '可接赏金 ≤ ¥15 的单' },
  { name: '金牌', min: 85, cap: Infinity, desc: '不限金额，加急单优先推送' },
]
export const levelOf = (c) => [...LEVELS].reverse().find((l) => c >= l.min)
export const nextLevel = (c) => LEVELS.find((l) => l.min > c)
export const minCreditFor = (reward) => LEVELS.find((l) => l.min >= 60 && reward <= l.cap)?.min ?? 85

export const RULES_PLUS = [
  { delta: +2, label: '按时完成一单', note: '在截止时间前提交送达凭证' },
  { delta: +1, label: '收到好评', note: '对方打 4 到 5 星' },
  { delta: +1, label: '发单人按时确认', note: '送达后 2 小时内确认收货' },
]
export const RULES_MINUS = [
  { delta: -3, label: '超时送达', note: '晚于截止时间才送到' },
  { delta: -5, label: '接单后爽约', note: '接单后主动放弃或失联' },
  { delta: -4, label: '收到差评', note: '对方打 1 到 2 星' },
  { delta: -8, label: '申诉被判责任方', note: '平台核实后判定' },
]

const now = () => Date.now()
const M = 60000

let seq = 100
export const nextId = () => 't' + (seq++) + Math.random().toString(36).slice(2, 6)
export const code4 = () => String(Math.floor(1000 + Math.random() * 9000))

function mk(o) {
  return {
    status: 'open', picked: false, proof: null, runnerId: null, late: false,
    ratingByPoster: null, ratingByRunner: null, dispute: null,
    createdAt: now() - (o.ago ?? 10) * M,
    deadline: now() + o.windowMin * M,
    deliverCode: code4(),
    private: { code: o.type === 'express' ? `${3 + (o.id.length % 5)}-2-${code4()}` : null, room: o.room, phone: '170 0000 ' + code4() },
    timeline: [{ at: now() - (o.ago ?? 10) * M, text: '发布任务，赏金已托管' }],
    ...o,
  }
}

export function seedTasks() {
  return [
    mk({ id: 's1', type: 'express', title: '菜鸟驿站取 2 个小件快递', from: 'cainiao', to: 'mei5', reward: 5, windowMin: 90, urgent: true, size: 's', note: '两个都是衣服，很轻', room: '梅园 5 号楼 412', posterName: '梁小禾', posterCredit: 91, ago: 6 }),
    mk({ id: 's2', type: 'food', title: '外卖到北门了，帮忙拎上楼', from: 'gate', to: 'tao2', reward: 3, windowMin: 25, urgent: true, size: 's', note: '黄色袋子，尾号 7731', room: '桃园 2 号楼 608', posterName: '许一舟', posterCredit: 83, ago: 3 }),
    mk({ id: 's3', type: 'buy', title: '教育超市带一瓶生抽和两包抽纸', from: 'market', to: 'zhu3', reward: 6, windowMin: 240, urgent: false, size: 's', note: '生抽要海天的，钱到了一起转', room: '竹园 3 号楼 215', posterName: '温晴', posterCredit: 95, ago: 22 }),
    mk({ id: 's4', type: 'seat', title: '图书馆三楼占一个靠窗座位', from: 'lib', to: 'lib', reward: 4, windowMin: 600, urgent: false, size: 's', note: '明早 7:40 前，放本书就行', room: '图书馆 3F 自习区', posterName: '周砚', posterCredit: 88, ago: 40 }),
    mk({ id: 's5', type: 'express', title: '顺丰大件显示器，需要力气', from: 'sf', to: 'yan', reward: 15, windowMin: 180, urgent: false, size: 'l', note: '箱子大约 8 斤，有提手', room: '研究生公寓 B 栋 1103', posterName: '程立', posterCredit: 97, ago: 15 }),
    mk({ id: 's6', type: 'buy', title: '二食堂带一份黄焖鸡米饭', from: 'canteen2', to: 'jiao1', reward: 4, windowMin: 35, urgent: true, size: 's', note: '微辣，不要香菜', room: '一教 204 教室后排', posterName: '于小渔', posterCredit: 79, ago: 4 }),
    mk({ id: 's7', type: 'other', title: '把雨伞送到体育馆门口', from: 'lan1', to: 'gym', reward: 5, windowMin: 45, urgent: false, size: 's', note: '伞在宿管阿姨那里，报我名字', room: '兰园 1 号楼宿管室', posterName: '乐知行', posterCredit: 86, ago: 9 }),
    mk({ id: 's8', type: 'seat', title: '周五讲座帮占前排两个位', from: 'hall', to: 'hall', reward: 12, windowMin: 1440, urgent: false, size: 's', note: '13:30 开始，13:00 前到', room: '学术报告厅前三排', posterName: '社团 王一凡', posterCredit: 90, ago: 55 }),
  ]
}

export function seedAccounts() {
  return {
    poster: {
      id: 'poster', name: '小满', role: '发单人', avatar: 'student-city-1',
      verified: true, verifyMethod: '学号认证', credit: 88, balance: 50, frozen: 0,
      done: 0, ratings: [],
      ledger: [{ at: now() - 3 * 24 * 60 * M, amount: 50, label: '钱包充值（示例）' }],
      creditLog: [{ at: now() - 3 * 24 * 60 * M, delta: 0, label: '示例账号：已有信用 88' }],
    },
    runner: {
      id: 'runner', name: '阿远', role: '跑腿人', avatar: 'canteen-study-1',
      verified: false, verifyMethod: null, credit: null, balance: 0, frozen: 0,
      done: 0, ratings: [], ledger: [], creditLog: [],
    },
  }
}
