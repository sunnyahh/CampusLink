/**
 * ============================================================
 *  真实校园暖廊数据 · 统一规则（哈尔滨工业大学 西大直街校区）
 * ------------------------------------------------------------
 *  数据版本 0.2.0：端点从「建筑」升级为「楼层级节点」。
 *
 *  为什么升级？
 *  X6 号暖廊的官方原文是「A10公寓东2层—A10公寓西3层」——
 *  两端是同一栋楼，旧模型（端点=建筑ID）根本表达不了。
 *  暖廊连接的从来不是"建筑"，而是"建筑上的某个点"。
 *
 *  ⚠️ 三条硬规矩（违反任何一条，数据作废）
 *  1. 建筑名称、暖廊编号、连接楼层，只能来自官方地图
 *     https://map.hit.edu.cn/2d/ ，不得自行命名或推断。
 *  2. 距离未知一律 null，禁止估算，也禁止拿直线距离冒充。
 *  3. 官方地图已标注的暖廊，统一按「双向可通行」建模。
 *     这是项目假设，不是核实结论；网页必须显示免责声明。
 * ============================================================
 */

/** 数据版本，采集口径变化时请递增 */
export const DATA_VERSION = '0.2.0'
export const DATA_UPDATED_AT = '2026-11-02'

/** 官方地图入口 */
export const OFFICIAL_MAP_URL = 'https://map.hit.edu.cn/2d/'

/**
 * 校区信息
 * 官方地图的校区下拉菜单写作「西大直街校区」；
 * 暖廊详情弹窗的「地址」写作「一校区」。
 * 两个都是官方用法，所以官方名 + 别名都记下来。
 */
export const CAMPUS = {
  code: 'YQ1',
  displayName: '哈尔滨工业大学 · 一校区',
  officialName: '西大直街校区',
  namingNote:
    '官方地图校区菜单写作「西大直街校区」，暖廊弹窗「地址」写作「一校区」；两者为同一校区的不同官方写法。'
}

/** 网页必须逐字展示的免责声明（src/App.vue 顶部提示条使用） */
export const DISCLAIMER =
  '本系统为课程演示作品，暖廊通行状态基于建模假设，实际以学校公告为准。'

/** 建模假设清单（写进课程报告） */
export const ASSUMPTIONS = [
  {
    id: 'A1',
    title: '存在性',
    text: '仅收录官方地图已标注的暖廊；地图上没有标注的，一律不推断、不补全。'
  },
  {
    id: 'A2',
    title: '双向通行',
    text: '所有已收录暖廊统一按双向可通行建模（bidirectional = true），未逐条核实实际通行方向。'
  },
  {
    id: 'A3',
    title: '开放状态',
    text: '不逐条调查实时开放状态，access_status 统一记为 assumed_open（假设可通行）。'
  },
  {
    id: 'A4',
    title: '距离',
    text: '未实测的距离保持 null，不做估算；路线界面需明示「距离未知」。'
  },
  {
    id: 'A5',
    title: '楼层',
    text: '连接楼层只接受官方地图标注值；官方未标注则保持 null。'
  },
  {
    id: 'A6',
    title: '节点粒度',
    text: '暖廊端点用「楼层级节点」表示（建筑 + 楼层 + 方位），允许同一栋建筑的不同节点相连。'
  },
  {
    id: 'A7',
    title: '串联不拆分',
    text: '官方用一条描述串联多栋建筑时，整条保留原文，不擅自拆成多段，也不推断中途出入口。'
  }
]

/** 通行状态枚举 */
export const ACCESS_STATUS = {
  assumed_open: {
    label: '假设可通行',
    description: '官方地图已标注该暖廊；项目统一假设双向可通行，未逐条核实实时开放状态。'
  },
  pending: {
    label: '待核实',
    description: '尚不能确认是否存在，或无法确认是否可通行。'
  },
  closed: {
    label: '已关闭',
    description: '有官方公告或实地证据表明暂不可通行。'
  },
  removed: {
    label: '已拆除',
    description: '建筑改造或拆改后，该暖廊已不存在。'
  }
}

/** 本项目阶段的默认通行状态 */
export const DEFAULT_ACCESS_STATUS = 'assumed_open'

