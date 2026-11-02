<script setup>
/**
 * 真实校园 · 拓扑示意图
 * ------------------------------------------------------------
 * ⚠️ 这是一张「拓扑示意」，不是地图：
 *    - 建筑方框的位置只为看清楚连接关系，不代表真实地理位置；
 *    - 没有使用官方 GIS 底图，也没有按经纬度/距离排布。
 *
 * 画法：一栋建筑 = 一个方框；楼层节点 = 框里的小胶囊；
 * 暖廊 = 连接两个胶囊的线。X6 这种「同楼不同节点」的连接
 * 画成框内虚线弧，一眼就能看出它不是跨楼连接。
 *
 * 查询出基础连通路径后，路径上的暖廊会高亮，其余连线变淡。
 */
import { computed } from 'vue'

const props = defineProps({
  buildings: { type: Array, required: true },
  nodes: { type: Array, required: true },
  corridors: { type: Array, required: true },
  selection: { type: Object, default: null },
  routeCorridorIds: { type: Array, default: () => [] },
  routeNodeIds: { type: Array, default: () => [] },
  routeBuildingIds: { type: Array, default: () => [] },
  startBuildingId: { type: String, default: '' },
  endBuildingId: { type: String, default: '' },
  routeActive: { type: Boolean, default: false }
})

const emit = defineEmits(['select'])

/* ---------- 尺寸常量 ---------- */
const BOX = { w: 140, h: 96, rx: 14 }
const CHIP = { w: 106, h: 22, step: 28, firstOffset: 3 }

/** 示意布局：只为了不让连线交叉，没有任何地理含义 */
const LAYOUT = {
  'YQ1-B001': { x: 140, y: 205 }, // 明德楼
  'YQ1-B002': { x: 140, y: 360 }, // 理学楼
  'YQ1-B003': { x: 350, y: 205 }, // 格物楼
  'YQ1-B004': { x: 350, y: 360 }, // 建筑设计学院
  'YQ1-B005': { x: 590, y: 205 }, // 诚意楼
  'YQ1-B006': { x: 790, y: 205 }, // 学士楼
  'YQ1-B007': { x: 590, y: 360 }, // A03公寓
  'YQ1-B008': { x: 980, y: 205 }, // A10公寓
  'YQ1-B009': { x: 980, y: 360 } // 正心楼
}

/** 楼层排序：2层 < 2.5层 < M层 */
function floorValue(node) {
  const match = String(node.floor ?? '').match(/^(\d+(\.\d+)?)层$/)
  return match ? Number(match[1]) : 999
}

const nodeById = computed(() => new Map(props.nodes.map((n) => [n.node_id, n])))

/**
 * 拓扑图只画「有暖廊节点」的建筑。
 * 没有节点的建筑（图书馆、体育馆等）不参与路由，画进来只会变成空框，
 * 而且会落到自动网格里被画布裁掉。
 */
const routingBuildings = computed(() => {
  const withNodes = new Set(props.nodes.map((n) => n.building_id))
  return props.buildings.filter((b) => withNodes.has(b.building_id))
})

const layout = computed(() => {
  const map = new Map()
  routingBuildings.value.forEach((building, index) => {
    const pos =
      LAYOUT[building.building_id] ?? {
        x: 140 + (index % 4) * 220,
        y: 205 + Math.floor(index / 4) * 160
      }

    const nodes = props.nodes
      .filter((n) => n.building_id === building.building_id)
      .sort((a, b) => floorValue(a) - floorValue(b))

    const nodePositions = new Map()
    nodes.forEach((node, i) => {
      nodePositions.set(node.node_id, {
        x: pos.x,
        y: pos.y + CHIP.firstOffset + i * CHIP.step,
        buildingId: building.building_id
      })
    })

    map.set(building.building_id, { ...pos, building, nodes, nodePositions })
  })
  return map
})

function positionOf(nodeId) {
  const node = nodeById.value.get(nodeId)
  if (!node) return null
  return layout.value.get(node.building_id)?.nodePositions.get(nodeId) ?? null
}

/* ---------- 路径生成 ---------- */
function isInsideSameBuilding(a, b) {
  return a && b && a.buildingId === b.buildingId
}

