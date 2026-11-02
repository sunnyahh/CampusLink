/**
 * ============================================================
 *  校园暖廊通 CampusLink · 模拟建筑数据
 * ------------------------------------------------------------
 *  ⚠️ 重要说明（作业里可以照抄这段）
 *  本项目当前使用「模拟数据」：下面的建筑名称、坐标、楼层、简介
 *  全部是为课程演示虚构的，不代表任何真实校园（包括任何真实高校）
 *  的实际布局。等拿到真实校园地图后，只需要替换本文件的数据。
 *
 *  📐 坐标系统
 *  SVG 画布是 1000 × 660 的「地图单位」，x 向右、y 向下。
 *  比例尺：1 地图单位 = 0.5 米（见 scaleMetersPerUnit）。
 *  也就是说两栋楼中心点相距 300 个单位，实际约 150 米。
 *
 *  🔧 以后换成真实地图要做什么？
 *  1. 按真实地图改每个建筑的 x / y / w / h（中心点 + 宽高）；
 *  2. 改 corridors.js 里的连接关系；
 *  3. 其余代码（算法、界面、搜索）完全不用动。
 * ============================================================
 */

/** 校园整体信息 */
export const CAMPUS_META = {
  name: '暖廊大学 · 模拟校区',
  disclaimer: '建筑位置与暖廊连接为课程演示用虚构数据，不代表任何真实校园布局。',
  width: 1000,
  height: 660,
  scaleMetersPerUnit: 0.5
}

/**
 * 建筑类型：决定地图上的配色和小标签文字
 * color 用于描边与文字，soft 用于填充（浅色底）
 */
export const BUILDING_TYPES = {
  teaching: { label: '教学楼', color: '#2563eb', soft: '#e9f0ff' },
  study: { label: '图书馆', color: '#0891b2', soft: '#e5f7fb' },
  lab: { label: '实验楼', color: '#7c3aed', soft: '#f2ecff' },
  dorm: { label: '宿舍', color: '#d97706', soft: '#fff5e6' },
  food: { label: '食堂', color: '#e11d48', soft: '#fdeef3' },
  sport: { label: '体育馆', color: '#16a34a', soft: '#e9f8ee' },
  admin: { label: '行政楼', color: '#1e40af', soft: '#e8edfb' },
  center: { label: '活动中心', color: '#db2777', soft: '#fdeef6' },
  gate: { label: '校门', color: '#64748b', soft: '#eef2f7' }
}

/**
 * 建筑列表
 * 字段说明：
 *  id        唯一标识，路线算法用它来连线
 *  name      中文名（地图上显示）
 *  en        英文名（地图上的副标题）
 *  type      建筑类型，对应上面的 BUILDING_TYPES
 *  x, y      建筑中心点坐标（地图单位）
 *  w, h      建筑宽高（地图单位）
 *  floors    楼层数
 *  hours     开放时间
 *  scale     规模说明
 *  desc      简介
 *  facilities 设施标签
 *  aliases   搜索用的别名（中文别名 + 拼音 + 英文）
 */