/** 核实状态枚举（从强到弱） */
export const VERIFY_STATUS = {
  confirmed: {
    label: '已确认（官方弹窗）',
    description: '官方地图弹窗标题完整可读，已逐字记录。'
  },
  map_confirmed: {
    label: '官方地图标注',
    description: '官方地图标签可读，但未用弹窗复核。'
  },
  field_verified: {
    label: '实地核实',
    description: '已实地走过，并留存照片与日期。'
  },
  pending: {
    label: '待核实',
    description: '信息不完整，只能作为候选，不参与导航。'
  }
}

export const DEFAULT_VERIFY_STATUS = 'map_confirmed'

/** 双向通行的固定说明（会写进每条暖廊记录） */
export const BIDIRECTIONAL_NOTE =
  '项目假设：官方地图已标注的暖廊统一按双向可通行建模，实际通行方向未逐条核实。'

/** 节点类型：当前只有「楼层节点」一种 */
export const NODE_KINDS = {
  floor: {
    label: '楼层节点',
    description: '建筑 + 楼层 + 方位。例如「A10公寓 东侧2层」。'
  }
}

/** 暖廊拓扑类型 */
export const CORRIDOR_TOPOLOGY = {
  linear_chain: {
    label: '线性串联',
    description: '官方原文用「—」按顺序列出多栋建筑，连接顺序明确。'
  },
  unresolved: {
    label: '拓扑待定',
    description: '官方原文的串联顺序或分支无法确定，不参与导航。'
  }
}

/** 候选暖廊被卡住的原因 */
export const BLOCKED_REASONS = {
  text_obscured: '文字被其他标签遮挡，前半句或中段缺失',
  text_truncated: '文字超出屏幕边缘，后半句被截断',
  topology_unresolved: '多栋建筑的连接顺序不明确（顿号分隔），无法确定端点',
  corridor_junction: '端点接的是另一条暖廊（如 N4暖廊），不是建筑楼层',
  number_unconfirmed: '编号写法或编号本身未经弹窗确认（含编号完全缺失）',
  term_ambiguous: '原文中有读不准的术语，需弹窗复核',
  unreadable: '除编号外几乎无法辨认',
  multi_stop_entrance_unverified:
    '原文已由弹窗确认，但多栋串联的中途能否独立进出 / 换乘未核实，暂不纳入路线计算'
}

/** 连廊类型：决定路线算法里的权重，未核实前保持 unknown */
export const CORRIDOR_TYPES = {
  indoor: '室内暖廊',
  semi: '半封闭连廊',
  outdoor: '露天连廊',
  unknown: '待核实'
}

export const DEFAULT_CORRIDOR_TYPE = 'unknown'

/** 建筑分类（照抄官方地图「校内建筑」分类）；未采集时允许 null */
export const BUILDING_CATEGORIES = [
  '行政办公',
  '教学科研',
  '校内场馆',
  '学生宿舍',
  '文化风景',
  '家属住宅',
  '其他楼宇'
]

/* ------------------------------------------------------------
   格式规则
   ------------------------------------------------------------ */

const BUILDING_ID_RE = /^YQ1-B\d{3}$/
const NODE_ID_RE = /^YQ1-N-\d{3}$/
const CORRIDOR_ID_RE = /^YQ1-WC-\d{4}$/
const CANDIDATE_ID_RE = /^YQ1-C-\d{4}$/
/** 楼层写法：1层 / 2层 / 1.5层 / 2.5层 / M层 */
const FLOOR_RE = /^(\d+(\.\d+)?|M)层$/

function isBlank(value) {
  return value === undefined || value === null || String(value).trim() === ''
}

/* ------------------------------------------------------------
   工厂函数：创建时只做"自包含"校验
   （跨表的引用校验交给 validateDataset）
   ------------------------------------------------------------ */

/**
 * 生成一个楼层级节点
 * @param {object} input node_id / building_id / floor / zone / display_name / source
 */
export function createNode(input) {
  const node = {
    node_id: input.node_id,
    kind: 'floor',
    building_id: input.building_id,
    floor: input.floor ?? null,
    zone: input.zone ?? null,
    display_name: input.display_name,
    source: input.source,
    verify_status: input.verify_status ?? DEFAULT_VERIFY_STATUS
  }

  assertNode(node)
  return node
}

