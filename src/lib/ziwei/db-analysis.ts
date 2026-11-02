/**
 * 紫微斗数 · 13 维确定性断语引擎 & 14 主星知识库 & 双盘合参计算引擎
 * 对齐倪海厦《天纪》教学体系与《紫微斗数全书》《骨髓赋》原典
 */

import type { ZiweiChart, Palace, SiHua } from './types';
import { BRANCHES, STEMS, STAR_DESCRIPTIONS } from './constants';
import { detectPatterns } from './patterns';
import { STAR_IN_FUQI_GU, SIHUA_IN_FUQI_GU } from './heming-knowledge';
import { getSiHuaByStem } from './sihua';

export type TopicKey =
  | 'overview' | 'personality' | 'love' | 'career' | 'wealth' | 'health'
  | 'family' | 'children' | 'move' | 'friends' | 'home' | 'spirit' | 'parents';

export const ALL_TOPICS: TopicKey[] = [
  'overview', 'personality', 'love', 'career', 'wealth', 'health',
  'family', 'children', 'move', 'friends', 'home', 'spirit', 'parents',
];

export const TOPIC_PALACE_NAME: Record<TopicKey, string> = {
  overview:    '命宫',
  personality: '命宫',
  love:        '夫妻宫',
  career:      '官禄宫',
  wealth:      '财帛宫',
  health:      '疾厄宫',
  family:      '兄弟宫',
  children:    '子女宫',
  move:        '迁移宫',
  friends:     '交友宫',
  home:        '田宅宫',
  spirit:      '福德宫',
  parents:     '父母宫',
};

export const TOPIC_LABEL: Record<TopicKey, string> = {
  overview:    '命格总览',
  personality: '性格特质',
  love:        '感情婚姻',
  career:      '事业职业',
  wealth:      '财富运势',
  health:      '健康状况',
  family:      '兄弟合伙',
  children:    '子女缘分',
  move:        '迁移外出',
  friends:     '人际贵人',
  home:        '田宅家产',
  spirit:      '精神福德',
  parents:     '父母长辈',
};

/** 倪师子午流注：地支对应脏腑经络与身体部位 */
export const BRANCH_ORGAN_MAP: Record<number, { branch: string; time: string; organ: string; advice: string }> = {
  0:  { branch: '子', time: '23:00–01:00', organ: '胆经（胆腑、头部神经）', advice: '切忌熬夜，子时前入睡以养少阳胆气，防偏头痛与胆汁代谢失常' },
  1:  { branch: '丑', time: '01:00–03:00', organ: '肝经（肝脏、筋膜、目）', advice: '丑时肝血回流解毒，宜深度睡眠、少饮酒、调畅情志防肝郁化火' },
  2:  { branch: '寅', time: '03:00–05:00', organ: '肺经（肺脏、呼吸系统、皮肤）', advice: '寅时气血由静转动，注意呼吸道保暖与有氧扩胸运动' },
  3:  { branch: '卯', time: '05:00–07:00', organ: '大肠经（大肠、排泄系统）', advice: '晨起宜饮温水促排便，少食生冷辛辣，保持肠道通畅' },
  4:  { branch: '辰', time: '07:00–09:00', organ: '胃经（胃腑、消化道）', advice: '辰时胃经当令，务必规律吃温热早餐，忌空腹饮浓茶冰饮' },
  5:  { branch: '巳', time: '09:00–11:00', organ: '脾经（脾脏、胰腺、肌肉四肢）', advice: '脾主运化水湿，久坐伤肉，宜适度散步，少食甜腻生湿之物' },
  6:  { branch: '午', time: '11:00–13:00', organ: '心经（心脏、心血管、神明）', advice: '午时心火当令，宜小憩15–30分钟养心安神，防心火亢盛与心悸失眠' },
  7:  { branch: '未', time: '13:00–15:00', organ: '小肠经（小肠、营养吸收、肩颈）', advice: '午餐宜营养均衡好消化，午后多补充温水促小肠分清泌浊' },
  8:  { branch: '申', time: '15:00–17:00', organ: '膀胱经（泌尿系统、脊柱背部）', advice: '申时人体代谢最旺，宜多饮水、拉伸背部督脉与膀胱经，莫憋尿' },
  9:  { branch: '酉', time: '17:00–19:00', organ: '肾经（肾脏、骨骼、内分泌）', advice: '酉时肾经藏精，晚餐宜清淡少盐，防过度劳累耗损先天肾气' },
  10: { branch: '戌', time: '19:00–21:00', organ: '心包经（心包、胸腔、情绪循环）', advice: '戌时宜散步谈心、舒缓工作压力，保持胸膈舒畅' },
  11: { branch: '亥', time: '21:00–23:00', organ: '三焦经（内分泌、淋巴、百脉通调）', advice: '亥时三焦百脉皆通，宜泡脚静心准备入眠，忌剧烈运动与情绪激动' },
};

/** 十四主星核心知识档案（倪海厦《天纪》+《紫微斗数全书》） */
export interface StarArchiveItem {
  name: string;
  group: '紫微系' | '天府系';
  element: string;
  yinYang: string;
  role: string;
  dingdiao: string;
  niTeaching: string;
  classicQuote: string;
  careerTrait: string;
  wealthTrait: string;
  loveTrait: string;
  healthOrgan: string;
}

