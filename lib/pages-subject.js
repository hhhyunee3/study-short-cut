// 과목 메인 · 시도 · 시군구 · 동 · 학년 페이지
import SITE from '../site.js';
import CONTENT from '../content.js';
import { SIDO_ORDER, SIDO_SHORT, sidoFull, getSgg, getDong, sggList, dongList, neighbors, regionCounts, schoolsInDong, schoolStats } from './data.js';
import { esc, escAttr, rhash, pick, fill, imgPH, subjInfo, GRADE_INFO, ABS, faqHtml, ctaHtml, updHtml, pillsHtml, subjectBox, bcHtml, serviceLD } from './core.js';

const T = (title) => `${title} | ${SITE.name}`;
// 대상 표기: 성인 과목·초등만 있는 과목(한글)·전 학년
const audience = s => s.adult ? '성인·청소년' : (s.grade && Object.keys(s.grade).join() === 'elementary') ? '유아·초등 저학년' : '초·중·고 전 학년';

// ---------- 과목 메인 /{subj}/ ----------
export function subjectMainPage(key) {
  const s = subjInfo(key); if (!s) return null;
  const canonical = ABS(`/${key}/`);
  const title = T(`${s.kor} 과외 - ${s.tagline}, 1:1 맞춤 수업`);
  const desc = `${SITE.name} 1:1 ${s.kor} 과외. ${s.short} 학년별 진행 방식과 지역별 안내, 첫 상담 무료 ${SITE.tel}`;
  const sidoPills = SIDO_ORDER.map(k => ({ label: sidoFull(k), href: `/${k}/${key}/` }));
  const bc = [{ name: '홈', url: ABS('/') }, { name: s.kor + ' 과외', url: canonical }];
  const body = `<article class="art">${bcHtml(bc)}
<h1 class="h1"><em>${esc(s.kor)} 과외</em><br>${esc(s.tagline)}<span class="h1-sub">${esc(SITE.name)} 1:1 방문·화상 수업</span></h1>
<div class="meta"><span class="tag">${s.emoji} ${esc(s.kor)}</span><span class="tag">1:1 맞춤</span><span class="tag">방문·화상</span><span class="tag">📞 ${SITE.tel}</span></div>${updHtml()}
${imgPH(`/images/subjects/${key}.jpg`, `${s.kor} 수업`, '5/2')}
<p class="lead-p">${esc(s.lead)}</p><div class="callout">${esc(s.callout)}</div>
<h2 class="h2">왜 1:1 ${esc(s.kor)} 수업인가요?</h2><p class="p">${esc(s.why)}</p>
<div class="feat">${s.feats.map(f => `<div><b>${esc(f[0])}</b><span>${esc(f[1])}</span></div>`).join('')}</div>
<h2 class="h2">${s.adult ? '단계별' : '학년별'} ${esc(s.kor)} 진행 방식</h2><ol class="ol">${s.curri.map(c => `<li><strong>${esc(c[0])}</strong><span>${esc(c[1])}</span></li>`).join('')}</ol>
<h2 class="h2">신청부터 첫 수업까지</h2><ol class="ol">${CONTENT.home.steps.map(x => `<li><strong>${esc(x.h)}</strong><span>${esc(x.d)}</span></li>`).join('')}</ol>
${faqHtml(s.faq)}
<h2 class="h2">지역별 ${esc(s.kor)} 과외 안내</h2><p class="p">${esc(CONTENT.home.regionsLead)}</p>${pillsHtml(sidoPills, 17)}
${ctaHtml(`${s.kor} 과외, 첫 상담은 무료입니다`, '현재 상황을 알려 주시면 수업 방향을 먼저 제안해 드립니다.')}</article>`;
  return { title, desc, keywords: `${s.kor} 과외,1:1 ${s.kor},${s.kor} 방문과외,${s.kor} 화상과외,초등 ${s.kor} 과외,중등 ${s.kor} 과외,고등 ${s.kor} 과외`, canonical, breadcrumbs: bc, faqs: s.faq, ld: serviceLD(`${s.kor} 과외`, desc, canonical), body, form: { subject: s.kor, adult: !!s.adult, detail: `${s.kor} 과외 상담 신청합니다.` } };
}

