// 결정 단계 페이지 — /pricing/ /teachers/ /compare/ /fit/
// 본문은 decide.js 에 있다. H2 는 학부모가 던지는 질문 문장이고, 각 답은 그 문단만 읽어도 되게 쓴다.
import SITE from '../site.js';
import DECIDE from '../decide.js';
import { esc, ABS, ctaHtml, updHtml, bcHtml, serviceLD } from './core.js';

const T = t => `${t} | ${SITE.name}`;

/* 순서는 코드가 정하고 문구는 decide.js 가 가진다. 사이트마다 메뉴 이름을 다르게 쓸 수 있다. */
export const DECIDE_ORDER = ['pricing', 'teachers', 'compare', 'fit'];
export const DECIDE_PAGES = DECIDE_ORDER.filter(k => DECIDE[k]).map(k => ({ slug: k, nav: DECIDE[k].nav, label: DECIDE[k].label }));
const bySlug = s => DECIDE_PAGES.find(p => p.slug === s);

const secHtml = s => `<h2 class="h2">${esc(s.h)}</h2>`
  + (s.ps || []).map(p => `<p class="p">${esc(p)}</p>`).join('')
  /* 목록 스타일은 교육정보 글(pages-misc.js)과 같게 맞춘다 */
  + (s.ul && s.ul.length ? `<ul style="line-height:1.85;color:var(--ink2);padding-left:20px;margin:0 0 18px">${s.ul.map(li => `<li>${esc(li)}</li>`).join('')}</ul>` : '');

/* 4개 페이지끼리 서로 연결. 제목과 마지막 링크 문구는 decide.js 가 가진다 —
   4개 사이트에서 같은 문구를 쓰면 모든 페이지에 같은 덩어리가 들어가 사이트 간 중복이 올라간다. */
const crossHtml = cur => {
  const others = DECIDE_PAGES.filter(p => p.slug !== cur);
  return `<h2 class="h2">${esc(DECIDE._crossH2 || '결정하기 전에 함께 보면 좋은 안내')}</h2><div class="pills">`
    + others.map(p => `<a class="pill" href="/${p.slug}/">${esc(p.label)} →</a>`).join('')
    + `<a class="pill" href="/guides/">${esc(DECIDE._crossLast || '교육정보 전체')} →</a></div>`;
};

export function decidePage(slug) {
  const d = DECIDE[slug], nav = bySlug(slug);
  if (!d || !nav) return null;
  const canonical = ABS(`/${slug}/`);
  const body = `<article class="art">${bcHtml([{ name: '홈', url: '/' }, { name: nav.nav }])}
<h1 class="h1">${esc(d.h1)}<span class="h1-sub">${esc(d.h1sub)}</span></h1>
<div class="meta"><span class="tag pc-hide">📞 ${SITE.tel}</span><span class="tag">상담·방향 제안 무료</span></div>${updHtml()}
<p class="lead-p">${esc(d.lead)}</p>
${d.sections.map(secHtml).join('')}
${crossHtml(slug)}
${ctaHtml(d.cta.h, d.cta.p)}</article>`;
  return {
    title: T(d.title), desc: d.desc, keywords: d.keywords, canonical,
    breadcrumbs: [{ name: '홈', url: ABS('/') }, { name: nav.nav, url: canonical }],
    /* H2 가 질문이고 그 아래 문단이 답이라 보이는 내용 그대로 FAQ 구조화데이터로 싣는다 */
    faqs: d.sections.map(s => [s.h, (s.ps || []).join(' ')]),
    ld: serviceLD('1:1 맞춤 과외', d.desc, canonical),
    body, form: { detail: `${d.h1} 페이지를 보고 상담 신청합니다.` },
  };
}