/** 校验单个节点（自包含部分） */
export function assertNode(node) {
  const errors = []

  if (!NODE_ID_RE.test(String(node.node_id ?? ''))) {
    errors.push('节点 id 必须是 YQ1-N-001 这样的格式（YQ1-N- + 3 位流水号）')
  }
  if (!BUILDING_ID_RE.test(String(node.building_id ?? ''))) {
    errors.push('节点必须关联一个建筑 id（YQ1-B001 格式）')
  }
  if (node.floor !== null && !FLOOR_RE.test(String(node.floor))) {
    errors.push(`楼层写法不合法：「${node.floor}」；允许 1层 / 2.5层 / M层 或 null`)
  }
  if (isBlank(node.display_name)) {
    errors.push('显示名称不能为空')
  }
  if (isBlank(node.source)) {
    errors.push('节点来源不能为空')
  }
  if (!(node.verify_status in VERIFY_STATUS)) {
    errors.push(`核实状态不合法，可选值：${Object.keys(VERIFY_STATUS).join(' / ')}`)
  }

  if (errors.length > 0) {
    throw new Error(`节点数据不合法：\n- ${errors.join('\n- ')}`)
  }
}

/**
 * 生成一条暖廊记录并套用项目规则：
 *  - bidirectional 强制为 true（不接受外部传入）
 *  - access_status 默认 assumed_open
 *  - length_m / floors 未提供时为 null
 *  - 端点用节点 id，禁止节点自环
 */
export function createCorridor(input) {
  const corridor = {
    corridor_id: input.corridor_id,
    official_no: input.official_no,
    official_description: input.official_description,
    from_node_id: input.from_node_id,
    to_node_id: input.to_node_id,
    chain_node_ids: input.chain_node_ids ?? [],
    floors: input.floors ?? null,
    length_m: input.length_m ?? null,
    access_status: input.access_status ?? DEFAULT_ACCESS_STATUS,
    bidirectional: true,
    bidirectional_note: BIDIRECTIONAL_NOTE,
    corridor_type: input.corridor_type ?? DEFAULT_CORRIDOR_TYPE,
    topology: input.topology ?? 'linear_chain',
    linked_corridors: input.linked_corridors ?? [],
    navigation_eligible: (input.topology ?? 'linear_chain') === 'linear_chain',
    geometry: input.geometry ?? null,
    source: input.source,
    verify_status: input.verify_status ?? DEFAULT_VERIFY_STATUS,
    notes: input.notes ?? ''
  }

  assertCorridor(corridor)
  return corridor
}

