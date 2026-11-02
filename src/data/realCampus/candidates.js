/**
 * ============================================================
 *  真实校园 · 候选暖廊表（暂不可用于导航）
 * ------------------------------------------------------------
 *  这里放的是「官方地图上看到了，但信息不完整」的暖廊。
 *  它们只有官方原文和卡点原因，没有节点引用，
 *  navigation_eligible 固定为 false，永远不参与路线规划。
 *
 *  一条候选要升级成 corridors.js 的正式记录，必须补全：
 *    ① 两端都是明确的建筑楼层节点
 *    ② 官方原文完整可读（或已用弹窗确认）
 *    ③ 没有未决的分支 / 暖廊接口
 * ============================================================
 */

import { createCandidate } from './rules.js'

const SOURCE = '[official_map] 官方地图暖廊图层截图 ｜ 2026-11-02 ｜ 课程采集'

/**
 * 候选暖廊列表
 * @type {Array<ReturnType<typeof createCandidate>>}
 */
export const CANDIDATES = [
  createCandidate({
    candidate_id: 'YQ1-C-0001',
    official_no: '4-2',
    official_text: '4-2号暖廊（格物楼2层—管理楼2层—明德楼2层）',
    mentioned_buildings: ['格物楼', '管理楼', '明德楼'],
    blocked_reason: 'number_unconfirmed',
    notes: '文字完整、顺序明确，但编号的连字符写法未经弹窗确认（图上形似 4.2）。',
    source: SOURCE
  }),
  createCandidate({
    candidate_id: 'YQ1-C-0002',
    official_no: '4-4',
    official_text: '4-4号暖廊（学子楼2层—格物楼2层）',
    mentioned_buildings: ['学子楼', '格物楼'],
    blocked_reason: 'number_unconfirmed',
    notes: '编号写法同样待弹窗确认（图上形似 4.4）。',
    source: SOURCE
  }),
  createCandidate({
    candidate_id: 'YQ1-C-0003',
    official_no: '4-5',
    official_text: '4-5号暖廊（正心楼9号楼梯1.5层—体育馆1层）',
    mentioned_buildings: ['正心楼', '体育馆'],
    blocked_reason: 'term_ambiguous',
    notes: '「9号楼梯」含义不明，可能是楼名或楼梯位置，需弹窗复核。',
    source: SOURCE
  }),
  createCandidate({
    candidate_id: 'YQ1-C-0004',
    official_no: '4-6',
    provisional_corridor_id: 'YQ1-WC-0008',
    official_text: '4-6号暖廊（学苑楼2层—致知楼2层—图书馆2层—新民楼3层—A18公寓4层）',
    mentioned_buildings: ['学苑楼', '致知楼', '图书馆', '新民楼', 'A18公寓'],
    building_stops: [
      { building_id: 'YQ1-B011', building_name: '学苑楼', floor: '2层' },
      { building_id: 'YQ1-B017', building_name: '致知楼', floor: '2层' },
      { building_id: 'YQ1-B010', building_name: '图书馆', floor: '2层' },
      { building_id: 'YQ1-B018', building_name: '新民楼', floor: '3层' },
      { building_id: 'YQ1-B019', building_name: 'A18公寓', floor: '4层' }
    ],
    blocked_reason: 'multi_stop_entrance_unverified',
    notes:
      '官方弹窗已确认原文与串联顺序（2026-11-02）。' +
      '但「经过这五栋」不等于「每栋都能独立进出」：中途能否进出、能否换乘均未核实，' +
      '因此先作为候选保留，暂不纳入 BFS。' +
      '项目编号暂定 YQ1-WC-0008 —— YQ1-WC-0006 已被 X6、YQ1-WC-0007 已被 4-7 占用，待确认后再定。',
    source: '[official_map_popup] 官方地图 4-6 号暖廊弹窗截图 ｜ 2026-11-02 ｜ 课程采集'
  }),
  createCandidate({
    candidate_id: 'YQ1-C-0006',
    official_no: null,
    official_text: '□号暖廊（□楼2层—正心楼2层）',
    mentioned_buildings: ['正心楼'],
    blocked_reason: 'text_obscured',
    notes: '编号与首栋楼均被「电力一部」标签压住。',
    source: SOURCE
  }),
  createCandidate({
    candidate_id: 'YQ1-C-0007',
    official_no: '6',
    official_text: '6号暖廊（学士楼2层—……）',
    mentioned_buildings: ['学士楼'],
    blocked_reason: 'text_truncated',
    notes: '后半句超出屏幕。',
    source: SOURCE
  }),
  createCandidate({
    candidate_id: 'YQ1-C-0008',
    official_no: null,
    official_text: '暖廊（正心楼1.5层—体育馆1层）',
    mentioned_buildings: ['正心楼', '体育馆'],
    blocked_reason: 'number_unconfirmed',
    notes: '标签上没有编号；疑与 4-5 号暖廊是同一段，待弹窗确认后合并。',
    source: SOURCE
  }),
  createCandidate({
    candidate_id: 'YQ1-C-0009',
    official_no: '7-2',
    official_text: '7-2号暖廊（学苑楼2层—学子楼2层）',
    mentioned_buildings: ['学苑楼', '学子楼'],
    blocked_reason: 'number_unconfirmed',
    notes: '编号前缀位数不确定（可能还有一位）。',
    source: SOURCE
  }),
  createCandidate({
    candidate_id: 'YQ1-C-0010',
    official_no: 'X3',
    official_text: 'X3暖廊（A0……）',
    mentioned_buildings: [],
    blocked_reason: 'unreadable',
    notes: '除编号外全部被遮挡。',
    source: SOURCE
  }),
  createCandidate({
    candidate_id: 'YQ1-C-0011',
    official_no: 'X4',
    official_text: 'X4暖廊（A06……）',
    mentioned_buildings: [],
    blocked_reason: 'text_truncated',
    notes: '只看到「A06」，是否为公寓、另一端接哪里均未知。',
    source: SOURCE
  }),
  createCandidate({
    candidate_id: 'YQ1-C-0012',
    official_no: 'X7',
    official_text: 'X7暖廊（风雨操场-M层—A10公寓……）',
    mentioned_buildings: ['风雨操场', 'A10公寓'],
    blocked_reason: 'text_truncated',
    notes: '右端被屏幕边缘截断。',
    source: SOURCE
  }),
  createCandidate({
    candidate_id: 'YQ1-C-0013',
    official_no: null,
    official_text: '（……3层—A08公寓2……）',
    mentioned_buildings: ['A08公寓'],
    blocked_reason: 'unreadable',
    notes: '编号不可见，只剩后半句。',
    source: SOURCE
  }),
  createCandidate({
    candidate_id: 'YQ1-C-0014',
    official_no: 'N1',
    official_text: 'N1暖廊（活动中心□……—A16公寓3层）',
    mentioned_buildings: ['活动中心', 'A16公寓'],
    blocked_reason: 'text_obscured',
    notes: '中段被遮挡。',
    source: SOURCE
  }),
  createCandidate({
    candidate_id: 'YQ1-C-0015',
    official_no: 'N2',
    official_text: 'N2暖廊（A16公寓3层—A15公寓、A13公寓、A01公寓3层）',
    mentioned_buildings: ['A16公寓', 'A15公寓', 'A13公寓', 'A01公寓'],
    blocked_reason: 'topology_unresolved',
    notes:
      '原文用顿号分隔三栋楼，无法判断是线性串联还是并列分支；' +
      '强行取首尾会编造连接关系，故整条保留为候选。',
    source: SOURCE
  }),
  createCandidate({
    candidate_id: 'YQ1-C-0016',
    official_no: 'N3',
    official_text: 'N3暖廊（A13公寓3层—A11公寓2层，N4暖廊）',
    mentioned_buildings: ['A13公寓', 'A11公寓'],
    blocked_reason: 'corridor_junction',
    notes: '主跨两端是建筑，但末尾「，N4暖廊」表示还与另一条暖廊相接，分支位置未定。',
    source: SOURCE
  }),
  createCandidate({
    candidate_id: 'YQ1-C-0017',
    official_no: 'N4',
    official_text: 'N4暖廊（N3暖廊—A12公寓3层—A11公寓3层）',
    mentioned_buildings: ['A12公寓', 'A11公寓'],
    blocked_reason: 'text_obscured',
    notes: '被 N5 标签压住一部分。',
    source: SOURCE
  }),
  createCandidate({
    candidate_id: 'YQ1-C-0018',
    official_no: 'N5',
    official_text: 'N5暖廊（N4暖廊—风雨操场-M层）',
    mentioned_buildings: ['风雨操场'],
    blocked_reason: 'corridor_junction',
    notes: '一端接的是 N4 暖廊，不是建筑楼层，当前节点模型无法表达。',
    source: SOURCE
  })
]

/** 统计：按卡点原因分组 */
export function candidatesByReason() {
  const map = new Map()
  for (const c of CANDIDATES) {
    map.set(c.blocked_reason, (map.get(c.blocked_reason) ?? 0) + 1)
  }
  return map
}
