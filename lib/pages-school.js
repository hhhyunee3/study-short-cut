// 학교 허브·시도·시군구·학교·학교×과목 페이지
import SITE from '../site.js';
import CONTENT from '../content.js';
import { SIDO_ORDER, SIDO_SHORT, sidoFull, getSgg, schoolStats, schoolBySlug, schoolsNear, allSchools, LEVEL_KOR, LEVEL_SHORT, LEVEL_GRADE } from './data.js';
import { esc, rhash, pick, fill, imgPH, subjInfo, GRADE_INFO, ABS, faqHtml, ctaHtml, updHtml, pillsHtml, bcHtml, serviceLD } from './core.js';

const T = t => `${t} | ${SITE.name}`;
const searchBox = () => `<form class="search" onsubmit="return schGo(this)" role="search"><input type="search" placeholder="학교 이름으로 검색 (예: 개포중, 휘문고)" oninput="schSugg(this)" autocomplete="off" aria-label="학교 검색"><button type="submit" class="btn btn-c">검색</button><div class="sugg"></div></form>`;
const lvTag = l => `<span class="lv tag lv-${l}">${l === 'E' ? '초' : l === 'M' ? '중' : '고'}</span>`;

export function schoolsHubPage() {
  const st = schoolStats();
  const all = allSchools();
  const cnt = { E: 0, M: 0, H: 0 }; for (const s of all) cnt[s.level]++;
  const canonical = ABS('/schools/');
  const sidoCards = SIDO_ORDER.filter(k => st[k]).map(k => `<a class="card" href="/schools/${k}/"><h3>${esc(sidoFull(k))}</h3><p>학교 ${st[k].total.toLocaleString()}개 · 초 ${st[k].E} · 중 ${st[k].M} · 고 ${st[k].H}</p><span class="more">시군구별 보기 →</span></a>`).join('');
  const faqs = CONTENT.school.hubFaq;
  const body = `<article class="art">${bcHtml([{ name: '홈', url: '/' }, { name: '학교별 수업' }])}
<h1 class="h1">🏫 우리 학교 <em>맞춤 1:1 과외</em><span class="h1-sub">학교 시험 형식에 맞춰 마무리하는 수업</span></h1>${updHtml()}
${imgPH('/images/schools/hero.jpg', '학교별 수업', '5/2')}
<p class="lead-p">${esc(CONTENT.school.hubLead)}</p>${searchBox()}
<div class="stat"><div><b>${all.length.toLocaleString()}</b><span>전체 학교</span></div><div><b>${cnt.E.toLocaleString()}</b><span>초등학교</span></div><div><b>${cnt.M.toLocaleString()}</b><span>중학교</span></div><div><b>${cnt.H.toLocaleString()}</b><span>고등학교</span></div></div>
<h2 class="h2">시도별 학교 찾기</h2><div class="grid g3">${sidoCards}</div>
<h2 class="h2">학교별 수업은 이렇게 진행합니다</h2><ol class="ol">${CONTENT.school.plan.M.w.map(w => `<li><strong>${esc(w[0])}</strong><span>${esc(w[1].replace(/\{학교\}/g, '우리 학교'))}</span></li>`).join('')}</ol>
${faqHtml(faqs)}${ctaHtml('학교가 목록에 없어도 괜찮습니다', '학교 이름과 학년을 남겨 주시면 바로 연결해 드립니다.')}</article>`;
  return { title: T('학교별 1:1 과외 - 우리 학교 시험 형식 맞춤 수업'), desc: `전국 ${all.length.toLocaleString()}개 초·중·고 학교별 1:1 과외 안내. 학교 시험 형식에 맞춰 4주 전부터 마무리하는 방문·화상 수업. 첫 상담 무료 ${SITE.tel}`, keywords: '학교별 과외,학교 맞춤 과외,학교 시험 대비 과외,학교 1:1 과외', canonical, breadcrumbs: [{ name: '홈', url: ABS('/') }, { name: '학교별 수업', url: canonical }], faqs, body, form: { school: '', detail: '학교별 과외 상담 신청합니다.' } };
}