/** 校验单条暖廊（自包含部分） */
export function assertCorridor(corridor) {
  const errors = []

  if (!CORRIDOR_ID_RE.test(String(corridor.corridor_id ?? ''))) {
    errors.push('暖廊编号必须是 YQ1-WC-0001 这样的格式')
  }
  if (isBlank(corridor.official_no)) {
    errors.push('官方编号不能为空（官方没印编号时写「未标注」，但本项目收录的都有编号）')
  }
  if (isBlank(corridor.official_description)) {
    errors.push('官方原文不能为空（必须逐字照抄）')
  }
  if (!NODE_ID_RE.test(String(corridor.from_node_id ?? ''))) {
    errors.push('起点节点 id 必须是 YQ1-N-001 这样的格式')
  }
  if (!NODE_ID_RE.test(String(corridor.to_node_id ?? ''))) {
    errors.push('终点节点 id 必须是 YQ1-N-001 这样的格式')
  }
  // 允许同一栋建筑的不同节点相连；但节点自环必须禁止
  if (corridor.from_node_id === corridor.to_node_id) {
    errors.push('禁止节点自环：起点节点和终点节点不能是同一个')
  }
  if (!Array.isArray(corridor.chain_node_ids)) {
    errors.push('chain_node_ids 必须是数组（没有串联时写 []）')
  } else if (corridor.chain_node_ids.length > 0) {
    const first = corridor.chain_node_ids[0]
    const last = corridor.chain_node_ids[corridor.chain_node_ids.length - 1]
    if (first !== corridor.from_node_id || last !== corridor.to_node_id) {
      errors.push('串联节点的首尾必须与起点/终点节点一致')
    }
    if (new Set(corridor.chain_node_ids).size !== corridor.chain_node_ids.length) {
      errors.push('串联节点里出现了重复节点')
    }
  }
  if (isBlank(corridor.source)) {
    errors.push('数据来源不能为空：必须写明来源类型、定位信息和采集日期')
  }
  if (!(corridor.access_status in ACCESS_STATUS)) {
    errors.push(`通行状态不合法，可选值：${Object.keys(ACCESS_STATUS).join(' / ')}`)
  }
  if (!(corridor.verify_status in VERIFY_STATUS)) {
    errors.push(`核实状态不合法，可选值：${Object.keys(VERIFY_STATUS).join(' / ')}`)
  }
  if (corridor.bidirectional !== true) {
    errors.push('bidirectional 必须为 true：本项目统一假设暖廊双向可通行')
  }
  if (corridor.floors !== null && typeof corridor.floors !== 'string') {
    errors.push('连接楼层必须是字符串（如 "东侧2层 ⇄ 西侧3层"），未知时写 null')
  }
  if (corridor.length_m !== null) {
    if (
      typeof corridor.length_m !== 'number' ||
      !Number.isFinite(corridor.length_m) ||
      corridor.length_m <= 0
    ) {
      errors.push('距离必须是大于 0 的数字，未知时写 null（禁止写 0 或估算值）')
    }
  }
  if (!(corridor.corridor_type in CORRIDOR_TYPES)) {
    errors.push(`连廊类型不合法，可选值：${Object.keys(CORRIDOR_TYPES).join(' / ')}`)
  }
  if (!(corridor.topology in CORRIDOR_TOPOLOGY)) {
    errors.push(`拓扑类型不合法，可选值：${Object.keys(CORRIDOR_TOPOLOGY).join(' / ')}`)
  }

  if (errors.length > 0) {
    throw new Error(`暖廊数据不合法：\n- ${errors.join('\n- ')}`)
  }
}

/**
 * 生成一条建筑记录
 * category 允许为 null（官方分类尚未采集）
 */
export function createBuilding(input) {
  const building = {
    building_id: input.building_id,
    official_name: input.official_name,
    aliases: input.aliases ?? [],
    category: input.category ?? null,
    source: input.source,
    verify_status: input.verify_status ?? DEFAULT_VERIFY_STATUS
  }

  assertBuilding(building)
  return building
}

/** 校验单条建筑（自包含部分） */
export function assertBuilding(building) {
  const errors = []

  if (!BUILDING_ID_RE.test(String(building.building_id ?? ''))) {
    errors.push('建筑 id 必须是 YQ1-B001 这样的格式')
  }
  if (isBlank(building.official_name)) {
    errors.push('建筑名称不能为空，且必须与官方地图逐字一致')
  }
  if (building.category !== null && !BUILDING_CATEGORIES.includes(building.category)) {
    errors.push(`建筑分类必须是官方分类之一，或写 null：${BUILDING_CATEGORIES.join(' / ')}`)
  }
  if (isBlank(building.source)) {
    errors.push('数据来源不能为空')
  }
  if (!(building.verify_status in VERIFY_STATUS)) {
    errors.push(`核实状态不合法，可选值：${Object.keys(VERIFY_STATUS).join(' / ')}`)
  }

  if (errors.length > 0) {
    throw new Error(`建筑数据不合法：\n- ${errors.join('\n- ')}`)
  }
}

/**
 * 生成一条「候选暖廊」记录
 * 候选永远不参与导航，只保存官方原文和卡点原因
 */
