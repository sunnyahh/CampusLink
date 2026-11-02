/**
 * ============================================================
 *  校园暖廊通 CampusLink · 模拟暖廊连接数据
 * ------------------------------------------------------------
 *  ⚠️ 同样是虚构数据，不代表任何真实校园的暖廊走向。
 *
 *  每条连接（corridor）表示"两栋楼之间可以直接走过去"，包含：
 *   from / to  两端节点的 id（建筑 id，或下面 JUNCTIONS 里的枢纽 id）
 *   type       'indoor' 室内暖廊 / 'outdoor' 室外步道
 *   name       路段名称（显示在路线详情里）
 *   via        可选，折线拐点。暖廊通常不是笔直的，
 *              用拐点让地图上的路线更像真实走廊。
 *
 *  距离不用手写：算法会按坐标自动算出长度（再乘比例尺换算成米），
 *  所以改了建筑坐标，距离会自动跟着变。
 * ============================================================
 */

/** 暖廊枢纽：不是建筑，只是走廊交叉点（地图上画成小圆点） */
export const JUNCTIONS = [
  { id: 'w1', name: '西暖廊枢纽', x: 200, y: 290 },
  { id: 'w2', name: '东暖廊枢纽', x: 800, y: 290 }
]

export const CORRIDORS = [
  // ---------- 北区：北环暖廊 ----------
  {
    id: 'c_north_gate_admin',
    from: 'north_gate',
    to: 'admin',
    type: 'outdoor',
    name: '北门广场步道'
  },
  {
    id: 'c_north_west',
    from: 'admin',
    to: 'tla',
    type: 'indoor',
    name: '北环暖廊 · 西段'
  },
  {
    id: 'c_north_east',
    from: 'admin',
    to: 'tlb',
    type: 'indoor',
    name: '北环暖廊 · 东段'
  },

  // ---------- 中区：中央暖廊 + 东西两翼 ----------
  {
    id: 'c_admin_lib',
    from: 'admin',
    to: 'lib',
    type: 'indoor',
    name: '中央暖廊 · 北段'
  },
  {
    id: 'c_tla_w1',
    from: 'tla',
    to: 'w1',
    type: 'indoor',
    name: '西翼暖廊 · 北段'
  },
  {
    id: 'c_tlb_w2',
    from: 'tlb',
    to: 'w2',
    type: 'indoor',
    name: '东翼暖廊 · 北段'
  },
  {
    id: 'c_gym_w1',
    from: 'gym',
    to: 'w1',
    type: 'indoor',
    name: '西翼暖廊 · 体育馆连廊'
  },
  {
    id: 'c_w1_lib',
    from: 'w1',
    to: 'lib',
    type: 'indoor',
    name: '西翼暖廊 · 南段'
  },
  {
    id: 'c_lib_w2',
    from: 'lib',
    to: 'w2',
    type: 'indoor',
    name: '东翼暖廊 · 南段'
  },
  {
    id: 'c_w2_lab',
    from: 'w2',
    to: 'lab',
    type: 'indoor',
    name: '东翼暖廊 · 实验楼连廊'
  },

  // ---------- 南区：中央暖廊南段 + 南苑暖廊 ----------
  {
    id: 'c_lib_canteen',
    from: 'lib',
    to: 'canteen',
    type: 'indoor',
    name: '中央暖廊 · 南段'
  },
  {
    id: 'c_canteen_dorm1',
    from: 'canteen',
    to: 'dorm1',
    type: 'indoor',
    name: '南苑暖廊 · 东段'
  },
  {
    id: 'c_dorm1_dorm2',
    from: 'dorm1',
    to: 'dorm2',
    type: 'indoor',
    name: '南苑暖廊 · 宿舍连廊'
  },
  {
    id: 'c_dorm2_dorm3',
    from: 'dorm2',
    to: 'dorm3',
    type: 'indoor',
    name: '南苑暖廊 · 西段'
  },
  {
    id: 'c_dorm3_canteen',
    from: 'dorm3',
    to: 'canteen',
    type: 'indoor',
    name: '南苑暖廊 · 回环段',
    via: [{ x: 500, y: 560 }]
  },

  // ---------- 室外步道：算法会尽量避开它们 ----------
  {
    id: 'c_canteen_south_gate',
    from: 'canteen',
    to: 'south_gate',
    type: 'outdoor',
    name: '南门广场步道'
  },
  {
    id: 'c_canteen_center',
    from: 'canteen',
    to: 'center',
    type: 'outdoor',
    name: '青春广场步道'
  },
  {
    id: 'c_center_lab',
    from: 'center',
    to: 'lab',
    type: 'outdoor',
    name: '东区外环步道'
  },
  {
    id: 'c_north_gate_tla',
    from: 'north_gate',
    to: 'tla',
    type: 'outdoor',
    name: '北门外环步道'
  },
  {
    id: 'c_dorm3_south_gate',
    from: 'dorm3',
    to: 'south_gate',
    type: 'outdoor',
    name: '南门西侧步道',
    via: [{ x: 350, y: 612 }]
  }
]
