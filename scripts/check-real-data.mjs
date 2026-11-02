/**
 * 真实校园数据自检（运行：npm run check:data）
 *
 * 覆盖四类校验：
 *   1. 节点引用    —— 暖廊不能引用不存在的节点
 *   2. 编号重复    —— 项目编号 / 官方编号都不能重复
 *   3. 楼层        —— 格式合法，且与节点楼层对得上
 *   4. 同建筑连接  —— 允许不同节点，禁止自环与同层同方位
 *
 * 既有「正向测试」（真实数据必须通过），
 * 也有「负向测试」（故意造脏数据，校验器必须拦住）。
 */
import {
  validateDataset,
  createCorridor,
  createNode,
  createCandidate
} from '../src/data/realCampus/rules.js'
import { BUILDINGS } from '../src/data/realCampus/buildings.js'
import { NODES } from '../src/data/realCampus/nodes.js'
import { CORRIDORS } from '../src/data/realCampus/corridors.js'
import { CANDIDATES } from '../src/data/realCampus/candidates.js'
import { BUILDING_LAYOUT, validateLayout } from '../src/data/realCampus/mapLayout.js'

let passed = 0
let failed = 0
let currentGroup = ''

function group(title) {
  currentGroup = title
  console.log(`\n── ${title} ─────────────────────────────`)
}

function test(name, fn) {
  try {
    fn()
    passed += 1
    console.log(`  ✓ ${name}`)
  } catch (error) {
    failed += 1
    console.log(`  ✗ ${name}`)
    console.log(`    ${String(error.message).split('\n').join('\n    ')}`)
  }
}

function expectOk(report) {
  if (!report.ok) throw new Error(`预期通过，但报错：\n${report.errors.join('\n')}`)
}

function expectFail(report, keyword) {
  if (report.ok) throw new Error('预期校验失败，但居然通过了')
  const text = report.errors.join(' ')
  if (keyword && !text.includes(keyword)) {
    throw new Error(`报错了，但信息不含「${keyword}」：${text}`)
  }
}

function expectThrow(fn, keyword) {
  try {
    fn()
  } catch (error) {
    if (keyword && !error.message.includes(keyword)) {
      throw new Error(`抛错了，但信息不含「${keyword}」：${error.message}`)
    }
    return
  }
  throw new Error('预期抛错，但没有抛')
}

const base = { buildings: BUILDINGS, nodes: NODES, corridors: CORRIDORS }

/* ============================================================
   1. 真实数据整体校验
   ============================================================ */
group('真实数据整体校验')

test('全部建筑 / 节点 / 暖廊通过校验', () => {
  expectOk(validateDataset(base))
})

test('统计数字符合预期（20 栋 / 13 节点 / 7 条暖廊 / 17 条候选）', () => {
  const { stats } = validateDataset(base)
  const actual = `${stats.buildings}/${stats.nodes}/${stats.corridors}/${CANDIDATES.length}`
  if (actual !== '20/13/7/17') throw new Error(`实际是 ${actual}`)
})

test('7 条暖廊全部可导航（eligible = 7）', () => {
  const { stats } = validateDataset(base)
  if (stats.eligible !== 7) throw new Error(`eligible 实际是 ${stats.eligible}`)
})

test('全部暖廊距离为 null、状态 assumed_open、双向 true', () => {
  for (const c of CORRIDORS) {
    if (c.length_m !== null) throw new Error(`${c.corridor_id} 距离不是 null`)
    if (c.access_status !== 'assumed_open') throw new Error(`${c.corridor_id} 状态不是 assumed_open`)
    if (c.bidirectional !== true) throw new Error(`${c.corridor_id} 双向不是 true`)
  }
})

test('候选暖廊一律不参与导航', () => {
  for (const c of CANDIDATES) {
    if (c.navigation_eligible !== false) throw new Error(`${c.candidate_id} 竟然可导航`)
  }
  const usedInNav = new Set(CORRIDORS.map((c) => c.official_no))
  for (const c of CANDIDATES) {
    if (c.official_no && usedInNav.has(c.official_no)) {
      throw new Error(`候选 ${c.candidate_id} 的编号 ${c.official_no} 同时出现在正式表里`)
    }
  }
})

/* ============================================================
   2. 节点引用
   ============================================================ */
group('节点引用校验')

test('引用不存在的节点会被拦住', () => {
  const broken = [{ ...CORRIDORS[0], from_node_id: 'YQ1-N-999' }]
  expectFail(validateDataset({ ...base, corridors: broken }), '不存在')
})

test('串联节点里出现不存在的节点会被拦住', () => {
  const broken = [
    {
      ...CORRIDORS[1],
      chain_node_ids: ['YQ1-N-001', 'YQ1-N-998', 'YQ1-N-004']
    }
  ]
  expectFail(validateDataset({ ...base, corridors: broken }), '串联节点')
})