export const STAR_MASTER_ARCHIVE: Record<string, StarArchiveItem> = {
  '紫微': {
    name: '紫微',
    group: '紫微系',
    element: '己土',
    yinYang: '阴土',
    role: '北斗帝座 · 官禄主',
    dingdiao: '帝王之星，统御百官，重尊严与格局，喜左辅右弼夹辅，忌独坐无援成孤君。',
    niTeaching: '倪师《天纪》强调：紫微是皇帝星，坐命者自带尊贵与孤傲之气，耳根软但自尊极强。必须看三方四正有无左辅、右弼、天魁、天钺相会；若有辅弼拱照，则出将入相；若无吉星而见四煞空劫，则为「在野孤君」，虽有抱负却凡事亲力亲为。',
    classicQuote: '《紫微斗数全书》：「紫微帝座临命主尊贵，统领众星；得辅弼昌曲拱照，位至三公；无吉相伴则为孤君。」',
    careerTrait: '宜执掌核心管理权、独立开拓、政企高层或某一专业领域的领头人，不宜长期屈居人下做机械性事务。',
    wealthTrait: '重名声大于算计，财自贵中求；庙旺会禄存化禄则财官双美，忌冲动投机。',
    loveTrait: '择偶眼光高，重精神契合与伴侣能力，自尊心强不喜先低头，晚婚更能修得良缘。',
    healthOrgan: '脾胃消化系统、中焦气机（己土所主）',
  },
  '天机': {
    name: '天机',
    group: '紫微系',
    element: '乙木',
    yinYang: '阴木',
    role: '南斗益寿星 · 兄弟主',
    dingdiao: '智囊谋臣之星，机敏善变、洞察秋毫，长于策划与技术，最忌化忌钻牛角尖。',
    niTeaching: '倪师《天纪》指出：天机是军师参谋星，脑筋转得极快，反应灵敏，但「多谋少决」，适合做幕僚、研发、设计、算法与军师，不宜做独自承担巨额风险的一把手。天机化忌最怕「聪明反被聪明误」，思虑过重易伤肝胆与睡眠。',
    classicQuote: '《骨髓赋》：「天机居卯酉，善策善谋；机月同梁作吏人，精于计划与专业技艺。」',
    careerTrait: '极适合科技研发、系统架构、战略咨询、教育研究、金融分析等高智力密度行业。',
    wealthTrait: '智慧生财、技艺生财，资金周转快，宜将动产转化为稳健资产以免财来财去。',
    loveTrait: '心思细腻敏感，容易想太多，宜配性格豁达稳重之伴侣，避免情绪内耗。',
    healthOrgan: '肝胆系统、四肢筋络、神经与睡眠（乙木所主）',
  },
  '太阳': {
    name: '太阳',
    group: '紫微系',
    element: '丙火',
    yinYang: '阳火',
    role: '中天司贵星 · 官禄主',
    dingdiao: '光明博爱之星，主贵不主富，重名望与大局，庙旺则光辉夺目，落陷则劳心费力。',
    niTeaching: '倪师《天纪》强调：看太阳第一要看出生时辰与宫位庙陷！卯、辰、巳、午四宫为日生光辉（尤其是「日照雷门」「日丽中天」），光明磊落、大公无私；申酉戌亥子丑为日落西山，付出多而回报迟。女命太阳代表丈夫与父亲，太阳庙旺无忌必嫁贵夫。',
    classicQuote: '《紫微斗数全书》：「太阳司贵，居卯辰巳午为入庙，光辉普照，主聪明慈爱，不较是非；落陷则劳碌奔波。」',
    careerTrait: '利公职、外交、传媒、互联网平台、跨国业务、公共服务及一切面向大众的事业。',
    wealthTrait: '先名后利，慷慨重义，常常「照亮别人」，宜建立强制储蓄与资产隔离机制。',
    loveTrait: '男命热情主动有担当，女命独立豪爽；若太阳落陷或化忌，需防感情中付出失衡。',
    healthOrgan: '心血管系统、眼目视力、脑部供血（丙火所主）',
  },
  '武曲': {
    name: '武曲',
    group: '紫微系',
    element: '辛金',
    yinYang: '阴金',
    role: '北斗正财星 · 财帛主',
    dingdiao: '刚毅果断之正财星，重执行力与结果，讲求真金白银与规则效率，刚强而略带孤克。',
    niTeaching: '倪师《天纪》指出：武曲是第一大财星，也是将星，性格刚直、说一不二、执行力极强。武曲坐命或入财帛，只要不见化忌，一生与钱财金融结缘；辰戌丑未四墓库宫最喜火铃同宫（火武格），主突发横财。但武曲入夫妻宫嫌其过刚，宜晚婚互让。',
    classicQuote: '《紫微斗数全书》：「武曲属金，司财帛，性刚果决，有吉曜扶持则大富大贵，最喜化禄及禄存同度。」',
    careerTrait: '极适合金融投资、量化交易、工程制造、军警外科、财务审计与硬核实业。',
    wealthTrait: '正财星入命，对数字与商业机会高度敏锐，能赚能拼，最忌武曲化忌时盲目加杠杆。',
    loveTrait: '直来直往、不善甜言蜜语，习惯用行动和物质表达爱意，宜配温柔体贴型伴侣。',
    healthOrgan: '呼吸系统、肺部、鼻腔、骨骼牙齿（辛金所主）',
  },
  '天同': {
    name: '天同',
    group: '紫微系',
    element: '壬水',
    yinYang: '阳水',
    role: '南斗益算保生星 · 福德主',
    dingdiao: '温润谦和之福星，知足常乐、人缘极佳，重精神生活与生命体验，逆境反能激发大成就。',
    niTeaching: '倪师《天纪》说：天同是福星，坐命的人脾气最好、不记仇、懂得享受生活，但也容易安于现状。所以天同反而「不怕一点煞星来激」，羊陀火铃适度刺激反而让天同发奋图强（如「马头带箭」反主大贵）；天同入福德宫最为得位，一生精神富足。',
    classicQuote: '《骨髓赋》：「天同为福德之主，为人廉洁貌端庄，无煞冲破则一生安享清福。」',
    careerTrait: '适合文化创意、自由职业、餐饮旅游、心理咨询、公关协调及人性化管理岗位。',
    wealthTrait: '白手起家或靠口碑人脉顺其自然聚财，天同化禄主财源轻松顺遂。',
    loveTrait: '重情重义、温柔体贴，极具同理心，需注意在感情中保持定力与边界感。',
    healthOrgan: '肾脏泌尿系统、耳部听力、内分泌水液代谢（壬水所主）',
  },
  '廉贞': {
    name: '廉贞',
    group: '紫微系',
    element: '丁火',
    yinYang: '阴火',
    role: '北斗五星 · 官禄主 · 次桃花',
    dingdiao: '刚柔并济、爱恨分明，兼具清白官禄之贵与次桃花之魅力，遇吉则贵显，化忌则防是非。',
    niTeaching: '倪师《天纪》特别强调：廉贞是官禄主，又是次桃花，社交手腕与专业敏锐度极高。廉贞天相在子午同宫为「廉相格」，化气为印，大吉；廉贞天府在辰戌亦稳；但廉贞若会贪狼、破军、七杀在夫妻或迁移且见化忌，则必须严防官非口舌与感情风波。',
    classicQuote: '《紫微斗数全书》：「廉贞在官禄为官禄主，在身命为次桃花；见吉则清白显贵，逢煞忌则浓血刑囚。」',
    careerTrait: '适合司法行政、精密科技、公关外交、艺术设计、演艺传媒及企业合规风控。',
    wealthTrait: '凭独特才华、公关资源或高门槛专业技能取财，廉贞化禄常因合作与异性贵人得财。',
    loveTrait: '魅力独特、情感浓烈，极具吸引力但占有欲强，宜修心养性、以理智驾驭情感。',
    healthOrgan: '血液循环、免疫系统、心火与炎症调理（丁火所主）',
  },
  '天府': {
    name: '天府',
    group: '天府系',
    element: '戊土',
    yinYang: '阳土',
    role: '南斗令星 · 财帛田宅主',
    dingdiao: '南斗统领、天上财库，稳重厚道、善于守成与统筹，逢禄则仓廪充实，最忌空劫同度。',
    niTeaching: '倪师《天纪》指出：天府是南斗主星，更是「禄库」，行事稳健、包容力强、重实际。看天府一定要看有禄无禄、有空无空：天府得禄存或化禄会照，为充实之库，富贵稳健；若天府逢地空、地劫，叫「空库」「露库」，表面风光而内里现金流吃紧。',
    classicQuote: '《紫微斗数全书》：「天府乃延寿解厄之星，司财宅之权，喜禄存武曲同会，忌空亡同宫。」',
    careerTrait: '适合大型机构高管、银行资产管理、国企央企、房地产不动产及稳健型集团运营。',
    wealthTrait: '天生具备资产配置与守财能力，擅长复利积累与置业安家，财库丰隆。',
    loveTrait: '重家庭责任与现实稳定，伴侣关系温和长久，追求岁月静好与物质保障。',
    healthOrgan: '脾胃系统、腹部消化、湿气代谢（戊土所主）',
  },
  '太阴': {
    name: '太阴',
    group: '天府系',
    element: '癸水',
    yinYang: '阴水',
    role: '中天母仪星 · 财帛田宅主',
    dingdiao: '温柔内敛、清秀聪慧，主富不主贵，精于理财与不动产积累，戌亥子丑夜生人最为辉煌。',
    niTeaching: '倪师《天纪》讲得极透：太阴是月亮，酉戌亥子丑五宫入庙（如「月朗天门」「水澄桂萼」），生于夜晚者大富且温柔清秀；卯辰巳午未白天出生则太阴失辉。男命太阴代表母亲与太太，太阴庙旺化禄则得美妻且旺家产；太阴化忌则需防婆媳矛盾或阴暗损财。',
    classicQuote: '《紫微斗数全书》：「太阴乃水之精，为田宅财帛之主，酉戌亥子丑生人为得垣，富而且贵。」',
    careerTrait: '适合金融财务、地产物业、文艺美学、酒店护理、学术研究与后台精细化运营。',
    wealthTrait: '细水长流、积少成多之大财星，极利不动产置业、长线价值投资与稳健现金流。',
    loveTrait: '情感细腻深沉，男命易得温柔贤内助，女命端庄温婉，重家庭氛围与情感安全感。',
    healthOrgan: '肾水系统、内分泌、妇科/生殖系统、睡眠（癸水所主）',
  },
  '贪狼': {
    name: '贪狼',
    group: '天府系',
    element: '甲木 / 癸水',
    yinYang: '阳木带阴水',
    role: '北斗解厄星 · 正桃花主',
    dingdiao: '多才多艺、交际手腕超群、求知欲与企图心极强，逢火星铃星成「火贪」「铃贪」暴发大格。',
    niTeaching: '倪师《天纪》正名：不要一看到贪狼就只批桃花！贪狼主祸福、主才艺、主五术玄学，在午宫更是「木火通明」的武官大格。贪狼最喜与火星、铃星同度或会照，构成「火贪格」「铃贪格」，主意想不到的横发机遇；少年历经磨砺，中年后愈发通达。',
    classicQuote: '《骨髓赋》：「贪狼火铃四墓宫，豪富家资侯伯贵；贪狼居午宫，木火通明位至公卿。」',
    careerTrait: '适合商业谈判、文娱传媒、公关社交、前沿消费品、外贸开拓及身心灵哲学研究。',
    wealthTrait: '擅长捕捉新兴风口与人脉变现，遇火铃化禄有爆发式财富跃迁机会，得财后宜及时购置实物资产。',
    loveTrait: '异性缘极旺，风趣迷人，感情世界丰富多彩，宜晚婚并将桃花转化为公众人缘与事业助力。',
    healthOrgan: '肝胆解毒、肾水损耗，宜节制烟酒熬夜（甲木/癸水所主）',
  },
  '巨门': {
    name: '巨门',
    group: '天府系',
    element: '癸水',
    yinYang: '阴水',
    role: '北斗司暗星 · 是非口才主',
    dingdiao: '洞察深邃、逻辑严密、辩才无碍，得太阳照耀或化禄化权则「开口生财」，最忌化忌招口舌。',
    niTeaching: '倪师《天纪》点窍：巨门为暗星，专门管口才、研究与是非。巨门最喜庙旺太阳照亮（「巨日同宫」或対宫太阳入庙），则暗气全消，成为名律师、名师、外交家；巨门化禄、化权皆主靠一张嘴或精密专业立身；唯巨门化忌在命或交友，切忌与人合伙担保，防口舌官非。',
    classicQuote: '《紫微斗数全书》：「巨门化气为暗，主口舌是非，得太阳同度或对照则光彩夺目，化禄权则富贵声扬。」',
    careerTrait: '极适合律师法务、大学教授、主播传媒、培训讲师、精准医疗及深度调查科研。',
    wealthTrait: '以专业认知差与口才声誉生财，「石中隐玉」格早年韬光养晦、中晚年大富。',
    loveTrait: '内心深情但嘴上有时不饶人，夫妻相处重在「多赞美、少辩论」，年龄差或异地沟通反增美感。',
    healthOrgan: '口腔咽喉、食道肠胃、脾胃湿寒与情绪郁结（癸水所主）',
  },
  '天相': {
    name: '天相',
    group: '天府系',
    element: '壬水',
    yinYang: '阳水',
    role: '南斗司爵星 · 官禄印星',
    dingdiao: '掌印之星，公正严谨、诚实守信、衣食丰足，最喜「财荫夹印」，最忌「刑忌夹印」。',
    niTeaching: '倪师《天纪》强调：天相是宰相印绶之星，本身可善可恶，关键看左右两邻宫位什么星来夹，以及对宫什么星来照！若化禄与天梁夹天相，为「财荫夹印」，一生得贵人提携、名利双收；若化忌与擎羊（或天梁化忌）夹天相，为「刑忌夹印」，则易受牵连背锅。',
    classicQuote: '《骨髓赋》：「天相司爵，为福善之星，言语诚实，事不虚伪；财荫夹印主富贵，刑忌夹印主灾伤。」',
    careerTrait: '适合首席运营官（COO）、行政法务、战略幕僚、人力资源、金融机构及公职管理。',
    wealthTrait: '衣食无忧、高薪厚禄，依靠平台信誉与专业职权稳步获利，天府必在三合拱照故财库稳固。',
    loveTrait: '择偶注重外表气质与家世修养，常由亲友同学圈介绍成婚（亲上加亲），婚姻配合度高。',
    healthOrgan: '泌尿膀胱、皮肤过敏、水液代谢（壬水所主）',
  },
  '天梁': {
    name: '天梁',
    group: '天府系',
    element: '戊土',
    yinYang: '阳土',
    role: '南斗司寿星 · 父母荫星',
    dingdiao: '清高磊落之老大星、医药长寿之荫星，逢凶化吉、极具侠义与责任感，宜清贵名望之业。',
    niTeaching: '倪师《天纪》指出：天梁是父母主、医药星、清官星，坐命之人少年老成、正气凛然、乐于助人，一生遇难呈祥（逢凶化吉）。但天梁也是「清官星」，不主经商暴利——天梁坐命若强行去搞投机倒把必破财，反而从医、从教、做审计监察、做技术权威会名利双全！',
    classicQuote: '《紫微斗数全书》：「天梁乃司寿之星，化气为荫，能解厄制化，阳梁昌禄于卯宫，胪传第一名。」',
    careerTrait: '极适合医疗养生、高等教育、纪检审计、法官仲裁、科研学术及公益顾问。',
    wealthTrait: '先名后利、清贵生财，靠资历、声望、专利与长辈福荫获益，不宜高风险投机。',
    loveTrait: '在感情中常扮演照顾者或引导者角色，宜配成熟懂事或年长/年幼有反差感的伴侣。',
    healthOrgan: '脾胃消化、肋胁气机，虽偶有小疾但康复力与寿元极佳（戊土所主）',
  },
  '七杀': {
    name: '七杀',
    group: '天府系',
    element: '庚金 / 丁火',
    yinYang: '阳金带火',
    role: '南斗将星 · 成败之孤辰',
    dingdiao: '运筹帷幄之大将星，勇猛果决、不畏强权、逆境崛起，入庙见吉则为「七杀朝斗」威震八方。',
    niTeaching: '倪师《天纪》对七杀评价极高：七杀是战场上的大将军，独立自主、喜怒不形于色、越是危机四伏越能杀出重围！「七杀朝斗」（寅申子午入命）如有禄存、化禄、左右昌曲会照，必掌生杀大权或成商业巨擘；唯七杀坐夫妻宫主「鸳衾半冷」，宜聚少离多或晚婚。',
    classicQuote: '《骨髓赋》：「七杀朝斗，爵禄荣昌；七杀寅申子午，一生爵禄高迁。」',
    careerTrait: '适合开疆拓土型创业者、企业破局统帅、军警安防、外科手术及高强度竞争赛道。',
    wealthTrait: '大起大落中把握战略级机会，与武曲同度或三合会禄时具备极强的财富掠夺与创造力。',
    loveTrait: '感情干脆利落、爱恨分明，厌恶拖泥带水，给彼此留出独立事业空间反而长久恩爱。',
    healthOrgan: '肺与大肠、筋骨外伤、痔疮或呼吸系统（庚金所主）',
  },
  '破军': {
    name: '破军',
    group: '天府系',
    element: '癸水',
    yinYang: '阴水',
    role: '北斗耗星 · 先锋开创主',
    dingdiao: '破旧立新之先锋星，大破大立、敢为人先，不走寻常路，得化禄或紫微同度则开创非凡伟业。',
    niTeaching: '倪师《天纪》讲破军：破军是先锋官，一生最不喜守成，「先破后成、不破不立」。破军在子午入庙（「英星入庙」），或破军化禄、化权，皆主在时代变革中颠覆旧局、创立新业（如乔布斯即典型破军格）；但破军在夫妻宫或财帛宫无禄而见煞，则须防冲动折腾。',
    classicQuote: '《紫微斗数全书》：「破军属水，北斗第七星，化气曰耗，居子午入庙，得禄权则威震华夷，开创大业。」',
    careerTrait: '极适合颠覆式科技创新、新市场开荒、危机重组、极限探险及从0到1的创业先锋。',
    wealthTrait: '不靠死工资，靠颠覆创新与结构性变革获利；破军化禄主在变动转折中大发其财。',
    loveTrait: '追求灵魂共振与不落俗套的爱情，忌早婚冲动，历经世事沉淀后的感情方能笃定。',
    healthOrgan: '肾水生殖系统、骨骼外伤、水液代谢（癸水所主）',
  },
};