export const BUILDINGS = [
  {
    id: 'tla',
    name: '教学楼A',
    en: 'TEACHING BLDG A',
    type: 'teaching',
    x: 200,
    y: 110,
    w: 150,
    h: 90,
    floors: 5,
    hours: '06:30 – 22:00',
    scale: '48 间教室 · 3 个阶梯教室',
    desc: '公共基础课与晚自习的主要场所。二层和四层设有直通西翼暖廊的玻璃连廊，从宿舍区出发可以一路室内走到教室。',
    facilities: ['公共教室', '阶梯教室', '自习区', '饮水间'],
    aliases: ['教学楼a', '教a', 'a座', 'jiaoxuelou', 'teaching', 'building a']
  },
  {
    id: 'admin',
    name: '行政楼',
    en: 'ADMINISTRATION',
    type: 'admin',
    x: 500,
    y: 110,
    w: 130,
    h: 75,
    floors: 8,
    hours: '08:00 – 17:30',
    scale: '一站式服务大厅',
    desc: '行政办公与学生事务大厅所在地，一层设有一站式服务窗口。北侧门厅与北门广场步道相接，也是北环暖廊的中点。',
    facilities: ['学生事务', '教务处', '财务窗口', '会议室'],
    aliases: ['行政楼', '办公楼', 'xingzhenglou', 'admin', 'office']
  },
  {
    id: 'tlb',
    name: '教学楼B',
    en: 'TEACHING BLDG B',
    type: 'teaching',
    x: 800,
    y: 110,
    w: 150,
    h: 90,
    floors: 6,
    hours: '06:30 – 22:00',
    scale: '60 间教室 · 2 个报告厅',
    desc: '专业课教室与报告厅集中楼，紧邻东翼暖廊，可从图书馆、实验楼室内直达，冬季上早课不必穿过露天广场。',
    facilities: ['专业教室', '报告厅', '教师休息室', '自助打印'],
    aliases: ['教学楼b', '教b', 'b座', 'jiaoxueloub', 'teaching b']
  },
  {
    id: 'gym',
    name: '体育馆',
    en: 'GYMNASIUM',
    type: 'sport',
    x: 120,
    y: 290,
    w: 130,
    h: 100,
    floors: 3,
    hours: '06:00 – 22:00',
    scale: '篮球馆 · 羽毛球 12 片',
    desc: '含篮球馆、羽毛球馆与器械健身房，冬季开放时间延长。一层西侧与西翼暖廊直连，运动完可以直接穿暖廊回宿舍。',
    facilities: ['篮球馆', '羽毛球馆', '健身房', '淋浴间'],
    aliases: ['体育馆', '健身', '球馆', 'tiyuguan', 'gym', 'sports']
  },
  {
    id: 'lib',
    name: '图书馆',
    en: 'LIBRARY',
    type: 'study',
    x: 500,
    y: 290,
    w: 150,
    h: 110,
    floors: 6,
    hours: '07:00 – 22:30',
    scale: '约 2,800 个阅览座位',
    desc: '校园学习中心，六层阅览区。中央暖廊贯穿一层大厅，是全校暖廊网络最重要的枢纽——大多数室内路线都会经过这里。',
    facilities: ['自习区', '电子阅览', '研讨间', '咖啡角', '自助借还'],
    aliases: ['图书馆', '图书', '自习', 'tushuguan', 'library', 'lib']
  },
  {
    id: 'lab',
    name: '实验楼',
    en: 'LABORATORY',
    type: 'lab',
    x: 880,
    y: 290,
    w: 120,
    h: 90,
    floors: 7,
    hours: '07:30 – 23:00',
    scale: '32 间实验室',
    desc: '材料与信息类实验室集中楼，通过东翼暖廊与图书馆、教学楼B连通。夜间 22:00 后仅保留东侧门禁通道。',
    facilities: ['专业实验室', '仪器室', '机房', '值班室'],
    aliases: ['实验楼', '实验室', 'shiyanlou', 'lab', 'laboratory']
  },
  {
    id: 'dorm1',
    name: '宿舍1号楼',
    en: 'DORMITORY 1',
    type: 'dorm',
    x: 200,
    y: 450,
    w: 120,
    h: 80,
    floors: 6,
    hours: '24 小时',
    scale: '约 620 个床位',
    desc: '南苑最靠近食堂的宿舍楼，一层门厅连接南苑暖廊，出门穿过连廊 2 分钟就能到食堂。',
    facilities: ['洗衣房', '开水间', '自习室', '快递柜'],
    aliases: ['宿舍1', '一号楼', '宿舍一', 'sushe1', 'dorm1', 'dormitory 1']
  },
  {
    id: 'dorm2',
    name: '宿舍2号楼',
    en: 'DORMITORY 2',
    type: 'dorm',
    x: 200,
    y: 560,
    w: 120,
    h: 80,
    floors: 6,
    hours: '24 小时',
    scale: '约 600 个床位',
    desc: '南苑宿舍楼，与 1 号楼、3 号楼之间均有封闭连廊相连，雨雪天不必露天穿行。',
    facilities: ['洗衣房', '开水间', '活动室', '快递柜'],
    aliases: ['宿舍2', '二号楼', '宿舍二', 'sushe2', 'dorm2', 'dormitory 2']
  },
  {
    id: 'dorm3',
    name: '宿舍3号楼',
    en: 'DORMITORY 3',
    type: 'dorm',
    x: 350,
    y: 560,
    w: 120,
    h: 80,
    floors: 5,
    hours: '24 小时',
    scale: '约 480 个床位',
    desc: '南苑宿舍楼，暖廊回环段可以绕行到食堂南侧，从宿舍到食堂全程室内。',
    facilities: ['洗衣房', '开水间', '自习室', '快递柜'],
    aliases: ['宿舍3', '三号楼', '宿舍三', 'sushe3', 'dorm3', 'dormitory 3']
  },
  {
    id: 'canteen',
    name: '食堂',
    en: 'CANTEEN',
    type: 'food',
    x: 500,
    y: 450,
    w: 160,
    h: 90,
    floors: 3,
    hours: '06:30 – 20:30',
    scale: '约 1,200 个餐位',
    desc: '三层食堂，一层窗口早 6:30 开始供应。南苑暖廊与中央暖廊在此交汇，是宿舍区到教学区最重要的中转站。',
    facilities: ['一层窗口', '风味餐厅', '清真窗口', '便利店'],
    aliases: ['食堂', '餐厅', '饭堂', 'shitang', 'canteen', 'dining']
  },
  {
    id: 'center',
    name: '学生活动中心',
    en: 'STUDENT CENTER',
    type: 'center',
    x: 800,
    y: 450,
    w: 130,
    h: 85,
    floors: 4,
    hours: '09:00 – 22:00',
    scale: '剧场 · 社团之家',
    desc: '学生社团活动、演出与展览空间，门前是青春广场。目前只能通过广场步道到达，是暖廊网络里比较"冷"的一个节点。',
    facilities: ['小剧场', '社团活动室', '展厅', '排练厅'],
    aliases: ['活动中心', '学生活动中心', '社团', 'huodongzhongxin', 'center', 'student center']
  },
  {
    id: 'south_gate',
    name: '南门',
    en: 'SOUTH GATE',
    type: 'gate',
    x: 500,
    y: 612,
    w: 96,
    h: 34,
    floors: 0,
    hours: '06:00 – 23:00',
    scale: '人行 + 车行',
    desc: '校园南侧主出入口，校车与外卖集散点。门内是南门广场步道，冬季无遮挡。',
    facilities: ['门禁闸机', '校车站', '快递驿站'],
    aliases: ['南门', '校门', '正门', 'nanmen', 'south gate']
  },
  {
    id: 'north_gate',
    name: '北门',
    en: 'NORTH GATE',
    type: 'gate',
    x: 500,
    y: 44,
    w: 96,
    h: 34,
    floors: 0,
    hours: '06:00 – 23:00',
    scale: '人行',
    desc: '校园北侧出入口，靠近地铁站。门内是北门广场步道，直达行政楼门厅。',
    facilities: ['门禁闸机', '共享单车点'],
    aliases: ['北门', '校门', 'beimen', 'north gate']
  }
]

/** 按 id 快速查建筑的小工具 */
export const BUILDING_MAP = new Map(BUILDINGS.map((b) => [b.id, b]))