test('串联节点首尾与起终点不一致会被拦住', () => {
  expectThrow(
    () =>
      createCorridor({
        ...CORRIDORS[1],
        chain_node_ids: ['YQ1-N-001', 'YQ1-N-004', 'YQ1-N-003']
      }),
    '首尾'
  )
})

test('4-3 的串联顺序与官方原文一致（明德楼 → 格物楼 → 建筑设计学院）', () => {
  const c = CORRIDORS.find((x) => x.official_no === '4-3')
  const names = c.chain_node_ids.map((id) => NODES.find((n) => n.node_id === id).display_name)
  const expected = '明德楼 2层 → 格物楼 2层 → 建筑设计学院 2层'
  if (names.join(' → ') !== expected) throw new Error(`实际是 ${names.join(' → ')}`)
})

/* ============================================================
   3. 编号重复
   ============================================================ */
group('编号重复校验')

test('项目编号重复会被拦住', () => {
  const dup = [{ ...CORRIDORS[0] }, { ...CORRIDORS[1], corridor_id: CORRIDORS[0].corridor_id }]
  expectFail(validateDataset({ ...base, corridors: dup }), '暖廊项目编号重复')
})

test('官方编号重复会被拦住', () => {
  const dup = [{ ...CORRIDORS[0] }, { ...CORRIDORS[1], official_no: CORRIDORS[0].official_no }]
  expectFail(validateDataset({ ...base, corridors: dup }), '暖廊官方编号重复')
})

test('节点编号重复会被拦住', () => {
  const dupNode = { ...NODES[1], node_id: NODES[0].node_id }
  expectFail(validateDataset({ ...base, nodes: [...NODES, dupNode] }), '节点编号重复')
})

/* ============================================================
   4. 楼层校验
   ============================================================ */
group('楼层校验')

test('非法楼层写法会被拦住', () => {
  expectThrow(
    () =>
      createNode({
        node_id: 'YQ1-N-903',
        building_id: 'YQ1-B001',
        floor: '二楼',
        display_name: '测试',
        source: 'test'
      }),
    '楼层'
  )
})

test('合法楼层写法（2层 / 2.5层 / M层）都能通过', () => {
  for (const floor of ['2层', '2.5层', 'M层']) {
    createNode({
      node_id: 'YQ1-N-904',
      building_id: 'YQ1-B001',
      floor,
      display_name: `测试 ${floor}`,
      source: 'test'
    })
  }
})

test('暖廊楼层描述与节点楼层对不上会被拦住', () => {
  const broken = [{ ...CORRIDORS[0], floors: '9层 ⇄ 9层' }]
  expectFail(validateDataset({ ...base, corridors: broken }), '对不上')
})

/* ============================================================
   5. 同建筑连接
   ============================================================ */
group('同建筑连接校验')

test('同建筑不同节点相连是允许的（X6）', () => {
  const x6 = CORRIDORS.find((c) => c.official_no === 'X6')
  const from = NODES.find((n) => n.node_id === x6.from_node_id)
  const to = NODES.find((n) => n.node_id === x6.to_node_id)
  if (from.building_id !== to.building_id) throw new Error('X6 两端不在同一建筑')
  if (from.node_id === to.node_id) throw new Error('X6 两端是同一个节点')
  expectOk(validateDataset(base))
})

test('节点自环（起点=终点）会被拦住', () => {
  expectThrow(
    () =>
      createCorridor({
        ...CORRIDORS[0],
        to_node_id: CORRIDORS[0].from_node_id
      }),
    '自环'
  )
})

test('同建筑同层同方位的重复节点会被拦住', () => {
  const a = createNode({
    node_id: 'YQ1-N-905',
    building_id: 'YQ1-B008',
    floor: '2层',
    zone: '东',
    display_name: 'A10公寓 东侧2层（重复）',
    source: 'test'
  })
  expectFail(validateDataset({ ...base, nodes: [...NODES, a] }), '重复的楼层节点')
})

/* ============================================================
   6. 候选约束
   ============================================================ */
group('候选约束校验')

test('候选记录不能标记为可导航', () => {
  expectThrow(
    () =>
      createCandidate({
        candidate_id: 'YQ1-C-9999',
        official_no: 'X9',
        official_text: '测试',
        blocked_reason: 'unreadable',
        source: 'test',
        navigation_eligible: true
      }),
    '不得参与导航'
  )
})

/* ============================================================
   7. 示意地图布局（人工标定）
   ============================================================ */
group('示意地图布局')

test('布局数据本身合法（无越界、无重复、无越权）', () => {
  const report = validateLayout(BUILDINGS)
  if (!report.ok) throw new Error(report.errors.join('\n'))
})

