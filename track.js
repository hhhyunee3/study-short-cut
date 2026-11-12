// 방문·전환 수집 (jihyun_stats D1) — 16개 사이트 공통 모듈.
// 원본은 ~/projects/jihyun-stats/track.js 하나다. 각 사이트의 track.js 는 sync-track.sh 가 복사한 사본이니 직접 고치지 않는다.
// 단말기(thesave-new)는 build.mjs 가 이 파일의 export 를 떼고 워커 한 파일에 합친다 — 그래서 import 없이 혼자 돈다.
//
//   export default withTracking({ ...__APP, fetch: ... }, SITE.domain);
//
//  1) HTML(GET·200) 응답의 </body> 앞에 작은 스크립트를 붙인다(HTMLRewriter — 응답을 기다리지 않고 흘려보낸다).
//     view 는 페이지가 화면에 보이는 상태로 VIEW_MS(누적) 머물렀거나, 그 전에 사람이 직접 조작(휠·터치 스크롤·키·포인터)했을 때 한 번 보낸다.
//     뒤 탭으로 열린 동안·사전 렌더링 중에는 시간을 세지 않는다. 크롤러 묶음(3~15초에 여러 페이지)을 거르려는 것이다.
//     tel: 링크·카카오톡 채널 링크를 누르면 아직 안 보낸 view 를 먼저 보내고 tel/kakao 를 /_t 로 sendBeacon 한다.
//     JS 를 실행하지 않는 크롤러는 view 에 잡히지 않는다.
//  2) /_t 는 바로 204 로 답하고, D1 기록은 ctx.waitUntil 로 뒤에서 한다. Origin 이 그 사이트 자기 도메인(+www)이 아니면(없는 경우 포함) 기록하지 않는다.
//  3) 신청(form)은 버튼 클릭이 아니라 /api/contact 가 실제로 접수({ok:true})됐을 때 서버에서 센다.
//     입력 오류로 막힌 클릭·숨은 칸(hp)이 채워진 봇 접수는 세지 않는다.
//
// 방문자 식별: sha256(IP + User-Agent + KST 날짜 + STATS_SALT) 앞 32자. 원본 IP·UA 는 저장하지 않는다.
// 날짜가 들어가므로 같은 사람도 날이 바뀌면 다른 해시가 된다 → 순방문은 하루 단위다.
// STATS_SALT(워커 시크릿)나 STATS(D1 바인딩)가 없으면 아무것도 기록하지 않는다.

const BOT_RE = /bot|crawl|spider|slurp|scrap|headless|phantom|selenium|puppeteer|playwright|lighthouse|pagespeed|inspectiontool|google-?other|mediapartners|facebookexternalhit|yeti|daumoa|bytespider|petalbot|ahrefs|semrush|mj12|dotbot|dataforseo|serpstat|archiver|monitor|uptime|python|curl|wget|httpclient|okhttp|go-http|java\/|node-fetch|axios|libwww|scrapy/i;
const KAKAO_RE = /^kakaotalk:|^https?:\/\/(pf|open|qr)\.kakao\.com\//i;
const TYPES = { view: 1, tel: 1, kakao: 1 };
const KST = 9 * 3600000;

// view 를 보내기까지 화면에 보여야 하는 누적 시간(ms)
const VIEW_MS = 5000;

const SCRIPT = '<script>(function(){var U="/_t",M=' + VIEW_MS + ',d=document,done=0,acc=0,t0=0,tm=0;'
  + 'function s(t){try{var b=JSON.stringify({t:t,p:location.pathname,r:t==="view"?d.referrer:""});if(!(navigator.sendBeacon&&navigator.sendBeacon(U,b)))fetch(U,{method:"POST",body:b,keepalive:true}).catch(function(){})}catch(e){}}'
  + 'function v(){if(done)return;done=1;clearTimeout(tm);s("view")}'
  + 'function go(){if(done||t0||d.prerendering||d.visibilityState!=="visible")return;t0=Date.now();tm=setTimeout(v,Math.max(0,M-acc))}'
  + 'function stop(){if(!t0)return;acc+=Date.now()-t0;t0=0;clearTimeout(tm)}'
  + 'd.addEventListener("visibilitychange",function(){d.visibilityState==="visible"?go():stop()});'
  + 'if(d.prerendering)d.addEventListener("prerenderingchange",go,{once:true});else go();'
  + 'function u(e){if(e.isTrusted)v()}["wheel","touchmove","keydown","pointerdown"].forEach(function(n){addEventListener(n,u,{passive:true,capture:true})});'
  + 'd.addEventListener("click",function(e){var a=e.target&&e.target.closest&&e.target.closest("a[href]");if(!a)return;var h=a.getAttribute("href")||"";'
  + 'if(/^tel:/i.test(h)){v();s("tel")}else if(' + KAKAO_RE + '.test(h)){v();s("kakao")}},true)})();</script>';