export function createCandidate(input) {
  // 候选永远不参与导航：外部若试图标记为可导航，直接拒绝
  if (input.navigation_eligible === true) {
    throw new Error('候选数据不合法：\n- 候选记录不得参与导航（navigation_eligible 必须为 false）')
  }

  const candidate = {
    candidate_id: input.candidate_id,
    official_no: input.official_no ?? null,
    provisional_corridor_id: input.provisional_corridor_id ?? null,
    official_text: input.official_text,
    mentioned_buildings: input.mentioned_buildings ?? [],
    building_stops: input.building_stops ?? [],
    length_m: input.length_m ?? null,
    access_status: input.access_status ?? DEFAULT_ACCESS_STATUS,
    bidirectional: true,
    bidirectional_note: BIDIRECTIONAL_NOTE,
    blocked_reason: input.blocked_reason,
    notes: input.notes ?? '',
    source: input.source,
    navigation_eligible: false
  }

  assertCandidate(candidate)
  return candidate
}

/** 校验单条候选（自包含部分） */
export function assertCandidate(candidate) {
  const errors = []

  if (!CANDIDATE_ID_RE.test(String(candidate.candidate_id ?? ''))) {
    errors.push('候选 id 必须是 YQ1-C-0001 这样的格式')
  }
  if (isBlank(candidate.official_text)) {
    errors.push('候选必须保留官方原文')
  }
  if (!(candidate.blocked_reason in BLOCKED_REASONS)) {
    errors.push(`卡点原因不合法，可选值：${Object.keys(BLOCKED_REASONS).join(' / ')}`)
  }
  if (candidate.navigation_eligible !== false) {
    errors.push('候选记录不得参与导航（navigation_eligible 必须为 false）')
  }
  if (isBlank(candidate.source)) {
    errors.push('数据来源不能为空')
  }
  if (candidate.length_m !== null) {
    if (
      typeof candidate.length_m !== 'number' ||
      !Number.isFinite(candidate.length_m) ||
      candidate.length_m <= 0
    ) {
      errors.push('候选距离必须是大于 0 的数字，未知时写 null')
    }
  }
  if (!(candidate.access_status in ACCESS_STATUS)) {
    errors.push(`候选通行状态不合法，可选值：${Object.keys(ACCESS_STATUS).join(' / ')}`)
  }
  if (candidate.bidirectional !== true) {
    errors.push('候选的 bidirectional 也必须为 true：本项目统一假设暖廊双向可通行')
  }

  if (!Array.isArray(candidate.building_stops)) {
    errors.push('building_stops 必须是数组（没有逐栋楼层信息时写 []）')
  } else {
    for (const stop of candidate.building_stops) {
      if (isBlank(stop.building_id)) errors.push('building_stops 里缺少 building_id')
      if (isBlank(stop.building_name)) errors.push('building_stops 里缺少 building_name')
      if (isBlank(stop.floor)) errors.push(`${stop.building_name ?? stop.building_id} 缺少楼层`)
    }
    if (
      candidate.mentioned_buildings.length > 0 &&
      candidate.building_stops.length > 0 &&
      candidate.mentioned_buildings.length !== candidate.building_stops.length
    ) {
      errors.push('mentioned_buildings 与 building_stops 的数量不一致')
    }
  }

  if (errors.length > 0) {
    throw new Error(`候选数据不合法：\n- ${errors.join('\n- ')}`)
  }
}

/* ------------------------------------------------------------
   跨表校验：节点引用 / 编号重复 / 楼层 / 同建筑连接
   ------------------------------------------------------------ */

/**
 * 校验整个数据集
 * @param {{buildings: Array, nodes: Array, corridors: Array}} dataset
 * @returns {{ok: boolean, errors: string[], warnings: string[], stats: object}}
 */
