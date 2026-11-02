/**
 * ============================================================
 *  真实校园 · 示意地图布局（人工近似标定）
 * ------------------------------------------------------------
 *  ⚠️ 这是什么：把 9 栋楼按官方地图截图里的**相对方位**，
 *     人工排到一张 1200×800 的画布上。
 *
 *  ⚠️ 这不是什么：
 *     - 不是测绘坐标，没有经纬度；
 *     - 不是从截图做像素投影（10 张图是三维斜视，透视各不相同，
 *       直接投影会系统性拉伸）；
 *     - 不复制官方 GIS 底图、不使用瓦片。
 *
 *  精度声明：方位正确、比例近似，误差约 ±40–60 画布单位。
 *  未确认位置的一律 unplaced，绝不硬摆一个方框上去。
 * ============================================================
 */

/** 画布尺寸（SVG viewBox） */
export const MAP_CANVAS = { width: 1200, height: 800 }

/** 校园示意范围（四周留 80 的装饰边） */
export const CAMPUS_BOX = { x: 80, y: 80, width: 1040, height: 660 }

/** 地图元信息 */
export const MAP_META = {
  title: '哈尔滨工业大学 一校区（西大直街校区）示意地图',
  calibratedAt: '2026-11-02',
  method: '人工近似标定：按官方地图截图的相对方位排布，非像素投影',
  precision: '非测绘精度，误差约 ±40–60 画布单位',
  north: 'up',
  disclaimer: '人工标定 · 课程演示 · 非测绘精度'
}

/** 标定状态 */
export const MAP_STATUS = {
  calibrated: {
    label: '已标定',
    description: '相对方位有多张截图互相印证，可直接绘制。'
  },
  estimated: {
    label: '位置待核实',
    description: '位置或名称尚有疑问，绘制为虚线框并标注。'
  },
  unplaced: {
    label: '未标定',
    description: '没有可靠位置依据，不绘制在地图上，只进"待标定"清单。'
  }
}

/**
 * 建筑布局
 * footprint 是中心的 x / y 与宽高（画布单位），全部轴对齐。
 * label 是文字标签的绝对坐标，避免压到别的楼上。
 */
