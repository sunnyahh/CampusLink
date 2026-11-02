/**
 * ============================================================
 *  真实校园 · 基础连通路径（BFS 广度优先搜索）
 * ------------------------------------------------------------
 *  和模拟校园的 routePlanner.js 是两套独立的东西：
 *   - 模拟校园：加权 Dijkstra（有距离，能比"最短"）
 *   - 真实校园：无权 BFS（距离全是 null，只能比"段数最少"）
 *
 *  ⚠️ 三条约束
 *  1. 图里的节点是「楼层节点」，不是建筑；
 *  2. 一条暖廊只连它官方原文写的两个端点，不拆、不插中间换乘点；
 *  3. 不做任何"楼内默认连通"的推断 —— 没录入的通道就是不存在。
 * ============================================================
 */

/**
 * 用已确认的节点和暖廊构建邻接表
 * @param {Array} nodes 楼层节点
 * @param {Array} corridors 已确认暖廊（每条只连 from_node 与 to_node）
 * @returns {Map<string, Array<{to: string, corridor: object}>>}
 */
export function buildNodeGraph(nodes, corridors) {
  const graph = new Map()
  for (const node of nodes) graph.set(node.node_id, [])

  for (const corridor of corridors) {
    const fromEdges = graph.get(corridor.from_node_id)
    const toEdges = graph.get(corridor.to_node_id)
    // 端点不存在就跳过（数据校验会在别处报错，这里只做防御）
    if (!fromEdges || !toEdges) continue
    fromEdges.push({ to: corridor.to_node_id, corridor })
    toEdges.push({ to: corridor.from_node_id, corridor })
  }

  return graph
}

/**
 * BFS：找「经过暖廊段数最少」的路径
 * 注意：段数最少 ≠ 距离最短。真实距离全部未知，所以这里只能比段数。
 *
 * @param {Map} graph buildNodeGraph 的结果
 * @param {string} startId 起点节点
 * @param {string} endId 终点节点
 */
export function findPath(graph, startId, endId) {
  if (!graph.has(startId) || !graph.has(endId)) {
    return { ok: false, reason: 'unknown_node' }
  }
  if (startId === endId) {
    return { ok: false, reason: 'same_node' }
  }

  const queue = [startId]
  const visited = new Set([startId])
  const previous = new Map() // nodeId -> { from, corridor }

  while (queue.length > 0) {
    const current = queue.shift()
    if (current === endId) break

    for (const edge of graph.get(current) ?? []) {
      if (visited.has(edge.to)) continue
      visited.add(edge.to)
      previous.set(edge.to, { from: current, corridor: edge.corridor })
      queue.push(edge.to)
    }
  }

  if (!visited.has(endId)) {
    return { ok: false, reason: 'unreachable' }
  }

  // 从终点往回倒推
  const nodeIds = [endId]
  const corridorsUsed = []
  let cursor = endId

  while (cursor !== startId) {
    const record = previous.get(cursor)
    if (!record) return { ok: false, reason: 'unreachable' }
    corridorsUsed.unshift(record.corridor)
    nodeIds.unshift(record.from)
    cursor = record.from
  }

  return {
    ok: true,
    nodeIds,
    corridors: corridorsUsed,
    segments: corridorsUsed.length
  }
}

/**
 * 统计节点级连通组（用于说明"网络有多碎"）
 * @returns {{groups: string[][], isolated: string[]}}
 */
export function nodeComponents(graph) {
  const groups = []
  const isolated = []
  const seen = new Set()

  for (const start of graph.keys()) {
    if (seen.has(start)) continue
    const group = []
    const stack = [start]

    while (stack.length > 0) {
      const id = stack.pop()
      if (seen.has(id)) continue
      seen.add(id)
      group.push(id)
      for (const edge of graph.get(id) ?? []) {
        if (!seen.has(edge.to)) stack.push(edge.to)
      }
    }

    if (group.length === 1) isolated.push(group[0])
    else groups.push(group)
  }

  return { groups, isolated }
}

/* ============================================================
   楼间路由：学生只选「建筑」，不用管楼层
   ------------------------------------------------------------
   做法：在楼层节点图上多连一类"楼内换乘边"。
     - 官方暖廊边：cost = 1（走一段暖廊）
     - 同建筑节点之间：cost = 0（课程建模假设，不增加暖廊段数）

   ⚠️ 这条假设只在"同一栋建筑已经录入的节点之间"生效，
      不会凭空生成任何跨楼连接。跨楼的每一段都必须有官方暖廊。
   ============================================================ */

