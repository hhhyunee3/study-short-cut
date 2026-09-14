// 지역(regions.js)·학교(schools.txt) 데이터 접근. 모듈 로드 시 1회 파싱해 Map 으로 보관한다.
import REGIONS from '../regions.js';
import SCHOOLS_RAW from '../schools.txt';

export const SIDO = REGIONS.sido;
// 표시 순서 (수도권·광역시 우선)
export const SIDO_ORDER = ['seoul','gyeonggi','incheon','busan','daegu','gwangju','daejeon','ulsan','sejong','gangwon','chungbuk','chungnam','jeonbuk','jeonnam','gyeongbuk','gyeongnam','jeju'];
export const SIDO_SHORT = { seoul:'서울', gyeonggi:'경기', incheon:'인천', busan:'부산', daegu:'대구', gwangju:'광주', daejeon:'대전', ulsan:'울산', sejong:'세종', gangwon:'강원', chungbuk:'충북', chungnam:'충남', jeonbuk:'전북', jeonnam:'전남', gyeongbuk:'경북', gyeongnam:'경남', jeju:'제주' };
const SHORT_TO_KEY = Object.fromEntries(Object.entries(SIDO_SHORT).map(([k, v]) => [v, k]));

export function sidoFull(key) { return SIDO[key] ? SIDO[key].full : ''; }
export function getSido(key) { return SIDO[key] ? { key, full: SIDO[key].full, sgg: SIDO[key].sgg } : null; }
export function getSgg(sidoKey, sggKey) {
  const s = SIDO[sidoKey]; if (!s || !s.sgg[sggKey]) return null;
  const v = s.sgg[sggKey];
  return { key: sggKey, name: v.d, dongs: v.l };
}
export function getDong(sidoKey, sggKey, dongSlug) {
  const g = getSgg(sidoKey, sggKey); if (!g) return null;
  const hit = g.dongs.find(d => d[3] === dongSlug || d[0] === dongSlug);
  return hit ? { name: hit[0], code: hit[1], kind: hit[2], slug: hit[3] } : null;
}
export function sggList(sidoKey) {
  const s = SIDO[sidoKey]; if (!s) return [];
  return Object.entries(s.sgg).map(([key, v]) => ({ key, name: v.d, count: v.l.length }))
    .sort((a, b) => a.name.localeCompare(b.name, 'ko'));
}
export function dongList(sidoKey, sggKey) {
  const g = getSgg(sidoKey, sggKey); if (!g) return [];
  return g.dongs.map(d => ({ name: d[0], slug: d[3], kind: d[2] })).sort((a, b) => a.name.localeCompare(b.name, 'ko'));
}
export function neighbors(sidoKey, sggKey, dongSlug, n = 5) {
  const g = getSgg(sidoKey, sggKey); if (!g) return [];
  const idx = g.dongs.findIndex(d => d[3] === dongSlug);
  const out = [];
  for (let off = 1; off < g.dongs.length && out.length < n; off++) {
    if (idx - off >= 0) out.push(g.dongs[idx - off]);
    if (out.length >= n) break;
    if (idx + off < g.dongs.length) out.push(g.dongs[idx + off]);
  }
  return out.map(d => ({ name: d[0], slug: d[3] }));
}
export function regionCounts() {
  let sgg = 0, dong = 0;
  for (const s of Object.values(SIDO)) for (const g of Object.values(s.sgg)) { sgg++; dong += g.l.length; }
  return { sido: Object.keys(SIDO).length, sgg, dong };
}
// 시군구 한글 표시명 → 슬러그 (학교 데이터 연결용). 옛 행정구역 이름은 현재 이름으로 바꿔 찾는다.
const SGG_ALIAS = { '남구|incheon': '미추홀구', '여주군': '여주시', '포천군': '포천시', '당진군': '당진시' };
let _sggByName = null;
function sggByName() {
  if (_sggByName) return _sggByName;
  _sggByName = new Map();
  for (const [sk, sv] of Object.entries(SIDO)) for (const [gk, gv] of Object.entries(sv.sgg)) _sggByName.set(sk + '|' + gv.d, gk);
  return _sggByName;
}
export function sggKeyByName(sidoKey, sggName) {
  const m = sggByName();
  let n = (SGG_ALIAS[sggName + '|' + sidoKey] || SGG_ALIAS[sggName] || sggName).trim();
  if (sidoKey === 'sejong') return 'sejong';
  if (m.has(sidoKey + '|' + n)) return m.get(sidoKey + '|' + n);
  // "수원시영통구" 처럼 붙어 쓴 이름 → "수원시 영통구"
  const sp = n.replace(/([시])([가-힣]+구)$/, '$1 $2');
  if (m.has(sidoKey + '|' + sp)) return m.get(sidoKey + '|' + sp);
  return null;
}
export function dongSlugByName(sidoKey, sggKey, dongName) {
  const g = getSgg(sidoKey, sggKey); if (!g) return null;
  const hit = g.dongs.find(d => d[0] === dongName);
  return hit ? hit[3] : null;
}