export function schoolsSidoPage(sidoKey) {
  const st = schoolStats()[sidoKey]; const full = sidoFull(sidoKey); if (!st || !full) return null;
  const canonical = ABS(`/schools/${sidoKey}/`);
  const sggs = Object.entries(st.sgg).sort((a, b) => a[0].localeCompare(b[0], 'ko'));
  const cards = sggs.map(([name, v]) => v.key ? `<a class="card" href="/schools/${sidoKey}/${v.key}/"><h3>${esc(name)}</h3><p>학교 ${v.total}개 · 초 ${v.E} · 중 ${v.M} · 고 ${v.H}</p><span class="more">학교 목록 →</span></a>` : `<div class="card"><h3>${esc(name)}</h3><p>학교 ${v.total}개</p><div class="pills">${v.list.slice(0, 6).map(s => `<a class="pill" href="/school/${s.slug}/">${esc(s.base)}</a>`).join('')}</div></div>`).join('');
  const body = `<article class="art">${bcHtml([{ name: '홈', url: '/' }, { name: '학교별 수업', url: '/schools/' }, { name: full }])}
<h1 class="h1">${esc(full)} <em>학교별 1:1 과외</em><span class="h1-sub">시군구별 초·중·고 목록</span></h1>
<div class="meta"><span class="tag">학교 ${st.total.toLocaleString()}개</span><span class="tag lv-E">초 ${st.E}</span><span class="tag lv-M">중 ${st.M}</span><span class="tag lv-H">고 ${st.H}</span></div>${updHtml()}
${searchBox()}
<p class="lead-p">${esc(full)} 학교를 시군구별로 정리했습니다. 학교를 고르면 학교급에 맞는 수업 안내와 과목별 페이지로 이어집니다. ${esc(CONTENT.sidoNotes[sidoKey] || '')}</p>
<h2 class="h2">시군구 선택</h2><div class="grid g3">${cards}</div>
${ctaHtml(`${full} 학교별 과외, 첫 상담은 무료입니다`, '학교 이름과 학년을 남겨 주시면 가까운 선생님을 추천해 드립니다.')}</article>`;
  return { title: T(`${full} 학교별 1:1 과외 - 시군구별 학교 목록`), desc: `${full} ${st.total.toLocaleString()}개 초·중·고 학교별 1:1 과외 안내. 시군구를 고르면 학교 목록과 학교 맞춤 수업 안내로 이어집니다. 첫 상담 무료 ${SITE.tel}`, canonical, breadcrumbs: [{ name: '홈', url: ABS('/') }, { name: '학교별 수업', url: ABS('/schools/') }, { name: full, url: canonical }], body, form: { school: '', addr: full, detail: `${full} 학교별 과외 상담 신청합니다.` } };
}

