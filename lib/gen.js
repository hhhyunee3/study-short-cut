// 문장 조합 엔진. pools/*.js 의 문장 풀에서 페이지 주소 해시로 자리(slot)마다 문장을 골라 본문을 만든다.
// 섹션 = { h: [소제목 변형...], s: [[자리1 대안...], [자리2 대안...], ...] }
// 같은 자리의 대안은 역할이 같아 어느 것을 골라도 문단이 자연스럽게 이어진다.
import POOLS from '../pools/index.js';
import { esc, fill } from './core.js';

// FNV-1a + murmur3 fmix32. 앞의 단순 곱셈 해시는 페이지끼리 같은 선택이 연달아 나와 유사도가 높았다.
function mix(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16;
  return h >>> 0;
}
const idx = (seed, key, n) => n ? mix(key + '|' + seed + '|' + key) % n : 0;

// 섹션 키마다 소제목 클래스(i-<섹션>)를 붙인다. 이모지는 CSS ::before 로 넣는다 — HTML 텍스트에 넣으면 모든 페이지가 같은 글자를 공유해 유사도가 오른다.
const SEC_KEYS = ['open','intro','why','why11','method','curri','effect','mistakes','exam','level','routine','schedule','process','teacher','visit','parent','consult','guide','habit'];
// 섹션 하나를 <h2> + 문단으로. 5~6문장을 두 문단으로 나누고 사이에 구분 도형을 넣는다. 소제목 이모지는 CSS.
export function section(sec, seed, key, ctx, opt = {}) {
  if (!sec || !sec.s) return '';
  const h = sec.h && sec.h.length ? fill(sec.h[idx(seed, key + '#h', sec.h.length)], ctx) : '';
  const sents = sec.s.map((slot, i) => fill(slot[idx(seed, key + '#' + i, slot.length)], ctx));
  const base = key.replace(/[0-9#].*$/, '');
  const cls = SEC_KEYS.includes(base) ? ' i-' + base : '';
  const cut = Math.ceil(sents.length / 2);
  const paras = sents.length > 3 ? [sents.slice(0, cut), sents.slice(cut)] : [sents];
  const head = h && !opt.noH ? `<h2 class="h2${cls}">${esc(h)}</h2>` : '';
  const body = paras.map((p, i) => (i ? '<div class="sep" aria-hidden="true"></div>' : '') + `<p class="p">${esc(p.join(' '))}</p>`).join('');
  return head + body;
}
// 자리 하나만 골라 문장으로
export function sentence(slot, seed, key, ctx) { return slot && slot.length ? fill(slot[idx(seed, key, slot.length)], ctx) : ''; }
// FAQ 목록에서 k개를 서로 다른 조합으로 고른다
export function pickFaq(list, seed, key, k = 4, ctx = {}) {
  if (!list || !list.length) return [];
  const n = list.length; const start = idx(seed, key, n);
  const steps = [3, 5, 7, 11].filter(s => n % s !== 0); const step = steps[idx(seed, key + '#step', steps.length)] || 1;
  const out = []; const seen = new Set();
  for (let j = 0; out.length < Math.min(k, n) && j < n * 2; j++) { const i = (start + j * step) % n; if (seen.has(i)) continue; seen.add(i); out.push([fill(list[i][0], ctx), fill(list[i][1], ctx)]); }
  return out;
}
export function cta(seed, key, ctx) {
  const c = POOLS.common.cta || {};
  return { h: sentence(c.h, seed, key + '#h', ctx), p: sentence(c.p, seed, key + '#p', ctx) };
}
export const pools = () => POOLS;
export const hasSubject = k => !!(POOLS.subjects && POOLS.subjects[k]);

// 지역·학년 페이지 본문 섹션 묶음. level: 'E'|'M'|'H'|'' (학년 페이지면 해당 급)
// 반환: { top: [...], mid: [...], bottom: [...] } 각각 HTML 조각 배열 — 페이지 빌더가 사이에 지역 목록 등을 끼운다.
export function regionSections(subjKey, seed, ctx, level = '') {
  const C = POOLS.common, S = POOLS.subjects[subjKey];
  if (!S) return null;
  const lv = level && S.level && S.level[level] ? S.level[level] : null;
  const levelHtml = lv ? section(lv, seed, 'level', ctx) : (S.level ? `<h2 class="h2">${esc(fill(sentence(S.levelH || ['{법정동} 학년별 {과목} 수업'], seed, 'levelH', ctx), ctx))}</h2><p class="p">${['E', 'M', 'H'].map(L => S.level[L] ? esc(sentence(S.level[L].s[0], seed, 'lvl' + L, ctx)) : '').filter(Boolean).join(' ')}</p>` : '');
  return {
    open: section(C.open, seed, 'open', ctx, { noH: true }),
    top: [section(S.intro, seed, 'intro', ctx), section(S.why, seed, 'why', ctx), section(C.why11, seed, 'why11', ctx)],
    mid: [section(S.method, seed, 'method', ctx), section(S.curri, seed, 'curri', ctx), levelHtml, section(S.effect, seed, 'effect', ctx), section(S.mistakes, seed, 'mistakes', ctx), section(S.exam, seed, 'exam', ctx)],
    bottom: [section(C.routine, seed, 'routine', ctx), section(C.schedule, seed, 'schedule', ctx), section(C.process, seed, 'process', ctx), section(C.teacher, seed, 'teacher', ctx), section(C.visit, seed, 'visit', ctx), section(C.parent, seed, 'parent', ctx), section(C.consult, seed, 'consult', ctx)],
    faqs: [...pickFaq(S.faq, seed, 'sfaq', 3, ctx), ...pickFaq(C.faq, seed, 'cfaq', 3, ctx)],
    cta: cta(seed, 'cta', ctx),
  };
}
// 학교 페이지 본문 (급별). subjKey 가 있으면 과목 섹션도 섞는다.
export function schoolSections(level, seed, ctx, subjKey = '') {
  const SC = POOLS.school[level]; const C = POOLS.common; const S = subjKey ? POOLS.subjects[subjKey] : null;
  if (!SC) return null;
  const plan = SC.plan ? `<h2 class="h2">${esc(fill(sentence(SC.plan.h, seed, 'plan#h', ctx), ctx))}</h2><p class="p">${esc(fill(sentence(SC.plan.i, seed, 'plan#i', ctx), ctx))}</p><ol class="ol">${SC.plan.w.map((w, i) => `<li><strong>${esc(w.h)}</strong><span>${esc(sentence(w.s, seed, 'plan#w' + i, ctx))}</span></li>`).join('')}</ol>` : '';
  const lv = S && S.level && S.level[level] ? section(S.level[level], seed, 'level', ctx) : '';
  // 과목 없는 학교 페이지: 과목마다 이 급의 특징 문장(level[급] 자리①)을 하나씩 모은 문단. 지역 페이지의 학년 요약과 같은 방식이며, 학교 페이지 분량을 5,000자 위로 올린다.
  const subjNote = S ? '' : (() => {
    const ps = Object.keys(SC.subjects || {}).map(k => POOLS.subjects[k]).filter(X => X && X.level && X.level[level])
      .map(X => sentence(X.level[level].s[0], seed, 'sn' + X.key, { ...ctx, subj: X.kor, grade: { E: '초등', M: '중등', H: '고등' }[level] }));
    return ps.length ? `<h2 class="h2">${esc(fill('{학교} 과목별로 짚어 볼 점', ctx))}</h2><p class="p">${esc(ps.join(' '))}</p>` : '';
  })();
  return {
    open: section(SC.open, seed, 'open', ctx, { noH: true }),
    top: [section(SC.guide, seed, 'guide', ctx), S ? section(S.intro, seed, 'intro', ctx) : '', section(SC.why, seed, 'why', ctx), S ? section(S.why, seed, 'why2', ctx) : section(C.why11, seed, 'why11', ctx)],
    mid: [S ? section(S.method, seed, 'method', ctx) : '', lv || subjNote, S ? section(S.exam, seed, 'exam', ctx) : section(SC.exam, seed, 'exam', ctx), plan, S ? section(S.mistakes, seed, 'mistakes', ctx) : '', section(SC.parent, seed, 'parent', ctx), section(SC.habit, seed, 'habit', ctx), S ? '' : section(C.parent, seed, 'parent2', ctx)],
    bottom: [section(C.routine, seed, 'routine', ctx), section(C.schedule, seed, 'schedule', ctx), section(C.process, seed, 'process', ctx), section(C.teacher, seed, 'teacher', ctx), section(C.visit, seed, 'visit', ctx), section(C.consult, seed, 'consult', ctx)],
    faqs: [...pickFaq(SC.faq, seed, 'lfaq', 3, ctx), ...(S ? pickFaq(S.faq, seed, 'sfaq', 3, ctx) : pickFaq(C.faq, seed, 'cfaq', 3, ctx))],
    subjectLine: k => SC.subjects && SC.subjects[k] ? sentence(SC.subjects[k], seed, 'sl' + k, ctx) : '',
    cta: cta(seed, 'cta', ctx),
  };
}
// HTML 에서 글자 수(한글·영문·숫자)만 센다 — 분량 점검용
export function textLength(html) { return String(html).replace(/<[^>]+>/g, ' ').replace(/\s+/g, '').length; }
