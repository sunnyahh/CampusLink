/**
 * 真实校园 · 基础连通路径（BFS）自检
 * 运行：npm run check:real-route
 *
 * 覆盖四类场景：
 *   1. 直连        —— 一段暖廊到达
 *   2. 多段        —— 需要换乘两次及以上
 *   3. 同建筑节点  —— X6 这种同楼不同楼层的连接
 *   4. 未连通      —— 数据里确实走不通（不代表现实走不通）
 *
 * 另外还验证：
 *   - 多栋串联暖廊不拆段（4-3 只算一条边）
 *   - 路径段数 = 节点数 − 1，且用到的暖廊都可导航
 *   - 反方向查询结果一致
 */
import { NODES } from '../src/data/realCampus/nodes.js'
import { CORRIDORS } from '../src/data/realCampus/corridors.js'
import {
  buildNodeGraph,
  buildRoutingGraph,
  findPath,
  findBuildingRoute,
  nodeComponents
} from '../src/utils/realRoutePlanner.js'

const graph = buildNodeGraph(NODES, CORRIDORS)

let passed = 0
let failed = 0

function group(title) {
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

function expectEqual(actual, expected, label) {
  if (actual !== expected) throw new Error(`${label}：期望 ${expected}，实际 ${actual}`)
}

function nameOf(nodeId) {
  return NODES.find((n) => n.node_id === nodeId)?.display_name ?? nodeId
}

function routeOf(from, to) {
  return findPath(graph, from, to)
}

function expectRoute(from, to, expectedSegments, expectedNos) {
  const route = routeOf(from, to)
  if (!route.ok) {
    throw new Error(`${nameOf(from)} → ${nameOf(to)} 应该连通，但返回 ${route.reason}`)
  }
  expectEqual(route.segments, expectedSegments, '段数')
  const nos = route.corridors.map((c) => c.official_no).join(' → ')
  if (nos !== expectedNos) throw new Error(`暖廊顺序：期望 ${expectedNos}，实际 ${nos}`)
  expectEqual(route.nodeIds.length, route.segments + 1, '节点数应为段数 + 1')
  return route
}

function expectUnreachable(from, to) {
  const route = routeOf(from, to)
  if (route.ok) {
    throw new Error(`${nameOf(from)} → ${nameOf(to)} 应该不连通，却找到 ${route.segments} 段路径`)
  }
  expectEqual(route.reason, 'unreachable', '失败原因')
}

/* ============================================================
   0. 图结构
   ============================================================ */
group('图结构')

test('每个楼层节点都进入图中', () => {
  expectEqual(graph.size, NODES.length, '节点数')
})

test('7 条暖廊生成 14 条有向边（双向）', () => {
  let edges = 0
  for (const list of graph.values()) edges += list.length
  expectEqual(edges, CORRIDORS.length * 2, '有向边数')
})

test('4-3 串联暖廊只算一条边（不拆成两段）', () => {
  const edge = graph.get('YQ1-N-001').find((e) => e.corridor.official_no === '4-3')
  if (!edge) throw new Error('明德楼2层 没有 4-3 号暖廊的边')
  expectEqual(edge.to, 'YQ1-N-004', '4-3 的终点节点')
})

/* ============================================================
   1. 直连
   ============================================================ */
group('直连（1 段）')

test('明德楼2层 → 理学楼2层：1 段（4-1）', () => {
  expectRoute('YQ1-N-001', 'YQ1-N-002', 1, '4-1')
})

test('明德楼2层 → 建筑设计学院2层：1 段（4-3 串联，算一段）', () => {
  const route = expectRoute('YQ1-N-001', 'YQ1-N-004', 1, '4-3')
  expectEqual(route.nodeIds.join(','), 'YQ1-N-001,YQ1-N-004', '节点序列')
})

test('图书馆2层 → 材料学院3层：1 段（4-7，已进正式导航）', () => {
  expectRoute('YQ1-N-012', 'YQ1-N-013', 1, '4-7')
})

/* ============================================================
   2. 多段
   ============================================================ */
group('多段（需要换乘）')

test('A10公寓东侧2层 → 正心楼1层：2 段（X6 → X2）', () => {
  expectRoute('YQ1-N-010', 'YQ1-N-011', 2, 'X6 → X2')
})

test('反方向查询结果一致（正心楼1层 → A10公寓东侧2层）', () => {
  expectRoute('YQ1-N-011', 'YQ1-N-010', 2, 'X2 → X6')
})

test('路径上用到的暖廊都标记为可导航', () => {
  const route = routeOf('YQ1-N-011', 'YQ1-N-010')
  for (const corridor of route.corridors) {
    if (!corridor.navigation_eligible) {
      throw new Error(`${corridor.official_no} 不可导航却出现在路径里`)
    }
  }
})

/* ============================================================
   3. 同建筑节点连接
   ============================================================ */
group('同建筑节点连接')

test('A10公寓东侧2层 → A10公寓西侧3层：1 段（X6，同楼不同楼层）', () => {
  const route = expectRoute('YQ1-N-010', 'YQ1-N-009', 1, 'X6')
  const from = NODES.find((n) => n.node_id === route.nodeIds[0])
  const to = NODES.find((n) => n.node_id === route.nodeIds[1])
  expectEqual(from.building_id, to.building_id, '两端应属于同一栋建筑')
  if (from.node_id === to.node_id) throw new Error('两端不应是同一个节点')
})

/* ============================================================
   4. 未连通
   ============================================================ */
group('未连通')

test('明德楼2层 → 正心楼1层：不连通', () => {
  expectUnreachable('YQ1-N-001', 'YQ1-N-011')
})

test('格物楼2层 没有任何已确认连接（只出现在 4-3 的串联描述里）', () => {
  expectUnreachable('YQ1-N-003', 'YQ1-N-001')
  expectUnreachable('YQ1-N-003', 'YQ1-N-004')
})

test('诚意楼2层 与 诚意楼2.5层 不连通（楼内竖向通行未录入）', () => {
  expectUnreachable('YQ1-N-006', 'YQ1-N-005')
})

test('起点与终点相同时不返回路径', () => {
  const route = routeOf('YQ1-N-001', 'YQ1-N-001')
  if (route.ok) throw new Error('同节点不应返回路径')
  expectEqual(route.reason, 'same_node', '失败原因')
})

test('不存在的节点会返回 unknown_node', () => {
  const route = routeOf('YQ1-N-999', 'YQ1-N-001')
  if (route.ok) throw new Error('未知节点不应返回路径')
  expectEqual(route.reason, 'unknown_node', '失败原因')
})

/* ============================================================
   5. 连通性统计
   ============================================================ */
group('连通性统计')

test('13 个节点分成 5 个连通组 + 1 个孤立节点', () => {
  const { groups, isolated } = nodeComponents(graph)
  expectEqual(groups.length, 5, '连通组数')
  expectEqual(isolated.length, 1, '孤立节点数')
  expectEqual(isolated[0], 'YQ1-N-003', '孤立节点应是格物楼2层')
})

test('所有连通组的总节点数 + 孤立节点 = 13', () => {
  const { groups, isolated } = nodeComponents(graph)
  const total = groups.reduce((sum, g) => sum + g.length, 0) + isolated.length
  expectEqual(total, NODES.length, '节点总数')
})

/* ============================================================
   6. 楼间路由（学生只选建筑）
   ============================================================ */
group('楼间路由（建筑级）')

const routing = buildRoutingGraph(NODES, CORRIDORS)

function buildingRoute(from, to) {
  return findBuildingRoute(routing, NODES, from, to)
}

function expectBuildingRoute(from, to, segments, transferCount, corridorNos, buildingIds) {
  const route = buildingRoute(from, to)
  if (!route.ok) throw new Error(`${from} → ${to} 应该连通，但返回 ${route.reason}`)
  expectEqual(route.segments, segments, '官方暖廊段数')
  expectEqual(route.transferCount, transferCount, '楼内换乘次数')
  const nos = route.corridors.map((c) => c.official_no).join(' → ')
  if (nos !== corridorNos) throw new Error(`暖廊顺序：期望 ${corridorNos}，实际 ${nos}`)
  const ids = route.buildingIds.join(' → ')
  if (ids !== buildingIds) throw new Error(`建筑链：期望 ${buildingIds}，实际 ${ids}`)
  return route
}

test('直连：明德楼 → 理学楼 = 1 段，0 换乘', () => {
  expectBuildingRoute('YQ1-B001', 'YQ1-B002', 1, 0, '4-1', 'YQ1-B001 → YQ1-B002')
})

test('串联暖廊算一段：明德楼 → 建筑设计学院 = 1 段（4-3）', () => {
  expectBuildingRoute('YQ1-B001', 'YQ1-B004', 1, 0, '4-3', 'YQ1-B001 → YQ1-B004')
})

test('多段 + 楼内换乘：A03公寓 → 学士楼 = 2 段 + 1 次换乘', () => {
  const route = expectBuildingRoute(
    'YQ1-B007',
    'YQ1-B006',
    2,
    1,
    '2 → 4',
    'YQ1-B007 → YQ1-B005 → YQ1-B006'
  )
  const transfer = route.steps.find((s) => s.kind === 'transfer')
  const from = NODES.find((n) => n.node_id === transfer.fromNodeId)
  const to = NODES.find((n) => n.node_id === transfer.toNodeId)
  expectEqual(from.building_id, to.building_id, '换乘两端应在同一栋建筑')
  expectEqual(from.building_id, 'YQ1-B005', '换乘应发生在诚意楼')
})

test('起点建筑的任一节点都可作为出发点：A10公寓 → 正心楼 = 1 段（X2，0 换乘）', () => {
  const route = buildingRoute('YQ1-B008', 'YQ1-B009')
  expectEqual(route.segments, 1, '官方暖廊段数')
  expectEqual(route.transferCount, 0, '换乘次数')
  expectEqual(route.corridors[0].official_no, 'X2', '暖廊编号')
  expectEqual(route.buildingIds.join(' → '), 'YQ1-B008 → YQ1-B009', '建筑链')
})

test('楼内换乘不计入段数：A03公寓 → 学士楼 共 3 步，但只有 2 段暖廊', () => {
  const route = buildingRoute('YQ1-B007', 'YQ1-B006')
  expectEqual(route.steps.length, 3, '总步数（含换乘）')
  expectEqual(route.segments, 2, '官方暖廊段数')
  if (route.segments >= route.steps.length) {
    throw new Error('换乘应该不增加暖廊段数')
  }
})

test('同一栋建筑不返回路线', () => {
  const route = buildingRoute('YQ1-B008', 'YQ1-B008')
  if (route.ok) throw new Error('同建筑不应返回路线')
  expectEqual(route.reason, 'same_building', '失败原因')
})

test('不同组团之间不连通：明德楼 → 正心楼', () => {
  const route = buildingRoute('YQ1-B001', 'YQ1-B009')
  if (route.ok) throw new Error('跨组团不应连通')
  expectEqual(route.reason, 'unreachable', '失败原因')
})

test('没有凭空生成跨楼连接：明德楼 → 诚意楼 不连通', () => {
  const route = buildingRoute('YQ1-B001', 'YQ1-B005')
  if (route.ok) throw new Error('明德楼与诚意楼之间没有任何官方暖廊，不应连通')
  expectEqual(route.reason, 'unreachable', '失败原因')
})

test('格物楼没有可用连接：格物楼 → 明德楼 不连通', () => {
  const route = buildingRoute('YQ1-B003', 'YQ1-B001')
  if (route.ok) throw new Error('格物楼只出现在串联描述里，不应有路线')
  expectEqual(route.reason, 'unreachable', '失败原因')
})

test('结果里不含距离和步行时间字段', () => {
  const route = buildingRoute('YQ1-B007', 'YQ1-B006')
  for (const key of ['meters', 'length', 'minutes', 'duration', 'distance']) {
    if (key in route) throw new Error(`结果不应包含 ${key}`)
  }
  for (const corridor of route.corridors) {
    if (corridor.length_m !== null) throw new Error(`${corridor.official_no} 距离不是 null`)
  }
})

test('每一步用的暖廊都在已录入的精确清单里', () => {
  const route = buildingRoute('YQ1-B007', 'YQ1-B006')
  const known = new Set(CORRIDORS.map((c) => c.corridor_id))
  for (const step of route.steps) {
    if (step.kind !== 'corridor') continue
    if (!known.has(step.corridor.corridor_id)) {
      throw new Error(`出现了未录入的暖廊 ${step.corridor.corridor_id}`)
    }
  }
})

/* ============================================================
   汇总
   ============================================================ */
console.log('\n════════════════════════════════════════')
console.log('典型路径：')
const demo = routeOf('YQ1-N-010', 'YQ1-N-011')
console.log(
  `  ${demo.nodeIds.map(nameOf).join(' → ')}`
)
console.log(`  共 ${demo.segments} 段：${demo.corridors.map((c) => c.official_no + ' 号暖廊').join(' → ')}`)
console.log(`测试结果：通过 ${passed} 项，失败 ${failed} 项`)
console.log('════════════════════════════════════════')

process.exit(failed === 0 ? 0 : 1)
