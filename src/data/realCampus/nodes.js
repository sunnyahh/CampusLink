/**
 * ============================================================
 *  真实校园 · 楼层级节点表（哈尔滨工业大学 西大直街校区）
 * ------------------------------------------------------------
 *  暖廊的端点不是"建筑"，而是"建筑上的某个点"。
 *  例如 X6 号暖廊两端都在 A10公寓，只是东侧2层和西侧3层，
 *  所以必须用「建筑 + 楼层 + 方位」的节点来表达。
 *
 *  节点编号：YQ1-N-001 起，流水号，不含地理含义。
 *  楼层的官方写法要原样保留：2层 / 2.5层 / 1.5层 / M层。
 *  ⚠️ 本表只收录「已被已确认暖廊引用」的节点，
 *     没有关联暖廊的楼层暂不录入。
 * ============================================================
 */

import { createNode } from './rules.js'

const SOURCE = '[official_map] 官方地图暖廊弹窗/标签截图 ｜ 2026-11-02 ｜ 课程采集'
const SOURCE_POPUP = '[official_map_popup] 官方地图暖廊弹窗截图 ｜ 2026-11-02 ｜ 课程采集'

/**
 * 楼层节点列表
 * @type {Array<ReturnType<typeof createNode>>}
 */
export const NODES = [
  // ---------- 4-1 号暖廊的两端 ----------
  createNode({
    node_id: 'YQ1-N-001',
    building_id: 'YQ1-B001',
    floor: '2层',
    zone: null,
    display_name: '明德楼 2层',
    source: SOURCE,
    verify_status: 'confirmed'
  }),
  createNode({
    node_id: 'YQ1-N-002',
    building_id: 'YQ1-B002',
    floor: '2层',
    zone: null,
    display_name: '理学楼 2层',
    source: SOURCE,
    verify_status: 'confirmed'
  }),

  // ---------- 4-3 号暖廊串联的三栋 ----------
  createNode({
    node_id: 'YQ1-N-003',
    building_id: 'YQ1-B003',
    floor: '2层',
    zone: null,
    display_name: '格物楼 2层',
    source: SOURCE,
    verify_status: 'map_confirmed'
  }),
  createNode({
    node_id: 'YQ1-N-004',
    building_id: 'YQ1-B004',
    floor: '2层',
    zone: null,
    display_name: '建筑设计学院 2层',
    source: SOURCE,
    verify_status: 'map_confirmed'
  }),

  // ---------- 诚意楼：同一栋楼的两个不同楼层节点 ----------
  createNode({
    node_id: 'YQ1-N-005',
    building_id: 'YQ1-B005',
    floor: '2.5层',
    zone: null,
    display_name: '诚意楼 2.5层',
    source: SOURCE,
    verify_status: 'map_confirmed'
  }),
  createNode({
    node_id: 'YQ1-N-006',
    building_id: 'YQ1-B005',
    floor: '2层',
    zone: null,
    display_name: '诚意楼 2层',
    source: SOURCE,
    verify_status: 'map_confirmed'
  }),

  // ---------- 学士楼 ----------
  createNode({
    node_id: 'YQ1-N-007',
    building_id: 'YQ1-B006',
    floor: '2层',
    zone: null,
    display_name: '学士楼 2层',
    source: SOURCE,
    verify_status: 'map_confirmed'
  }),

  // ---------- A03公寓 ----------
  createNode({
    node_id: 'YQ1-N-008',
    building_id: 'YQ1-B007',
    floor: '2层',
    zone: null,
    display_name: 'A03公寓 2层',
    source: SOURCE,
    verify_status: 'map_confirmed'
  }),

  // ---------- A10公寓：东、西两个方位的不同楼层 ----------
  createNode({
    node_id: 'YQ1-N-009',
    building_id: 'YQ1-B008',
    floor: '3层',
    zone: '西',
    display_name: 'A10公寓 西侧3层',
    source: SOURCE,
    verify_status: 'confirmed'
  }),
  createNode({
    node_id: 'YQ1-N-010',
    building_id: 'YQ1-B008',
    floor: '2层',
    zone: '东',
    display_name: 'A10公寓 东侧2层',
    source: SOURCE,
    verify_status: 'confirmed'
  }),

  // ---------- 正心楼 ----------
  createNode({
    node_id: 'YQ1-N-011',
    building_id: 'YQ1-B009',
    floor: '1层',
    zone: null,
    display_name: '正心楼 1层',
    source: SOURCE,
    verify_status: 'map_confirmed'
  }),

  // ---------- 4-7 号暖廊的两端 ----------
  createNode({
    node_id: 'YQ1-N-012',
    building_id: 'YQ1-B010',
    floor: '2层',
    zone: null,
    display_name: '图书馆 2层',
    source: SOURCE_POPUP,
    verify_status: 'confirmed'
  }),
  createNode({
    node_id: 'YQ1-N-013',
    building_id: 'YQ1-B020',
    floor: '3层',
    zone: null,
    display_name: '材料学院 3层',
    source: SOURCE_POPUP,
    verify_status: 'confirmed'
  })
]

/** 按 id 快速查节点 */
export const NODE_MAP = new Map(NODES.map((n) => [n.node_id, n]))

/** 查某栋建筑下的全部节点（建筑 ↔ 节点关联） */
export function nodesOfBuilding(buildingId) {
  return NODES.filter((node) => node.building_id === buildingId)
}