// ---------- 시도 /{sido}/{subj}/ ----------
export function sidoPage(sidoKey, key) {
  const s = subjInfo(key); const full = sidoFull(sidoKey); if (!s || !full) return null;
  const list = sggList(sidoKey);
  const total = list.reduce((a, b) => a + b.count, 0);
  const canonical = ABS(`/${sidoKey}/${key}/`);
  const title = T(`${full} ${s.kor} 과외 - 시군구별 1:1 맞춤 수업`);
  const desc = `${full} ${list.length}개 시군구 ${total.toLocaleString()}개 동·읍·면 1:1 ${s.kor} 과외. ${s.short} 첫 상담 무료 ${SITE.tel}`;
  const h = rhash(`sido-${sidoKey}-${key}`);
  const note = CONTENT.sidoNotes[sidoKey] || '';
  const ctx = { sidoFull: full, sgg: full, dong: full, subj: s.kor };
  const r = s.region;
  const body = `<article class="art">${bcHtml([{ name: '홈', url: '/' }, { name: s.kor + ' 과외', url: `/${key}/` }, { name: full + ' ' + s.kor + ' 과외' }])}
<h1 class="h1">${esc(full)} <em>${esc(s.kor)} 과외</em><span class="h1-sub">시군구별 1:1 방문·화상 수업 안내</span></h1>
<div class="meta"><span class="tag">📍 ${list.length}개 시군구</span><span class="tag">${total.toLocaleString()}개 동·읍·면</span><span class="tag">${audience(s)}</span><span class="tag">📞 ${SITE.tel}</span></div>${updHtml()}
${imgPH(`/images/regions/${sidoKey}.jpg`, `${full} ${s.kor} 과외`, '5/2')}
${subjectBox(key, `/${sidoKey}`)}
<div class="region-box"><b>📍 ${esc(full)} 시군구 선택 <span>${list.length}개</span></b>${pillsHtml(list.map(g => ({ label: g.name, href: `/${sidoKey}/${g.key}/${key}/` })), 12)}</div>
<p class="lead-p">${esc(full)} 전 지역 학생을 위한 ${esc(SITE.name)} 1:1 ${esc(s.kor)} 과외 안내입니다. ${esc(note)} 시군구를 고르면 동·읍·면 단위 안내로 이어집니다.</p>
<div class="callout">${esc(s.callout)}</div>
<h2 class="h2">${esc(full)} 1:1 ${esc(s.kor)} 수업, 어떻게 다른가요?</h2><p class="p">${esc(fill(pick(r.why, h), ctx))}</p>
<div class="feat">${s.feats.map(f => `<div><b>${esc(f[0])}</b><span>${esc(f[1])}</span></div>`).join('')}</div>
<h2 class="h2">${s.adult ? '단계별' : '학년별'} 진행 방식</h2><ol class="ol">${s.curri.map(c => `<li><strong>${esc(c[0])}</strong><span>${esc(c[1])}</span></li>`).join('')}</ol>
<h2 class="h2">${esc(full)} 학생 수업 진행 순서</h2><p class="p">${esc(fill(pick(r.steps, h, 3), ctx))}</p>
<h2 class="h2">선생님 연결 기준</h2><p class="p">${esc(fill(pick(r.match, h, 5), ctx))}</p>
${faqHtml(s.faq, `${full} ${s.kor} 과외 자주 묻는 질문`)}
${ctaHtml(`${full} ${s.kor} 과외, 첫 상담은 무료입니다`, '거주 시군구와 학년을 알려 주시면 가까운 선생님을 추천해 드립니다.')}</article>`;
  return { title, desc, keywords: `${full} ${s.kor} 과외,${SIDO_SHORT[sidoKey]} ${s.kor} 과외,${SIDO_SHORT[sidoKey]} 1:1 ${s.kor},${SIDO_SHORT[sidoKey]} 방문과외`, canonical, faqs: s.faq, ld: serviceLD(`${full} ${s.kor} 과외`, desc, canonical, full), body, form: { subject: s.kor, adult: !!s.adult, addr: full, detail: `${full} ${s.kor} 과외 상담 신청합니다.` } };
}