export const BUILDING_LAYOUT = [
  {
    building_id: 'YQ1-B001',
    name: '明德楼',
    footprint: { x: 230, y: 380, w: 55, h: 100 },
    label: { x: 230, y: 316, anchor: 'middle' },
    status: 'calibrated',
    confidence: 'high',
    source: 'S1 / S2 / S9 / S10',
    note: '紧邻西大直街，格物楼正西'
  },
  {
    building_id: 'YQ1-B002',
    name: '理学楼',
    footprint: { x: 120, y: 470, w: 50, h: 85 },
    label: { x: 120, y: 528, anchor: 'middle' },
    status: 'calibrated',
    confidence: 'medium',
    source: 'S1 / S2',
    note: '明德楼西南，贴西大直街'
  },
  {
    building_id: 'YQ1-B003',
    name: '格物楼',
    footprint: { x: 330, y: 385, w: 55, h: 85 },
    label: { x: 330, y: 330, anchor: 'middle' },
    status: 'calibrated',
    confidence: 'high',
    source: 'S1 / S2 / S9 / S10',
    note: '明德楼正东，两楼几乎同纬度'
  },
  {
    building_id: 'YQ1-B004',
    name: '建筑设计学院',
    footprint: { x: 560, y: 300, w: 80, h: 60 },
    label: { x: 560, y: 262, anchor: 'middle' },
    status: 'estimated',
    confidence: 'low',
    source: 'S3 / S9 / S10（图上标注为「建筑与设计馆」）',
    note: '与官方标注的「建筑与设计馆」是否为同一栋楼尚未确认，位置仅按 4-3 号暖廊的串联顺序推定'
  },
  {
    building_id: 'YQ1-B009',
    name: '正心楼',
    footprint: { x: 560, y: 560, w: 85, h: 70 },
    label: { x: 560, y: 611, anchor: 'middle' },
    status: 'calibrated',
    confidence: 'high',
    source: 'S1 / S2 / S8',
    note: '学士楼以西、体育馆东北'
  },
  {
    building_id: 'YQ1-B006',
    name: '学士楼',
    footprint: { x: 800, y: 560, w: 70, h: 70 },
    label: { x: 800, y: 513, anchor: 'middle' },
    status: 'calibrated',
    confidence: 'high',
    source: 'S1 / S2 / S8',
    note: '正心楼以东、诚意楼西北'
  },
  {
    building_id: 'YQ1-B005',
    name: '诚意楼',
    footprint: { x: 880, y: 620, w: 70, h: 80 },
    label: { x: 880, y: 678, anchor: 'middle' },
    status: 'calibrated',
    confidence: 'medium',
    source: 'S1 / S2 / S8',
    note: '学士楼东南'
  },
  {
    building_id: 'YQ1-B007',
    name: 'A03公寓',
    footprint: { x: 990, y: 590, w: 60, h: 60 },
    label: { x: 990, y: 548, anchor: 'middle' },
    status: 'calibrated',
    confidence: 'medium',
    source: 'S1 / S2 / S8',
    note: '诚意楼以东'
  },
  {
    building_id: 'YQ1-B008',
    name: 'A10公寓',
    footprint: null,
    label: null,
    status: 'unplaced',
    confidence: 'low',
    source: '仅见 X2 / X6 等暖廊图标聚在正心楼东南一带，无建筑名标签',
    note: '地图上标有「十公寓」，但「A10公寓」与「十公寓」是否同一栋尚未确认，不做合并'
  },

  // ---------- 第二轮扩充：7 栋可辨认建筑（暂无暖廊数据） ----------
  {
    building_id: 'YQ1-B010',
    name: '图书馆',
    footprint: { x: 700, y: 350, w: 90, h: 80 },
    label: { x: 700, y: 302, anchor: 'middle' },
    status: 'calibrated',
    confidence: 'high',
    source: 'S1 / S2 / S9',
    note: '校园中部体量最大的建筑之一，多张截图可互相印证'
  },
  {
    building_id: 'YQ1-B012',
    name: '学子楼',
    footprint: { x: 620, y: 450, w: 75, h: 70 },
    label: { x: 620, y: 408, anchor: 'middle' },
    status: 'calibrated',
    confidence: 'high',
    source: 'S1 / S2 / S9',
    note: '图书馆西南、正心楼以北'
  },
  {
    building_id: 'YQ1-B011',
    name: '学苑楼',
    footprint: { x: 730, y: 485, w: 80, h: 70 },
    label: { x: 730, y: 440, anchor: 'middle' },
    status: 'calibrated',
    confidence: 'medium',
    source: 'S1 / S2 / S8',
    note: '学子楼以东、学士楼西北'
  },
  {
    building_id: 'YQ1-B013',
    name: '管理楼',
    footprint: { x: 210, y: 505, w: 55, h: 70 },
    label: { x: 210, y: 458, anchor: 'middle' },
    status: 'calibrated',
    confidence: 'high',
    source: 'S1 / S2 / S3',
    note: '明德楼以南、理学楼以东'
  },
  {
    building_id: 'YQ1-B014',
    name: '体育馆',
    footprint: { x: 450, y: 630, w: 80, h: 80 },
    label: { x: 450, y: 682, anchor: 'middle' },
    status: 'calibrated',
    confidence: 'high',
    source: 'S1 / S2 / S8',
    note: '正心楼西南，外形独特易于定位'
  },
  {
    building_id: 'YQ1-B015',
    name: '风雨操场',
    footprint: { x: 620, y: 700, w: 85, h: 65 },
    label: { x: 620, y: 658, anchor: 'middle' },
    status: 'calibrated',
    confidence: 'medium',
    source: 'S5 / S6 / S8',
    note: '正心楼以南，紧邻七公寓/八公寓一带'
  },
  {
    building_id: 'YQ1-B016',
    name: '材料楼',
    footprint: { x: 820, y: 290, w: 70, h: 65 },
    label: { x: 820, y: 240, anchor: 'middle' },
    status: 'calibrated',
    confidence: 'medium',
    source: 'S3 / S9 / S10',
    note: '图书馆东北、主楼以南'
  },

  // ---------- 因 4-6 号暖廊补录的建筑：本轮机不动地图布局，先标未标定 ----------
  {
    building_id: 'YQ1-B017',
    name: '致知楼',
    footprint: null,
    label: null,
    status: 'unplaced',
    confidence: 'low',
    source: '官方地图 4-6 号暖廊弹窗 + 标签截图',
    note: '仅确认名称与楼层，位置尚未标定（本轮机不动地图布局）'
  },
  {
    building_id: 'YQ1-B018',
    name: '新民楼',
    footprint: null,
    label: null,
    status: 'unplaced',
    confidence: 'low',
    source: '官方地图 4-6 号暖廊弹窗 + 标签截图',
    note: '仅确认名称与楼层，位置尚未标定（本轮机不动地图布局）'
  },
  {
    building_id: 'YQ1-B019',
    name: 'A18公寓',
    footprint: null,
    label: null,
    status: 'unplaced',
    confidence: 'low',
    source: '官方地图 4-6 号暖廊弹窗 + 标签截图',
    note: '仅确认名称与楼层，位置尚未标定（本轮机不动地图布局）'
  },
  {
    building_id: 'YQ1-B020',
    name: '材料学院',
    footprint: null,
    label: null,
    status: 'unplaced',
    confidence: 'low',
    source: '官方地图 4-7 号暖廊弹窗',
    note:
      '暖廊原文写「材料学院」，官方建筑标签写「材料楼」，二者是否同一栋尚未确认，' +
      '因此单独建档且不标位置；位置核实后再上图'
  }
]