/**
 * 构建楼间路由图（官方暖廊 + 楼内换乘假设）
 * @param {Array} nodes 楼层节点
 * @param {Array} corridors 已确认暖廊
 */
export function buildRoutingGraph(nodes, corridors) {
  const graph = new Map()
  for (const node of nodes) graph.set(node.node_id, [])

  // 1. 官方暖廊：两端之间 cost = 1
  for (const corridor of corridors) {
    const fromEdges = graph.get(corridor.from_node_id)
    const toEdges = graph.get(corridor.to_node_id)
    if (!fromEdges || !toEdges) continue
    fromEdges.push({ to: corridor.to_node_id, cost: 1, kind: 'corridor', corridor })
    toEdges.push({ to: corridor.from_node_id, cost: 1, kind: 'corridor', corridor })
  }

  // 2. 同建筑节点之间：cost = 0（建模假设）
  const nodesByBuilding = new Map()
  for (const node of nodes) {
    if (!nodesByBuilding.has(node.building_id)) nodesByBuilding.set(node.building_id, [])
    nodesByBuilding.get(node.building_id).push(node.node_id)
  }

  for (const ids of nodesByBuilding.values()) {
    for (const a of ids) {
      for (const b of ids) {
        if (a === b) continue
        graph.get(a).push({ to: b, cost: 0, kind: 'transfer', corridor: null })
      }
    }
  }

  return graph
}

/**
 * 楼间路由：0-1 BFS
 * 目标：经过的**官方暖廊段数**最少；楼内换乘不额外计段。
 *
 * @param {Map} graph buildRoutingGraph 的结果
 * @param {Array} nodes 楼层节点（用来把节点映射回建筑）
 * @param {string} startBuildingId 起点建筑
 * @param {string} endBuildingId 终点建筑
 */
export function findBuildingRoute(graph, nodes, startBuildingId, endBuildingId) {
  const buildingOf = new Map(nodes.map((n) => [n.node_id, n.building_id]))

  const startNodes = nodes
    .filter((n) => n.building_id === startBuildingId)
    .map((n) => n.node_id)
  const endNodes = nodes
    .filter((n) => n.building_id === endBuildingId)
    .map((n) => n.node_id)

  if (startNodes.length === 0 || endNodes.length === 0) {
    return { ok: false, reason: 'unknown_building' }
  }
  if (startBuildingId === endBuildingId) {
    return { ok: false, reason: 'same_building' }
  }

  // 0-1 BFS：cost 为 0 的边放队首，为 1 的放队尾
  const dist = new Map()
  const previous = new Map()
  const queue = []

  for (const id of startNodes) {
    dist.set(id, 0)
    queue.push(id)
  }

  while (queue.length > 0) {
    const current = queue.shift()
    const currentDist = dist.get(current) ?? 0

    for (const edge of graph.get(current) ?? []) {
      const nextDist = currentDist + edge.cost
      const known = dist.get(edge.to)
      if (known !== undefined && known <= nextDist) continue

      dist.set(edge.to, nextDist)
      previous.set(edge.to, { from: current, edge })

      if (edge.cost === 0) queue.unshift(edge.to)
      else queue.push(edge.to)
    }
  }

  // 在终点建筑的所有节点里挑成本最低的那个
  let target = null
  let targetCost = Infinity
  for (const id of [...endNodes].sort()) {
    const cost = dist.get(id)
    if (cost !== undefined && cost < targetCost) {
      targetCost = cost
      target = id
    }
  }

  if (target === null) {
    return { ok: false, reason: 'unreachable' }
  }

  // 倒推路径
  const sourceSet = new Set(startNodes)
  const steps = []
  const nodeIds = [target]
  let cursor = target

  while (!sourceSet.has(cursor)) {
    const record = previous.get(cursor)
    if (!record) return { ok: false, reason: 'unreachable' }
    steps.unshift({
      kind: record.edge.kind,
      corridor: record.edge.corridor,
      fromNodeId: record.from,
      toNodeId: cursor
    })
    nodeIds.unshift(record.from)
    cursor = record.from
  }

  const corridors = steps.filter((s) => s.kind === 'corridor').map((s) => s.corridor)
  const transfers = steps.filter((s) => s.kind === 'transfer')

  // 把节点序列压成建筑序列（相邻同一栋只留一个）
  const buildingIds = []
  for (const id of nodeIds) {
    const building = buildingOf.get(id)
    if (buildingIds[buildingIds.length - 1] !== building) buildingIds.push(building)
  }

  return {
    ok: true,
    startBuildingId,
    endBuildingId,
    nodeIds,
    steps,
    corridors,
    segments: corridors.length,
    transferCount: transfers.length,
    buildingIds
  }
}

