<script setup>
/**
 * 真实校园 · 详情面板
 * 点建筑 / 楼层节点 / 暖廊，都在这里出详情。
 * 重点：距离一律显示「未实测」，不换算、不估算（真实模式不算路程）。
 */
import { computed } from 'vue'
import { VERIFY_STATUS, ACCESS_STATUS, CORRIDOR_TYPES } from '../../data/realCampus/rules.js'

const props = defineProps({
  selection: { type: Object, default: null },
  buildings: { type: Array, required: true },
  nodes: { type: Array, required: true },
  corridors: { type: Array, required: true }
})

const emit = defineEmits(['select'])

const detail = computed(() => {
  const selection = props.selection
  if (!selection) return null

  if (selection.type === 'building') {
    const building = props.buildings.find((b) => b.building_id === selection.id)
    if (!building) return null
    return {
      kind: 'building',
      title: building.official_name,
      subtitle: building.building_id,
      building,
      nodes: props.nodes.filter((n) => n.building_id === building.building_id),
      corridors: props.corridors.filter((c) => {
        const from = props.nodes.find((n) => n.node_id === c.from_node_id)
        const to = props.nodes.find((n) => n.node_id === c.to_node_id)
        return (
          from?.building_id === building.building_id || to?.building_id === building.building_id
        )
      })
    }
  }

  if (selection.type === 'node') {
    const node = props.nodes.find((n) => n.node_id === selection.id)
    if (!node) return null
    const building = props.buildings.find((b) => b.building_id === node.building_id)
    return {
      kind: 'node',
      title: node.display_name,
      subtitle: node.node_id,
      node,
      building,
      corridors: props.corridors.filter(
        (c) =>
          c.from_node_id === node.node_id ||
          c.to_node_id === node.node_id ||
          c.chain_node_ids.includes(node.node_id)
      )
    }
  }

  if (selection.type === 'corridor') {
    const corridor = props.corridors.find((c) => c.corridor_id === selection.id)
    if (!corridor) return null
    const from = props.nodes.find((n) => n.node_id === corridor.from_node_id)
    const to = props.nodes.find((n) => n.node_id === corridor.to_node_id)
    const chain = corridor.chain_node_ids
      .map((id) => props.nodes.find((n) => n.node_id === id))
      .filter(Boolean)
    return {
      kind: 'corridor',
      title: `${corridor.official_no} 号暖廊`,
      subtitle: corridor.corridor_id,
      corridor,
      from,
      to,
      chain
    }
  }

  return null
})

function verifyLabel(value) {
  return VERIFY_STATUS[value]?.label ?? value ?? '待核实'
}

function accessLabel(value) {
  return ACCESS_STATUS[value]?.label ?? value ?? '待核实'
}

function typeLabel(value) {
  return CORRIDOR_TYPES[value] ?? value
}

function nodeName(nodeId) {
  return props.nodes.find((n) => n.node_id === nodeId)?.display_name ?? nodeId
}
</script>

