<script setup>
/**
 * 真实校园模式
 * ------------------------------------------------------------
 * 数据全部来自 src/data/realCampus/dataset.js（加载时自动校验）。
 *
 * 学生用法：只选「起点建筑 / 终点建筑」，就能查暖廊路线。
 * 楼层不参与选择，只作为路线详情里的提示。
 *
 * 计算是 0-1 BFS：
 *   官方暖廊段 = 1，楼内换乘 = 0（课程建模假设）。
 * 不会凭空生成任何跨楼连接：跨楼每段都必须在 corridors.js 里。
 */
import { computed, ref } from 'vue'
import REAL_CAMPUS from '../data/realCampus/dataset.js'
import { buildRoutingGraph, findBuildingRoute } from '../utils/realRoutePlanner.js'
import RealTopology from './real/RealTopology.vue'
import RealCampusMap from './real/RealCampusMap.vue'
import RealRouteQuery from './real/RealRouteQuery.vue'
import RealInfoPanel from './real/RealInfoPanel.vue'
import CandidateList from './real/CandidateList.vue'

const data = REAL_CAMPUS
const selection = ref(null)
const mapView = ref('map') // 'map' 示意地图 ｜ 'topology' 拓扑结构图

/* ---------- 起终点（建筑级） ---------- */
const startBuildingId = ref('YQ1-B007') // A03公寓
const endBuildingId = ref('YQ1-B006') // 学士楼

/* ---------- 路由 ---------- */
const routingGraph = buildRoutingGraph(data.nodes, data.corridors)
const route = computed(() =>
  findBuildingRoute(routingGraph, data.nodes, startBuildingId.value, endBuildingId.value)
)

const routeCorridorIds = computed(() =>
  route.value.ok ? route.value.corridors.map((c) => c.corridor_id) : []
)
const routeNodeIds = computed(() => (route.value.ok ? route.value.nodeIds : []))
const routeBuildingIds = computed(() => (route.value.ok ? route.value.buildingIds : []))

/** 建筑级连通情况：只看有暖廊节点的建筑，避免把"没录入"说成"孤立" */
const connectivity = computed(() => {
  const nodeBuilding = new Map(data.nodes.map((n) => [n.node_id, n.building_id]))
  const withNodes = [...new Set(data.nodes.map((n) => n.building_id))]
  const adjacency = new Map(withNodes.map((id) => [id, new Set()]))

  for (const corridor of data.corridors) {
    const a = nodeBuilding.get(corridor.from_node_id)
    const b = nodeBuilding.get(corridor.to_node_id)
    if (!a || !b || a === b) continue
    adjacency.get(a)?.add(b)
    adjacency.get(b)?.add(a)
  }

  const seen = new Set()
  let groupCount = 0
  let groupedBuildings = 0
  const isolated = []

  for (const id of withNodes) {
    if (seen.has(id)) continue
    const stack = [id]
    const members = []
    while (stack.length > 0) {
      const current = stack.pop()
      if (seen.has(current)) continue
      seen.add(current)
      members.push(current)
      for (const next of adjacency.get(current) ?? []) {
        if (!seen.has(next)) stack.push(next)
      }
    }
    if (members.length === 1) isolated.push(members[0])
    else {
      groupCount += 1
      groupedBuildings += members.length
    }
  }

  return {
    groupCount,
    groupedBuildings,
    isolated,
    withNodes: withNodes.length,
    withoutNodes: data.buildings.length - withNodes.length
  }
})

const isolatedNames = computed(() =>
  connectivity.value.isolated
    .map((id) => data.buildings.find((b) => b.building_id === id)?.official_name ?? id)
    .join('、')
)

function swapEnds() {
  const temp = startBuildingId.value
  startBuildingId.value = endBuildingId.value
  endBuildingId.value = temp
}
</script>