/** 楼内连接：向右鼓出一条弧线 */
function arcPath(a, b) {
  const bulge = 86
  return `M ${a.x} ${a.y} C ${a.x + bulge} ${a.y}, ${a.x + bulge} ${b.y}, ${b.x} ${b.y}`
}

/** 跨楼连接：走两框之间空隙的折线 */
function polyPath(points) {
  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1]
    const b = points[i]
    const midX = (a.x + b.x) / 2
    d += ` L ${midX} ${a.y} L ${midX} ${b.y} L ${b.x} ${b.y}`
  }
  return d
}

const edges = computed(() =>
  props.corridors
    .map((corridor) => {
      const chainIds = corridor.chain_node_ids.length
        ? corridor.chain_node_ids
        : [corridor.from_node_id, corridor.to_node_id]
      const points = chainIds.map(positionOf).filter(Boolean)
      if (points.length < 2) return null

      const internal = isInsideSameBuilding(points[0], points[1])
      const d = internal ? arcPath(points[0], points[1]) : polyPath(points)

      const labelPos = internal
        ? { x: points[0].x + 86, y: (points[0].y + points[1].y) / 2 }
        : { x: (points[0].x + points[1].x) / 2, y: (points[0].y + points[1].y) / 2 }

      return {
        id: corridor.corridor_id,
        officialNo: corridor.official_no,
        d,
        internal,
        labelPos,
        onRoute: props.routeCorridorIds.includes(corridor.corridor_id)
      }
    })
    .filter(Boolean)
)

/* ---------- 选中 / 高亮判断 ---------- */
function isSelected(type, id) {
  return props.selection?.type === type && props.selection?.id === id
}

function edgeClass(edge) {
  return {
    'is-selected': isSelected('corridor', edge.id),
    'is-route': edge.onRoute,
    'is-dim': props.routeActive && !edge.onRoute
  }
}

function chipClass(nodeId) {
  return {
    'is-selected': isSelected('node', nodeId),
    'is-route-node': props.routeNodeIds.includes(nodeId)
  }
}

function buildingClass(buildingId) {
  return {
    'is-selected': isSelected('building', buildingId),
    'is-route-building': props.routeBuildingIds.includes(buildingId),
    'is-start-building': buildingId === props.startBuildingId,
    'is-end-building': buildingId === props.endBuildingId
  }
}

function selectBuilding(id) {
  emit('select', { type: 'building', id })
}

function selectNode(id) {
  emit('select', { type: 'node', id })
}

function selectCorridor(id) {
  emit('select', { type: 'corridor', id })
}

function chipLabel(node, building) {
  const rest = node.display_name.replace(building.official_name, '').trim()
  return rest || node.floor || '—'
}
</script>