export function schoolsSggPage(sidoKey, sggKey) {
  const full = sidoFull(sidoKey); const g = getSgg(sidoKey, sggKey); const st = schoolStats()[sidoKey]; if (!full || !g || !st) return null;
  const v = st.sgg[g.name]; if (!v) return null;
  const canonical = ABS(`/schools/${sidoKey}/${sggKey}/`);
  const byLevel = l => v.list.filter(s => s.level === l).sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  const listHtml = l => { const arr = byLevel(l); return arr.length ? `<h2 class="h2">${LEVEL_KOR[l]} ${arr.length}개</h2><div class="sch-list">${arr.map(s => `<a href="/school/${s.slug}/">${lvTag(l)}${esc(s.name)}<small style="color:#94A3B8;margin-left:auto">${esc(s.dong)}</small></a>`).join('')}</div>` : ''; };
  const first = SITE.subjects[0];
  const body = `<article class="art">${bcHtml([{ name: '홈', url: '/' }, { name: '학교별 수업', url: '/schools/' }, { name: full, url: `/schools/${sidoKey}/` }, { name: g.name }])}
<h1 class="h1">${esc(g.name)} <em>학교별 1:1 과외</em><span class="h1-sub">${esc(full)} ${esc(g.name)} 초·중·고 ${v.total}개</span></h1>
<div class="meta"><span class="tag lv-E">초 ${v.E}</span><span class="tag lv-M">중 ${v.M}</span><span class="tag lv-H">고 ${v.H}</span><span class="tag">📞 ${SITE.tel}</span></div>${updHtml()}
${searchBox()}
<p class="lead-p">${esc(g.name)} 학교 목록입니다. 학교를 고르면 학교급에 맞는 수업 안내와 과목별 페이지로 이어집니다. 지역별 과목 안내는 <a href="/${sidoKey}/${sggKey}/${first}/">${esc(g.name)} ${esc(subjInfo(first).kor)} 과외</a>에서 볼 수 있습니다.</p>
${listHtml('H')}${listHtml('M')}${listHtml('E')}
${ctaHtml(`${g.name} 학교별 과외, 첫 상담은 무료입니다`, '학교 이름과 학년을 남겨 주시면 가까운 선생님을 추천해 드립니다.')}</article>`;
  return { title: T(`${g.name} 학교별 1:1 과외 - 초·중·고 ${v.total}개 학교`), desc: `${full} ${g.name} 초·중·고 ${v.total}개 학교별 1:1 과외 안내. 학교 시험 형식에 맞춘 방문·화상 수업, 첫 상담 무료 ${SITE.tel}`, canonical, breadcrumbs: [{ name: '홈', url: ABS('/') }, { name: '학교별 수업', url: ABS('/schools/') }, { name: full, url: ABS(`/schools/${sidoKey}/`) }, { name: g.name, url: canonical }], body, form: { school: '', addr: `${full} ${g.name}`, detail: `${g.name} 학교별 과외 상담 신청합니다.` } };
}

function schoolCtx(s) {
  return { sidoFull: s.sidoFull, sgg: s.sggName, dong: s.dong, school: s.name, level: LEVEL_KOR[s.level] };
}
function schoolBc(s) {
  const bc = [{ name: '홈', url: '/' }, { name: '학교별 수업', url: '/schools/' }];
  if (s.sidoKey) bc.push({ name: s.sidoFull, url: `/schools/${s.sidoKey}/` });
  if (s.sidoKey && s.sggKey) bc.push({ name: s.sggName, url: `/schools/${s.sidoKey}/${s.sggKey}/` });
  return bc;
}
const toAbs = (bc, canonical) => bc.map(x => ({ name: x.name, url: x.url ? ABS(x.url) : canonical }));