// ---------------- 학교 ----------------
// schools.txt 형식: "#시도약칭" / ">시군구" / "동|<급><설립><남녀>이름=슬러그,..."
// 급 E/M/H, 설립 P(공립) R(사립) N(국립), 남녀 C(공학) B(남) G(여) ?(미상)
export const LEVEL_KOR = { E: '초등학교', M: '중학교', H: '고등학교' };
export const LEVEL_SHORT = { E: '초등', M: '중등', H: '고등' };
export const LEVEL_GRADE = { E: 'elementary', M: 'middle', H: 'high' };
let _bySlug = null, _byName = null, _byDong = null, _bySgg = null, _all = null;
function build() {
  if (_bySlug) return;
  _bySlug = new Map(); _byName = new Map(); _byDong = new Map(); _bySgg = new Map(); _all = [];
  let sidoShort = '', sggName = '';
  for (const line of SCHOOLS_RAW.split('\n')) {
    if (!line) continue;
    if (line[0] === '#') { sidoShort = line.slice(1).trim(); continue; }
    if (line[0] === '>') { sggName = line.slice(1).trim(); continue; }
    const bar = line.indexOf('|'); if (bar < 0) continue;
    const dong = line.slice(0, bar);
    const sidoKey = SHORT_TO_KEY[sidoShort] || '';
    const sggKey = sidoKey ? sggKeyByName(sidoKey, sggName) : null;
    const dongSlug = sggKey ? dongSlugByName(sidoKey, sggKey, dong) : null;
    for (const raw of line.slice(bar + 1).split(',')) {
      if (raw.length < 4) continue;
      const eq = raw.indexOf('=');
      const level = raw[0], founder = raw[1], coed = raw[2];
      const base = eq > 0 ? raw.slice(3, eq) : raw.slice(3);
      const slug = eq > 0 ? raw.slice(eq + 1) : '';
      if (!slug) continue;
      const s = {
        name: base + LEVEL_KOR[level], base, slug, level,
        sidoKey, sidoShort, sidoFull: sidoFull(sidoKey) || sidoShort, sggKey, sggName, dong, dongSlug,
        founder: founder === 'P' ? '공립' : founder === 'R' ? '사립' : founder === 'N' ? '국립' : '',
        coed: coed === 'C' ? '남녀공학' : coed === 'B' ? '남학교' : coed === 'G' ? '여학교' : '',
      };
      _all.push(s);
      _bySlug.set(slug, s);
      if (!_byName.has(s.name)) _byName.set(s.name, s);
      const dk = sidoShort + '|' + sggName + '|' + dong;
      if (!_byDong.has(dk)) _byDong.set(dk, []);
      _byDong.get(dk).push(s);
      const gk = sidoKey + '|' + sggName;
      if (!_bySgg.has(gk)) _bySgg.set(gk, []);
      _bySgg.get(gk).push(s);
    }
  }
}
export function allSchools() { build(); return _all; }
export function schoolBySlug(slug) { build(); return _bySlug.get(slug) || null; }
const ABBR = [['여고', '여자고등학교'], ['여중', '여자중학교'], ['공고', '공업고등학교'], ['상고', '상업고등학교'], ['예고', '예술고등학교'], ['외고', '외국어고등학교'], ['과고', '과학고등학교'], ['디고', '디자인고등학교'], ['미고', '미술고등학교']];
export function findSchool(name) {
  build();
  name = (name || '').replace(/\s+/g, '');
  if (_byName.has(name)) return _byName.get(name);
  for (const sfx of ['등학교', '학교']) if (_byName.has(name + sfx)) return _byName.get(name + sfx);
  for (const [a, f] of ABBR) if (name.endsWith(a)) { const t = name.slice(0, -a.length) + f; if (_byName.has(t)) return _byName.get(t); }
  for (const s of _all) if (s.base === name) return s;
  return null;
}
export function schoolsNear(s, n = 6) {
  build();
  return (_byDong.get(s.sidoShort + '|' + s.sggName + '|' + s.dong) || []).filter(x => x.slug !== s.slug).slice(0, n);
}
export function schoolsInDong(sidoShort, sggName, dong) { build(); return _byDong.get(sidoShort + '|' + sggName + '|' + dong) || []; }
// 시도별 → 시군구별 학교 통계
let _stats = null;
export function schoolStats() {
  build();
  if (_stats) return _stats;
  _stats = {};
  for (const s of _all) {
    if (!s.sidoKey) continue;
    const S = _stats[s.sidoKey] || (_stats[s.sidoKey] = { total: 0, E: 0, M: 0, H: 0, sgg: {} });
    S.total++; S[s.level]++;
    const G = S.sgg[s.sggName] || (S.sgg[s.sggName] = { key: s.sggKey, total: 0, E: 0, M: 0, H: 0, list: [] });
    G.total++; G[s.level]++; G.list.push(s);
  }
  return _stats;
}
export function searchSchools(q, limit = 10) {
  build();
  q = (q || '').replace(/\s+/g, '');
  if (!q) return [];
  const qs = [q];
  for (const [a, f] of ABBR) if (q.endsWith(a)) qs.push(q.slice(0, -a.length) + f);
  const out = [];
  for (const s of _all) {
    for (const qq of qs) if (s.name.includes(qq) || s.base.includes(qq)) { out.push(s); break; }
    if (out.length >= limit * 4) break;
  }
  out.sort((a, b) => (a.base.startsWith(q) ? 0 : 1) - (b.base.startsWith(q) ? 0 : 1) || a.name.length - b.name.length);
  return out.slice(0, limit);
}
// 지역 이름 검색 (검색창에서 "강남구", "역삼동" 같은 입력)
export function findRegionByName(q) {
  q = (q || '').trim();
  if (!q) return null;
  if (SHORT_TO_KEY[q]) return { sido: SHORT_TO_KEY[q] };
  for (const [sk, sv] of Object.entries(SIDO)) {
    if (sv.full === q || sv.full.startsWith(q) && q.length >= 2 && sv.full.replace(/(특별자치시|특별자치도|광역시|특별시|도)$/, '') === q) return { sido: sk };
    for (const [gk, gv] of Object.entries(sv.sgg)) {
      if (gv.d === q || gv.d.split(' ').pop() === q) return { sido: sk, sgg: gk };
    }
  }
  for (const [sk, sv] of Object.entries(SIDO)) for (const [gk, gv] of Object.entries(sv.sgg)) for (const d of gv.l) if (d[0] === q) return { sido: sk, sgg: gk, dong: d[3] };
  return null;
}