// ---------- 시군구 /{sido}/{sgg}/{subj}/ ----------
export function sggPage(sidoKey, sggKey, key) {
  const s = subjInfo(key); const full = sidoFull(sidoKey); const g = getSgg(sidoKey, sggKey); if (!s || !full || !g) return null;
  const dongs = dongList(sidoKey, sggKey);
  const canonical = ABS(`/${sidoKey}/${sggKey}/${key}/`);
  const title = T(`${g.name} ${s.kor} 과외 - 동별 1:1 맞춤 수업`);
  const desc = `${full} ${g.name} ${dongs.length}개 동·읍·면 1:1 ${s.kor} 과외. ${s.short} 방문·화상 수업, 첫 상담 무료 ${SITE.tel}`;
  const h = rhash(`sgg-${sidoKey}-${sggKey}-${key}`);
  const ctx = { sidoFull: full, sgg: g.name, dong: g.name, subj: s.kor };
  const r = s.region;
  const st = (schoolStats()[sidoKey] || { sgg: {} }).sgg[g.name];
  const schoolLine = st ? `<p class="p">${esc(g.name)}에는 초·중·고 ${st.total}개 학교(초 ${st.E}·중 ${st.M}·고 ${st.H})가 있습니다. <a href="/schools/${sidoKey}/${sggKey}/">학교별 안내 보기 →</a></p>` : '';
  const gradeKeys = Object.keys(GRADE_INFO).filter(k => s.grade && s.grade[k]);
  const gradeLinks = (s.adult || !gradeKeys.length) ? '' : `<h2 class="h2">${esc(g.name)} 학년별 ${esc(s.kor)} 과외</h2><div class="pills">${gradeKeys.map(k => GRADE_INFO[k]).map(gi => `<a class="pill" href="/${sidoKey}/${sggKey}/${gi.key}/${key}/">${gi.label} ${esc(s.kor)}</a>`).join('')}</div>`;
  const body = `<article class="art">${bcHtml([{ name: '홈', url: '/' }, { name: s.kor + ' 과외', url: `/${key}/` }, { name: full, url: `/${sidoKey}/${key}/` }, { name: g.name + ' ' + s.kor + ' 과외' }])}
<h1 class="h1">${esc(g.name)} <em>${esc(s.kor)} 과외</em><span class="h1-sub">${esc(full)} ${esc(g.name)} 동별 1:1 방문·화상 수업</span></h1>
<div class="meta"><span class="tag">📍 ${dongs.length}개 동·읍·면</span><span class="tag">${audience(s)}</span><span class="tag">방문·화상</span><span class="tag">📞 ${SITE.tel}</span></div>${updHtml()}
${imgPH(`/images/subjects/${key}.jpg`, `${g.name} ${s.kor} 과외`)}
${subjectBox(key, `/${sidoKey}/${sggKey}`)}
<div class="region-box"><b>📍 ${esc(g.name)} 동·읍·면 선택 <span>${dongs.length}개</span></b>${pillsHtml(dongs.map(d => ({ label: d.name, href: `/${sidoKey}/${sggKey}/${d.slug}/${key}/` })), 12)}</div>
<p class="lead-p">${esc(fill(pick(r.intro, h), ctx))}</p>
<div class="callout">${esc(s.callout)}</div>
<h2 class="h2">${esc(g.name)} 1:1 ${esc(s.kor)} 수업이 필요한 이유</h2><p class="p">${esc(fill(pick(r.why, h, 2), ctx))}</p>
<div class="feat">${s.feats.map(f => `<div><b>${esc(f[0])}</b><span>${esc(f[1])}</span></div>`).join('')}</div>
<h2 class="h2">${esc(g.name)} ${esc(s.kor)} 수업 커리큘럼</h2><p class="p">${esc(fill(pick(r.curri, h, 4), ctx))}</p>
<h2 class="h2">수업 진행 순서</h2><p class="p">${esc(fill(pick(r.steps, h, 6), ctx))}</p>
${gradeLinks}
<h2 class="h2">${esc(g.name)} 학습 환경</h2><p class="p">${esc(fill(pick(r.env, h, 8), ctx))}</p>${schoolLine}
<h2 class="h2">상담에서 자주 듣는 이야기</h2><p class="p">${esc(fill(pick(r.review, h, 10), ctx))}</p>
${faqHtml(r.faq.map(f => [fill(f[0], ctx), fill(f[1], ctx)]), `${g.name} ${s.kor} 과외 자주 묻는 질문`)}
${ctaHtml(`${g.name} ${s.kor} 과외, 첫 상담은 무료입니다`, '거주 동과 학년을 알려 주시면 가까운 선생님을 추천해 드립니다.')}</article>`;
  const faqs = r.faq.map(f => [fill(f[0], ctx), fill(f[1], ctx)]);
  return { title, desc, keywords: `${g.name} ${s.kor} 과외,${g.name} 1:1 ${s.kor},${full} ${g.name} ${s.kor},${g.name} 방문과외`, canonical, faqs, ld: serviceLD(`${g.name} ${s.kor} 과외`, desc, canonical, `${full} ${g.name}`), body, form: { subject: s.kor, adult: !!s.adult, addr: `${full} ${g.name}`, detail: `${g.name} ${s.kor} 과외 상담 신청합니다.` } };
}

