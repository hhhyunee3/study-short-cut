// robots · sitemap(분할) · rss · llms.txt · IndexNow
import SITE from '../site.js';
import CONTENT from '../content.js';
import GUIDES from '../guides.js';
import { SIDO_ORDER, SIDO, sidoFull, sggList, dongList, schoolStats, allSchools, regionCounts } from './data.js';
import { subjInfo, ALL_SUBJ_KEYS, GRADE_INFO, esc, ABS } from './core.js';

// 사이트맵 단계 개방. 페이지는 항상 살아 있고, 여기서 끄는 것은 "적극적으로 알리지 않는다"는 뜻이다.
// 상위(시도·시군구·학교 페이지) 색인이 자리 잡은 뒤(색인 수천 이상) 아래를 차례로 켠다.
export const SITEMAP_TIERS = {
  dongPages: true,       // 동 + 과목 (약 5,000 × 과목 수)
  gradePagesSgg: false,   // 시군구 + 학년 + 과목
  gradePagesDong: true,  // 동 + 학년 + 과목
  schoolSubject: true,   // 학교 + 과목
};

const xml = (body, cache = 'public, max-age=3600') => new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': cache } });
const urlset = urls => `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `<url><loc>${u[0]}</loc><lastmod>${u[2] || SITE.updated}</lastmod><priority>${u[1]}</priority></url>`).join('\n')}\n</urlset>`;

// 사이트맵 한 파일의 주소 상한은 규격상 5만이다. 학교 주소가 그보다 많아 나눠 싣는다.
const SCHOOL_CHUNK = 20000;
let _schoolUrls = null;
const schoolUrlsCached = () => (_schoolUrls || (_schoolUrls = schoolUrls()));
const schoolChunkCount = () => Math.max(1, Math.ceil(schoolUrlsCached().length / SCHOOL_CHUNK));
export function sitemapNames() { return ['main', ...ALL_SUBJ_KEYS, ...Array.from({ length: schoolChunkCount() }, (_, i) => `school-${i + 1}`)]; }
export function sitemapIndex() {
  const items = sitemapNames().map(n => `<sitemap><loc>${ABS(`/sitemap-${n}.xml`)}</loc><lastmod>${SITE.updated}</lastmod></sitemap>`).join('\n');
  return xml(`<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items}\n</sitemapindex>`);
}
export function mainUrls() {
  const u = [[ABS('/'), '1.0'], [ABS('/regions/'), '0.8'], [ABS('/schools/'), '0.9'], [ABS('/tools/grade-calculator/'), '0.7']];
  for (const k of ALL_SUBJ_KEYS) u.push([ABS(`/${k}/`), '0.9']);
  if (GUIDES.length) { u.push([ABS('/guides/'), '0.8']); for (const g of GUIDES) u.push([ABS(`/guides/${g.slug}/`), '0.7', g.updated || g.date]); }
  return u;
}
export function subjectUrls(key) {
  const s = subjInfo(key); if (!s) return null;
  const u = [];
  for (const sk of SIDO_ORDER) {
    u.push([ABS(`/${sk}/${key}/`), '0.8']);
    for (const g of sggList(sk)) {
      u.push([ABS(`/${sk}/${g.key}/${key}/`), '0.7']);
      if (SITEMAP_TIERS.gradePagesSgg && s.grade) for (const gr of Object.keys(GRADE_INFO)) if (s.grade[gr]) u.push([ABS(`/${sk}/${g.key}/${gr}/${key}/`), '0.5']);
      if (SITEMAP_TIERS.dongPages) for (const d of dongList(sk, g.key)) {
        u.push([ABS(`/${sk}/${g.key}/${d.slug}/${key}/`), '0.6']);
        if (SITEMAP_TIERS.gradePagesDong && s.grade) for (const gr of Object.keys(GRADE_INFO)) if (s.grade[gr]) u.push([ABS(`/${sk}/${g.key}/${d.slug}/${gr}/${key}/`), '0.4']);
      }
    }
  }
  return u;
}
export function schoolUrls() {
  const st = schoolStats();
  const u = [];
  for (const sk of SIDO_ORDER) {
    if (!st[sk]) continue;
    u.push([ABS(`/schools/${sk}/`), '0.8']);
    for (const v of Object.values(st[sk].sgg)) if (v.key) u.push([ABS(`/schools/${sk}/${v.key}/`), '0.7']);
  }
  for (const s of allSchools()) {
    u.push([ABS(`/school/${s.slug}/`), '0.6']);
    if (SITEMAP_TIERS.schoolSubject) for (const k of SITE.subjects) u.push([ABS(`/school/${s.slug}/${k}/`), '0.5']);
  }
  return u;
}
export function sitemapFor(name) {
  if (name === 'main') return xml(urlset(mainUrls()));
  { const m = name.match(/^school(?:-(\d+))?$/); if (m) { const i = m[1] ? +m[1] - 1 : 0; const part = schoolUrlsCached().slice(i * SCHOOL_CHUNK, (i + 1) * SCHOOL_CHUNK); return part.length ? xml(urlset(part), 'public, max-age=86400') : null; } }
  const u = subjectUrls(name); if (!u) return null;
  return xml(urlset(u), 'public, max-age=86400');
}
// IndexNow 회전 제출용 전체 목록(사이트맵에 실린 주소만)
export function allSitemapPaths() {
  const out = mainUrls().map(u => u[0]);
  for (const k of ALL_SUBJ_KEYS) for (const u of subjectUrls(k) || []) out.push(u[0]);
  for (const u of schoolUrls()) out.push(u[0]);
  return out;
}