<template>
  <section class="panel card">
    <div class="card-title">
      <h2>详情</h2>
      <span v-if="detail" class="card-sub">{{ detail.subtitle }}</span>
    </div>

    <!-- 未选中 -->
    <div v-if="!detail" class="empty">
      <div class="empty-icon">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3.5" y="3.5" width="7" height="7" rx="2" />
          <rect x="13.5" y="3.5" width="7" height="7" rx="2" />
          <rect x="3.5" y="13.5" width="7" height="7" rx="2" />
          <path d="M17 13.5v7M13.5 17h7" />
        </svg>
      </div>
      <p class="empty-title">点击图中的元素查看详情</p>
      <p class="empty-text">
        可以点<b>建筑方框</b>、框里的<b>楼层节点胶囊</b>，或者连着它们的<b>暖廊编号</b>。
      </p>
    </div>

    <!-- 建筑 -->
    <template v-else-if="detail.kind === 'building'">
      <h3 class="detail-title">{{ detail.title }}</h3>
      <dl class="meta">
        <div><dt>建筑编号</dt><dd>{{ detail.building.building_id }}</dd></div>
        <div>
          <dt>官方分类</dt>
          <dd>{{ detail.building.category ?? '待核实（截图未显示分类）' }}</dd>
        </div>
        <div><dt>核实状态</dt><dd>{{ verifyLabel(detail.building.verify_status) }}</dd></div>
        <div><dt>数据来源</dt><dd class="source">{{ detail.building.source }}</dd></div>
      </dl>

      <p class="section-label">楼层节点（{{ detail.nodes.length }}）</p>
      <div class="pill-list">
        <button
          v-for="node in detail.nodes"
          :key="node.node_id"
          class="pill"
          @click="emit('select', { type: 'node', id: node.node_id })"
        >
          {{ node.display_name }}
        </button>
        <span v-if="detail.nodes.length === 0" class="muted">暂无节点</span>
      </div>

      <p class="section-label">相关暖廊（{{ detail.corridors.length }}）</p>
      <div class="pill-list">
        <button
          v-for="corridor in detail.corridors"
          :key="corridor.corridor_id"
          class="pill pill-corridor"
          @click="emit('select', { type: 'corridor', id: corridor.corridor_id })"
        >
          {{ corridor.official_no }}
        </button>
        <span v-if="detail.corridors.length === 0" class="muted">暂无</span>
      </div>

      <p v-if="detail.corridors.length === 0" class="no-route">
        该建筑尚未录入任何暖廊，因此只能查看信息，暂不能作为路线端点 —— 不会为它生成路线。
      </p>
    </template>

    <!-- 楼层节点 -->
    <template v-else-if="detail.kind === 'node'">
      <h3 class="detail-title">{{ detail.title }}</h3>
      <dl class="meta">
        <div><dt>节点编号</dt><dd>{{ detail.node.node_id }}</dd></div>
        <div><dt>所属建筑</dt><dd>{{ detail.building?.official_name ?? '—' }}</dd></div>
        <div><dt>楼层</dt><dd>{{ detail.node.floor ?? '待核实' }}</dd></div>
        <div><dt>方位</dt><dd>{{ detail.node.zone ?? '未标注' }}</dd></div>
        <div><dt>核实状态</dt><dd>{{ verifyLabel(detail.node.verify_status) }}</dd></div>
        <div><dt>数据来源</dt><dd class="source">{{ detail.node.source }}</dd></div>
      </dl>

      <p class="section-label">连接的暖廊（{{ detail.corridors.length }}）</p>
      <div class="pill-list">
        <button
          v-for="corridor in detail.corridors"
          :key="corridor.corridor_id"
          class="pill pill-corridor"
          @click="emit('select', { type: 'corridor', id: corridor.corridor_id })"
        >
          {{ corridor.official_no }}
        </button>
        <span v-if="detail.corridors.length === 0" class="muted">暂无</span>
      </div>
    </template>

    <!-- 暖廊 -->
    <template v-else-if="detail.kind === 'corridor'">
      <div class="corridor-head">
        <span class="corridor-no">{{ detail.corridor.official_no }}</span>
        <div>
          <h3 class="detail-title">{{ detail.title }}</h3>
          <p class="corridor-sub">数据编号 {{ detail.corridor.corridor_id }}</p>
        </div>
      </div>

      <p class="official">{{ detail.corridor.official_description }}</p>

      <div class="endpoints">
        <div class="endpoint">
          <span class="ep-tag start">起点</span>
          <span class="ep-name">{{ detail.from?.display_name ?? '—' }}</span>
        </div>
        <div class="endpoint">
          <span class="ep-tag end">终点</span>
          <span class="ep-name">{{ detail.to?.display_name ?? '—' }}</span>
        </div>
      </div>

      <p v-if="detail.corridor.chain_node_ids.length > 2" class="chain">
        串联经过：{{ detail.chain.map((n) => n.display_name).join(' → ') }}
        <br />
        <span class="chain-note">格物楼只按原文顺序记录，是否设出入口未核实，不能当换乘点。</span>
      </p>

      <dl class="meta">
        <div><dt>连接楼层</dt><dd>{{ detail.corridor.floors ?? '待核实' }}</dd></div>
        <div>
          <dt>距离</dt>
          <dd class="pending">未实测（null）—— 真实模式不计算距离</dd>
        </div>
        <div>
          <dt>通行状态</dt>
          <dd>
            <span class="chip" :class="detail.corridor.access_status === 'assumed_open' ? 'chip-indoor' : 'chip-outdoor'">
              {{ accessLabel(detail.corridor.access_status) }}
            </span>
          </dd>
        </div>
        <div>
          <dt>双向</dt>
          <dd>{{ detail.corridor.bidirectional ? '是' : '否' }}<span class="muted">（项目假设）</span></dd>
        </div>
        <div><dt>连廊类型</dt><dd>{{ typeLabel(detail.corridor.corridor_type) }}</dd></div>
        <div><dt>核实状态</dt><dd>{{ verifyLabel(detail.corridor.verify_status) }}</dd></div>
        <div><dt>数据来源</dt><dd class="source">{{ detail.corridor.source }}</dd></div>
      </dl>

      <p class="assume">{{ detail.corridor.bidirectional_note }}</p>

      <p v-if="detail.corridor.notes" class="notes">{{ detail.corridor.notes }}</p>
    </template>
  </section>