// ---------- 동 /{sido}/{sgg}/{dong}/{subj}/ ----------
export function dongPage(sidoKey, sggKey, dongSlug, key) {
  const s = subjInfo(key); const full = sidoFull(sidoKey); const g = getSgg(sidoKey, sggKey); const d = getDong(sidoKey, sggKey, dongSlug);
  if (!s || !full || !g || !d) return null;
  const canonical = ABS(`/${sidoKey}/${sggKey}/${d.slug}/${key}/`);
  const title = T(`${d.name} ${s.kor} 과외 - ${g.name} 1:1 맞춤 수업`);
  const desc = `${full} ${g.name} ${d.name} 1:1 ${s.kor} 과외. ${s.short} 방문·화상 수업, 첫 상담 무료 ${SITE.tel}`;
  const h = rhash(`dong-${sidoKey}-${sggKey}-${d.slug}-${key}`);
  const ctx = { sidoFull: full, sgg: g.name, dong: d.name, subj: s.kor };
  const r = s.region;
  const nb = neighbors(sidoKey, sggKey, d.slug, 6);
  const nbHtml = nb.length ? `<div class="region-box"><b>📍 ${esc(g.name)} 인근 ${esc(s.kor)} 과외</b><div class="pills">${nb.map(n => `<a class="pill" href="/${sidoKey}/${sggKey}/${n.slug}/${key}/">${esc(n.name)}</a>`).join('')}</div></div>` : '';
  const schools = schoolsInDong(SIDO_SHORT[sidoKey], g.name, d.name).slice(0, 8);
  const schHtml = schools.length ? `<h2 class="h2">${esc(d.name)} 학교별 안내</h2><div class="pills">${schools.map(x => `<a class="pill" href="/school/${x.slug}/">${esc(x.name)}</a>`).join('')}</div>` : '';
  const gradeKeys = Object.keys(GRADE_INFO).filter(k => s.grade && s.grade[k]);
  const gradeLinks = (s.adult || !gradeKeys.length) ? '' : `<h2 class="h2">${esc(d.name)} 학년별 ${esc(s.kor)} 과외</h2><div class="pills">${gradeKeys.map(k => GRADE_INFO[k]).map(gi => `<a class="pill" href="/${sidoKey}/${sggKey}/${d.slug}/${gi.key}/${key}/">${gi.label} ${esc(s.kor)}</a>`).join('')}</div>`;
  const body = `<article class="art">${bcHtml([{ name: '홈', url: '/' }, { name: s.kor + ' 과외', url: `/${key}/` }, { name: full, url: `/${sidoKey}/${key}/` }, { name: g.name, url: `/${sidoKey}/${sggKey}/${key}/` }, { name: d.name + ' ' + s.kor + ' 과외' }])}
<h1 class="h1">${esc(d.name)} <em>${esc(s.kor)} 과외</em><span class="h1-sub">${esc(g.name)} 1:1 방문·화상 수업</span></h1>
<div class="meta"><span class="tag">📍 ${esc(g.name)} ${esc(d.name)}</span><span class="tag">${audience(s)}</span><span class="tag">방문·화상</span><span class="tag">📞 ${SITE.tel}</span></div>${updHtml()}
${imgPH(`/images/subjects/${key}.jpg`, `${d.name} ${s.kor} 과외`)}
${subjectBox(key, `/${sidoKey}/${sggKey}/${d.slug}`)}
<p class="lead-p">${esc(fill(pick(r.intro, h), ctx))}</p>
<div class="callout">${esc(s.callout)}</div>
<h2 class="h2">${esc(d.name)} 1:1 ${esc(s.kor)} 수업이 필요한 이유</h2><p class="p">${esc(fill(pick(r.why, h, 2), ctx))}</p>
<h2 class="h2">${esc(d.name)} ${esc(s.kor)} 수업으로 달라지는 것</h2><p class="p">${esc(fill(pick(r.effect, h, 4), ctx))}</p>
<h2 class="h2">${esc(d.name)} ${esc(s.kor)} 커리큘럼</h2><p class="p">${esc(fill(pick(r.curri, h, 6), ctx))}</p>
<h2 class="h2">수업 진행 순서</h2><p class="p">${esc(fill(pick(r.steps, h, 8), ctx))}</p>
<h2 class="h2">선생님 연결 기준</h2><p class="p">${esc(fill(pick(r.match, h, 10), ctx))}</p>
${gradeLinks}
<h2 class="h2">${esc(d.name)} 학습 환경</h2><p class="p">${esc(fill(pick(r.env, h, 12), ctx))}</p>
${schHtml}${nbHtml}
<h2 class="h2">상담에서 자주 듣는 이야기</h2><p class="p">${esc(fill(pick(r.review, h, 14), ctx))}</p>
${faqHtml(r.faq.map(f => [fill(f[0], ctx), fill(f[1], ctx)]), `${d.name} ${s.kor} 과외 자주 묻는 질문`)}
${ctaHtml(`${d.name} ${s.kor} 과외, 첫 상담은 무료입니다`, '학년과 현재 상황을 알려 주시면 가까운 선생님을 추천해 드립니다.')}</article>`;
  const faqs = r.faq.map(f => [fill(f[0], ctx), fill(f[1], ctx)]);
  return { title, desc, keywords: `${d.name} ${s.kor} 과외,${d.name} 1:1 ${s.kor},${g.name} ${d.name} ${s.kor},${d.name} 방문과외`, canonical, faqs, ld: serviceLD(`${d.name} ${s.kor} 과외`, desc, canonical, `${full} ${g.name} ${d.name}`), body, form: { subject: s.kor, adult: !!s.adult, addr: `${full} ${g.name} ${d.name}`, detail: `${d.name} ${s.kor} 과외 상담 신청합니다.` } };
}