export function schoolPage(slug) {
  const s = schoolBySlug(slug); if (!s) return null;
  const C = CONTENT.school; const ctx = schoolCtx(s); const L = s.level;
  const canonical = ABS(`/school/${s.slug}/`);
  const h = rhash('school-' + slug);
  const tags = C.subjTags[L] || {};
  const subjGrid = SITE.subjects.map((k, i) => { const si = subjInfo(k); return `<a href="/school/${s.slug}/${k}/"${i === 0 ? ' class="pop"' : ''}>${si.emoji} ${esc(si.kor)}<small>${esc(tags[k] || '1:1 맞춤')}</small></a>`; }).join('');
  const near = schoolsNear(s, 6);
  const nearHtml = near.length ? `<h2 class="h2">${esc(s.dong)} 인근 학교</h2><div class="pills">${near.map(x => `<a class="pill" href="/school/${x.slug}/">${esc(x.name)}</a>`).join('')}</div>` : '';
  const regionLink = s.sidoKey && s.sggKey ? `<p class="p"><a href="/${s.sidoKey}/${s.sggKey}${s.dongSlug ? '/' + s.dongSlug : ''}/${SITE.subjects[0]}/">${esc(s.dongSlug ? s.dong : s.sggName)} 지역 과외 안내 →</a></p>` : '';
  const plan = C.plan[L];
  const faqs = C.faq.map(f => [fill(f[0], ctx), fill(f[1], ctx)]);
  const bc = schoolBc(s); bc.push({ name: s.name });
  const body = `<article class="art">${bcHtml(bc)}
<div class="meta"><span class="tag lv-${L}">${LEVEL_KOR[L]}</span>${s.founder ? `<span class="tag">${s.founder}</span>` : ''}${s.coed ? `<span class="tag">${s.coed}</span>` : ''}<span class="tag">📍 ${esc(s.sggName)} ${esc(s.dong)}</span></div>
<h1 class="h1">${esc(s.name)} <em>1:1 맞춤 과외</em><span class="h1-sub">${esc(s.dong)} ${LEVEL_SHORT[L]} 학생 · 학교 시험 형식에 맞춘 수업</span></h1>${updHtml()}
${imgPH('/images/schools/hero.jpg', s.name + ' 1:1 과외', '5/2')}
<p class="lead-p">${esc(fill(C.lead, ctx))}</p>
<h2 class="h2">📖 ${esc(s.name)} 학생 학습 가이드</h2><p class="p">${esc(fill(C.guide[L], ctx))}</p>
<h2 class="h2">🎯 ${esc(s.name)} 학생에게 1:1 수업이 맞는 이유</h2><p class="p">${esc(fill(C.why[L], ctx))}</p>
<h2 class="h2">📅 ${esc(fill(plan.i, ctx))}</h2><ol class="ol">${plan.w.map(w => `<li><strong>${esc(w[0])}</strong><span>${esc(fill(w[1], ctx))}</span></li>`).join('')}</ol>
<h2 class="h2">📚 ${esc(s.name)} 과목별 1:1 과외</h2><p class="p">같은 학교라도 과목마다 시험 형식이 다릅니다. 과목을 고르면 ${esc(s.name)} ${LEVEL_SHORT[L]} 학생 기준 안내로 이어집니다.</p><div class="sch-grid">${subjGrid}</div>
<h2 class="h2">📍 ${esc(s.dong)} 학습 환경</h2><p class="p">${esc(fill(pick(subjInfo(SITE.subjects[0]).region.env, h), { sidoFull: s.sidoFull, sgg: s.sggName, dong: s.dong }))}</p>${regionLink}
${nearHtml}
${faqHtml(faqs, `${s.name} 1:1 과외 자주 묻는 질문`)}
${ctaHtml(`${s.name} 학생 첫 상담은 무료입니다`, '학년과 과목을 알려 주시면 가까운 선생님을 추천해 드립니다.')}</article>`;
  return { title: T(`${s.name} 1:1 과외 - ${s.dong} 학교 맞춤 수업`), desc: `${s.sggName} ${s.dong} ${s.name} 학생을 위한 1:1 방문·화상 과외. 학교 시험 형식에 맞춰 4주 전부터 마무리. ${SITE.subjects.map(k => subjInfo(k).kor).join('·')}. 첫 상담 무료 ${SITE.tel}`, keywords: `${s.name} 과외,${s.name} 1:1 과외,${s.dong} 학교별 과외,${s.sggName} ${LEVEL_SHORT[L]} 과외`, canonical, breadcrumbs: toAbs(bc, canonical), faqs, ld: serviceLD(`${s.name} 1:1 과외`, `${s.name} 학생 맞춤 1:1 과외`, canonical, `${s.sidoFull} ${s.sggName} ${s.dong}`), body, form: { school: s.name, addr: `${s.sidoFull} ${s.sggName} ${s.dong}`, detail: `${s.name} 학생 과외 상담 신청합니다.` } };
}

