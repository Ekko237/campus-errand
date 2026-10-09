export const TYPES = {
  express: { label: '快递', icon: '📦', color: 'bg-amber-100 text-amber-800' },
  buy: { label: '代买', icon: '🛒', color: 'bg-emerald-100 text-emerald-800' },
  seat: { label: '占座', icon: '💺', color: 'bg-sky-100 text-sky-800' },
  food: { label: '外卖', icon: '🍱', color: 'bg-rose-100 text-rose-800' },
  other: { label: '其他', icon: '✨', color: 'bg-violet-100 text-violet-800' },
}

export const TASKS = [
  { id: 1, type: 'express', title: '菜鸟驿站取 2 个快递', from: '菜鸟驿站（东门）', to: '竹园 3 号楼', reward: 5, distance: 650, deadline: '今天 18:00 前', urgent: true, user: '小林', credit: 92 },
  { id: 2, type: 'food', title: '外卖送上楼，在宿舍楼下', from: '梅园 5 号楼门口', to: '梅园 5 号楼 6 层', reward: 3, distance: 80, deadline: '20 分钟内', urgent: true, user: '阿杰', credit: 88 },
  { id: 3, type: 'buy', title: '超市带一瓶酱油和两包纸巾', from: '教育超市', to: '桃园 2 号楼', reward: 6, distance: 900, deadline: '今天 21:00 前', urgent: false, user: '晴晴', credit: 95 },
  { id: 4, type: 'seat', title: '图书馆三楼占一个靠窗座位', from: '图书馆 3F 自习区', to: '图书馆 3F 自习区', reward: 4, distance: 400, deadline: '明早 7:40 前', urgent: false, user: '考研人老周', credit: 90 },
  { id: 5, type: 'express', title: '顺丰大件（显示器），需要力气', from: '顺丰点（西门）', to: '研究生公寓 B 栋', reward: 15, distance: 1200, deadline: '今天 17:30 前', urgent: false, user: '研二学长', credit: 97 },
  { id: 6, type: 'buy', title: '二食堂帮带一份黄焖鸡', from: '第二食堂', to: '一教 204 教室', reward: 4, distance: 500, deadline: '12:10 前', urgent: true, user: '小鱼', credit: 85 },
  { id: 7, type: 'other', title: '帮忙把雨伞送到体育馆', from: '兰园 1 号楼', to: '体育馆', reward: 5, distance: 1100, deadline: '30 分钟内', urgent: false, user: '跑步的阿乐', credit: 91 },
  { id: 8, type: 'seat', title: '周五讲座帮占前排两个位', from: '学术报告厅', to: '学术报告厅', reward: 6, distance: 700, deadline: '周五 13:30 前', urgent: false, user: '社团小王', credit: 89 },
]