// ---------- 학년 /{sido}/{sgg}/[{dong}/]{grade}/{subj}/ ----------
export function gradePage(sidoKey, sggKey, dongSlug, gradeKey, key) {
  const s = subjInfo(key); const full = sidoFull(sidoKey); const g = getSgg(sidoKey, sggKey); const gi = GRADE_INFO[gradeKey];
  if (!s || !full || !g || !gi || !s.grade || !s.grade[gradeKey]) return null;
  const d = dongSlug ? getDong(sidoKey, sggKey, dongSlug) : null;
  if (dongSlug && !d) return null;
  const place = d ? d.name : g.name;
  const prefix = d ? `/${sidoKey}/${sggKey}/${d.slug}` : `/${sidoKey}/${sggKey}`;
  const canonical = ABS(`${prefix}/${gradeKey}/${key}/`);
  const gl = s.adult ? { elementary: '초졸', middle: '중졸', high: '고졸' }[gradeKey] : gi.label;
  const title = T(`${place} ${gl} ${s.kor} 과외 - ${s.adult ? '' : gi.span + ' '}1:1 맞춤 수업`);
  const desc = `${full} ${g.name} ${d ? d.name + ' ' : ''}${gl} 1:1 ${s.kor} 과외. ${s.adult ? gl + ' 단계' : gi.span} 맞춤 진행, 방문·화상 수업, 첫 상담 무료 ${SITE.tel}`;
  const h = rhash(`grade-${sidoKey}-${sggKey}-${dongSlug || ''}-${gradeKey}-${key}`);
  const ctx = { sidoFull: full, sgg: g.name, dong: place, subj: s.kor, grade: gl };
  const G = s.grade[gradeKey]; const r = s.region;
  const others = Object.values(GRADE_INFO).filter(x => x.key !== gradeKey && s.grade[x.key]).map(x => `<a class="pill" href="${prefix}/${x.key}/${key}/">${s.adult ? { elementary: '초졸', middle: '중졸', high: '고졸' }[x.key] : x.label} ${esc(s.kor)}</a>`).join('');
  const bc = [{ name: '홈', url: '/' }, { name: s.kor + ' 과외', url: `/${key}/` }, { name: full, url: `/${sidoKey}/${key}/` }, { name: g.name, url: `/${sidoKey}/${sggKey}/${key}/` }];
  if (d) bc.push({ name: d.name, url: `${prefix}/${key}/` });
  bc.push({ name: `${gl} ${s.kor} 과외` });
  const body = `<article class="art">${bcHtml(bc)}
<h1 class="h1">${esc(place)} ${esc(gl)} <em>${esc(s.kor)} 과외</em><span class="h1-sub">${esc(g.name)} ${s.adult ? gl + ' 단계' : gi.span} 1:1 방문·화상 수업</span></h1>
<div class="meta"><span class="tag lv-${gi.level}">${esc(gl)}</span><span class="tag">📍 ${esc(g.name)}</span><span class="tag">${s.emoji} ${esc(s.kor)}</span><span class="tag">📞 ${SITE.tel}</span></div>${updHtml()}
${imgPH(`/images/subjects/${key}.jpg`, `${place} ${gl} ${s.kor} 과외`)}
${subjectBox(key, `${prefix}/${gradeKey}`, gradeKey, prefix)}
<p class="lead-p">${esc(fill(pick(G.intro, h), ctx))}</p>
<div class="callout">${esc(s.callout)}</div>
<h2 class="h2">왜 ${esc(gl)} 1:1 ${esc(s.kor)} 수업인가요?</h2><p class="p">${esc(fill(pick(G.why, h, 2), ctx))}</p>
<h2 class="h2">${esc(gl)} ${esc(s.kor)} 커리큘럼</h2><p class="p">${esc(fill(pick(G.curri, h, 4), ctx))}</p>
<h2 class="h2">${esc(place)} ${esc(gl)} ${esc(s.kor)} 수업으로 달라지는 것</h2><p class="p">${esc(fill(pick(r.effect, h, 6), ctx))}</p>
<h2 class="h2">수업 진행 순서</h2><p class="p">${esc(fill(pick(r.steps, h, 8), ctx))}</p>
<h2 class="h2">선생님 연결 기준</h2><p class="p">${esc(fill(pick(r.match, h, 10), ctx))}</p>
<div class="region-box"><b>다른 ${s.adult ? '단계' : '학년'} 안내</b><div class="pills">${others}</div></div>
${faqHtml(r.faq.map(f => [fill(f[0], ctx), fill(f[1], ctx)]), `${place} ${gl} ${s.kor} 과외 자주 묻는 질문`)}
${ctaHtml(`${place} ${gl} ${s.kor} 과외, 첫 상담은 무료입니다`, '현재 상황을 알려 주시면 수업 방향을 먼저 제안해 드립니다.')}</article>`;
  const faqs = r.faq.map(f => [fill(f[0], ctx), fill(f[1], ctx)]);
  const gradeVal = s.adult ? '검정고시' : { elementary: '', middle: '', high: '' }[gradeKey];
  return { title, desc, keywords: `${place} ${gl} ${s.kor} 과외,${g.name} ${gl} ${s.kor},${gl} ${s.kor} 과외 ${place}`, canonical, breadcrumbs: bc.map(x => ({ name: x.name, url: x.url ? ABS(x.url) : canonical })), faqs, ld: serviceLD(`${place} ${gl} ${s.kor} 과외`, desc, canonical, `${full} ${g.name}`), body, form: { subject: s.kor, adult: !!s.adult, grade: gradeVal, addr: `${full} ${g.name}${d ? ' ' + d.name : ''}`, detail: `${place} ${gl} ${s.kor} 과외 상담 신청합니다.` } };
}

