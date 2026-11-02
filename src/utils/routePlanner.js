/**
 * ============================================================
 *  本地路线规划算法（不依赖任何在线地图 / 付费 API）
 * ------------------------------------------------------------
 *  思路分三步：
 *   1. 建图：把每栋建筑和暖廊枢纽当作「节点」，
 *      把每条暖廊 / 步道当作带权重的「边」。
 *   2. 算权重：室内按真实距离计；室外乘一个「冬季体感系数」
 *      （暖廊优先模式下 1 米室外 = 5 米体感距离）。
 *   3. Dijkstra 最短路：在加权图上找起点到终点成本最小的路径。
 *
 *  为什么室外要加权？
 *    如果直接用真实距离，算法会挑"直线最近"的路，哪怕要露天走 150 米。
 *    加权之后，"绕暖廊多走 100 米"可能比"露天少走 50 米"更划算，
 *    这样就实现了"优先室内暖廊、减少冬季室外步行"。
 * ============================================================
 */

import { BUILDINGS } from '../data/buildings.js'
import { CORRIDORS, JUNCTIONS } from '../data/corridors.js'

/** 地图比例尺：1 个地图单位 = 0.5 米 */
export const MAP_SCALE_METERS = 0.5

/** 步行速度（米 / 分钟），约 4.5 km/h */
export const WALK_SPEED_M_PER_MIN = 75

/**
 * 三种路线偏好
 * outdoorWeight = 室外 1 米折算成多少米"体感距离"
 */
export const PREFERENCE_LIST = [
  {
    id: 'warm',
    label: '暖廊优先',
    short: '尽量走室内',
    outdoorWeight: 5,
    hint: '室外按 1 米 = 5 米折算，宁可绕行暖廊也尽量不露天穿行。'
  },
  {
    id: 'balanced',
    label: '均衡',
    short: '距离与保暖兼顾',
    outdoorWeight: 2.5,
    hint: '室外按 1 米 = 2.5 米折算，在距离和保暖之间取平衡。'
  },
  {
    id: 'shortest',
    label: '最短距离',
    short: '只算真实距离',
    outdoorWeight: 1,
    hint: '只按真实距离计算，可能会走更多室外路段。'
  }
]

export const PREFERENCES = Object.fromEntries(PREFERENCE_LIST.map((p) => [p.id, p]))

/* ------------------------------------------------------------
   1. 准备节点坐标
   ------------------------------------------------------------ */
const NODE_POINT = new Map()
const NODE_NAME = new Map()

for (const b of BUILDINGS) {
  NODE_POINT.set(b.id, { x: b.x, y: b.y })
  NODE_NAME.set(b.id, b.name)
}
for (const j of JUNCTIONS) {
  NODE_POINT.set(j.id, { x: j.x, y: j.y })
  NODE_NAME.set(j.id, j.name)
}

/** 计算折线总长度（地图单位） */
function polylineLength(points) {
  let total = 0
  for (let i = 1; i < points.length; i += 1) {
    total += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y)
  }
  return total
}

/** 一条连接的完整折线：起点 → 拐点… → 终点 */
function corridorPoints(corridor) {
  const from = NODE_POINT.get(corridor.from)
  const to = NODE_POINT.get(corridor.to)
  if (!from || !to) return null
  const via = Array.isArray(corridor.via) ? corridor.via : []
  return [from, ...via, to]
}

/* ------------------------------------------------------------
   2. 建图（双向边：暖廊是能来回走的）
   ------------------------------------------------------------ */
const GRAPH = (() => {
  const graph = new Map()

  const link = (from, to, edge) => {
    if (!graph.has(from)) graph.set(from, new Map())
    graph.get(from).set(to, edge)
  }

  for (const corridor of CORRIDORS) {
    const points = corridorPoints(corridor)
    if (!points) continue

    const meters = Math.max(1, Math.round(polylineLength(points) * MAP_SCALE_METERS))
    const forward = { id: corridor.id, name: corridor.name, type: corridor.type, meters, points }
    const backward = { ...forward, points: [...points].reverse() }

    link(corridor.from, corridor.to, forward)
    link(corridor.to, corridor.from, backward)
  }

  return graph
})()

/* ------------------------------------------------------------
   3. Dijkstra 最短路
   ------------------------------------------------------------ */

/** 一条边的"体感成本"：室内就是米数，室外要乘系数 */
function edgeCost(edge, outdoorWeight) {
  return edge.type === 'indoor' ? edge.meters : edge.meters * outdoorWeight
}

