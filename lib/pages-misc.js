// 홈 · 내신 계산기 · 교육정보 · 404
import SITE from '../site.js';
import CONTENT from '../content.js';
import GUIDES from '../guides.js';
import { SIDO_ORDER, SIDO_SHORT, sidoFull, regionCounts, allSchools } from './data.js';
import { esc, escAttr, imgPH, bodyImg, subjInfo, ALL_SUBJ_KEYS, ABS, faqHtml, ctaHtml, updHtml, bcHtml, websiteLD, articleLD, formatKR } from './core.js';

const T = t => `${t} | ${SITE.name}`;

export function homePage() {
  const H = CONTENT.home; const first = SITE.subjects[0];
  const c = regionCounts();
  const subjCards = ALL_SUBJ_KEYS.map(k => { const s = subjInfo(k); return `<a class="card anim" data-anim="up" href="/${k}/"><div class="ico">${s.emoji}</div><h3>${esc(s.kor)} 과외</h3><p>${esc(s.short)}</p><span class="more">자세히 보기 →</span></a>`; }).join('');
  const marq = SIDO_ORDER.map(k => `<a class="pill" href="/${k}/${first}/">${esc(sidoFull(k))} 과외</a>`).join('');
  // 후기 이미지 대신 상담에서 자주 듣는 이야기(content.js 의 과목별 review)를 카드로. 지역 치환자는 홈에서 비운다.
  const rvCards = ALL_SUBJ_KEYS.slice(0, 3).map(k => {
    const s = subjInfo(k); const t = (((s.region || {}).review || [])[0] || '').replace(/\{[가-힣]+\}\s*/g, '').replace(/\s{2,}/g, ' ').trim();
    return t ? `<div class="rv anim" data-anim="up"><strong>${s.emoji} ${esc(s.kor)}</strong><p>${esc(t)}</p></div>` : '';
  }).filter(Boolean).join('');
  const regionPills = SIDO_ORDER.map(k => `<a class="pill" href="/${k}/${first}/">${SIDO_SHORT[k]}</a>`).join('');
  const body = `<section class="hero"><div class="wrap"><div><span class="hero-badge">${esc(H.badge)}</span><h1>${H.h1}</h1><p>${esc(H.sub)}</p><div style="display:flex;gap:10px;flex-wrap:wrap"><a class="btn btn-p" href="#consult-form">무료 상담 신청</a><a class="btn btn-o only-mo" href="tel:${SITE.telRaw}">📞 ${SITE.tel}</a></div>
<div class="hero-chips">${H.chips.map(ch => `<div><div class="chip-n">${esc(ch[0])}<small>${esc(ch[1])}</small></div><div class="chip-l">${esc(ch[2])}</div></div>`).join('')}</div></div>
${bodyImg('home', SITE.name + ' 1:1 과외 수업', '4/3', 'background:rgba(255,255,255,.14)')}</div></section>
<div class="marq" aria-label="지역 바로가기"><div class="marq-track" id="marq">${marq}</div></div>
<section class="sec"><div class="wrap"><span class="sec-tag">WHY</span><h2 class="anim" data-anim="up">${esc(SITE.name)}가 다른 점</h2><div class="grid g4">${H.strengths.map((x, i) => `<div class="card anim" data-anim="up" style="animation-delay:${i * .08}s"><div class="ico">${x.ico}</div><h3>${esc(x.h)}</h3><p>${esc(x.d)}</p></div>`).join('')}</div></div></section>
<section class="sec alt"><div class="wrap"><span class="sec-tag">SUBJECTS</span><h2 class="anim" data-anim="up">과목·프로그램</h2><p class="lead">${esc(H.subjectsLead)}</p><div class="grid g3">${subjCards}</div></div></section>
<section class="sec"><div class="wrap"><span class="sec-tag">PROCESS</span><h2 class="anim" data-anim="up">수업 진행 순서</h2><p class="lead">${esc(H.stepsLead)}</p><div class="steps">${H.steps.map((x, i) => `<div class="step anim" data-anim="up" style="animation-delay:${i * .08}s"><h3>${esc(x.h)}</h3><p>${esc(x.d)}</p></div>`).join('')}</div></div></section>
<section class="sec alt"><div class="wrap"><span class="sec-tag">REGIONS</span><h2 class="anim" data-anim="up">지역 바로가기</h2><p class="lead">${esc(H.regionsLead)} 전국 ${c.sgg}개 시·군·구, ${c.dong.toLocaleString()}개 동·읍·면.</p><div class="pills">${regionPills}<a class="pill" href="/regions/">전체 지역 →</a><a class="pill" href="/schools/">🏫 학교별 수업 →</a></div></div></section>
<section class="sec"><div class="wrap"><span class="sec-tag">REVIEWS</span><h2 class="anim" data-anim="up">상담에서 자주 듣는 이야기</h2><p class="lead">${esc(H.reviewsLead)}</p><div class="rv-grid rv3">${rvCards}</div></div></section>
<section class="sec alt"><div class="wrap"><span class="sec-tag">FAQ</span><h2 class="anim" data-anim="up">자주 묻는 질문</h2><div class="faq">${H.faq.map(f => `<div class="fi"><p class="fq">${esc(f[0])}</p><p class="fa">${esc(f[1])}</p></div>`).join('')}</div></div></section>`;
  return { title: `${SITE.name} - ${SITE.tagline}`, desc: SITE.desc, keywords: `과외,1:1 과외,방문과외,화상과외,${ALL_SUBJ_KEYS.map(k => subjInfo(k).kor + '과외').join(',')}`, canonical: ABS('/'), faqs: H.faq, ld: websiteLD(), body, form: { detail: '' } };
}