export function validateDataset({ buildings = [], nodes = [], corridors = [] } = {}) {
  const errors = []
  const warnings = []

  /* --- 1. 编号重复 --- */
  const dupCheck = (list, key, label) => {
    const seen = new Map()
    for (const item of list) {
      const value = item[key]
      if (seen.has(value)) {
        errors.push(`${label}重复：「${value}」出现了不止一次`)
      } else {
        seen.set(value, item)
      }
    }
  }
  dupCheck(buildings, 'building_id', '建筑编号')
  dupCheck(buildings, 'official_name', '建筑名称')
  dupCheck(nodes, 'node_id', '节点编号')
  dupCheck(corridors, 'corridor_id', '暖廊项目编号')
  dupCheck(corridors, 'official_no', '暖廊官方编号')

  /* --- 2. 节点引用 + 建筑关联 --- */
  const buildingIds = new Set(buildings.map((b) => b.building_id))
  const nodeById = new Map(nodes.map((n) => [n.node_id, n]))

  for (const node of nodes) {
    if (!buildingIds.has(node.building_id)) {
      errors.push(`节点 ${node.node_id} 引用了不存在的建筑 ${node.building_id}`)
    }
  }

  for (const corridor of corridors) {
    const from = nodeById.get(corridor.from_node_id)
    const to = nodeById.get(corridor.to_node_id)

    if (!from) {
      errors.push(`暖廊 ${corridor.corridor_id} 的起点节点 ${corridor.from_node_id} 不存在`)
    }
    if (!to) {
      errors.push(`暖廊 ${corridor.corridor_id} 的终点节点 ${corridor.to_node_id} 不存在`)
    }

    for (const nodeId of corridor.chain_node_ids) {
      if (!nodeById.has(nodeId)) {
        errors.push(`暖廊 ${corridor.corridor_id} 的串联节点 ${nodeId} 不存在`)
      }
    }

    if (from && to) {
      /* --- 3. 同建筑连接：允许，但必须不是同一个节点 --- */
      const sameBuilding = from.building_id === to.building_id
      if (sameBuilding && from.node_id === to.node_id) {
        errors.push(`暖廊 ${corridor.corridor_id} 出现节点自环`)
      }
      if (sameBuilding && from.floor === to.floor && from.zone === to.zone) {
        errors.push(
          `暖廊 ${corridor.corridor_id} 的两端在同一栋建筑的同一层同一方位，无法区分`
        )
      }

      /* --- 4. 楼层一致性 --- */
      if (corridor.floors !== null) {
        const floorText = String(corridor.floors)
        for (const node of [from, to]) {
          if (node.floor !== null && !floorText.includes(node.floor)) {
            errors.push(
              `暖廊 ${corridor.corridor_id} 的楼层描述「${floorText}」与节点 ${node.node_id} 的楼层「${node.floor}」对不上`
            )
          }
        }
      } else if (from.floor !== null && to.floor !== null) {
        warnings.push(
          `暖廊 ${corridor.corridor_id} 两端楼层已知，但 floors 字段为空（不影响导航，建议补上便于展示）`
        )
      }
    }

    if (corridor.navigation_eligible && corridor.topology !== 'linear_chain') {
      errors.push(`暖廊 ${corridor.corridor_id} 拓扑未定，不能标记为可导航`)
    }
    for (const linked of corridor.linked_corridors) {
      if (!corridors.some((c) => c.official_no === linked)) {
        warnings.push(
          `暖廊 ${corridor.corridor_id} 关联的 ${linked} 号暖廊尚未收录（可能在候选清单里）`
        )
      }
    }
  }

  /* --- 5. 同一栋建筑的节点不能"同层同方位"重复 --- */
  const nodeKey = new Set()
  for (const node of nodes) {
    const key = `${node.building_id}|${node.floor ?? '?'}|${node.zone ?? '-'}`
    if (nodeKey.has(key)) {
      errors.push(`建筑 ${node.building_id} 出现了重复的楼层节点：${key}`)
    }
    nodeKey.add(key)
  }

  /* --- 6. 统计 --- */
  const stats = {
    buildings: buildings.length,
    nodes: nodes.length,
    corridors: corridors.length,
    eligible: corridors.filter((c) => c.navigation_eligible).length,
    withDistance: corridors.filter((c) => c.length_m !== null).length,
    sameBuilding: corridors.filter((c) => {
      const a = nodeById.get(c.from_node_id)
      const b = nodeById.get(c.to_node_id)
      return a && b && a.building_id === b.building_id
    }).length,
    chained: corridors.filter((c) => c.chain_node_ids.length > 2).length
  }

  return { ok: errors.length === 0, errors, warnings, stats }
}

/** 按建筑分组返回节点（建筑 ↔ 节点的关联查询） */
export function groupNodesByBuilding(nodes) {
  const map = new Map()
  for (const node of nodes) {
    if (!map.has(node.building_id)) map.set(node.building_id, [])
    map.get(node.building_id).push(node)
  }
  return map
}