/**
 * 参照物：不是本项目数据表里的导航建筑，
 * 只作为方位参照画在图上（灰色、不可点击）。
 */
export const CONTEXT_BUILDINGS = [
  { name: '主楼', x: 860, y: 120, w: 120, h: 70, label: { x: 860, y: 170 } }
]

/** 装饰层：只画有把握的两条地物，都是截图里明确标了街名的 */
export const CAMPUS_DECOR = {
  roads: [
    {
      name: '西大直街',
      d: 'M 104 40 L 88 400 L 74 790',
      label: { x: 128, y: 690, rotate: -78 }
    }
  ],
  water: [
    {
      name: '马家沟河',
      d: 'M 1120 600 C 1060 670, 980 720, 890 796',
      label: { x: 1052, y: 660, rotate: -38 }
    }
  ]
}

/** 按建筑 id 查布局 */
export function layoutOf(buildingId) {
  return BUILDING_LAYOUT.find((item) => item.building_id === buildingId) ?? null
}

/**
 * 校验布局数据（在自检脚本里调用）
 * @param {Array} buildings 建筑表
 */
export function validateLayout(buildings = []) {
  const errors = []
  const known = new Set(buildings.map((b) => b.building_id))
  const seen = new Set()

  for (const item of BUILDING_LAYOUT) {
    if (!known.has(item.building_id)) {
      errors.push(`布局引用了不存在的建筑：${item.building_id}`)
    }
    if (seen.has(item.building_id)) {
      errors.push(`重复的布局记录：${item.building_id}`)
    }
    seen.add(item.building_id)

    if (!(item.status in MAP_STATUS)) {
      errors.push(`${item.name} 的标定状态不合法：${item.status}`)
    }

    if (item.status === 'unplaced') {
      if (item.footprint) {
        errors.push(`${item.name} 标记为未标定，却带了 footprint（等于伪造位置）`)
      }
      continue
    }

    if (!item.footprint) {
      errors.push(`${item.name} 缺少 footprint`)
      continue
    }

    const { x, y, w, h } = item.footprint
    if (x - w / 2 < CAMPUS_BOX.x || x + w / 2 > CAMPUS_BOX.x + CAMPUS_BOX.width) {
      errors.push(`${item.name} 左右超出了校园示意边界`)
    }
    if (y - h / 2 < CAMPUS_BOX.y || y + h / 2 > CAMPUS_BOX.y + CAMPUS_BOX.height) {
      errors.push(`${item.name} 上下超出了校园示意边界`)
    }
    if (!(w > 0 && h > 0)) {
      errors.push(`${item.name} 的宽高必须大于 0`)
    }
  }

  for (const building of buildings) {
    if (!seen.has(building.building_id)) {
      errors.push(`建筑 ${building.official_name} 没有布局记录（应至少标记为 unplaced）`)
    }
  }

  return { ok: errors.length === 0, errors }
}