// 내신 등급 계산기
export function calculatorPage() {
  const canonical = ABS('/tools/grade-calculator/');
  const C = CONTENT.calculator;
  const row = (name, i) => `<div class="cr"><input type="text" class="cn" value="${name}" placeholder="과목명" aria-label="과목명"><input type="number" class="ct" placeholder="전체 인원" min="1" max="9999" inputmode="numeric" aria-label="전체 인원"><input type="number" class="ck" placeholder="본인 석차" min="1" max="9999" inputmode="numeric" aria-label="본인 석차"><div class="cres">—</div></div>`;
  const css = `<style>.calc{background:#fff;border:1px solid var(--line);border-radius:18px;padding:24px;margin:20px 0}.cg{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:16px}.cg button{padding:14px 8px;border:2px solid transparent;border-radius:12px;background:var(--bg);font-weight:800;cursor:pointer;font-size:1rem}.cg button span{display:block;font-size:.74rem;font-weight:500;color:var(--mute)}.cg button.on{background:var(--c1);color:#fff}.cg button.on span{color:var(--c2)}.csys{background:color-mix(in srgb,var(--c2) 40%,#fff);border-left:4px solid var(--c3);padding:12px 14px;border-radius:8px;font-size:.9rem;margin-bottom:16px}.cr{display:grid;grid-template-columns:1fr 1fr 1fr 90px;gap:8px;margin-bottom:8px}.cr input{padding:11px 12px;border:1px solid var(--line);border-radius:10px;font-size:.95rem;font-family:inherit;min-width:0}.cres{display:flex;align-items:center;justify-content:center;background:var(--bg);border-radius:10px;font-weight:800;color:var(--mute)}.cres.has{background:var(--c1);color:#fff}.cact{display:flex;gap:8px;margin-top:12px}.cadd{padding:12px 14px;border:1px dashed #94A3B8;background:var(--bg);border-radius:10px;cursor:pointer;font-weight:600}.crun{flex:1;padding:14px;border:none;background:var(--c3);color:#fff;border-radius:12px;font-weight:900;font-size:1rem;cursor:pointer}.csum{display:none;margin-top:16px;padding:16px;background:var(--bg);border-radius:12px}.csum.show{display:block}.csum b{display:block;font-size:1.5rem;color:var(--c1)}.cinfo{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin:16px 0}.cinfo div{border:1px solid var(--line);border-radius:14px;padding:16px}.cinfo h3{margin:0 0 10px;font-size:1rem;color:var(--c1)}.cinfo p{display:flex;justify-content:space-between;margin:0;padding:5px 0;border-bottom:1px dashed var(--line);font-size:.9rem}@media(max-width:600px){.cr{grid-template-columns:1fr 1fr}.cres{grid-column:1/-1;padding:10px}.cinfo{grid-template-columns:1fr}}</style>`;
  const body = css + `<article class="art">${bcHtml([{ name: '홈', url: '/' }, { name: '학습 도구', url: '/tools/grade-calculator/' }, { name: '내신 등급 계산기' }])}
<h1 class="h1">내신 등급 계산기 <em>2026년 기준</em><span class="h1-sub">학년을 고르면 9등급제·5등급제가 자동으로 적용됩니다</span></h1>${updHtml()}
<p class="lead-p">${esc(C.lead)}</p>
<div class="calc"><div class="cg"><button type="button" class="on" data-g="3" onclick="setG(3)">고3<span>9등급제</span></button><button type="button" data-g="2" onclick="setG(2)">고2<span>5등급제</span></button><button type="button" data-g="1" onclick="setG(1)">고1<span>5등급제</span></button></div>
<div class="csys" id="csys"></div><div id="crows">${row('국어')}${row('수학')}${row('영어')}</div>
<div class="cact"><button type="button" class="cadd" onclick="addRow()">+ 과목 추가</button><button type="button" class="crun" onclick="calc()">등급 계산하기</button></div><div class="csum" id="csum"></div></div>
<h2 class="h2">학년별 등급제 안내</h2><p class="p">2025학년도 고1부터 5등급제가 적용되어 2026년 기준 고1·고2는 5등급제, 고3은 9등급제입니다. 제도는 바뀔 수 있으니 학교 안내와 함께 확인하세요.</p>
<div class="cinfo"><div><h3>9등급제 (고3)</h3>${[[1, 4], [2, 11], [3, 23], [4, 40], [5, 60], [6, 77], [7, 89], [8, 96], [9, 100]].map(x => `<p><span>${x[0]}등급</span><strong>상위 ${x[1]}%</strong></p>`).join('')}</div><div><h3>5등급제 (고1·고2)</h3>${[[1, 10], [2, 34], [3, 66], [4, 90], [5, 100]].map(x => `<p><span>${x[0]}등급</span><strong>상위 ${x[1]}%</strong></p>`).join('')}</div></div>
${faqHtml(C.faq)}
${ctaHtml('목표 등급까지 무엇이 필요한지 궁금하다면', '현재 등급과 목표를 알려 주시면 가장 짧은 계획을 제안해 드립니다.')}</article>
<script>var G=3,S9=[4,11,23,40,60,77,89,96,100],S5=[10,34,66,90,100];function sys(){return G===3?S9:S5}
function setG(g){G=g;document.querySelectorAll('.cg button').forEach(function(b){b.classList.toggle('on',+b.dataset.g===g)});document.getElementById('csys').innerHTML='현재 <strong>'+(g===3?'9등급제':'5등급제')+'</strong> 적용 · '+sys().map(function(p,i){return (i+1)+'등급 상위 '+p+'%'}).join(', ');document.querySelectorAll('.cres').forEach(function(r){r.textContent='—';r.classList.remove('has')});document.getElementById('csum').classList.remove('show')}
function gradeOf(rank,total){if(!rank||!total||rank<1||total<1||rank>total)return null;var p=rank/total*100,s=sys();for(var i=0;i<s.length;i++)if(p<=s[i])return i+1;return s.length}
function calc(){var gs=[],names=[];document.querySelectorAll('.cr').forEach(function(r){var n=r.querySelector('.cn').value.trim()||'과목',t=+r.querySelector('.ct').value,k=+r.querySelector('.ck').value,res=r.querySelector('.cres'),g=gradeOf(k,t);if(g){res.textContent=g+'등급';res.classList.add('has');gs.push(g);names.push(n+' '+g+'등급')}else{res.textContent='—';res.classList.remove('has')}});var box=document.getElementById('csum');if(!gs.length){box.classList.remove('show');return}var avg=Math.round(gs.reduce(function(a,b){return a+b},0)/gs.length*10)/10;box.innerHTML='<b>평균 '+avg+'등급</b><div style="color:#475569;font-size:.92rem;margin-top:6px">'+names.join(' · ')+'</div>';box.classList.add('show')}
function addRow(){var c=document.getElementById('crows');if(c.children.length>=8)return;var d=document.createElement('div');d.className='cr';d.innerHTML='<input type="text" class="cn" placeholder="과목명" aria-label="과목명"><input type="number" class="ct" placeholder="전체 인원" min="1" max="9999" inputmode="numeric" aria-label="전체 인원"><input type="number" class="ck" placeholder="본인 석차" min="1" max="9999" inputmode="numeric" aria-label="본인 석차"><div class="cres">—</div>';c.appendChild(d)}
setG(3);</script>`;
  return { title: T('내신 등급 계산기 - 9등급·5등급 학년별 자동 환산'), desc: '전체 인원과 본인 석차만 넣으면 2026년 기준 고3 9등급제, 고1·고2 5등급제로 바로 계산합니다. 여러 과목 평균 등급까지 한 번에.', keywords: '내신 등급 계산기,9등급 5등급 환산,석차 등급 계산,고등학교 내신 등급', canonical, breadcrumbs: [{ name: '홈', url: ABS('/') }, { name: '학습 도구', url: canonical }, { name: '내신 등급 계산기', url: canonical }], faqs: C.faq, body, form: { detail: '내신 등급 계산기 사용 후 상담 신청합니다.' } };
}