test('19 栋建筑都有布局记录（含未标定）', () => {
  if (BUILDING_LAYOUT.length !== BUILDINGS.length) {
    throw new Error(`布局 ${BUILDING_LAYOUT.length} 条，建筑 ${BUILDINGS.length} 栋`)
  }
})

test('至少 14 栋标记为已标定', () => {
  const calibrated = BUILDING_LAYOUT.filter((item) => item.status === 'calibrated')
  if (calibrated.length < 14) throw new Error(`只有 ${calibrated.length} 栋 calibrated`)
})

test('新增建筑没有楼层节点，因此不会成为路线端点（不伪造导航）', () => {
  // B010 图书馆因为在 4-7 号暖廊里成为端点，已不在此列
  const added = ['YQ1-B011', 'YQ1-B012', 'YQ1-B013', 'YQ1-B014', 'YQ1-B015', 'YQ1-B016', 'YQ1-B017', 'YQ1-B018', 'YQ1-B019', 'YQ1-B020']
  for (const id of added) {
    if (!BUILDINGS.some((b) => b.building_id === id)) {
      throw new Error(`${id} 不在建筑表里`)
    }
    if (NODES.some((n) => n.building_id === id)) {
      throw new Error(`${id} 不应有楼层节点，否则会被当成路线端点`)
    }
  }
})

test('图书馆因为 4-7 号暖廊成为合法端点（有且仅有 2 层一个节点）', () => {
  const libraryNodes = NODES.filter((n) => n.building_id === 'YQ1-B010')
  if (libraryNodes.length !== 1) throw new Error(`图书馆节点数 ${libraryNodes.length}`)
  expectEqual(libraryNodes[0].floor, '2层', '图书馆节点楼层')
})

test('A10公寓 必须是 unplaced，且不能有坐标（禁止与十公寓合并当已核实）', () => {
  const a10 = BUILDING_LAYOUT.find((item) => item.building_id === 'YQ1-B008')
  if (!a10) throw new Error('缺少 A10公寓 的布局记录')
  if (a10.status !== 'unplaced') throw new Error(`A10公寓 状态是 ${a10.status}`)
  if (a10.footprint) throw new Error('A10公寓 未确认，不应带 footprint')
})

test('建筑设计学院 只能是 estimated（名称与位置均未确认）', () => {
  const item = BUILDING_LAYOUT.find((x) => x.building_id === 'YQ1-B004')
  if (!item) throw new Error('缺少 建筑设计学院 的布局记录')
  if (item.status !== 'estimated') throw new Error(`状态是 ${item.status}`)
  if (item.confidence !== 'low') throw new Error('置信度应为 low')
})

test('unplaced 的建筑绝不出现在可绘制列表里', () => {
  for (const item of BUILDING_LAYOUT.filter((x) => x.status === 'unplaced')) {
    if (item.footprint) throw new Error(`${item.name} 带坐标却没被拦住`)
  }
})

/* ============================================================
   8. 4-6 号暖廊（弹窗确认，暂列候选）
   ============================================================ */
group('4-6 号暖廊补录')

const c46 = CANDIDATES.find((c) => c.official_no === '4-6')

test('4-6 在候选表里，且不在正式暖廊表（不参与 BFS）', () => {
  if (!c46) throw new Error('候选表里没有 4-6')
  if (CORRIDORS.some((c) => c.official_no === '4-6')) {
    throw new Error('4-6 不应出现在正式暖廊表里')
  }
  if (c46.navigation_eligible !== false) throw new Error('4-6 不应可导航')
})

test('4-6 记录五栋建筑及各自楼层', () => {
  const expected = [
    ['YQ1-B011', '学苑楼', '2层'],
    ['YQ1-B017', '致知楼', '2层'],
    ['YQ1-B010', '图书馆', '2层'],
    ['YQ1-B018', '新民楼', '3层'],
    ['YQ1-B019', 'A18公寓', '4层']
  ]
  if (c46.building_stops.length !== expected.length) {
    throw new Error(`building_stops 实际 ${c46.building_stops.length} 条`)
  }
  expected.forEach(([id, name, floor], i) => {
    const stop = c46.building_stops[i]
    if (stop.building_id !== id || stop.building_name !== name || stop.floor !== floor) {
      throw new Error(`第 ${i + 1} 站不对：期望 ${id}/${name}/${floor}，实际 ${stop.building_id}/${stop.building_name}/${stop.floor}`)
    }
  })
})

test('4-6 引用的建筑全部存在于建筑表（不重复造楼）', () => {
  for (const stop of c46.building_stops) {
    const building = BUILDINGS.find((b) => b.building_id === stop.building_id)
    if (!building) throw new Error(`${stop.building_id} 不在建筑表里`)
    if (building.official_name !== stop.building_name) {
      throw new Error(`${stop.building_id} 名称不一致：${building.official_name} vs ${stop.building_name}`)
    }
  }
})

