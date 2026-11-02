/**
 * ============================================================
 *  真实校园 · 已确认暖廊表（哈尔滨工业大学 西大直街校区）
 * ------------------------------------------------------------
 *  ★ 本表每一条都满足「可导航三条件」：
 *    1. 两端都是明确的建筑楼层节点；
 *    2. 官方原文没有未决的分支或暖廊接口；
 *    3. 串联顺序明确（用「—」按顺序书写）。
 *  不满足的，一律放进 candidates.js，绝不在这里"凑数"。
 *
 *  ⚠️ 全部记录的共同假设：
 *    length_m = null（距离未实测）
 *    access_status = 'assumed_open'
 *    bidirectional = true（课程项目假设，由 createCorridor 强制写入）
 *    corridor_type = 'unknown'（室内/半封闭未核实）
 *
 *  ⚠️ 多栋串联：整条保留官方原文，不拆成多段。
 *     4-3 号暖廊在 chain_node_ids 里按原文顺序记录了格物楼，
 *     但不代表格物楼 2 层一定设有出入口 —— 那属于未核实信息。
 * ============================================================
 */

import { createCorridor } from './rules.js'

const SOURCE_POPUP = '[official_map_popup] 官方地图暖廊弹窗截图 ｜ 2026-11-02 ｜ 课程采集'
const SOURCE_LABEL = '[official_map] 官方地图暖廊图层标签截图 ｜ 2026-11-02 ｜ 课程采集'

/**
 * 已确认暖廊列表
 * @type {Array<ReturnType<typeof createCorridor>>}
 */
export const CORRIDORS = [
  {
    corridor_id: 'YQ1-WC-0001',
    official_no: '4-1',
    official_description: '4-1号暖廊(明德楼2层—理学楼2层)',
    from_node_id: 'YQ1-N-001', // 明德楼 2层
    to_node_id: 'YQ1-N-002', // 理学楼 2层
    floors: '2层 ⇄ 2层',
    source: SOURCE_POPUP,
    verify_status: 'confirmed',
    notes: '官方弹窗标题逐字记录。'
  },
  {
    corridor_id: 'YQ1-WC-0002',
    official_no: '4-3',
    official_description: '4-3号暖廊（明德楼2层—格物楼2层—建筑设计学院2层）',
    from_node_id: 'YQ1-N-001', // 明德楼 2层
    to_node_id: 'YQ1-N-004', // 建筑设计学院 2层
    chain_node_ids: ['YQ1-N-001', 'YQ1-N-003', 'YQ1-N-004'],
    floors: '2层 ⇄ 2层 ⇄ 2层',
    source: SOURCE_LABEL,
    verify_status: 'map_confirmed',
    notes:
      '官方原文用「—」按顺序串联三栋楼，连接顺序明确，故整条保留为一条、不拆段。' +
      '格物楼 2 层是否设有出入口未核实，不能据此当作换乘点。'
  },
  {
    corridor_id: 'YQ1-WC-0003',
    official_no: '4',
    official_description: '4号暖廊（诚意楼2.5层—学士楼2层）',
    from_node_id: 'YQ1-N-005', // 诚意楼 2.5层
    to_node_id: 'YQ1-N-007', // 学士楼 2层
    floors: '2.5层 ⇄ 2层',
    source: SOURCE_LABEL,
    verify_status: 'map_confirmed',
    notes: '两端楼层不同（2.5层 → 2层），现场是否含台阶/坡道未核实。'
  },
  {
    corridor_id: 'YQ1-WC-0004',
    official_no: '2',
    official_description: '2号暖廊（A03公寓2层—诚意楼2层）',
    from_node_id: 'YQ1-N-008', // A03公寓 2层
    to_node_id: 'YQ1-N-006', // 诚意楼 2层
    floors: '2层 ⇄ 2层',
    source: SOURCE_LABEL,
    verify_status: 'map_confirmed'
  },
  {
    corridor_id: 'YQ1-WC-0005',
    official_no: 'X2',
    official_description: 'X2暖廊（A10公寓西3层—正心楼1层）',
    from_node_id: 'YQ1-N-009', // A10公寓 西侧3层
    to_node_id: 'YQ1-N-011', // 正心楼 1层
    floors: '西侧3层 ⇄ 1层',
    source: SOURCE_LABEL,
    verify_status: 'map_confirmed',
    notes: '两端楼层差 2 层，现场是否含楼梯/坡道未核实。'
  },
  {
    corridor_id: 'YQ1-WC-0006',
    official_no: 'X6',
    official_description: 'X6暖廊（A10公寓东2层—A10公寓西3层）',
    from_node_id: 'YQ1-N-010', // A10公寓 东侧2层
    to_node_id: 'YQ1-N-009', // A10公寓 西侧3层
    floors: '东侧2层 ⇄ 西侧3层',
    source: SOURCE_POPUP,
    verify_status: 'confirmed',
    notes:
      '两端位于同一栋建筑（A10公寓）的不同方位与楼层，是引入楼层级节点的直接原因。' +
      '距离未核实。'
  },
  {
    corridor_id: 'YQ1-WC-0007',
    official_no: '4-7',
    official_description: '4-7号暖廊（图书馆2层—材料学院3层）',
    from_node_id: 'YQ1-N-012', // 图书馆 2层
    to_node_id: 'YQ1-N-013', // 材料学院 3层
    floors: '2层 ⇄ 3层',
    source: SOURCE_POPUP,
    verify_status: 'confirmed',
    notes:
      '官方弹窗确认（2026-11-02），两端都是明确的建筑楼层节点，因此进入正式导航。' +
      '注意：官方建筑标签写的是「材料楼」，暖廊原文写的是「材料学院」，' +
      '两名称是否指同一栋建筑尚未核实，所以单独建了 YQ1-B020「材料学院」，没有和「材料楼」合并。'
  }
].map((item) => createCorridor(item))

/** 按项目编号快速查暖廊 */
export const CORRIDOR_MAP = new Map(CORRIDORS.map((c) => [c.corridor_id, c]))
