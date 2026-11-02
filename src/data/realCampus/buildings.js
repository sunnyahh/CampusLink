/**
 * ============================================================
 *  真实校园 · 建筑表（哈尔滨工业大学 西大直街校区）
 * ------------------------------------------------------------
 *  ⚠️ 只收录「已被已确认暖廊的节点引用到」的建筑。
 *     其余建筑（西苑、贵新、园丁等）尚未与暖廊建立关系，
 *     等采到节点后再补，避免这里堆一堆用不上的名字。
 *
 *  category 暂为 null：官方地图是按分类展示建筑的，
 *  但截图里没有显示分类标签，所以不猜，等补采。
 *
 *  建筑 ↔ 节点的关联方式：节点表的 building_id 指向这里，
 *  反向查询用 nodes.js 的 nodesOfBuilding(buildingId)。
 * ============================================================
 */

import { createBuilding } from './rules.js'

const SOURCE = '[official_map] 官方地图建筑标签截图 ｜ 2026-11-02 ｜ 课程采集'

/**
 * 建筑列表
 * @type {Array<ReturnType<typeof createBuilding>>}
 */
export const BUILDINGS = [
  createBuilding({
    building_id: 'YQ1-B001',
    official_name: '明德楼',
    aliases: ['明德'],
    category: null,
    source: SOURCE,
    verify_status: 'map_confirmed'
  }),
  createBuilding({
    building_id: 'YQ1-B002',
    official_name: '理学楼',
    aliases: [],
    category: null,
    source: SOURCE,
    verify_status: 'map_confirmed'
  }),
  createBuilding({
    building_id: 'YQ1-B003',
    official_name: '格物楼',
    aliases: [],
    category: null,
    source: SOURCE,
    verify_status: 'map_confirmed'
  }),
  createBuilding({
    building_id: 'YQ1-B004',
    official_name: '建筑设计学院',
    aliases: [],
    category: null,
    source: SOURCE,
    verify_status: 'map_confirmed'
  }),
  createBuilding({
    building_id: 'YQ1-B005',
    official_name: '诚意楼',
    aliases: [],
    category: null,
    source: SOURCE,
    verify_status: 'map_confirmed'
  }),
  createBuilding({
    building_id: 'YQ1-B006',
    official_name: '学士楼',
    aliases: [],
    category: null,
    source: SOURCE,
    verify_status: 'map_confirmed'
  }),
  createBuilding({
    building_id: 'YQ1-B007',
    official_name: 'A03公寓',
    aliases: ['A03'],
    category: null,
    source: SOURCE,
    verify_status: 'map_confirmed'
  }),
  createBuilding({
    building_id: 'YQ1-B008',
    official_name: 'A10公寓',
    aliases: ['A10'],
    category: null,
    source: SOURCE,
    verify_status: 'confirmed'
  }),
  createBuilding({
    building_id: 'YQ1-B009',
    official_name: '正心楼',
    aliases: [],
    category: null,
    source: SOURCE,
    verify_status: 'map_confirmed'
  }),
  createBuilding({
    building_id: 'YQ1-B010',
    official_name: '图书馆',
    aliases: ['图书'],
    category: null,
    source: SOURCE,
    verify_status: 'map_confirmed'
  }),
  createBuilding({
    building_id: 'YQ1-B011',
    official_name: '学苑楼',
    aliases: [],
    category: null,
    source: SOURCE,
    verify_status: 'map_confirmed'
  }),
  createBuilding({
    building_id: 'YQ1-B012',
    official_name: '学子楼',
    aliases: [],
    category: null,
    source: SOURCE,
    verify_status: 'map_confirmed'
  }),
  createBuilding({
    building_id: 'YQ1-B013',
    official_name: '管理楼',
    aliases: [],
    category: null,
    source: SOURCE,
    verify_status: 'map_confirmed'
  }),
  createBuilding({
    building_id: 'YQ1-B014',
    official_name: '体育馆',
    aliases: [],
    category: null,
    source: SOURCE,
    verify_status: 'map_confirmed'
  }),
  createBuilding({
    building_id: 'YQ1-B015',
    official_name: '风雨操场',
    aliases: [],
    category: null,
    source: SOURCE,
    verify_status: 'map_confirmed'
  }),
  createBuilding({
    building_id: 'YQ1-B016',
    official_name: '材料楼',
    aliases: [],
    category: null,
    source: SOURCE,
    verify_status: 'map_confirmed'
  }),
  createBuilding({
    building_id: 'YQ1-B017',
    official_name: '致知楼',
    aliases: [],
    category: null,
    source: SOURCE,
    verify_status: 'map_confirmed'
  }),
  createBuilding({
    building_id: 'YQ1-B018',
    official_name: '新民楼',
    aliases: [],
    category: null,
    source: SOURCE,
    verify_status: 'map_confirmed'
  }),
  createBuilding({
    building_id: 'YQ1-B019',
    official_name: 'A18公寓',
    aliases: ['A18'],
    category: null,
    source: SOURCE,
    verify_status: 'map_confirmed'
  }),
  createBuilding({
    building_id: 'YQ1-B020',
    official_name: '材料学院',
    aliases: ['材料楼'],
    category: null,
    source: '[official_map_popup] 官方地图 4-7 号暖廊弹窗截图 ｜ 2026-11-02 ｜ 课程采集',
    verify_status: 'confirmed'
  })
]

/** 按 id 快速查建筑 */
export const BUILDING_MAP = new Map(BUILDINGS.map((b) => [b.building_id, b]))