// 교육정보
const gcard = g => `<a class="card" href="/guides/${g.slug}/"><p style="font-size:.78rem;color:var(--c3);font-weight:800;margin-bottom:6px">${(g.tags || []).slice(0, 3).map(esc).join(' · ')}</p><h3>${esc(g.h1)}</h3><p>${esc(g.desc)}</p><span class="more">${formatKR(g.date)}</span></a>`;
export function guidesHubPage() {
  const canonical = ABS('/guides/');
  const posts = [...GUIDES].sort((a, b) => b.date.localeCompare(a.date));
  const body = `<article class="art">${bcHtml([{ name: '홈', url: '/' }, { name: '교육정보' }])}
<h1 class="h1">교육정보<span class="h1-sub">시험 준비 · 과목별 공부법 · 과외 고르는 기준</span></h1>${updHtml()}
<p class="lead-p">${esc(CONTENT.guides.lead)}</p>
${posts.length ? `<div class="grid g2">${posts.map(gcard).join('')}</div>` : `<div class="callout">${esc(CONTENT.guides.empty)}</div>`}
${ctaHtml('읽고 궁금한 점이 남았다면', '상담에서 현재 상황을 듣고 필요한 것만 제안해 드립니다.')}</article>`;
  return { title: T('교육정보 - 시험 준비·공부법·과외 고르는 법'), desc: `${SITE.name} 교육정보 모음. 시험 준비 순서, 과목별 공부 방법, 과외와 학원 비교처럼 학생과 학부모가 상담에서 자주 묻는 내용을 정리합니다.`, canonical, breadcrumbs: [{ name: '홈', url: ABS('/') }, { name: '교육정보', url: canonical }], robots: posts.length ? '' : 'noindex,follow', body, form: { detail: '교육정보를 보고 상담 신청합니다.' } };
}
export function guidePostPage(slug) {
  const g = GUIDES.find(x => x.slug === slug); if (!g) return null;
  const canonical = ABS(`/guides/${g.slug}/`);
  const secs = g.sections.map(sec => `<h2 class="h2">${esc(sec.h)}</h2>${(sec.ps || []).map(p => `<p class="p">${esc(p)}</p>`).join('')}${sec.ul ? `<ul style="line-height:1.85;color:var(--ink2);padding-left:20px">${sec.ul.map(li => `<li>${esc(li)}</li>`).join('')}</ul>` : ''}`).join('');
  const others = GUIDES.filter(x => x.slug !== slug).slice(0, 3);
  const body = `<article class="art">${bcHtml([{ name: '홈', url: '/' }, { name: '교육정보', url: '/guides/' }, { name: g.h1 }])}
<div class="meta">${(g.tags || []).map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>
<h1 class="h1">${esc(g.h1)}</h1><p class="upd">작성: <time datetime="${g.date}">${formatKR(g.date)}</time></p>
<p class="lead-p">${esc(g.intro)}</p>${secs}
${g.faq && g.faq.length ? faqHtml(g.faq) : ''}
${g.related && g.related.length ? `<h2 class="h2">함께 보면 좋은 안내</h2><div class="pills">${g.related.map(r => `<a class="pill" href="${escAttr(r[1])}">${esc(r[0])}</a>`).join('')}</div>` : ''}
${others.length ? `<h2 class="h2">다른 교육정보</h2><div class="grid g3">${others.map(gcard).join('')}</div>` : ''}
${ctaHtml(`${g.cta || '공부'} 고민, 상담에서 바로 확인해 보세요`, '현재 상황을 듣고 필요한 것만 제안해 드립니다. 첫 상담은 무료입니다.')}</article>`;
  return { title: `${g.title} | ${SITE.name}`, desc: g.desc, keywords: (g.tags || []).join(','), canonical, ogType: 'article', breadcrumbs: [{ name: '홈', url: ABS('/') }, { name: '교육정보', url: ABS('/guides/') }, { name: g.h1, url: canonical }], faqs: g.faq || [], ld: articleLD(g, canonical), body, form: { detail: `교육정보 "${g.h1}"을 보고 상담 신청합니다.` } };
}

export function notFoundPage() {
  const body = `<article class="art" style="text-align:center;padding-top:60px"><div style="font-size:5rem;font-weight:900;color:var(--c1)">404</div><h1 class="h1">페이지를 찾을 수 없습니다</h1><p class="p">${esc(CONTENT.notFound)}</p><div class="pills" style="justify-content:center"><a class="pill" href="/">홈</a><a class="pill" href="/regions/">전국 지역</a><a class="pill" href="/schools/">학교별 수업</a><a class="pill" href="/${SITE.subjects[0]}/">과목별 수업</a></div></article>`;
  return { title: T('페이지를 찾을 수 없습니다'), desc: CONTENT.notFound, canonical: ABS('/'), robots: 'noindex', body, form: { detail: '' } };
}