const isBot = ua => !ua || BOT_RE.test(ua);
const clip = (v, n) => typeof v === 'string' ? v.slice(0, n) : '';
// 경로는 '/' 로 시작하는 것만, 유입은 쿼리를 뺀 origin+경로만 남긴다
const cleanPath = p => { p = clip(p, 300); return p.startsWith('/') ? p : ''; };
const cleanRef = r => { try { const u = new URL(clip(r, 500)); return /^https?:$/.test(u.protocol) ? (u.origin + u.pathname).slice(0, 300) : ''; } catch (e) { return ''; } };

async function visitorHash(request, env, ua) {
  const ip = request.headers.get('cf-connecting-ip') || '';
  const day = new Date(Date.now() + KST).toISOString().slice(0, 10);
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip + '|' + ua + '|' + day + '|' + env.STATS_SALT));
  return [...new Uint8Array(buf)].slice(0, 16).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function record(request, env, site, type, path, ref, ua) {
  try {
    const vh = await visitorHash(request, env, ua);
    await env.STATS.prepare('INSERT INTO events (site, type, path, ref, visitor_hash, ts) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(site, type, path, ref, vh, Date.now()).run();
  } catch (e) { console.log('stats 기록 실패:', String(e && e.message || e)); }
}

// 비콘을 받아 주는 Origin — 그 사이트 자기 도메인과 www 만(https). 다른 사이트 Origin, Origin 이 없는 요청은 기록하지 않는다.
// 브라우저는 sendBeacon·fetch POST 에 Origin 을 붙인다(16개 사이트 모두 Referrer-Policy 기본값, 2026-10-23 확인).
export const allowedHosts = site => [site, 'www.' + site];
function allowedOrigin(request, site) {
  const o = request.headers.get('origin');
  if (!o) return false;
  try { const u = new URL(o); return u.protocol === 'https:' && allowedHosts(site).includes(u.host); } catch (e) { return false; }
}

// opts.form === false : 신청을 세지 않는다(단말기 — 신청 폼이 없고 /api/contact 가 늘 ok 를 돌려줘 봇만 잡힌다)
export function withTracking(app, site, opts = {}) {
  return {
    ...app,
    async fetch(request, env, ctx) {
      const url = new URL(request.url);
      const on = !!(env && env.STATS && env.STATS_SALT);

      if (url.pathname === '/_t') {
        if (request.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
        const ua = request.headers.get('user-agent') || '';
        if (on && !isBot(ua) && allowedOrigin(request, site)) {
          let b = null; try { b = JSON.parse(await request.text()); } catch (e) {}
          if (b && TYPES[b.t] === 1) ctx.waitUntil(record(request, env, site, b.t, cleanPath(b.p), b.t === 'view' ? cleanRef(b.r) : '', ua));
        }
        return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
      }

      if (on && opts.form !== false && url.pathname === '/api/contact' && request.method === 'POST') {
        const ua = request.headers.get('user-agent') || '';
        const body = request.clone().text().catch(() => '');
        const res = await app.fetch(request, env, ctx);
        if (res.status === 200 && !isBot(ua)) {
          const copy = res.clone(); // 응답을 돌려주기 전에 복제해 둔다
          ctx.waitUntil((async () => {
            try {
              const out = await copy.json();
              let d = {}; try { d = JSON.parse(await body); } catch (e) {}
              if (out && out.ok === true && !String(d.hp || '').trim()) {
                // ctx_p(신청 페이지 경로)가 먼저. 없으면 page — '제목 · /경로' 꼴이면 뒤의 경로만 (2026-11-12)
                let p = '', raw = String(d.ctx_p || d.page || ''); const i = raw.lastIndexOf(' · /'); if (i >= 0) raw = raw.slice(i + 3);
                try { const u = new URL(raw, url.origin); if (u.origin === url.origin) p = u.pathname; } catch (e) {}
                await record(request, env, site, 'form', cleanPath(p), '', ua);
              }
            } catch (e) {}
          })());
        }
        return res;
      }

      const res = await app.fetch(request, env, ctx);
      if (!on || request.method !== 'GET' || res.status !== 200 || url.pathname.startsWith('/_')) return res;
      if (!(res.headers.get('content-type') || '').includes('text/html')) return res;
      return new HTMLRewriter().on('body', { element(e) { e.append(SCRIPT, { html: true }); } }).transform(res);
    },
  };
}