export const STAR_DB: Record<string, StarArchiveItem> = STAR_MASTER_ARCHIVE;

/** 获取指定宫位的主星列表（若为空宫则借对宫主星，遵循倪海厦「空宫必借对宫」铁律） */
export function getEffectiveMajorStars(chart: ZiweiChart, palace: Palace): {
  stars: string[];
  isBorrowed: boolean;
  fromPalaceName?: string;
} {
  const majors = palace.stars.filter(s => s.type === 'major').map(s => s.name);
  if (majors.length > 0) {
    return { stars: majors, isBorrowed: false };
  }
  const oppBranch = (palace.branch + 6) % 12;
  const oppPalace = chart.palaces.find(p => p.branch === oppBranch);
  const oppMajors = oppPalace ? oppPalace.stars.filter(s => s.type === 'major').map(s => s.name) : [];
  return {
    stars: oppMajors,
    isBorrowed: true,
    fromPalaceName: oppPalace?.name ?? '对宫',
  };
}

/** 格式化某宫的星曜配置描述 */
function formatPalaceStarsSummary(chart: ZiweiChart, palace: Palace): string {
  const eff = getEffectiveMajorStars(chart, palace);
  const majorDetails = palace.stars
    .filter(s => s.type === 'major')
    .map(s => `${s.name}${s.brightnessRaw ? `(${s.brightnessRaw})` : ''}${s.siHua ? `[化${s.siHua}]` : ''}`)
    .join('、');
  const lucky = palace.stars.filter(s => s.type === 'lucky').map(s => `${s.name}${s.siHua ? `[化${s.siHua}]` : ''}`).join('、');
  const sha = palace.stars.filter(s => s.type === 'sha').map(s => s.name).join('、');

  const parts: string[] = [];
  if (majorDetails) {
    parts.push(`主星：${majorDetails}`);
  } else if (eff.stars.length > 0) {
    parts.push(`本宫无正曜（空宫），依《天纪》对宫借星法则借【${eff.fromPalaceName}】主星：${eff.stars.join('、')}`);
  } else {
    parts.push('本宫及对宫俱无主星');
  }
  if (lucky) parts.push(`吉曜：${lucky}`);
  if (sha) parts.push(`煞曜：${sha}`);
  return parts.join('；');
}