export function robotsTxt() {
  const e = SITE._env || {};
  const bots = ['Yeti', 'Googlebot', 'Bingbot', 'GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-User', 'Claude-SearchBot', 'anthropic-ai', 'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'CCBot', 'Amazonbot'];
  let body = `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /search/\n\n` + bots.map(b => `User-agent: ${b}\nAllow: /`).join('\n\n') + `\n\nSitemap: ${ABS('/sitemap.xml')}\n` + sitemapNames().map(n => `Sitemap: ${ABS(`/sitemap-${n}.xml`)}`).join('\n') + '\n';
  if (e.DAUM_PIN) body += `\n#DaumWebMasterTool:${e.DAUM_PIN}\n`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=86400' } });
}

export function rssXml() {
  const items = [];
  const pub = new Date(SITE.updated + 'T09:00:00+09:00').toUTCString();
  items.push({ t: `${SITE.name} - ${SITE.tagline}`, u: ABS('/'), d: SITE.desc, p: pub });
  for (const g of [...GUIDES].sort((a, b) => b.date.localeCompare(a.date))) items.push({ t: g.h1, u: ABS(`/guides/${g.slug}/`), d: g.desc, p: new Date(g.date + 'T09:00:00+09:00').toUTCString() });
  for (const k of ALL_SUBJ_KEYS) { const s = subjInfo(k); items.push({ t: `${s.kor} 과외 - ${s.tagline}`, u: ABS(`/${k}/`), d: s.short, p: pub }); }
  items.push({ t: '학교별 1:1 과외', u: ABS('/schools/'), d: CONTENT.school.hubLead, p: pub }, { t: '전국 지역 안내', u: ABS('/regions/'), d: CONTENT.regions.lead, p: pub });
  outer: for (const sk of SIDO_ORDER) for (const k of SITE.subjects) { if (items.length >= 50) break outer; const s = subjInfo(k); items.push({ t: `${sidoFull(sk)} ${s.kor} 과외 - 시군구별 1:1 맞춤 수업`, u: ABS(`/${sk}/${k}/`), d: `${sidoFull(sk)} 학생을 위한 1:1 ${s.kor} 과외. ${s.short}`, p: pub }); }
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>${esc(SITE.name)} - ${esc(SITE.tagline)}</title><link>${ABS('/')}</link><atom:link href="${ABS('/rss.xml')}" rel="self" type="application/rss+xml"/><description>${esc(SITE.desc)}</description><language>ko-KR</language><lastBuildDate>${new Date().toUTCString()}</lastBuildDate>\n${items.map(i => `<item><title><![CDATA[${i.t}]]></title><link>${i.u}</link><guid>${i.u}</guid><pubDate>${i.p}</pubDate><description><![CDATA[${i.d}]]></description></item>`).join('\n')}\n</channel></rss>`;
  return new Response(body, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
}

export function llmsTxt() {
  const c = regionCounts();
  const subj = ALL_SUBJ_KEYS.map(k => { const s = subjInfo(k); return `- [${s.kor} 과외](${ABS(`/${k}/`)}): ${s.short}`; }).join('\n');
  const body = `# ${SITE.name}

> ${SITE.desc} ${SITE.tagline}. 초·중·고 학생 대상 1:1 방문·화상 과외를 상담 후 연결한다. 전국 ${c.sido}개 시도, ${c.sgg}개 시군구, ${c.dong.toLocaleString()}개 동·읍·면 단위 안내 페이지와 ${allSchools().length.toLocaleString()}개 학교 페이지를 제공한다.

## 과목
${subj}

## 주요 페이지
- [전국 지역 안내](${ABS('/regions/')}): 시도 > 시군구 > 동 순서로 지역을 골라 과외 안내로 이동
- [학교별 수업](${ABS('/schools/')}): 학교 이름 검색. 학교 페이지는 ${ABS('/school/<슬러그>/')} 형식
- [내신 등급 계산기](${ABS('/tools/grade-calculator/')}): 석차 기반 9등급·5등급 계산
- [교육정보](${ABS('/guides/')}): 시험 준비·공부법·과외 고르는 기준
${GUIDES.map(g => `- [${g.h1}](${ABS(`/guides/${g.slug}/`)})`).join('\n')}

## URL 구조 (끝에 슬래시)
- 과목: /math/ /english/ /korean/ /science/ /social/ 등
- 시도×과목: /seoul/math/ · 시군구×과목: /seoul/gangnam-gu/math/ · 동×과목: /seoul/gangnam-gu/yeoksam-dong/math/
- 학년: /seoul/gangnam-gu/high/math/ (elementary·middle·high)

## 문의
무료 상담 ${SITE.tel} · ${ABS('/#consult-form')}
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=86400' } });
}

// IndexNow — 콘텐츠 페이지 방문 시 하루 1회 자동 제출(캐시 마커), /api/indexnow 수동 제출, 매일 회전 제출
export async function indexNowSubmit(urls) {
  const body = JSON.stringify({ host: SITE.domain, key: SITE.indexNowKey, keyLocation: ABS(`/${SITE.indexNowKey}.txt`), urlList: urls.slice(0, 10000) });
  const results = [];
  for (const ep of ['https://api.indexnow.org/IndexNow', 'https://searchadvisor.naver.com/indexnow']) {
    try { const r = await fetch(ep, { method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' }, body }); results.push({ ep, status: r.status }); } catch (e) { results.push({ ep, error: String(e && e.message || e) }); }
  }
  return results;
}
export function autoPingIndexNow(path, ctx) {
  try {
    if (typeof caches === 'undefined' || !caches.default || !ctx || !ctx.waitUntil) return;
    const today = new Date().toISOString().slice(0, 10);
    const marker = new Request(ABS('/__pinged/' + today + '/' + encodeURIComponent(path)));
    ctx.waitUntil((async () => {
      try {
        if (await caches.default.match(marker)) return;
        await indexNowSubmit([ABS(path)]);
        await caches.default.put(marker, new Response('1', { headers: { 'Cache-Control': 'max-age=86400' } }));
      } catch (e) {}
    })());
  } catch (e) {}
}