</template>

<style scoped>
.panel {
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  min-height: 0;
}

.detail-title {
  font-size: 16px;
  font-weight: 700;
  color: #12386f;
}

/* ---------- 空状态 ---------- */
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 26px 12px;
  text-align: center;
}

.empty-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  margin-bottom: 10px;
  background: #eef4ff;
  border-radius: 14px;
}

.empty-icon svg {
  width: 24px;
  height: 24px;
  fill: none;
  stroke: #7aa7e8;
  stroke-width: 1.6;
  stroke-linejoin: round;
}

.empty-title {
  font-size: 13px;
  font-weight: 700;
  color: #4a6b96;
}

.empty-text {
  max-width: 230px;
  margin-top: 5px;
  font-size: 11.5px;
  line-height: 1.65;
  color: #94a3b8;
}

/* ---------- 字段表 ---------- */
.meta {
  display: grid;
  gap: 7px;
  margin-top: 12px;
  padding: 11px 12px;
  background: #f7faff;
  border: 1px solid #e6eefb;
  border-radius: 10px;
}

.meta div {
  display: flex;
  gap: 10px;
  font-size: 12px;
  line-height: 1.55;
}

.meta dt {
  flex: 0 0 62px;
  color: #94a3b8;
}

.meta dd {
  flex: 1;
  min-width: 0;
  margin: 0;
  color: var(--ink-2);
}

.meta dd.source {
  font-size: 11px;
  line-height: 1.5;
  color: #6b7f99;
  word-break: break-all;
}

.meta dd.pending {
  color: #b45309;
  font-weight: 600;
}

.section-label {
  margin-top: 14px;
  font-size: 11.5px;
  font-weight: 700;
  color: #7c8ba4;
}

.pill-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 7px;
}

.pill {
  padding: 4px 10px;
  font-size: 11.5px;
  color: #2f5b96;
  background: #eef4ff;
  border: 1px solid #dbe8fa;
  border-radius: 999px;
  transition: 0.15s;
}

.pill:hover {
  color: #1d4ed8;
  background: #e2edff;
  border-color: #b9d3f6;
}

.pill-corridor {
  color: #7e3ff2;
  background: #f5f0ff;
  border-color: #e4d8fb;
}

.pill-corridor:hover {
  color: #6d28d9;
  background: #ece2ff;
  border-color: #cdb6f5;
}

.muted {
  font-size: 11.5px;
  color: #94a3b8;
}

/* ---------- 暖廊 ---------- */
.corridor-head {
  display: flex;
  align-items: center;
  gap: 11px;
}

.corridor-no {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  min-width: 46px;
  height: 42px;
  padding: 0 10px;
  font-size: 15px;
  font-weight: 800;
  color: #fff;
  background: linear-gradient(135deg, #2563eb, #0ea5e9);
  border-radius: 12px;
  box-shadow: 0 6px 14px rgba(37, 99, 235, 0.28);
}

.corridor-sub {
  margin-top: 1px;
  font-size: 10.5px;
  color: #94a3b8;
}

.official {
  margin-top: 11px;
  padding: 10px 12px;
  font-size: 12px;
  line-height: 1.7;
  color: #3d5a80;
  background: #f4f9ff;
  border-left: 3px solid #a9c8f5;
  border-radius: 0 8px 8px 0;
}

.endpoints {
  display: grid;
  gap: 6px;
  margin-top: 10px;
}

.endpoint {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ep-tag {
  flex: 0 0 auto;
  padding: 2px 8px;
  font-size: 10.5px;
  font-weight: 700;
  color: #fff;
  border-radius: 999px;
}

.ep-tag.start {
  background: #1d4ed8;
}

.ep-tag.end {
  background: #0ea5e9;
}

.ep-name {
  font-size: 12.5px;
  font-weight: 600;
  color: #22344d;
}

.chain {
  margin-top: 10px;
  padding: 9px 11px;
  font-size: 11.5px;
  line-height: 1.6;
  color: #6b4f9c;
  background: #f7f2ff;
  border: 1px dashed #dcc9f8;
  border-radius: 9px;
}

.chain-note {
  color: #9a86bb;
}

.assume {
  margin-top: 10px;
  font-size: 11px;
  line-height: 1.6;
  color: #94a3b8;
}

.notes {
  margin-top: 8px;
  font-size: 11.5px;
  line-height: 1.65;
  color: #5b6b82;
}

.no-route {
  margin-top: 10px;
  padding: 8px 10px;
  font-size: 11px;
  line-height: 1.6;
  color: #8a6a1f;
  background: #fff9ea;
  border: 1px dashed #f0dcab;
  border-radius: 8px;
}
</style>