<template>
  <div class="topology">
    <svg
      class="topology-svg"
      viewBox="0 0 1100 470"
      role="img"
      aria-label="真实校园暖廊拓扑示意图"
      @click.self="emit('select', null)"
    >
      <!-- 跨楼暖廊（画在方框下面，看起来是从框边连出去） -->
      <g class="edges">
        <g
          v-for="edge in edges.filter((e) => !e.internal)"
          :key="edge.id"
          class="edge"
          :class="edgeClass(edge)"
          @click.stop="selectCorridor(edge.id)"
        >
          <path :d="edge.d" class="edge-hit" />
          <path :d="edge.d" class="edge-line" />
        </g>
      </g>

      <!-- 建筑方框 -->
      <g class="buildings">
        <g
          v-for="item in layout.values()"
          :key="item.building.building_id"
          class="building"
          :class="buildingClass(item.building.building_id)"
          @click.stop="selectBuilding(item.building.building_id)"
        >
          <rect
            :x="item.x - BOX.w / 2"
            :y="item.y - BOX.h / 2"
            :width="BOX.w"
            :height="BOX.h"
            :rx="BOX.rx"
            class="building-box"
          />
          <text :x="item.x" :y="item.y - 22" class="building-name">
            {{ item.building.official_name }}
          </text>

          <!-- 楼层节点胶囊 -->
          <g
            v-for="node in item.nodes"
            :key="node.node_id"
            class="chip"
            :class="chipClass(node.node_id)"
            @click.stop="selectNode(node.node_id)"
          >
            <rect
              :x="item.nodePositions.get(node.node_id).x - CHIP.w / 2"
              :y="item.nodePositions.get(node.node_id).y - CHIP.h / 2"
              :width="CHIP.w"
              :height="CHIP.h"
              rx="11"
              class="chip-box"
            />
            <text
              :x="item.nodePositions.get(node.node_id).x"
              :y="item.nodePositions.get(node.node_id).y"
              class="chip-text"
              dominant-baseline="central"
            >
              {{ chipLabel(node, item.building) }}
            </text>
          </g>

          <text v-if="item.nodes.length === 0" :x="item.x" :y="item.y + 8" class="no-node">
            暂无节点
          </text>
        </g>
      </g>

      <!-- 楼内暖廊（画在最上层，否则会被建筑框遮住） -->
      <g class="edges-internal">
        <g
          v-for="edge in edges.filter((e) => e.internal)"
          :key="edge.id"
          class="edge internal"
          :class="edgeClass(edge)"
          @click.stop="selectCorridor(edge.id)"
        >
          <path :d="edge.d" class="edge-hit" />
          <path :d="edge.d" class="edge-line" />
        </g>
      </g>

      <!-- 暖廊编号标签（最上层，保证可点） -->
      <g class="edge-labels">
        <g
          v-for="edge in edges"
          :key="`label-${edge.id}`"
          class="edge-label"
          :class="{ ...edgeClass(edge), internal: edge.internal }"
          @click.stop="selectCorridor(edge.id)"
        >
          <rect
            :x="edge.labelPos.x - 21"
            :y="edge.labelPos.y - 11"
            width="42"
            height="22"
            rx="11"
          />
          <text :x="edge.labelPos.x" :y="edge.labelPos.y" dominant-baseline="central">
            {{ edge.officialNo }}
          </text>
        </g>
      </g>
    </svg>

    <div class="topology-legend">
      <span><i class="lg-box"></i>建筑</span>
      <span><i class="lg-chip"></i>楼层节点</span>
      <span><i class="lg-line"></i>已确认暖廊</span>
      <span><i class="lg-dash"></i>楼内连接</span>
      <span><i class="lg-route"></i>当前路径</span>
      <span><i class="lg-start"></i>起点建筑</span>
      <span><i class="lg-end"></i>终点建筑</span>
    </div>
  </div>
</template>

