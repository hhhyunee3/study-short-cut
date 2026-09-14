// 진입점: 라우터. 페이지 생성은 lib/pages-*.js, 공통 레이아웃은 lib/core.js, 데이터는 lib/data.js.
import SITE from './site.js';
import { setEnv, PR, STYLES_CSS, subjInfo, GRADE_INFO, ALL_SUBJ_KEYS, ABS } from './lib/core.js';
import { getSido, getSgg, getDong, findSchool, schoolBySlug, searchSchools, findRegionByName, sggKeyByName, sidoFull, SIDO_ORDER } from './lib/data.js';
import { subjectMainPage, sidoPage, sggPage, dongPage, gradePage, regionsPage } from './lib/pages-subject.js';
import { schoolsHubPage, schoolsSidoPage, schoolsSggPage, schoolPage, schoolSubjectPage } from './lib/pages-school.js';
import { homePage, calculatorPage, guidesHubPage, guidePostPage, notFoundPage } from './lib/pages-misc.js';
import { sitemapIndex, sitemapFor, robotsTxt, rssXml, llmsTxt, indexNowSubmit, autoPingIndexNow, allSitemapPaths } from './lib/seo.js';
import { handleContact } from './lib/contact.js';

const page = r => r ? PR(r, r.body, r.form || {}) : null;
const redirect = (to, status = 301) => Response.redirect(to, status);
const json = o => new Response(JSON.stringify(o), { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=300' } });

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    setEnv(env, url.hostname); SITE._env = env;
    let path = url.pathname;
    // wrangler dev 는 routes 의 도메인으로 url 을 바꿔 주므로 실제 접속 호스트는 Host 헤더로 본다
    const host = (request.headers.get('host') || url.hostname).split(':')[0];
    const onDomain = host === SITE.domain || host === 'www.' + SITE.domain;

    // http→https, www→apex (실제 도메인에서만)
    // http 여부는 Cloudflare 가 넣는 cf-visitor 로 본다 (wrangler dev 는 url 을 http://도메인 으로 바꿔 주기 때문)
    let visitorHttp = false; try { visitorHttp = JSON.parse(request.headers.get('cf-visitor') || '{}').scheme === 'http'; } catch (e) {}
    if (onDomain && (visitorHttp || host.startsWith('www.'))) return redirect(ABS(path) + url.search, 301);

    // 여러 슬래시 정리
    if (/\/{2,}/.test(path)) return redirect((onDomain ? SITE.origin : url.origin) + path.replace(/\/{2,}/g, '/') + url.search, 301);

    if (path === '/api/contact') {
      if (request.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
      return handleContact(request, env);
    }
    if (path === '/api/sch-suggest') {
      const q = (url.searchParams.get('q') || '').trim();
      return json(q ? searchSchools(q, 10).map(s => ({ name: s.name, slug: s.slug, level: s.level, sgg: s.sggName, dong: s.dong })) : []);
    }
    if (path === '/api/indexnow' && request.method === 'POST') {
      try { const b = await request.json(); const urls = (b.urls || []).filter(u => typeof u === 'string' && u.startsWith(SITE.origin)); if (!urls.length) return json({ ok: false, error: 'urls 필요' }); return json({ ok: true, results: await indexNowSubmit(urls) }); } catch (e) { return json({ ok: false, error: String(e.message || e) }); }
    }
    if (path === '/styles.css') return new Response(STYLES_CSS, { headers: { 'Content-Type': 'text/css; charset=utf-8', 'Cache-Control': 'public, max-age=86400' } });
    if (path === '/robots.txt') return robotsTxt();
    if (path === '/llms.txt') return llmsTxt();
    if (path === '/rss.xml' || path === '/feed.xml') return rssXml();
    if (path === `/${SITE.indexNowKey}.txt`) return new Response(SITE.indexNowKey, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    if (path === '/sitemap.xml') return sitemapIndex();
    { const m = path.match(/^\/sitemap-([a-z]+)\.xml$/); if (m) { const r = sitemapFor(m[1]); if (r) return r; } }
    if (path === '/favicon.ico') return redirect(url.origin + '/favicon.png', 301);

    // 끝 슬래시 통일: 파일 확장자 없는 주소는 슬래시로 301
    if (path !== '/' && !path.endsWith('/') && !/\.[a-z0-9]{2,5}$/i.test(path)) return redirect((onDomain ? SITE.origin : url.origin) + path + '/' + url.search, 301);
    if (path === '/index.html' || path === '/index.html/') return redirect((onDomain ? SITE.origin : url.origin) + '/', 301);

    // 학교 검색 → 리디렉트
    if (path === '/search/') {
      const q = (url.searchParams.get('q') || '').trim();
      if (!q) return redirect(url.origin + '/schools/', 302);
      const sch = findSchool(q) || searchSchools(q, 1)[0];
      if (sch) return redirect(url.origin + '/school/' + sch.slug + '/', 302);
      const reg = findRegionByName(q);
      if (reg) { const first = SITE.subjects[0]; if (reg.dong) return redirect(`${url.origin}/${reg.sido}/${reg.sgg}/${reg.dong}/${first}/`, 302); if (reg.sgg) return redirect(`${url.origin}/schools/${reg.sido}/${reg.sgg}/`, 302); return redirect(`${url.origin}/schools/${reg.sido}/`, 302); }
      return redirect(url.origin + '/schools/', 302);
    }

    // 콘텐츠 페이지는 IndexNow 자동 제출(하루 1회)
    if (request.method === 'GET' && path.length > 1 && !path.startsWith('/api/')) autoPingIndexNow(path, ctx);

    const seg = path.split('/').filter(Boolean).map(s => { try { return decodeURIComponent(s); } catch (e) { return s; } });
    let r = null;
    if (seg.length === 0) r = homePage();
    else if (seg[0] === 'regions' && seg.length === 1) r = regionsPage();
    else if (seg[0] === 'tools') { if (seg.length === 2 && seg[1] === 'grade-calculator') r = calculatorPage(); else if (seg.length === 1) return redirect(url.origin + '/tools/grade-calculator/', 301); }
    else if (seg[0] === 'guides') { if (seg.length === 1) r = guidesHubPage(); else if (seg.length === 2) r = guidePostPage(seg[1]); }
    else if (seg[0] === 'schools') {
      if (seg.length === 1) r = schoolsHubPage();
      else if (seg.length === 2) r = schoolsSidoPage(seg[1]);
      else if (seg.length === 3) r = schoolsSggPage(seg[1], seg[2]);
    }
    else if (seg[0] === 'school' && (seg.length === 2 || seg.length === 3)) {
      let s = schoolBySlug(seg[1]);
      if (!s) { s = findSchool(seg[1]); if (s) return redirect(url.origin + '/school/' + s.slug + '/' + (seg[2] ? seg[2] + '/' : ''), 301); }
      if (s) r = seg.length === 2 ? schoolPage(s.slug) : schoolSubjectPage(s.slug, seg[2]);
    }
    else if (seg.length === 1 && subjInfo(seg[0])) r = subjectMainPage(seg[0]);
    else if (seg.length >= 2 && getSido(seg[0])) {
      const sidoKey = seg[0], key = seg[seg.length - 1];
      if (subjInfo(key)) {
        if (seg.length === 2) r = sidoPage(sidoKey, key);
        else if (seg.length === 3) r = sggPage(sidoKey, seg[1], key);
        else if (seg.length === 4) r = GRADE_INFO[seg[2]] ? gradePage(sidoKey, seg[1], null, seg[2], key) : dongPage(sidoKey, seg[1], seg[2], key);
        else if (seg.length === 5 && GRADE_INFO[seg[3]]) r = gradePage(sidoKey, seg[1], seg[2], seg[3], key);
      } else if (seg.length <= 3) {
        // /{sido}/ 또는 /{sido}/{sgg}/ → 첫 과목 페이지로
        const first = SITE.subjects[0];
        if (seg.length === 1 || getSgg(sidoKey, seg[1])) return redirect(url.origin + path + first + '/', 301);
      }
    }
    else if (seg.length === 1 && getSido(seg[0])) return redirect(url.origin + path + SITE.subjects[0] + '/', 301);

    if (r) return page(r);
    const nf = notFoundPage();
    return PR(nf, nf.body, nf.form, { status: 404, cache: 'public, max-age=300' });
  },

  // 매일 사이트맵 주소를 500개씩 돌아가며 IndexNow 에 제출
  async scheduled(event, env, ctx) {
    const all = allSitemapPaths();
    const BATCH = 500;
    const day = Math.floor(Date.now() / 86400000);
    const start = (day * BATCH) % all.length;
    let slice = all.slice(start, start + BATCH);
    if (slice.length < BATCH) slice = slice.concat(all.slice(0, BATCH - slice.length));
    ctx.waitUntil(indexNowSubmit(slice));
  },
};