export interface DimensionInterpretation {
  key: TopicKey;
  label: string;
  palaceName: string;
  dingdiao: string;
  lundian: string;
  yiju: string;
  chuchu: string;
  advice: string;
}

/**
 * 生成对齐 v4.0 规格的 13 维确定性命盘深度断语（毫秒级本地计算，不消耗 AI 额度）
 */
export function generate13DimensionAnalysis(chart: ZiweiChart): Record<TopicKey, DimensionInterpretation> {
  const findPalace = (namePrefix: string): Palace => {
    return (
      chart.palaces.find(p => p.name === namePrefix || p.name.startsWith(namePrefix.replace('宫', ''))) ||
      chart.palaces[0]
    );
  };

  const mingPalace = findPalace('命宫');
  const shenPalace = chart.palaces.find(p => p.isShenGong) || mingPalace;
  const caiPalace = findPalace('财帛宫');
  const guanPalace = findPalace('官禄宫');
  const qianPalace = findPalace('迁移宫');
  const fuqiPalace = findPalace('夫妻宫');
  const fudePalace = findPalace('福德宫');
  const jiePalace = findPalace('疾厄宫');
  const xiongdiPalace = findPalace('兄弟宫');
  const zinvPalace = findPalace('子女宫');
  const jiaoyouPalace = findPalace('交友宫');
  const tianzhaiPalace = findPalace('田宅宫');
  const fumuPalace = findPalace('父母宫');

  const patterns = detectPatterns(chart);
  const mingEff = getEffectiveMajorStars(chart, mingPalace);
  const primaryMingStar = mingEff.stars[0] || '紫微';
  const archive = STAR_MASTER_ARCHIVE[primaryMingStar] || STAR_MASTER_ARCHIVE['紫微'];
  const currentDx = chart.daXians[chart.currentDaXianIndex];

  // 四化全盘定位
  const siHuaLocations: Record<string, { star: string; palace: string }> = {};
  for (const p of chart.palaces) {
    for (const s of p.stars) {
      if (s.siHua) {
        siHuaLocations[s.siHua] = { star: s.name, palace: p.name };
      }
    }
  }

  // 倪师健康法则：全盘煞星最集中的宫位（若并列则优先看疾厄宫/命宫），按其地支定脏腑
  let maxShaPalace = jiePalace;
  let maxShaCount = -1;
  for (const p of chart.palaces) {
    const shaCount = p.stars.filter(s => s.type === 'sha').length + (p.stars.some(s => s.siHua === '忌') ? 1.5 : 0);
    if (shaCount > maxShaCount) {
      maxShaCount = shaCount;
      maxShaPalace = p;
    }
  }
  const organInfo = BRANCH_ORGAN_MAP[maxShaPalace.branch] || BRANCH_ORGAN_MAP[0];
  const jieOrganInfo = BRANCH_ORGAN_MAP[jiePalace.branch] || BRANCH_ORGAN_MAP[0];

  const patternNames = patterns.length > 0 ? patterns.map(p => `【${p.name}】`).join('、') : '稳健平和格';

  const buildPalaceDimension = (
    key: TopicKey,
    palace: Palace,
    customDingdiao: string,
    customLundian: string,
    customChuchu: string,
    customAdvice: string,
  ): DimensionInterpretation => {
    const oppBranch = (palace.branch + 6) % 12;
    const oppPalace = chart.palaces.find(p => p.branch === oppBranch);
    return {
      key,
      label: TOPIC_LABEL[key],
      palaceName: `${palace.name}（${STEMS[palace.stem]}${BRANCHES[palace.branch]}宫）`,
      dingdiao: customDingdiao,
      lundian: customLundian,
      yiju: `本宫配置：${formatPalaceStarsSummary(chart, palace)}。对宫【${oppPalace?.name ?? '对宫'}】：${oppPalace ? formatPalaceStarsSummary(chart, oppPalace) : '无'}。`,
      chuchu: customChuchu,
      advice: customAdvice,
    };
  };

  // 1. 命格总览
  const overview = buildPalaceDimension(
    'overview',
    mingPalace,
    `${chart.wuxingJuName} · 命坐${BRANCHES[mingPalace.branch]}宫（${mingEff.isBorrowed ? `借${mingEff.fromPalaceName}${mingEff.stars.join('')}安命` : `${mingEff.stars.join('、')}坐命`}） · 身寄${shenPalace.name} · 成格：${patternNames}`,
    `${archive.niTeaching} 本盘命宫居【${STEMS[mingPalace.stem]}${BRANCHES[mingPalace.branch]}】，三方会照财帛宫（${getEffectiveMajorStars(chart, caiPalace).stars.join('、') || '空宫'}）、官禄宫（${getEffectiveMajorStars(chart, guanPalace).stars.join('、') || '空宫'}）与迁移宫（${getEffectiveMajorStars(chart, qianPalace).stars.join('、') || '空宫'}）。生年化禄在【${siHuaLocations['禄']?.palace ?? '命盘'}】（${siHuaLocations['禄']?.star ?? ''}化禄），代表着先天福泽与最顺遂的能量源泉；生年化权在【${siHuaLocations['权']?.palace ?? '命盘'}】（${siHuaLocations['权']?.star ?? ''}化权），主人生掌控力与执着突破之处；生年化忌落入【${siHuaLocations['忌']?.palace ?? '命盘'}】（${siHuaLocations['忌']?.star ?? ''}化忌），为今生最需修心功课与防微杜渐之所在。`,
    `${archive.classicQuote} 倪海厦《天纪》：「命宫为本，三方四正为用；不看四化，命盘只解了一半。」`,
    currentDx
      ? `当前正行【${currentDx.startAge}–${currentDx.endAge}岁 · ${currentDx.palaceName}】大限，宜顺应${archive.role}之天性，扬长避短，在化禄与化权所在领域重点深耕。`
      : `宜顺应【${primaryMingStar}】之天性，以三方四正吉化之宫作为人生主战场。`,
  );

  // 2. 性格特质
  const personality = buildPalaceDimension(
    'personality',
    mingPalace,
    `${archive.dingdiao}`,
    `命主先天心性受【${mingEff.stars.join('、')}】主导（${STAR_DESCRIPTIONS[primaryMingStar]?.keywords ?? '独立自主'}），后天行事风格受身宫【${shenPalace.name}】（${getEffectiveMajorStars(chart, shenPalace).stars.join('、')}）深刻影响。${mingEff.isBorrowed ? '因命宫无正曜而借迁移宫星曜，为人处世极具弹性，善于审时度势，外在环境与贵人引导对人生转折尤为关键。' : '主星坐守命垣，主见鲜明，内在自我驱动力强。'}`,
    `《紫微斗数全书·诸星问答论》及倪师《天纪》性格篇：「命宫看先天本性，身宫看后天执着，福德宫看内心深处的喜怒哀乐。」`,
    `发挥【${primaryMingStar}】的${STAR_DESCRIPTIONS[primaryMingStar]?.keywords.split('·')[0] ?? '核心'}禀赋，同时留意【${siHuaLocations['忌']?.palace ?? '化忌宫'}】带来的情绪执念，做到知命而不认命。`,
  );

  // 3. 感情婚姻（夫妻宫 + 福德宫双宫联参）
  const fuqiEff = getEffectiveMajorStars(chart, fuqiPalace);
  const fuqiPrimary = fuqiEff.stars[0] || primaryMingStar;
  const fuqiKnowledge = STAR_IN_FUQI_GU[fuqiPrimary] || STAR_IN_FUQI_GU['紫微'];
  const fuqiSiHua = fuqiPalace.stars.find(s => s.siHua)?.siHua;
  const love = buildPalaceDimension(
    'love',
    fuqiPalace,
    `夫妻宫坐【${fuqiEff.stars.join('、')}】${fuqiEff.isBorrowed ? '（借官禄宫星）' : ''}：${fuqiKnowledge.summary}`,
    `依倪海厦《天纪》「看婚姻必同时参看夫妻宫与福德宫」之核心法则：本盘夫妻宫主星为【${fuqiEff.stars.join('、')}】，${fuqiKnowledge.spouse_traits}。吉象表现：${fuqiKnowledge.good}；需防范事项：${fuqiKnowledge.bad}。${fuqiSiHua ? `且夫妻宫见【化${fuqiSiHua}】：${SIHUA_IN_FUQI_GU[`化${fuqiSiHua}` as keyof typeof SIHUA_IN_FUQI_GU] ?? ''}` : ''} 同时参看福德宫（${getEffectiveMajorStars(chart, fudePalace).stars.join('、')}），福德宫稳则婚姻根基深厚。`,
    fuqiKnowledge.ni_quote ? `倪海厦《天纪》原话：「${fuqiKnowledge.ni_quote}」` : `倪海厦《天纪》：「看婚姻，光看夫妻宫大错特错，一定要同时看福德宫。」`,
    `婚恋建议：${fuqiKnowledge.timing}。日常相处中宜多包容理解，以福德宫之修养涵养夫妻情分。`,
  );

  // 4. 事业职业
  const guanEff = getEffectiveMajorStars(chart, guanPalace);
  const guanPrimary = guanEff.stars[0] || primaryMingStar;
  const guanArchive = STAR_MASTER_ARCHIVE[guanPrimary] || archive;
  const career = buildPalaceDimension(
    'career',
    guanPalace,
    `官禄宫【${guanEff.stars.join('、')}】主事：${guanArchive.careerTrait}`,
    `官禄宫坐落【${STEMS[guanPalace.stem]}${BRANCHES[guanPalace.branch]}】，主星为【${guanEff.stars.join('、')}】${guanEff.isBorrowed ? '（借夫妻宫星曜）' : ''}。倪师《天纪》论事业，必以命宫、财帛宫、官禄宫三方合参：命宫定个人特质，官禄定事业赛道与功名高度，财帛定现金流模式。本盘官禄宫得${guanArchive.role}之气，${guanPalace.stars.some(s => s.type === 'lucky') ? '且有吉星辅佐，职场易得上司提携与团队助力；' : '宜凭硬核专业实力打开局面；'}${guanPalace.stars.some(s => s.siHua === '权' || s.siHua === '禄') ? '宫内见吉化，具备独当一面或执掌实权之象。' : '稳扎稳打、深耕垂直领域最能积累长久声望。'}`,
    `《紫微斗数全书》及倪师《天纪》官禄论：「官禄宫看一个人适合吃公家饭、做专业技术还是自己当老板。」`,
    `核心发展策略：${guanArchive.careerTrait} 凡逢流年行至三方四正吉化之年，皆为晋升或开拓新局之良机。`,
  );

  // 5. 财富运势
  const caiEff = getEffectiveMajorStars(chart, caiPalace);
  const caiPrimary = caiEff.stars[0] || primaryMingStar;
  const caiArchive = STAR_MASTER_ARCHIVE[caiPrimary] || archive;
  const wealth = buildPalaceDimension(
    'wealth',
    caiPalace,
    `财帛宫【${caiEff.stars.join('、')}】司财：${caiArchive.wealthTrait}`,
    `财帛宫居【${STEMS[caiPalace.stem]}${BRANCHES[caiPalace.branch]}】，主星为【${caiEff.stars.join('、')}】，对宫福德宫为【${getEffectiveMajorStars(chart, fudePalace).stars.join('、')}】（倪师强调：福德宫是财帛宫的对宫，心态与福报直接决定求财是否顺遂）。本盘生年化禄在【${siHuaLocations['禄']?.palace ?? '命盘'}】，财帛宫与田宅宫（财库：${getEffectiveMajorStars(chart, tianzhaiPalace).stars.join('、')}）相互呼应，${caiArchive.wealthTrait}`,
    `《紫微斗数全书·论财帛》：「财帛宫看进财之渠道，田宅宫看藏财之库府，福德宫看享财之福气。」`,
    `理财准则：顺应【${caiPrimary}】之求财属性，赚取认知范围内的钱财，定期将流动资金转化为田宅稳健资产以锁住财库。`,
  );

  // 6. 健康状况（严格按倪师看杀星最集中地支 + 疾厄宫子午流注）
  const jieEff = getEffectiveMajorStars(chart, jiePalace);
  const jiePrimary = jieEff.stars[0] || primaryMingStar;
  const jieArchive = STAR_MASTER_ARCHIVE[jiePrimary] || archive;
  const health = buildPalaceDimension(
    'health',
    jiePalace,
    `倪师子午流注定脏腑：重点留意【${organInfo.branch}宫 · ${organInfo.organ}】与【${jieArchive.healthOrgan}】`,
    `倪海厦老师在《天纪》中看健康有独门法则：第一看疾厄宫星曜，第二看全盘煞星与化忌最集中落在哪一个地支宫位，按该地支的子午流注直接定位先天最需保养的脏腑！本盘疾厄宫位于【${BRANCHES[jiePalace.branch]}宫】（对应${jieOrganInfo.organ}），主星【${jieEff.stars.join('、')}】（五行关联：${jieArchive.healthOrgan}）；全盘煞忌能量最集中于【${maxShaPalace.name} · ${organInfo.branch}支】，对应【${organInfo.organ}】（气血当令时间：${organInfo.time}）。`,
    `倪海厦《天纪》与《人纪·黄帝内经》：「十二地支对应十二经络脏腑（子胆丑肝寅肺卯大肠辰胃巳脾午心未小肠申膀胱酉肾戌心包亥三焦），杀星聚何支，即防何脏。」`,
    `养生要诀：1. ${organInfo.advice}；2. 顺应四时阴阳，规律作息，切勿在${organInfo.time}过度耗损气血。`,
  );

  // 7. 兄弟合伙
  const xiongdiEff = getEffectiveMajorStars(chart, xiongdiPalace);
  const family = buildPalaceDimension(
    'family',
    xiongdiPalace,
    `兄弟宫坐【${xiongdiEff.stars.join('、')}】：主手足情缘、现金流周转及核心合伙人关系`,
    `兄弟宫在现代命理中除代表同胞手足外，更是「财帛之田宅」（现金周转库）与亲密事业合伙人之宫位。本盘兄弟宫主星【${xiongdiEff.stars.join('、')}】，${xiongdiPalace.stars.some(s => s.siHua === '忌' || s.name === '巨门') ? '倪师提醒：兄弟宫若见化忌或煞重，与人合伙务必账目分明、先小人后君子，不宜替人做大额财务担保。' : '手足与近友关系总体融洽，关键时刻可得同辈扶持与合作助力。'}`,
    `倪海厦《天纪》：「斗数批六亲虽有局限，但兄弟宫与交友宫一线可直接看合伙成败，化忌入此线绝对不可合伙。」`,
    `与同辈及合伙人往来宜保持清晰权责边界，重义亦须明算账。`,
  );

  // 8. 子女缘分
  const zinvEff = getEffectiveMajorStars(chart, zinvPalace);
  const children = buildPalaceDimension(
    'children',
    zinvPalace,
    `子女宫坐【${zinvEff.stars.join('、')}】：主后代缘分、晚辈门生及才华创作结晶`,
    `子女宫居【${STEMS[zinvPalace.stem]}${BRANCHES[zinvPalace.branch]}】，主星【${zinvEff.stars.join('、')}】，对宫为田宅宫。子女宫不仅反映与晚辈子女的互动模式，也代表个人的门生弟子、团队下属以及才华孵化的项目成果。${zinvPalace.stars.some(s => s.type === 'lucky' || s.siHua === '禄' || s.siHua === '科') ? '宫内吉曜祥和，晚辈聪慧有成，亦利培养团队骨干。' : '对待子女与年轻下属宜因材施教，多予鼓励与独立成长空间。'}`,
    `《紫微斗数全书·论子女》及倪师《天纪》（注：倪师指出斗数批六亲仅供参考，后天教育与地理环境同样关键）。`,
    `对待晚辈与团队新人宜「宽严相济」，尊重其独立命格与天赋方向。`,
  );

  // 9. 迁移外出
  const qianEff = getEffectiveMajorStars(chart, qianPalace);
  const qianPrimary = qianEff.stars[0] || primaryMingStar;
  const move = buildPalaceDimension(
    'move',
    qianPalace,
    `迁移宫坐【${qianEff.stars.join('、')}】：主外出发展机遇、社会第一印象与远方贵人`,
    `倪师《天纪》极为重视迁移宫，因迁移宫与命宫互为表里（对宫），直接决定一个人「宜守祖业还是宜远走高飞」。本盘迁移宫主星【${qianEff.stars.join('、')}】，${qianPalace.stars.some(s => s.name === '天马' || s.siHua === '禄' || s.siHua === '权' || s.type === 'lucky') ? '动中生财、外出会吉，离开出生地或拓展跨地域/跨国业务反而能打开更广阔的天地，在外贵人运强。' : '在外形象鲜明，出行及异地拓展宜稳步推进，提前做好周密规划。'}`,
    `倪海厦《天纪》：「命宫与迁移宫一内一外，迁移宫吉星云集者，越往远方走发展越大。」`,
    `把握【${qianPrimary}】赋予的外部气场，在社交与跨地域合作中主动展现自身核心价值。`,
  );

  // 10. 人际贵人
  const jiaoyouEff = getEffectiveMajorStars(chart, jiaoyouPalace);
  const friends = buildPalaceDimension(
    'friends',
    jiaoyouPalace,
    `交友宫（仆役宫）坐【${jiaoyouEff.stars.join('、')}】：主社交圈层、客户群体与下属得力程度`,
    `交友宫居【${STEMS[jiaoyouPalace.stem]}${BRANCHES[jiaoyouPalace.branch]}】，主星【${jiaoyouEff.stars.join('、')}】。${jiaoyouPalace.stars.some(s => s.name === '巨门' || s.siHua === '忌') ? '倪师在《天纪》中特别叮嘱：交友宫见化忌或巨门陷地，一生需防「升米恩斗米仇」，交友贵精不贵多，重大商业机密与财务切勿轻托外人。' : '人际磁场温和，社交圈层中多有专业能人，善用良师益友可事半功倍。'}`,
    `倪海厦《天纪》：「巨门或化忌在朋友宫，代表跟朋友合伙容易朋友变仇人，单独做生意最好。」`,
    `择友以品行端正、价值观契合为第一准则，君子之交淡如水而久如醇。`,
  );

  // 11. 田宅不动产
  const tianzhaiEff = getEffectiveMajorStars(chart, tianzhaiPalace);
  const home = buildPalaceDimension(
    'home',
    tianzhaiPalace,
    `田宅宫坐【${tianzhaiEff.stars.join('、')}】：主不动产运势、家庭祖业根基与终极藏财之库`,
    `田宅宫居【${STEMS[tianzhaiPalace.stem]}${BRANCHES[tianzhaiPalace.branch]}】，主星【${tianzhaiEff.stars.join('、')}】。在紫微斗数中，财帛宫是「现金流水」，田宅宫才是真正的「大财库」与家庭港湾。${tianzhaiPalace.stars.some(s => ['天府', '太阴', '武曲', '禄存'].includes(s.name) || s.siHua === '禄') ? '本盘田宅宫得财库吉曜拱护，一生极利置业安家，不动产保值增值能力强，家庭根基稳固。' : '置业安家宜循序渐进，注重居家风水采光与藏风聚气（倪师阳宅学核心）。'}`,
    `《紫微斗数全书·论田宅》及倪师《天纪·阳宅篇》：「命好不如运好，运好不如阳宅风水好——名位相等才能纳福。」`,
    `赚取利润后宜优先配置优质不动产或核心稳健资产，居家遵循倪师阳宅「各归其位（父西北、母西南、长男正东等）」原则。`,
  );

  // 12. 精神福德
  const fudeEff = getEffectiveMajorStars(chart, fudePalace);
  const spirit = buildPalaceDimension(
    'spirit',
    fudePalace,
    `福德宫坐【${fudeEff.stars.join('、')}】：主精神世界、内心幸福感、睡眠质量与深层福报`,
    `福德宫居【${STEMS[fudePalace.stem]}${BRANCHES[fudePalace.branch]}】，主星【${fudeEff.stars.join('、')}】。倪师指出，福德宫统管一个人的心理抗压能力、兴趣雅好与婚姻长久度，且与财帛宫相对。${fudePalace.stars.some(s => s.siHua === '忌' || s.type === 'sha') ? '本盘福德宫见煞忌激荡，代表命主思维深邃、闲不下来，常有未雨绸缪之忧思，宜借读书、传统文化、运动或冥想疏导心绪。' : '本盘福德宫气场清朗，精神世界丰盈，懂得在忙碌中寻找生活意趣，晚年福泽深厚。'}`,
    `倪海厦《天纪》：「福德宫是看一个人一辈子快不快乐、想不想得开，很多亿万富翁福德宫化忌一样痛苦不堪。」`,
    `修心即为修福，「境随心转」，保持内心的定力与豁达是招引贵人与财气的根本。`,
  );

  // 13. 父母长辈
  const fumuEff = getEffectiveMajorStars(chart, fumuPalace);
  const parents = buildPalaceDimension(
    'parents',
    fumuPalace,
    `父母宫（相貌/文书宫）坐【${fumuEff.stars.join('、')}】：主父母长辈缘分、上司关系与科甲文书契约`,
    `父母宫居【${STEMS[fumuPalace.stem]}${BRANCHES[fumuPalace.branch]}】，主星【${fumuEff.stars.join('、')}】，对宫为疾厄宫（遗传体质与面相气色之连线）。父母宫不仅看长辈教养，更反映与直属上司、官方机构、资格认证及法律文书契约的顺逆。${fumuPalace.stars.some(s => s.type === 'lucky' || s.siHua === '科' || s.siHua === '禄') ? '本盘父母宫吉化相扶，易得长辈、恩师与贵人上司提携，文书考运亨通。' : '与长辈及上级沟通宜讲究方式方法，签署重大合同文书时务必细致审阅条款。'}`,
    `《紫微斗数全书·论父母》：「父母宫又名相貌宫，兼看文书契约与长上庇荫。」`,
    `孝亲尊师以培植福田，职场中善与上级换位思考，文书印信严谨合规。`,
  );

  return {
    overview,
    personality,
    love,
    career,
    wealth,
    health,
    family,
    children,
    move,
    friends,
    home,
    spirit,
    parents,
  };
}