<style scoped>
.topology {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

.topology-svg {
  flex: 1;
  width: 100%;
  min-height: 0;
}

/* ---------- 建筑 ---------- */
.building {
  cursor: pointer;
}

.building-box {
  fill: #fbfdff;
  stroke: #bfd4ee;
  stroke-width: 1.4;
  transition: stroke 0.16s, filter 0.16s;
}

.building:hover .building-box {
  stroke: #7fabdd;
  filter: drop-shadow(0 4px 10px rgba(37, 99, 235, 0.16));
}

.building.is-selected .building-box {
  stroke: #2563eb;
  stroke-width: 2.4;
  filter: drop-shadow(0 6px 14px rgba(37, 99, 235, 0.26));
}

.building.is-route-building .building-box {
  fill: #f4f9ff;
}

.building.is-start-building .building-box {
  stroke: #16a34a;
  stroke-width: 2.6;
  filter: drop-shadow(0 4px 10px rgba(22, 163, 74, 0.22));
}

.building.is-end-building .building-box {
  stroke: #dc2626;
  stroke-width: 2.6;
  filter: drop-shadow(0 4px 10px rgba(220, 38, 38, 0.22));
}

.building-name {
  fill: #1e3a5f;
  font-size: 14px;
  font-weight: 700;
  text-anchor: middle;
  user-select: none;
}

.no-node {
  fill: #b6c4d6;
  font-size: 11px;
  text-anchor: middle;
}

/* ---------- 节点胶囊 ---------- */
.chip {
  cursor: pointer;
}

.chip-box {
  fill: #eaf2ff;
  stroke: #bdd5f6;
  stroke-width: 1;
  transition: fill 0.16s, stroke 0.16s;
}

.chip:hover .chip-box {
  fill: #dbe9ff;
  stroke: #8fb8ee;
}

.chip.is-route-node .chip-box {
  fill: #dbeafe;
  stroke: #93b8ee;
}

.chip.is-selected .chip-box {
  fill: #1d4ed8;
  stroke: #1d4ed8;
  stroke-width: 2;
}

.chip-text {
  fill: #2f5b96;
  font-size: 11px;
  font-weight: 600;
  text-anchor: middle;
  user-select: none;
}

.chip.is-selected .chip-text {
  fill: #fff;
}

/* ---------- 暖廊连线 ---------- */
.edge {
  cursor: pointer;
  transition: opacity 0.18s;
}

.edge-hit {
  fill: none;
  stroke: transparent;
  stroke-width: 16;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.edge-line {
  fill: none;
  stroke: #4f8ff0;
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
  transition: stroke 0.16s, stroke-width 0.16s, opacity 0.18s;
}

.edge:hover .edge-line {
  stroke: #2563eb;
  stroke-width: 4;
}

.edge.is-dim {
  opacity: 0.18;
}

.edge.is-route .edge-line {
  stroke: #f97316;
  stroke-width: 5.5;
}

.edge.is-route .edge-hit {
  stroke-width: 18;
}

.edge.is-selected .edge-line {
  stroke: #12386f;
  stroke-width: 5;
}

.edge.is-route.is-selected .edge-line {
  stroke: #c2410c;
}

.edge.internal .edge-line {
  stroke: #a855f7;
  stroke-width: 2.6;
  stroke-dasharray: 7 5;
}

.edge.internal.is-route .edge-line {
  stroke: #f97316;
  stroke-width: 4;
  stroke-dasharray: 9 5;
}

.edge.internal.is-selected .edge-line {
  stroke: #6d28d9;
  stroke-width: 4;
}

/* ---------- 编号标签 ---------- */
.edge-label {
  cursor: pointer;
  transition: opacity 0.18s;
}

.edge-label rect {
  fill: #fff;
  stroke: #cfe0f6;
  stroke-width: 1;
}

.edge-label text {
  fill: #2f6fd0;
  font-size: 11.5px;
  font-weight: 700;
  text-anchor: middle;
  user-select: none;
}

.edge-label.internal rect {
  stroke: #dcc6f7;
}

.edge-label.internal text {
  fill: #7e3ff2;
}

.edge-label.is-dim {
  opacity: 0.25;
}

.edge-label.is-route rect {
  fill: #f97316;
  stroke: #ea580c;
}

.edge-label.is-route text {
  fill: #fff;
}

.edge-label.is-selected rect {
  fill: #12386f;
  stroke: #12386f;
}

.edge-label.is-selected text {
  fill: #fff;
}

/* ---------- 图例 ---------- */
.topology-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  padding: 8px 14px 10px;
  font-size: 11.5px;
  color: #4a6b96;
  border-top: 1px dashed #e2ecfa;
}

.topology-legend span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.topology-legend i {
  display: inline-block;
  width: 14px;
  height: 10px;
  border-radius: 3px;
}

.lg-box {
  background: #fbfdff;
  border: 1.4px solid #bfd4ee;
}

.lg-chip {
  height: 9px !important;
  background: #eaf2ff;
  border: 1px solid #bdd5f6;
  border-radius: 5px !important;
}

.lg-line {
  height: 0 !important;
  border-top: 3px solid #4f8ff0;
  border-radius: 0 !important;
}

.lg-dash {
  height: 0 !important;
  border-top: 2.5px dashed #a855f7;
  border-radius: 0 !important;
}

.lg-route {
  height: 0 !important;
  border-top: 3.5px solid #f97316;
  border-radius: 0 !important;
}

.lg-start {
  height: 10px !important;
  background: #dcfce7;
  border: 2px solid #16a34a;
}

.lg-end {
  height: 10px !important;
  background: #fee2e2;
  border: 2px solid #dc2626;
}

@media (max-width: 1120px) {
  .topology-svg {
    min-height: 380px;
  }
}
</style>
