<script setup>
/**
 * App.vue = 整个页面的"总指挥"
 * 它负责：
 *   1. 保存页面状态（起点、终点、偏好、选中的建筑）
 *   2. 调用 routePlanner 算出路线
 *   3. 把数据和事件分发给各个子组件
 */
import { computed, ref } from 'vue'
import { BUILDING_MAP } from './data/buildings.js'
import { DISCLAIMER } from './data/realCampus/rules.js'
import { planRoute } from './utils/routePlanner.js'
import CampusMap from './components/CampusMap.vue'
import RouteForm from './components/RouteForm.vue'
import BuildingSearch from './components/BuildingSearch.vue'
import BuildingInfo from './components/BuildingInfo.vue'
import RouteDetail from './components/RouteDetail.vue'
import RealCampusView from './components/RealCampusView.vue'

/* ---------- 状态 ---------- */
const mode = ref('demo') // 'demo' 模拟校园 ｜ 'real' 真实校园
const startId = ref('tla') // 默认示例：教学楼A
const endId = ref('dorm3') // 默认示例：宿舍3号楼
const preference = ref('warm') // 默认"暖廊优先"
const selectedId = ref('') // 当前查看详情的建筑
const picking = ref('') // '' | 'start' | 'end'：是否正在地图上点选

/* ---------- 派生数据 ---------- */
// 只要起点/终点/偏好变了，route 会自动重新计算（这就是 computed 的好处）
const route = computed(() => planRoute(startId.value, endId.value, preference.value))
const selectedBuilding = computed(() => BUILDING_MAP.get(selectedId.value) ?? null)

/* ---------- 交互 ---------- */

/** 地图上点了某栋楼 */
function handlePick(id) {
  if (picking.value === 'start') {
    startId.value = id
    picking.value = ''
  } else if (picking.value === 'end') {
    endId.value = id
    picking.value = ''
  }
  selectedId.value = id
}

/** 开启 / 关闭"地图点选"模式 */
function togglePick(target) {
  picking.value = picking.value === target ? '' : target
}

function setStart(id) {
  startId.value = id
  selectedId.value = id
}

function setEnd(id) {
  endId.value = id
  selectedId.value = id
}

/** 交换起点和终点 */
function swapEnds() {
  const temp = startId.value
  startId.value = endId.value
  endId.value = temp
}
</script>

<template>
  <div class="app">
    <!-- 顶部标题栏 -->
    <header class="topbar">
      <div class="brand">
        <span class="brand-mark">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 20V8.6L12 4l8 4.6V20" />
            <path d="M9 20v-5.4h6V20" />
          </svg>
        </span>
        <div class="brand-text">
          <h1>校园暖廊通 <span>CampusLink</span></h1>
          <p>冬季校园室内暖廊智能导航</p>
        </div>
      </div>

      <div class="topbar-right">
        <!-- 模拟 / 真实 模式切换 -->
        <div class="mode-switch" role="tablist" aria-label="校园模式">
          <button
            :class="{ on: mode === 'demo' }"
            role="tab"
            :aria-selected="mode === 'demo'"
            @click="mode = 'demo'"
          >
            模拟校园
          </button>
          <button
            :class="{ on: mode === 'real' }"
            role="tab"
            :aria-selected="mode === 'real'"
            @click="mode = 'real'"
          >
            真实校园
          </button>
        </div>

        <div class="badges">
          <span v-if="mode === 'demo'" class="badge badge-warn">模拟数据 · 非真实校园</span>
          <span v-else class="badge badge-warn">真实拓扑 · 非地理比例</span>
          <span class="badge">本地算法 · 无需付费 API</span>
        </div>
      </div>
    </header>

    <!-- 课程演示免责声明：真实校园暖廊数据基于建模假设，文案见 realCampus/rules.js -->
    <p class="notice" role="note">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8.2v.02M12 11.4v5" />
      </svg>
      <span>{{ DISCLAIMER }}</span>
    </p>

    <!-- 主体：左（规划/搜索/信息） 中（地图） 右（路线详情） -->
    <main v-if="mode === 'demo'" class="layout">
      <div class="col col-left">
        <RouteForm
          :start-id="startId"
          :end-id="endId"
          :preference="preference"
          :picking="picking"
          @change-start="startId = $event"
          @change-end="endId = $event"
          @change-preference="preference = $event"
          @toggle-pick="togglePick"
          @swap="swapEnds"
        />

        <BuildingSearch @select="selectedId = $event" />

        <BuildingInfo
          :building="selectedBuilding"
          @set-start="setStart"
          @set-end="setEnd"
        />
      </div>

      <div class="stage">
        <CampusMap
          :start-id="startId"
          :end-id="endId"
          :selected-id="selectedId"
          :picking="picking"
          :route="route"
          @pick="handlePick"
          @clear="selectedId = ''"
          @cancel-pick="picking = ''"
        />
      </div>

      <div class="col col-right">
        <RouteDetail :route="route" />
      </div>
    </main>

    <!-- 真实校园模式：只做拓扑展示，不做路径规划（距离全为 null） -->
    <RealCampusView v-else />
  </div>