export function schoolSubjectPage(slug, key) {
  const s = schoolBySlug(slug); const si = subjInfo(key); if (!s || !si || !SITE.subjects.includes(key)) return null;
  const L = s.level; const gradeKey = LEVEL_GRADE[L]; const gi = GRADE_INFO[gradeKey]; const G = si.grade && si.grade[gradeKey]; if (!G) return null;
  const canonical = ABS(`/school/${s.slug}/${key}/`);
  const h = rhash(`school-${slug}-${key}`);
  const ctx = { sidoFull: s.sidoFull, sgg: s.sggName, dong: s.dong, subj: si.kor, grade: gi.label, school: s.name, level: LEVEL_KOR[L] };
  const C = CONTENT.school; const plan = C.plan[L];
  const others = SITE.subjects.filter(k => k !== key).map(k => { const o = subjInfo(k); return `<a class="pill" href="/school/${s.slug}/${k}/">${o.emoji} ${esc(o.kor)}</a>`; }).join('');
  const faqs = si.region.faq.map(f => [fill(f[0], ctx), fill(f[1], ctx)]);
  const bc = schoolBc(s); bc.push({ name: s.name, url: `/school/${s.slug}/` }, { name: si.kor + ' 과외' });
  const body = `<article class="art">${bcHtml(bc)}
<div class="meta"><span class="tag lv-${L}">${LEVEL_KOR[L]}</span><span class="tag">${si.emoji} ${esc(si.kor)}</span><span class="tag">📍 ${esc(s.sggName)} ${esc(s.dong)}</span></div>
<h1 class="h1">${esc(s.name)} <em>${esc(si.kor)} 과외</em><span class="h1-sub">${esc(s.dong)} ${LEVEL_SHORT[L]} 학생 1:1 방문·화상 수업</span></h1>${updHtml()}
${imgPH(`/images/subjects/${key}.jpg`, `${s.name} ${si.kor} 과외`, '5/2')}
<p class="lead-p">${esc(fill(pick(G.intro, h), ctx))}</p>
<div class="callout">${esc(si.callout)}</div>
<h2 class="h2">왜 ${esc(s.name)} ${LEVEL_SHORT[L]} 학생에게 1:1 ${esc(si.kor)} 수업인가요?</h2><p class="p">${esc(fill(pick(G.why, h, 2), ctx))}</p>
<h2 class="h2">${esc(s.name)} ${esc(si.kor)} 커리큘럼</h2><p class="p">${esc(fill(pick(G.curri, h, 4), ctx))}</p>
<h2 class="h2">📅 ${esc(fill(plan.i, ctx))}</h2><ol class="ol">${plan.w.map(w => `<li><strong>${esc(w[0])}</strong><span>${esc(fill(w[1], ctx))}</span></li>`).join('')}</ol>
<h2 class="h2">${esc(si.kor)} 수업으로 달라지는 것</h2><p class="p">${esc(fill(pick(si.region.effect, h, 6), ctx))}</p>
<h2 class="h2">선생님 연결 기준</h2><p class="p">${esc(fill(pick(si.region.match, h, 8), ctx))}</p>
<div class="region-box"><b>${esc(s.name)} 다른 과목</b><div class="pills">${others}</div></div>
${faqHtml(faqs, `${s.name} ${si.kor} 과외 자주 묻는 질문`)}
${ctaHtml(`${s.name} ${si.kor} 과외, 첫 상담은 무료입니다`, '현재 상황을 알려 주시면 수업 방향을 먼저 제안해 드립니다.')}</article>`;
  return { title: T(`${s.name} ${si.kor} 과외 - ${LEVEL_SHORT[L]} 1:1 맞춤 수업`), desc: `${s.sggName} ${s.dong} ${s.name} ${LEVEL_SHORT[L]} 학생 1:1 ${si.kor} 과외. ${si.short} 학교 시험 형식 맞춤, 첫 상담 무료 ${SITE.tel}`, keywords: `${s.name} ${si.kor} 과외,${s.name} ${si.kor},${s.dong} ${LEVEL_SHORT[L]} ${si.kor} 과외`, canonical, breadcrumbs: toAbs(bc, canonical), faqs, ld: serviceLD(`${s.name} ${si.kor} 과외`, `${s.name} 학생 1:1 ${si.kor} 과외`, canonical, `${s.sidoFull} ${s.sggName} ${s.dong}`), body, form: { school: s.name, subject: si.kor, addr: `${s.sidoFull} ${s.sggName} ${s.dong}`, detail: `${s.name} ${si.kor} 과외 상담 신청합니다.` } };
}