test('4-6 的官方原文逐字完整', () => {
  const expected = '4-6号暖廊（学苑楼2层—致知楼2层—图书馆2层—新民楼3层—A18公寓4层）'
  if (c46.official_text !== expected) throw new Error(`实际是：${c46.official_text}`)
})

test('4-6 距离为 null、状态 assumed_open、双向为项目假设', () => {
  if (c46.length_m !== null) throw new Error(`距离应为 null，实际 ${c46.length_m}`)
  if (c46.access_status !== 'assumed_open') throw new Error(`状态应为 assumed_open，实际 ${c46.access_status}`)
  if (c46.bidirectional !== true) throw new Error('双向应为 true')
  if (!c46.bidirectional_note.includes('项目假设')) throw new Error('缺少双向的假设说明')
})

test('临时项目编号不与正式暖廊冲突', () => {
  if (!c46.provisional_corridor_id) throw new Error('缺少临时项目编号')
  if (CORRIDORS.some((c) => c.corridor_id === c46.provisional_corridor_id)) {
    throw new Error(`临时编号 ${c46.provisional_corridor_id} 与正式暖廊冲突`)
  }
})

/* ============================================================
   9. 4-7 号暖廊（弹窗确认，已进正式导航）
   ============================================================ */
group('4-7 号暖廊（正式）')

const c47 = CORRIDORS.find((c) => c.official_no === '4-7')

test('4-7 在正式暖廊表里，项目编号 YQ1-WC-0007', () => {
  if (!c47) throw new Error('正式表里没有 4-7')
  expectEqual(c47.corridor_id, 'YQ1-WC-0007', '项目编号')
})

test('4-7 两端是 图书馆2层 与 材料学院3层', () => {
  expectEqual(c47.from_node_id, 'YQ1-N-012', '起点节点')
  expectEqual(c47.to_node_id, 'YQ1-N-013', '终点节点')
  const from = NODES.find((n) => n.node_id === c47.from_node_id)
  const to = NODES.find((n) => n.node_id === c47.to_node_id)
  expectEqual(from.display_name, '图书馆 2层', '起点名称')
  expectEqual(to.display_name, '材料学院 3层', '终点名称')
})

test('4-7 官方原文逐字完整', () => {
  expectEqual(c47.official_description, '4-7号暖廊（图书馆2层—材料学院3层）', '原文')
})

test('4-7 距离 null、状态 assumed_open、双向为项目假设', () => {
  if (c47.length_m !== null) throw new Error(`距离应为 null，实际 ${c47.length_m}`)
  expectEqual(c47.access_status, 'assumed_open', '通行状态')
  expectEqual(c47.bidirectional, true, '双向')
  if (!c47.bidirectional_note.includes('项目假设')) throw new Error('缺少双向假设说明')
})

test('4-7 已由弹窗确认，可导航', () => {
  expectEqual(c47.verify_status, 'confirmed', '核实状态')
  expectEqual(c47.navigation_eligible, true, '可导航')
})

test('材料学院 与 材料楼 是两条独立记录（未合并）', () => {
  const academy = BUILDINGS.find((b) => b.official_name === '材料学院')
  const hall = BUILDINGS.find((b) => b.official_name === '材料楼')
  if (!academy || !hall) throw new Error('材料学院或材料楼缺失')
  if (academy.building_id === hall.building_id) throw new Error('两条记录被合并了')
})

test('材料学院 在地图上未标定（位置未核实）', () => {
  const layout = BUILDING_LAYOUT.find((x) => x.building_id === 'YQ1-B020')
  if (!layout) throw new Error('缺少材料学院的布局记录')
  expectEqual(layout.status, 'unplaced', '标定状态')
  if (layout.footprint) throw new Error('位置未确认，不应有坐标')
})

/* ============================================================
   汇总
   ============================================================ */
const report = validateDataset(base)
console.log('\n════════════════════════════════════════')
console.log(`数据集：建筑 ${report.stats.buildings} · 节点 ${report.stats.nodes} · 暖廊 ${report.stats.corridors} · 候选 ${CANDIDATES.length}`)
console.log(`可导航 ${report.stats.eligible} 条 ｜ 同建筑连接 ${report.stats.sameBuilding} 条 ｜ 多栋串联 ${report.stats.chained} 条`)
console.log(`测试结果：通过 ${passed} 项，失败 ${failed} 项`)
if (report.warnings.length > 0) {
  console.log(`提示（不影响通过）：`)
  for (const w of report.warnings) console.log(`  · ${w}`)
}
console.log('════════════════════════════════════════')

process.exit(failed === 0 ? 0 : 1)