/** 双人合盘本地五步合参分析结果 */
export interface LocalHemingResult {
  score: number;          // 0-100
  stars: number;          // 1-5 星
  ratingTitle: string;
  summary: string;
  steps: {
    title: string;
    detail: string;
    tag: '大吉' | '吉' | '平' | '需磨合';
  }[];
  flyAtoB: { siHua: SiHua; star: string; targetPalace: string; meaning: string }[];
  flyBtoA: { siHua: SiHua; star: string; targetPalace: string; meaning: string }[];
}

/**
 * 倪海厦《天纪》合盘五步法本地确定性计算（双盘互参 + 四化飞星落宫 + 双宫联参）
 */
export function computeLocalHemingMatch(chartA: ZiweiChart, chartB: ZiweiChart): LocalHemingResult {
  const findP = (c: ZiweiChart, prefix: string) =>
    c.palaces.find(p => p.name.startsWith(prefix)) || c.palaces[0];

  const mingA = findP(chartA, '命宫');
  const mingB = findP(chartB, '命宫');
  const fuqiA = findP(chartA, '夫妻');
  const fuqiB = findP(chartB, '夫妻');
  const fudeA = findP(chartA, '福德');
  const fudeB = findP(chartB, '福德');
  const guanA = findP(chartA, '官禄');
  const guanB = findP(chartB, '官禄');

  const mingStarsA = getEffectiveMajorStars(chartA, mingA).stars;
  const mingStarsB = getEffectiveMajorStars(chartB, mingB).stars;
  const fuqiStarsA = getEffectiveMajorStars(chartA, fuqiA).stars;
  const fuqiStarsB = getEffectiveMajorStars(chartB, fuqiB).stars;
  const fudeStarsA = getEffectiveMajorStars(chartA, fudeA).stars;
  const fudeStarsB = getEffectiveMajorStars(chartB, fudeB).stars;

  let score = 74;

  // 第一步：夫妻宫与命宫互映检测（倪师天作之合标准）
  const aFuqiMatchesBMing = fuqiStarsA.some(s => mingStarsB.includes(s));
  const bFuqiMatchesAMing = fuqiStarsB.some(s => mingStarsA.includes(s));
  let step1Tag: '大吉' | '吉' | '平' | '需磨合' = '吉';
  let step1Detail = '';
  if (aFuqiMatchesBMing && bFuqiMatchesAMing) {
    score += 18;
    step1Tag = '大吉';
    step1Detail = `【天作之合】甲方夫妻宫主星（${fuqiStarsA.join('、')}）与乙方命宫主星（${mingStarsB.join('、')}）双向互映！符合倪师所言「你的夫妻宫正是对方命宫主星」之命中注定正缘结构。`;
  } else if (aFuqiMatchesBMing || bFuqiMatchesAMing) {
    score += 10;
    step1Tag = '大吉';
    step1Detail = `【单向正缘映射】${aFuqiMatchesBMing ? `甲方夫妻宫（${fuqiStarsA.join('、')}）恰好对应乙方命宫（${mingStarsB.join('、')}）` : `乙方夫妻宫（${fuqiStarsB.join('、')}）恰好对应甲方命宫（${mingStarsA.join('、')}）`}，彼此天生具有强烈的宿命吸引力与契合感。`;
  } else {
    step1Tag = '平';
    step1Detail = `甲方命宫【${mingStarsA.join('、')}】配乙方命宫【${mingStarsB.join('、')}】；甲方夫妻宫为【${fuqiStarsA.join('、')}】，乙方夫妻宫为【${fuqiStarsB.join('、')}】，属于互补磨合型结构。`;
  }

  // 第二步：夫妻宫 + 福德宫双宫联参
  const fudeHasJiA = fudeA.stars.some(s => s.siHua === '忌');
  const fudeHasJiB = fudeB.stars.some(s => s.siHua === '忌');
  if (!fudeHasJiA && !fudeHasJiB) {
    score += 6;
  } else {
    score -= 5;
  }
  const step2Detail = `倪师铁律「看婚姻必同看福德宫」：甲方福德宫【${fudeStarsA.join('、')}】，乙方福德宫【${fudeStarsB.join('、')}】。${!fudeHasJiA && !fudeHasJiB ? '双方福德宫均无化忌冲破，精神价值观容易达成长期默契。' : '其中一方福德宫带有化忌课题，相处中需多照顾彼此深层情绪，避免冷战内耗。'}`;

  // 第三步：生年四化飞星互参（甲方生年四化落乙方何宫，乙方生年四化落甲方何宫）
  const calcFly = (fromChart: ZiweiChart, toChart: ZiweiChart) => {
    const stem = fromChart.lunarInfo.yearStem;
    const map = getSiHuaByStem(stem);
    const list: { siHua: SiHua; star: string; targetPalace: string; meaning: string }[] = [];
    (['禄', '权', '科', '忌'] as SiHua[]).forEach(sh => {
      const starName = map[sh];
      const targetP = toChart.palaces.find(p => p.stars.some(s => s.name === starName));
      const pName = targetP?.name ?? '命盘';
      let meaning = '';
      if (sh === '禄') meaning = `将福气、财源与善意带入对方【${pName}】`;
      if (sh === '权') meaning = `在对方【${pName}】领域发挥引导与推动力`;
      if (sh === '科') meaning = `为对方【${pName}】带来贵人声誉与温和包容`;
      if (sh === '忌') meaning = `在对方【${pName}】产生深层羁绊与执着课题，需多加体谅`;
      list.push({ siHua: sh, star: starName, targetPalace: pName, meaning });
    });
    return list;
  };

  const flyAtoB = calcFly(chartA, chartB);
  const flyBtoA = calcFly(chartB, chartA);

  const luToCoreA = flyAtoB.find(f => f.siHua === '禄' && ['命宫', '夫妻宫', '福德宫', '财帛宫'].includes(f.targetPalace));
  const luToCoreB = flyBtoA.find(f => f.siHua === '禄' && ['命宫', '夫妻宫', '福德宫', '财帛宫'].includes(f.targetPalace));
  if (luToCoreA) score += 5;
  if (luToCoreB) score += 5;

  const jiToCoreA = flyAtoB.find(f => f.siHua === '忌' && ['命宫', '夫妻宫'].includes(f.targetPalace));
  const jiToCoreB = flyBtoA.find(f => f.siHua === '忌' && ['命宫', '夫妻宫'].includes(f.targetPalace));
  if (jiToCoreA) score -= 5;
  if (jiToCoreB) score -= 5;

  score = Math.max(55, Math.min(98, score));
  const stars = score >= 88 ? 5 : score >= 78 ? 4 : score >= 68 ? 3 : 2;
  const ratingTitle =
    stars === 5 ? '天作之合 · 宿命正缘' :
    stars === 4 ? '良缘佳配 · 刚柔互济' :
    stars === 3 ? '相知相守 · 互补磨合' : '欢喜冤家 · 需修心包容';

  return {
    score,
    stars,
    ratingTitle,
    summary: `双方合盘综合契合度 ${score} 分（${'★'.repeat(stars)}${'☆'.repeat(5 - stars)}）。甲方（${chartA.wuxingJuName}·${mingStarsA.join('')}坐命）与乙方（${chartB.wuxingJuName}·${mingStarsB.join('')}坐命）在三方四正与四化互参上呈现「${ratingTitle}」之格局。`,
    steps: [
      {
        title: '一、命宫与夫妻宫互映（正缘基准）',
        detail: step1Detail,
        tag: step1Tag,
      },
      {
        title: '二、夫妻宫与福德宫双宫联参（长久度）',
        detail: step2Detail,
        tag: !fudeHasJiA && !fudeHasJiB ? '大吉' : '平',
      },
      {
        title: '三、生年四化飞星互参（能量互动）',
        detail: `甲方生年化禄（${flyAtoB[0]?.star}）飞入乙方【${flyAtoB[0]?.targetPalace}】，乙方生年化禄（${flyBtoA[0]?.star}）飞入甲方【${flyBtoA[0]?.targetPalace}】；甲方化忌落乙方【${flyAtoB[3]?.targetPalace}】，乙方化忌落甲方【${flyBtoA[3]?.targetPalace}】。化禄所落之宫即为彼此最能互相旺益的领域。`,
        tag: luToCoreA || luToCoreB ? '大吉' : '吉',
      },
      {
        title: '四、事业合伙与财帛共振',
        detail: `甲方官禄宫【${getEffectiveMajorStars(chartA, guanA).stars.join('、')}】配乙方官禄宫【${getEffectiveMajorStars(chartB, guanB).stars.join('、')}】，在事业规划与财务决策上宜一人主外开拓、一人主内统筹，形成互补合力。`,
        tag: '吉',
      },
    ],
    flyAtoB,
    flyBtoA,
  };
}