<template>
  <div class="real-view">
    <!-- 左：拓扑示意 -->
    <section class="stage">
      <div class="topo-card card">
        <div class="topo-head">
          <div>
            <h2>真实校园 · 暖廊拓扑</h2>
            <p class="topo-sub">数据版本 {{ data.version }} · {{ data.campus.officialName }}</p>
          </div>
          <div class="stats">
            <span><b>{{ data.stats.buildings }}</b> 栋建筑</span>
            <span><b>{{ data.stats.nodes }}</b> 个楼层节点</span>
            <span><b>{{ data.stats.corridors }}</b> 条暖廊</span>
            <span><b>{{ data.stats.candidates }}</b> 条候选</span>
          </div>
        </div>

        <!-- 视图切换 + 固定标注 -->
        <div class="map-toolbar">
          <div class="view-switch">
            <button :class="{ on: mapView === 'map' }" @click="mapView = 'map'">示意地图</button>
            <button :class="{ on: mapView === 'topology' }" @click="mapView = 'topology'">
              拓扑结构
            </button>
          </div>
          <p class="watermark">
            <template v-if="mapView === 'map'">
              人工标定 · 课程演示 · 非测绘精度；暖廊走向为示意，通行状态基于课程项目假设
            </template>
            <template v-else>
              真实建筑与暖廊拓扑示意，非地理比例地图；通行状态基于课程项目假设
            </template>
          </p>
        </div>

        <RealCampusMap
          v-if="mapView === 'map'"
          :buildings="data.buildings"
          :nodes="data.nodes"
          :corridors="data.corridors"
          :selection="selection"
          :route-corridor-ids="routeCorridorIds"
          :route-node-ids="routeNodeIds"
          :route-building-ids="routeBuildingIds"
          :start-building-id="startBuildingId"
          :end-building-id="endBuildingId"
          :route-active="route.ok"
          @select="selection = $event"
        />

        <RealTopology
          v-else
          :buildings="data.buildings"
          :nodes="data.nodes"
          :corridors="data.corridors"
          :selection="selection"
          :route-corridor-ids="routeCorridorIds"
          :route-node-ids="routeNodeIds"
          :route-building-ids="routeBuildingIds"
          :start-building-id="startBuildingId"
          :end-building-id="endBuildingId"
          :route-active="route.ok"
          @select="selection = $event"
        />

        <p class="footnote">
          <template v-if="mapView === 'topology'">
            <b>拓扑图只绘制已录入暖廊节点的建筑</b>（其余建筑没有暖廊数据，不参与路由）。
          </template>
          图中方框位置只为看清连接关系，<b>不代表真实地理方位</b>；未使用官方 GIS 底图。
          有暖廊节点的 <b>{{ connectivity.withNodes }}</b> 栋里，
          <b>{{ connectivity.groupedBuildings }}</b> 栋分成
          <b>{{ connectivity.groupCount }}</b> 个可互通组团<template v-if="isolatedNames">，
          <b>{{ isolatedNames }}</b> 暂无任何已确认连接</template>；
          另外 <b>{{ connectivity.withoutNodes }}</b> 栋尚未录入暖廊，只作位置参照。
        </p>
      </div>
    </section>

    <!-- 右：路线查询 + 详情 + 候选 -->
    <aside class="side">
      <RealRouteQuery
        :buildings="data.buildings"
        :nodes="data.nodes"
        :start-building-id="startBuildingId"
        :end-building-id="endBuildingId"
        :route="route"
        @change-start="startBuildingId = $event"
        @change-end="endBuildingId = $event"
        @swap="swapEnds"
      />

      <RealInfoPanel
        :selection="selection"
        :buildings="data.buildings"
        :nodes="data.nodes"
        :corridors="data.corridors"
        @select="selection = $event"
      />

      <CandidateList :candidates="data.candidates" />
    </aside>
  </div>
</template>

<style scoped>
.real-view {
  display: grid;
  flex: 1;
  grid-template-columns: minmax(0, 1fr) 384px;
  gap: 14px;
  min-height: 0;
  padding: 14px 18px 18px;
}

.stage {
  display: flex;
  min-height: 0;
}

.topo-card {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  padding-bottom: 0;
}

.topo-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.topo-head h2 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 700;
}

.topo-head h2::before {
  content: '';
  width: 4px;
  height: 14px;
  border-radius: 2px;
  background: linear-gradient(180deg, var(--blue-600), var(--cyan));
}

.topo-sub {
  margin-top: 3px;
  font-size: 11px;
  color: var(--muted);
}

.stats {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.stats span {
  padding: 3px 9px;
  font-size: 11px;
  color: #4a6b96;
  background: #f2f7ff;
  border: 1px solid #e2ecfa;
  border-radius: 999px;
  white-space: nowrap;
}

.stats b {
  color: var(--blue-700);
}

.map-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}

.view-switch {
  display: flex;
  flex: 0 0 auto;
  gap: 3px;
  padding: 3px;
  background: #eef4ff;
  border: 1px solid #dbe7f8;
  border-radius: 999px;
}

.view-switch button {
  padding: 4px 12px;
  font-size: 11.5px;
  font-weight: 600;
  color: #4a6b96;
  border-radius: 999px;
  transition: 0.18s;
  white-space: nowrap;
}

.view-switch button:hover {
  color: var(--blue-700);
}

.view-switch button.on {
  color: #fff;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  box-shadow: 0 4px 10px rgba(37, 99, 235, 0.26);
}

.watermark {
  flex: 1;
  margin: 0;
  padding: 5px 10px;
  font-size: 11px;
  font-weight: 600;
  line-height: 1.5;
  color: #7c5a12;
  text-align: center;
  background: #fff9ea;
  border: 1px dashed #f0dcab;
  border-radius: 8px;
}

.footnote {
  padding: 9px 14px 11px;
  font-size: 11px;
  line-height: 1.65;
  color: #7b8ca6;
  border-top: 1px dashed #e2ecfa;
}

.side {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
  padding-right: 3px;
  overflow-y: auto;
}

@media (max-width: 1120px) {
  .real-view {
    grid-template-columns: 1fr;
    padding: 12px;
  }

  .side {
    overflow: visible;
  }
}
</style>
