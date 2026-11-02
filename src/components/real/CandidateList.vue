<script setup>
/**
 * 候选暖廊清单
 * 这些暖廊官方地图上有，但信息不完整（被遮挡/截断/拓扑不明），
 * 所以只展示、不参与导航，统一标记「待核实」。
 */
import { BLOCKED_REASONS } from '../../data/realCampus/rules.js'

defineProps({
  candidates: { type: Array, required: true }
})

function reasonLabel(value) {
  return BLOCKED_REASONS[value] ?? value
}
</script>

<template>
  <section class="candidates card">
    <div class="card-title">
      <h2>候选暖廊</h2>
      <span class="card-sub">{{ candidates.length }} 条 · 待核实</span>
    </div>

    <p class="hint">
      以下暖廊尚未确认完整信息，<b>不参与正式导航</b>，仅作采集线索保留。
    </p>

    <ul class="list">
      <li v-for="item in candidates" :key="item.candidate_id" class="item">
        <div class="item-head">
          <span class="no" :class="{ unlabeled: !item.official_no }">
            {{ item.official_no ?? '未标注' }}
          </span>
          <span class="tag">待核实</span>
        </div>
        <p class="text">{{ item.official_text }}</p>
        <p class="reason">{{ reasonLabel(item.blocked_reason) }}</p>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.candidates {
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  max-height: 300px;
  min-height: 0;
}

.hint {
  margin-bottom: 10px;
  padding: 8px 10px;
  font-size: 11px;
  line-height: 1.6;
  color: #8a6a1f;
  background: #fff9ea;
  border: 1px dashed #f0dcab;
  border-radius: 8px;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 0;
  padding-right: 2px;
  overflow-y: auto;
}

.item {
  padding: 8px 10px;
  background: #fbfcfe;
  border: 1px solid #eef3fa;
  border-radius: 9px;
}

.item-head {
  display: flex;
  align-items: center;
  gap: 7px;
}

.no {
  padding: 1px 8px;
  font-size: 11px;
  font-weight: 700;
  color: #8a6a1f;
  background: #fff4d9;
  border: 1px solid #f0dcab;
  border-radius: 999px;
}

.no.unlabeled {
  color: #8b93a3;
  background: #f2f4f8;
  border-color: #e2e6ee;
}

.tag {
  font-size: 10px;
  color: #b09050;
}

.text {
  margin-top: 5px;
  font-size: 11.5px;
  line-height: 1.6;
  color: #4a5b73;
  word-break: break-all;
}

.reason {
  margin-top: 3px;
  font-size: 10.5px;
  color: #9aa7ba;
}
</style>