</template>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

/* ---------- 顶栏 ---------- */
.topbar {
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 11px 22px;
  background: rgba(255, 255, 255, 0.78);
  border-bottom: 1px solid var(--line);
  backdrop-filter: blur(14px);
}

.brand {
  display: flex;
  align-items: center;
  gap: 11px;
}

.brand-mark {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #2563eb, #0ea5e9);
  border-radius: 12px;
  box-shadow: 0 8px 18px rgba(37, 99, 235, 0.3);
}

.brand-mark svg {
  width: 22px;
  height: 22px;
  fill: none;
  stroke: #fff;
  stroke-width: 1.9;
  stroke-linejoin: round;
}

.brand-text h1 {
  display: flex;
  align-items: baseline;
  gap: 7px;
  font-size: 18px;
  font-weight: 800;
  letter-spacing: 0.01em;
}

.brand-text h1 span {
  font-size: 11.5px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: #2f6fd0;
}

.brand-text p {
  margin-top: 2px;
  font-size: 11.5px;
  color: var(--muted);
}

.badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

/* ---------- 模式切换 ---------- */
.topbar-right {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.mode-switch {
  display: flex;
  gap: 3px;
  padding: 3px;
  background: #eef4ff;
  border: 1px solid #dbe7f8;
  border-radius: 999px;
}

.mode-switch button {
  padding: 5px 14px;
  font-size: 12px;
  font-weight: 600;
  color: #4a6b96;
  border-radius: 999px;
  transition: 0.18s;
}

.mode-switch button:hover {
  color: var(--blue-700);
}

.mode-switch button.on {
  color: #fff;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  box-shadow: 0 4px 10px rgba(37, 99, 235, 0.28);
}

.badge {
  padding: 5px 11px;
  font-size: 11.5px;
  font-weight: 600;
  color: #3f5a7d;
  background: #f2f7ff;
  border: 1px solid #dbe7f8;
  border-radius: 999px;
}

.badge-warn {
  color: #7c5a12;
  background: #fff8e7;
  border-color: #f0dcab;
}

/* ---------- 免责声明提示条 ---------- */
.notice {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 8px;
  padding: 7px 22px;
  font-size: 12px;
  line-height: 1.5;
  color: #7c5a12;
  background: linear-gradient(90deg, #fff8e7, #fffdf7);
  border-bottom: 1px solid #f0dcab;
}

.notice svg {
  flex: 0 0 auto;
  width: 14px;
  height: 14px;
  fill: none;
  stroke: #d9a13a;
  stroke-width: 2;
  stroke-linecap: round;
}

/* ---------- 三栏布局 ---------- */
.layout {
  display: grid;
  flex: 1;
  grid-template-columns: 350px minmax(0, 1fr) 366px;
  gap: 14px;
  min-height: 0;
  padding: 14px 18px 18px;
}

.col {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 0;
  padding-right: 3px;
  overflow-y: auto;
}

.col > .card {
  flex: 0 0 auto;
}

/* 右栏的路线详情卡片撑满整列，内部步骤列表自己滚动 */
.col-right > .card {
  flex: 1 1 auto;
  min-height: 0;
}

.stage {
  display: flex;
  min-height: 0;
}

@media (max-width: 1320px) {
  .layout {
    grid-template-columns: 320px minmax(0, 1fr) 336px;
  }
}

@media (max-width: 1120px) {
  .app {
    height: auto;
    overflow: visible;
  }

  .layout {
    grid-template-columns: 1fr;
    padding: 12px;
  }

  .col {
    overflow: visible;
  }

  .stage {
    order: -1;
    min-height: 58vh;
  }
}

@media (max-width: 640px) {
  .topbar {
    flex-direction: column;
    align-items: flex-start;
    padding: 11px 14px;
  }

  .notice {
    padding: 7px 14px;
  }

  .topbar-right {
    width: 100%;
    justify-content: space-between;
  }

  .brand-text h1 {
    font-size: 16px;
  }
}
</style>