function fail(reason) {
  return { ok: false, reason }
}

/**
 * 规划一条路线
 * @param {string} startId 起点建筑 id
 * @param {string} endId   终点建筑 id
 * @param {string} preferenceId 'warm' | 'balanced' | 'shortest'
 */
export function planRoute(startId, endId, preferenceId = 'warm') {
  if (!startId || !endId) return fail('请先选择起点和终点')
  if (startId === endId) return fail('起点和终点是同一栋建筑，换一个试试')
  if (!NODE_POINT.has(startId) || !NODE_POINT.has(endId)) {
    return fail('找不到所选建筑，请重新选择')
  }

  const preference = PREFERENCES[preferenceId] ?? PREFERENCES.warm

  // distance: 从起点到每个节点的最小成本
  // previous: 记录"我是从哪个节点、走哪条边过来的"，用于最后倒推路线
  const distance = new Map()
  const previous = new Map()
  const visited = new Set()

  for (const id of NODE_POINT.keys()) distance.set(id, Infinity)
  distance.set(startId, 0)

  while (visited.size < NODE_POINT.size) {
    // 在未访问节点里找当前成本最小的那个（节点只有十几个，直接线性扫描就够快）
    let current = null
    let best = Infinity
    for (const [id, value] of distance) {
      if (visited.has(id)) continue
      if (value < best) {
        best = value
        current = id
      }
    }

    if (current === null) break
    if (current === endId) break // 终点已确定，可以提前收工

    visited.add(current)

    const neighbors = GRAPH.get(current)
    if (!neighbors) continue

    for (const [nextId, edge] of neighbors) {
      if (visited.has(nextId)) continue
      const candidate = best + edgeCost(edge, preference.outdoorWeight)
      if (candidate < distance.get(nextId)) {
        distance.set(nextId, candidate)
        previous.set(nextId, { from: current, edge })
      }
    }
  }

  if (!Number.isFinite(distance.get(endId))) {
    return fail('当前暖廊网络没有连通这两栋建筑')
  }

  /* ---- 倒推路线：从终点一路回到起点 ---- */
  const rawSteps = []
  let node = endId
  let guard = 0
  while (node !== startId) {
    const record = previous.get(node)
    if (!record) return fail('路线重建失败，请换一组起终点')
    rawSteps.unshift({ fromId: record.from, toId: node, ...record.edge })
    node = record.from
    guard += 1
    if (guard > 100) return fail('路线重建失败，请换一组起终点')
  }

  const steps = rawSteps.map((step) => ({
    ...step,
    fromName: NODE_NAME.get(step.fromId),
    toName: NODE_NAME.get(step.toId)
  }))

  /* ---- 统计总距离、室内外里程、预计时间 ---- */
  const indoorMeters = steps
    .filter((s) => s.type === 'indoor')
    .reduce((sum, s) => sum + s.meters, 0)
  const outdoorMeters = steps
    .filter((s) => s.type === 'outdoor')
    .reduce((sum, s) => sum + s.meters, 0)
  const meters = indoorMeters + outdoorMeters

  // 把各段折线首尾相接，得到一条完整路径（地图上画线用）
  const path = steps.length
    ? steps[0].points.concat(...steps.slice(1).map((s) => s.points.slice(1)))
    : [NODE_POINT.get(startId)]

  // 途经的建筑（去掉暖廊枢纽，只保留真实建筑）
  const buildingIds = []
  for (const step of steps) {
    for (const id of [step.fromId, step.toId]) {
      if (BUILDINGS.some((b) => b.id === id) && !buildingIds.includes(id)) buildingIds.push(id)
    }
  }

  return {
    ok: true,
    startId,
    endId,
    startName: NODE_NAME.get(startId),
    endName: NODE_NAME.get(endId),
    preference,
    steps,
    path,
    buildingIds,
    totals: {
      meters,
      indoorMeters,
      outdoorMeters,
      minutes: Math.max(1, Math.round(meters / WALK_SPEED_M_PER_MIN)),
      indoorRatio: meters > 0 ? indoorMeters / meters : 0,
      indoorSteps: steps.filter((s) => s.type === 'indoor').length,
      outdoorSteps: steps.filter((s) => s.type === 'outdoor').length,
      // 加权后的"体感成本"，可用于对比不同偏好
      weightedCost: Math.round(
        indoorMeters + outdoorMeters * preference.outdoorWeight
      )
    }
  }
}