// ---------- 전국 지역 /regions/ ----------
export function regionsPage() {
  const first = SITE.subjects[0];
  const c = regionCounts();
  const canonical = ABS('/regions/');
  const secs = SIDO_ORDER.map(k => {
    const list = sggList(k);
    const cnt = list.reduce((a, b) => a + b.count, 0);
    return `<section class="sido-sec"><div class="sido-hd"><a href="/${k}/${first}/">${esc(sidoFull(k))}</a><span>${list.length}개 시·군·구 · ${cnt.toLocaleString()}개 동·읍·면</span></div><div class="sido-bd">${list.map(g => `<a href="/${k}/${g.key}/${first}/">${esc(g.name)} <small style="color:#94A3B8">${g.count}</small></a>`).join('')}</div></section>`;
  }).join('');
  const body = `<article class="art">${bcHtml([{ name: '홈', url: '/' }, { name: '전국 지역' }])}
<h1 class="h1">전국 지역 안내<span class="h1-sub">${c.sido}개 시도 · ${c.sgg}개 시·군·구 · ${c.dong.toLocaleString()}개 동·읍·면</span></h1>${updHtml()}
<p class="lead-p">${esc(CONTENT.regions.lead)}</p>${secs}
${ctaHtml('지역이 목록에 없어도 괜찮습니다', '상담을 남겨 주시면 방문 또는 화상 중 가능한 방식을 안내해 드립니다.')}</article>`;
  return { title: T('전국 지역 안내 - 시도·시군구·동별 1:1 과외'), desc: `${SITE.name} 방문·화상 1:1 과외 가능 지역 안내. ${c.sido}개 시도, ${c.sgg}개 시군구, ${c.dong.toLocaleString()}개 동·읍·면 페이지로 이어집니다. 첫 상담 무료 ${SITE.tel}`, canonical, breadcrumbs: [{ name: '홈', url: ABS('/') }, { name: '전국 지역', url: canonical }], body, form: { detail: '지역 과외 상담 신청합니다.' } };
}
