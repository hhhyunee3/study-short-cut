// 공통 레이아웃: head·헤더·푸터·상담 폼·스타일·JSON-LD·응답 헬퍼
import SITE from '../site.js';
import CONTENT from '../content.js';
import { SIDO_ORDER, SIDO_SHORT, sidoFull, getSgg, getDong } from './data.js';

let _env = {}, _host = '';
export function setEnv(env, host) { _env = env || {}; _host = host || ''; }
export function env() { return _env; }

export const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export const escAttr = s => esc(s).replace(/"/g, '&quot;');
export function rhash(s) { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return Math.abs(h); }
export function pick(arr, h, shift = 0) { if (!arr || !arr.length) return ''; return arr[(h >> shift) % arr.length]; }
export function fill(t, ctx) {
  return String(t ?? '')
    .replace(/\{법정동\}/g, ctx.dong || ctx.sgg || '')
    .replace(/\{시군구\}/g, ctx.sgg || '')
    .replace(/\{시도\}/g, ctx.sidoFull || '')
    .replace(/\{학년\}/g, ctx.grade || '')
    .replace(/\{과목\}/g, ctx.subj || '')
    .replace(/\{브랜드\}/g, SITE.name)
    .replace(/\{학교\}/g, ctx.school || '')
    .replace(/\{급\}/g, ctx.level || '');
}
export const formatKR = iso => { const [y, m, d] = iso.split('-'); return `${y}년 ${+m}월 ${+d}일`; };
export const ABS = p => SITE.origin + p;

// 과목 정보 (content.js 의 subjects 에서 이름·이모지 등을 읽는다)
export function subjInfo(key) { const s = CONTENT.subjects[key]; return s ? { key, ...s } : null; }
export const ALL_SUBJ_KEYS = [...SITE.subjects, ...SITE.extras];
export const GRADE_INFO = {
  elementary: { key: 'elementary', kor: '초등학생', label: '초등', span: '초등 1~6학년', level: 'E' },
  middle: { key: 'middle', kor: '중학생', label: '중등', span: '중등 1~3학년', level: 'M' },
  high: { key: 'high', kor: '고등학생', label: '고등', span: '고등 1~3학년', level: 'H' },
};

// 이미지 자리: 파일이 없으면 단색 상자만 남는다.
export function imgPH(src, alt, ratio = '16/9', extra = '') {
  return `<div class="ph" style="aspect-ratio:${ratio}${extra ? ';' + extra : ''}"><img src="${escAttr(src)}" alt="${escAttr(alt)}" loading="lazy" decoding="async" onerror="this.remove()"></div>`;
}

// ---------------- 스타일 ----------------
const C = SITE.colors;
export const STYLES_CSS = `
:root{--c1:${C.c1};--c2:${C.c2};--c3:${C.c3};--c4:${C.c4};--ink:#0F172A;--ink2:#334155;--mute:#64748B;--line:#E2E8F0;--bg:#F8FAFC;--maxw:1180px}
*{box-sizing:border-box}html{scroll-behavior:smooth;-webkit-text-size-adjust:100%}
body{margin:0;font-family:Pretendard,'Apple SD Gothic Neo','Noto Sans KR','Malgun Gothic',sans-serif;color:var(--ink);line-height:1.6;background:#fff;overflow-x:hidden;-webkit-font-smoothing:antialiased;word-break:keep-all}
a{color:inherit}img,svg{max-width:100%;height:auto}button{font-family:inherit}
.wrap{max-width:var(--maxw);margin:0 auto;padding-inline:20px}
.hd{position:sticky;top:0;z-index:100;background:rgba(255,255,255,.96);backdrop-filter:blur(8px);border-bottom:1px solid var(--line)}
.hd-in{max-width:var(--maxw);margin:0 auto;padding:10px 20px;display:flex;align-items:center;gap:14px}
.logo{display:flex;align-items:center;gap:9px;text-decoration:none;font-weight:900;font-size:1.25rem;letter-spacing:-.5px;color:var(--ink);flex-shrink:0}
.logo b{color:var(--c1)}
.burger{display:none;margin-left:auto;background:none;border:1px solid var(--line);border-radius:10px;font-size:1.3rem;padding:4px 10px;cursor:pointer}
.nav{display:flex;align-items:center;gap:2px;margin-left:auto}
.nm{position:relative}
.nm-btn{background:none;border:none;font-size:.95rem;font-weight:700;color:var(--ink2);padding:10px 13px;cursor:pointer;text-decoration:none;display:inline-block;border-radius:10px}
.nm-btn:hover{color:var(--c1);background:var(--bg)}
.nd{display:none;position:absolute;top:100%;left:0;background:#fff;border:1px solid var(--line);border-radius:14px;box-shadow:0 16px 40px -12px rgba(15,23,42,.2);padding:14px;z-index:200;min-width:220px}
.nd.open{display:block}.nd-wide{min-width:520px;display:none;flex-wrap:wrap;gap:6px}.nd-wide.open{display:flex}
.pill{display:inline-flex;align-items:center;gap:5px;padding:7px 13px;border-radius:24px;background:var(--bg);border:1px solid var(--line);font-size:.86rem;font-weight:600;color:var(--ink2);text-decoration:none;white-space:nowrap}
.pill:hover{border-color:var(--c3);color:var(--c1);background:#fff}
.pill.on{background:var(--c1);color:#fff;border-color:var(--c1)}
.hd-cta{margin-left:8px;background:var(--c4);color:var(--ink);font-weight:800;text-decoration:none;padding:10px 18px;border-radius:30px;font-size:.9rem;white-space:nowrap;box-shadow:0 6px 16px -6px rgba(0,0,0,.25)}
@media(max-width:900px){.burger{display:inline-block}.nav{display:none;position:absolute;left:0;right:0;top:100%;background:#fff;border-bottom:1px solid var(--line);flex-direction:column;align-items:stretch;padding:10px 16px 16px;gap:4px;max-height:80vh;overflow:auto}.nav.open{display:flex}.nm-btn{display:block;width:100%;text-align:left;padding:12px 8px}.nd,.nd-wide{position:static;display:none;box-shadow:none;border:none;padding:4px 8px 10px}.nd.open,.nd-wide.open{display:flex;flex-wrap:wrap;gap:6px}.hd-cta{margin:8px 0 0;text-align:center}}
/* 히어로·섹션 */
.hero{background:linear-gradient(160deg,var(--c1) 0%,color-mix(in srgb,var(--c1) 70%,#000) 100%);color:#fff;padding:72px 0 64px;position:relative;overflow:hidden}
.hero::after{content:'';position:absolute;right:-120px;top:-120px;width:420px;height:420px;border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,.14),transparent 70%)}
.hero .wrap{position:relative;display:grid;grid-template-columns:1.1fr .9fr;gap:40px;align-items:center}
.hero-badge{display:inline-block;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.3);border-radius:30px;padding:6px 14px;font-size:.82rem;font-weight:700;margin-bottom:18px}
.hero h1{font-size:2.9rem;line-height:1.22;letter-spacing:-1.5px;margin:0 0 18px;font-weight:900}
.hero h1 em{font-style:normal;color:var(--c4)}
.hero p{font-size:1.08rem;line-height:1.75;opacity:.92;margin:0 0 28px;max-width:520px}
.btn{display:inline-flex;align-items:center;gap:6px;padding:13px 26px;border-radius:30px;font-weight:800;text-decoration:none;font-size:.98rem;transition:transform .15s;border:none;cursor:pointer}
.btn:hover{transform:translateY(-1px)}
.btn-p{background:var(--c4);color:var(--ink)}.btn-w{background:#fff;color:var(--c1)}.btn-o{background:transparent;color:#fff;border:2px solid rgba(255,255,255,.5)}
.btn-c{background:var(--c3);color:#fff}
.hero-chips{display:flex;gap:22px;flex-wrap:wrap;margin-top:30px}
.chip-n{font-size:1.5rem;font-weight:900}.chip-n small{font-size:.9rem;color:var(--c4);margin-left:2px}.chip-l{font-size:.78rem;opacity:.8}
.ph{background:linear-gradient(135deg,var(--c2),color-mix(in srgb,var(--c2) 55%,#fff));border-radius:20px;overflow:hidden;position:relative;width:100%}
.ph img{width:100%;height:100%;object-fit:cover;display:block;position:absolute;inset:0}
.hero .ph{box-shadow:0 30px 60px -30px rgba(0,0,0,.5)}
@media(max-width:900px){.hero{padding:48px 0 40px}.hero .wrap{grid-template-columns:1fr;gap:28px}.hero h1{font-size:2rem}}
.sec{padding:70px 0}.sec.alt{background:var(--bg)}
.sec-tag{display:inline-block;color:var(--c3);font-weight:800;font-size:.82rem;letter-spacing:1px;margin-bottom:8px}
.sec h2{font-size:2rem;font-weight:900;letter-spacing:-1px;line-height:1.3;margin:0 0 12px}
.sec .lead{color:var(--mute);font-size:1.02rem;margin:0 0 34px;max-width:720px}
.grid{display:grid;gap:18px}.g2{grid-template-columns:repeat(2,1fr)}.g3{grid-template-columns:repeat(3,1fr)}.g4{grid-template-columns:repeat(4,1fr)}
@media(max-width:900px){.g3,.g4{grid-template-columns:repeat(2,1fr)}}@media(max-width:560px){.g2,.g3,.g4{grid-template-columns:1fr}}
.card{background:#fff;border:1px solid var(--line);border-radius:18px;padding:26px 24px;text-decoration:none;color:inherit;transition:transform .15s,box-shadow .15s}
.card:hover{transform:translateY(-3px);box-shadow:0 18px 40px -20px rgba(15,23,42,.25)}
.card .ico{font-size:1.9rem;margin-bottom:10px}.card h3{margin:0 0 8px;font-size:1.12rem;font-weight:800}.card p{margin:0;color:var(--mute);font-size:.93rem;line-height:1.65}
.card .more{display:inline-block;margin-top:12px;color:var(--c3);font-weight:800;font-size:.88rem}
.steps{counter-reset:s;display:grid;grid-template-columns:repeat(4,1fr);gap:18px}
.step{background:#fff;border:1px solid var(--line);border-radius:18px;padding:24px 22px;position:relative}
.step::before{counter-increment:s;content:counter(s,decimal-leading-zero);font-weight:900;color:var(--c3);font-size:1.6rem;display:block;margin-bottom:8px}
.step h3{margin:0 0 6px;font-size:1.05rem}.step p{margin:0;color:var(--mute);font-size:.92rem}
@media(max-width:900px){.steps{grid-template-columns:repeat(2,1fr)}}@media(max-width:560px){.steps{grid-template-columns:1fr}}
.marq{overflow:hidden;white-space:nowrap;padding:16px 0;border-top:1px solid var(--line);border-bottom:1px solid var(--line);background:#fff}
.marq-track{display:inline-flex;gap:10px;animation:marq 40s linear infinite;will-change:transform}
.marq:hover .marq-track{animation-play-state:paused}
@keyframes marq{from{transform:translate3d(0,0,0)}to{transform:translate3d(-50%,0,0)}}
.rv-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
.rv{background:#fff;border:1px dashed var(--line);border-radius:16px;aspect-ratio:1;display:flex;align-items:center;justify-content:center;color:var(--mute);font-size:.88rem;font-weight:600;text-align:center;padding:14px}
@media(max-width:900px){.rv-grid{grid-template-columns:repeat(2,1fr)}}
/* 본문(article) */
.art{max-width:880px;margin:0 auto;padding:36px 20px 20px}
.bc{font-size:.85rem;color:var(--mute);margin-bottom:14px;display:flex;flex-wrap:wrap;gap:4px}.bc a{color:var(--mute);text-decoration:none}.bc a:hover{color:var(--c1)}.bc strong{color:var(--ink)}
.h1{font-size:2.1rem;line-height:1.28;letter-spacing:-1px;margin:0 0 12px;font-weight:900}.h1 em{font-style:normal;color:var(--c3)}
.h1-sub{display:block;font-size:1rem;color:var(--mute);font-weight:600;margin-top:8px;letter-spacing:0}
.meta{display:flex;flex-wrap:wrap;gap:6px;margin:12px 0 8px}.tag{background:var(--bg);border:1px solid var(--line);border-radius:20px;padding:5px 12px;font-size:.8rem;font-weight:700;color:var(--ink2)}
.tag.lv-E{background:#E0F2FE;color:#0369A1;border-color:#BAE6FD}.tag.lv-M{background:#DCFCE7;color:#15803D;border-color:#BBF7D0}.tag.lv-H{background:#FEF3C7;color:#B45309;border-color:#FDE68A}
.upd{font-size:.8rem;color:#94A3B8;margin:0 0 20px}
.art .ph{margin:8px 0 24px}
.lead-p{font-size:1.06rem;line-height:1.85;color:var(--ink2);margin:0 0 20px}
.callout{background:color-mix(in srgb,var(--c2) 45%,#fff);border-left:4px solid var(--c3);border-radius:10px;padding:16px 20px;margin:20px 0;font-weight:600;line-height:1.7}
.h2{font-size:1.45rem;font-weight:900;letter-spacing:-.5px;margin:40px 0 12px;line-height:1.35}
.p{color:var(--ink2);line-height:1.85;margin:0 0 16px;font-size:.98rem}
.feat{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:18px 0 8px}
.feat div{background:var(--bg);border-radius:14px;padding:16px}.feat b{display:block;margin-bottom:4px;font-size:.98rem}.feat span{color:var(--mute);font-size:.88rem;line-height:1.55}
@media(max-width:600px){.feat{grid-template-columns:1fr}}
.ol{padding:0;margin:14px 0;list-style:none;counter-reset:o}
.ol li{display:grid;grid-template-columns:44px 1fr;gap:12px;padding:14px 0;border-bottom:1px dashed var(--line);align-items:start}
.ol li::before{counter-increment:o;content:counter(o);width:36px;height:36px;border-radius:50%;background:var(--c1);color:#fff;font-weight:900;display:flex;align-items:center;justify-content:center;font-size:.95rem}
.ol strong{display:block;margin-bottom:2px}.ol span{color:var(--mute);font-size:.92rem;line-height:1.6}
.pills{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0 6px}
.pills a.hid{display:none}.pills.open a.hid{display:inline-flex}
.more-btn{margin-top:10px;background:none;border:1px solid var(--line);border-radius:20px;padding:8px 16px;font-weight:700;color:var(--ink2);cursor:pointer;font-size:.86rem}
.subj-box{background:var(--bg);border-radius:14px;padding:14px 16px;margin:16px 0}.subj-box b{display:block;font-size:.85rem;margin-bottom:8px;color:var(--mute)}
.region-box{border:1px solid var(--line);border-radius:16px;padding:18px;margin:16px 0}.region-box b{display:block;margin-bottom:10px}.region-box b span{color:var(--mute);font-weight:600;font-size:.85rem;margin-left:6px}
.faq{margin:14px 0}.fi{background:var(--bg);border-radius:12px;padding:16px 20px;margin-bottom:8px;border-left:4px solid var(--c3)}.fq{font-weight:800;margin:0 0 6px}.fa{margin:0;color:var(--ink2);font-size:.94rem;line-height:1.7}
.cta{background:linear-gradient(135deg,var(--c1),color-mix(in srgb,var(--c1) 60%,var(--c3)));color:#fff;border-radius:20px;padding:34px 28px;text-align:center;margin:36px 0 10px}
.cta h3{margin:0 0 8px;font-size:1.35rem;font-weight:900}.cta p{margin:0 0 18px;opacity:.9}
.cta .btn-row{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}
.stat{display:flex;gap:12px;flex-wrap:wrap;margin:20px 0}.stat div{flex:1;min-width:120px;background:var(--bg);border-radius:14px;padding:16px;text-align:center}.stat b{display:block;font-size:1.5rem;color:var(--c1)}.stat span{font-size:.82rem;color:var(--mute)}
.sch-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin:14px 0}
.sch-grid a{background:#fff;border:1px solid var(--line);border-radius:14px;padding:14px 10px;text-align:center;text-decoration:none;font-weight:800}.sch-grid a small{display:block;color:var(--mute);font-weight:600;font-size:.76rem;margin-top:4px}
.sch-grid a.pop{border-color:var(--c3);background:color-mix(in srgb,var(--c2) 40%,#fff)}
@media(max-width:700px){.sch-grid{grid-template-columns:repeat(3,1fr)}}@media(max-width:420px){.sch-grid{grid-template-columns:repeat(2,1fr)}}
.sch-list{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin:12px 0}.sch-list a{display:flex;align-items:center;gap:8px;padding:10px 12px;border:1px solid var(--line);border-radius:12px;text-decoration:none;font-size:.92rem;font-weight:600}.sch-list a:hover{border-color:var(--c3)}
.sch-list .lv{font-size:.7rem;font-weight:800;padding:2px 7px;border-radius:8px}
@media(max-width:560px){.sch-list{grid-template-columns:1fr}}
.search{position:relative;display:flex;gap:8px;margin:16px 0}.search input{flex:1;padding:14px 16px;border:2px solid var(--line);border-radius:14px;font-size:1rem;font-family:inherit}.search input:focus{outline:none;border-color:var(--c3)}
.sugg{display:none;position:absolute;top:100%;left:0;right:0;background:#fff;border:1px solid var(--line);border-radius:14px;box-shadow:0 20px 40px -14px rgba(15,23,42,.25);z-index:50;margin-top:6px;overflow:hidden}.sugg.open{display:block}
.sugg a{display:block;padding:10px 14px;text-decoration:none;font-size:.92rem;border-bottom:1px solid var(--bg)}.sugg a:hover{background:var(--bg)}.sugg small{color:var(--mute);margin-left:6px}.sugg .none{padding:12px 14px;color:var(--mute);font-size:.9rem}
.sido-sec{border:1px solid var(--line);border-radius:16px;margin:16px 0;overflow:hidden}.sido-hd{background:var(--c1);color:#fff;padding:12px 18px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px}.sido-hd a{color:#fff;text-decoration:none;font-weight:900;font-size:1.05rem}.sido-hd span{font-size:.8rem;opacity:.85}
.sido-bd{padding:14px 18px;display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.sido-bd a{text-decoration:none;font-size:.9rem;padding:6px 8px;border-radius:8px;background:var(--bg)}
@media(max-width:700px){.sido-bd{grid-template-columns:repeat(2,1fr)}}
/* 상담 폼 */
.form{background:#fff;border:2px solid var(--c2);border-radius:22px;padding:36px 32px;margin:30px auto;max-width:720px;box-shadow:0 12px 36px -20px rgba(15,23,42,.2)}
.form h3{margin:0 0 6px;font-size:1.4rem;font-weight:900}.form-desc{color:var(--mute);margin:0 0 24px;font-size:.94rem}
.fg{margin-bottom:18px}.fg label{display:block;font-weight:800;margin-bottom:8px;font-size:.95rem}.req{color:#E11D48;font-size:.76rem;margin-left:4px}
.fg input,.fg select,.fg textarea{width:100%;padding:13px 15px;border:1.5px solid var(--line);border-radius:12px;font-size:.98rem;font-family:inherit;background:var(--bg);color:var(--ink)}
.fg input:focus,.fg select:focus,.fg textarea:focus{outline:none;border-color:var(--c3);background:#fff;box-shadow:0 0 0 3px color-mix(in srgb,var(--c3) 18%,transparent)}
.fg textarea{min-height:96px;resize:vertical}.fg .hint{font-size:.82rem;color:var(--mute);margin:0 0 8px}
.ph3{display:flex;gap:6px;align-items:center}.ph3 input{text-align:center;padding-inline:6px}.ph3 span{color:var(--mute)}
.addr{display:flex;gap:8px;margin-bottom:8px}.addr input{flex:1}.addr button{padding:0 16px;background:var(--c1);color:#fff;border:none;border-radius:12px;font-weight:700;cursor:pointer;white-space:nowrap}
.hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}
.submit{width:100%;padding:16px;background:var(--c3);color:#fff;border:none;border-radius:14px;font-size:1.05rem;font-weight:900;cursor:pointer;margin-top:6px}.submit:disabled{opacity:.6;cursor:default}
.form-note{font-size:.8rem;color:#94A3B8;text-align:center;margin:12px 0 0}
.done{display:none;text-align:center;padding:20px 0}.done .ok{font-size:2.6rem}.done h4{margin:8px 0 4px;font-size:1.2rem}.done p{color:var(--mute);margin:0}
.sum{text-align:left;background:var(--bg);border-radius:14px;padding:16px 20px;margin:18px 0 6px}.sum div{display:flex;padding:8px 0;border-bottom:1px solid var(--line);font-size:.93rem}.sum div:last-child{border:none}.sum b{width:78px;flex-shrink:0;color:var(--mute);font-weight:700}
/* 푸터 */
.ft{background:var(--ink);color:#CBD5E1;padding:40px 0 30px;margin-top:40px}.ft .wrap{display:flex;flex-wrap:wrap;gap:18px;align-items:center;justify-content:space-between}
.ft-brand{color:#fff;font-weight:900;font-size:1.15rem;text-decoration:none;display:flex;align-items:center;gap:8px}.ft-tel{color:var(--c4);font-weight:900;font-size:1.2rem;text-decoration:none}
.ft-nav{display:flex;flex-wrap:wrap;gap:14px;font-size:.88rem}.ft-nav a{text-decoration:none;color:#CBD5E1}.ft-copy{width:100%;font-size:.78rem;color:#64748B;border-top:1px solid #1E293B;padding-top:14px}
/* 전화 안내창(PC) */
.callm{display:none;position:fixed;inset:0;background:rgba(15,23,42,.55);z-index:999;align-items:center;justify-content:center;padding:20px}.callm.open{display:flex}
.callm-box{background:#fff;border-radius:20px;padding:30px 26px;max-width:360px;width:100%;text-align:center}.callm-box b{display:block;font-size:1.6rem;margin:8px 0 14px;color:var(--c1)}.callm-box .row{display:flex;gap:8px;justify-content:center;flex-wrap:wrap}
/* 스크롤 등장 */
.anim{opacity:0}.anim.in{opacity:1;animation:.7s cubic-bezier(.22,.61,.36,1) both}
.anim.in[data-anim=up]{animation-name:aUp}.anim.in[data-anim=zoom]{animation-name:aZoom}.anim.in[data-anim=fade]{animation-name:aFade}
@keyframes aUp{from{opacity:0;transform:translate3d(0,36px,0)}to{opacity:1;transform:none}}@keyframes aZoom{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:none}}@keyframes aFade{from{opacity:0}to{opacity:1}}
@media(prefers-reduced-motion:reduce){.anim{opacity:1!important;animation:none!important}.marq-track{animation:none!important}}
.ptabs{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 20px}.ptabs a{padding:9px 18px;border-radius:30px;background:#fff;border:1px solid var(--line);text-decoration:none;font-weight:700;font-size:.9rem}.ptabs a.on{background:var(--c1);color:#fff;border-color:var(--c1)}
.table{width:100%;border-collapse:collapse;font-size:.92rem;margin:12px 0}.table th{background:var(--c1);color:#fff;padding:10px;text-align:left}.table td{padding:10px;border-bottom:1px solid var(--line);vertical-align:top}
.tbl-wrap{overflow-x:auto}
`;

// ---------------- 로고·아이콘 ----------------
export function logoSvg(size = 34) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="15" fill="${C.c1}"/><path d="M14 44 L30 18 L38 32 L46 24 L52 44" fill="none" stroke="${C.c2}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="52" cy="44" r="5" fill="${C.c4}"/></svg>`;
}
function brandHtml() {
  const n = SITE.name;
  // 앞 두 글자 + 나머지 강조
  return `${esc(n.slice(0, 2))}<b>${esc(n.slice(2))}</b>`;
}

// ---------------- head ----------------
export function HEAD(m) {
  const e = _env;
  const title = esc(m.title), desc = escAttr(m.desc);
  const canonical = m.canonical || SITE.origin + '/';
  const og = SITE.origin + '/og.png';
  const ver = [
    e.NAVER_VERIFY ? `<meta name="naver-site-verification" content="${escAttr(e.NAVER_VERIFY)}">` : '',
    e.GOOGLE_VERIFY ? `<meta name="google-site-verification" content="${escAttr(e.GOOGLE_VERIFY)}">` : '',
  ].filter(Boolean).join('');
  return `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title><meta name="description" content="${desc}">${m.keywords ? `<meta name="keywords" content="${escAttr(m.keywords)}">` : ''}
<link rel="canonical" href="${escAttr(canonical)}">${m.robots ? `<meta name="robots" content="${m.robots}">` : ''}${ver}
<meta name="application-name" content="${escAttr(SITE.name)}"><meta property="og:site_name" content="${escAttr(SITE.name)}"><meta property="og:type" content="${m.ogType || 'website'}"><meta property="og:locale" content="ko_KR">
<meta property="og:title" content="${title}"><meta property="og:description" content="${desc}"><meta property="og:url" content="${escAttr(canonical)}">
<meta property="og:image" content="${og}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="${escAttr(SITE.name + ' ' + SITE.tagline)}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${title}"><meta name="twitter:description" content="${desc}"><meta name="twitter:image" content="${og}">
<link rel="icon" type="image/png" sizes="192x192" href="/favicon.png"><link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="alternate" type="application/rss+xml" title="${escAttr(SITE.name)} RSS" href="${SITE.origin}/rss.xml">
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin><link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css">
<link rel="stylesheet" href="/styles.css">${m.head || ''}</head><body>`;
}

// ---------------- 헤더·푸터 ----------------
export function HDR() {
  const first = SITE.subjects[0];
  const sidoPills = SIDO_ORDER.map(k => `<a class="pill" href="/${k}/${first}/">${SIDO_SHORT[k]}</a>`).join('');
  const subjPills = ALL_SUBJ_KEYS.map(k => { const s = subjInfo(k); return s ? `<a class="pill" href="/${k}/">${s.emoji} ${esc(s.kor)}</a>` : ''; }).join('');
  return `<header class="hd"><div class="hd-in"><a class="logo" href="/" aria-label="${escAttr(SITE.name)} 홈">${logoSvg()}<span>${brandHtml()}</span></a><button class="burger" onclick="toggleNav()" aria-label="메뉴 열기" aria-expanded="false">☰</button><nav class="nav" id="nav" aria-label="주 메뉴">
<div class="nm"><button class="nm-btn" onclick="toggleDrop('nd-region',this)" aria-haspopup="true">지역별수업 ▾</button><div class="nd nd-wide" id="nd-region">${sidoPills}<a class="pill" href="/regions/">전체 지역 →</a></div></div>
<div class="nm"><a class="nm-btn" href="/schools/">학교수업</a></div>
<div class="nm"><button class="nm-btn" onclick="toggleDrop('nd-subj',this)" aria-haspopup="true">과목수업 ▾</button><div class="nd nd-wide" id="nd-subj">${subjPills}</div></div>
<div class="nm"><a class="nm-btn" href="/tools/grade-calculator/">내신 계산기</a></div>
<div class="nm"><a class="nm-btn" href="/guides/">정보글</a></div>
<a class="hd-cta" href="tel:${SITE.telRaw}">📞 무료 상담</a></nav></div></header>`;
}
export function FTR() {
  const first = SITE.subjects[0];
  return `<footer class="ft"><div class="wrap"><a class="ft-brand" href="/">${logoSvg(26)}${esc(SITE.name)}</a><span style="font-size:.86rem">${esc(SITE.tagline)}</span><a class="ft-tel" href="tel:${SITE.telRaw}">${SITE.tel}</a>
<nav class="ft-nav" aria-label="푸터 메뉴"><a href="/regions/">전국 지역</a><a href="/seoul/${first}/">지역별 수업</a><a href="/schools/">학교별 수업</a><a href="/${first}/">과목별 수업</a><a href="/tools/grade-calculator/">내신 계산기</a><a href="/guides/">정보글</a></nav>
<div class="ft-copy">© ${new Date().getFullYear()} ${esc(SITE.name)} · 수업료는 상담 시 안내해 드립니다.</div></div></footer>
<div class="callm" id="callm" onclick="if(event.target===this)this.classList.remove('open')"><div class="callm-box"><div style="font-size:.9rem;color:#64748B">상담 전화</div><b>${SITE.tel}</b><div class="row"><a class="btn btn-c" href="tel:${SITE.telRaw}" data-direct="1">전화 걸기</a><button class="btn" style="background:#F1F5F9" onclick="copyTel()">번호 복사</button></div><p style="font-size:.82rem;color:#94A3B8;margin:14px 0 0">아래 상담 신청을 남기시면 순서대로 연락드립니다.</p></div></div>`;
}

// ---------------- 스크립트 ----------------
export const NAV_JS = `<script>
function toggleNav(){var n=document.getElementById('nav');var o=n.classList.toggle('open');document.querySelector('.burger').setAttribute('aria-expanded',o)}
function toggleDrop(id,btn){var d=document.getElementById(id);var open=d.classList.contains('open');document.querySelectorAll('.nd').forEach(function(x){x.classList.remove('open')});if(!open){d.classList.add('open');setTimeout(function(){document.addEventListener('click',function c(e){if(!btn.parentNode.contains(e.target)){d.classList.remove('open');document.removeEventListener('click',c)}})},0)}}
function togglePills(btn){var p=btn.previousElementSibling;var o=p.classList.toggle('open');btn.textContent=o?'접기 ▲':'전체 보기 ▼'}
function copyTel(){var t='${SITE.tel}';(navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(function(){alert('번호를 복사했습니다: '+t)},function(){prompt('번호를 복사하세요',t)})}
document.addEventListener('click',function(e){var a=e.target.closest('a[href^="tel:"]');if(!a||a.dataset.direct)return;var mobile=window.matchMedia('(max-width:900px)').matches||('ontouchstart' in window);if(mobile)return;e.preventDefault();document.getElementById('callm').classList.add('open')});
(function(){var els=document.querySelectorAll('.anim');if(!('IntersectionObserver' in window)||window.matchMedia('(prefers-reduced-motion: reduce)').matches){els.forEach(function(el){el.classList.add('in')});return}var io=new IntersectionObserver(function(en){en.forEach(function(x){if(x.isIntersecting||x.boundingClientRect.top<window.innerHeight){x.target.classList.add('in');io.unobserve(x.target)}})},{threshold:.12,rootMargin:'0px 0px -6% 0px'});els.forEach(function(el){io.observe(el)});window.addEventListener('scroll',function(){els.forEach(function(el){if(!el.classList.contains('in')&&el.getBoundingClientRect().top<window.innerHeight)el.classList.add('in')})},{passive:true})})();
(function(){var t=document.getElementById('marq');if(t)t.innerHTML+=t.innerHTML})();
var schT=null;function schSugg(inp){clearTimeout(schT);var q=inp.value.trim();var box=inp.parentNode.querySelector('.sugg');if(!box)return;if(!q){box.classList.remove('open');box.innerHTML='';return}schT=setTimeout(function(){fetch('/api/sch-suggest?q='+encodeURIComponent(q)).then(function(r){return r.json()}).then(function(d){if(!d.length){box.innerHTML='<div class="none">일치하는 학교가 없습니다. 지역 이름(예: 강남구, 역삼동)으로도 검색해 보세요.</div>';box.classList.add('open');return}var lk={E:'초',M:'중',H:'고'};box.innerHTML=d.map(function(s){return '<a href="/school/'+s.slug+'/"><span class="lv tag lv-'+s.level+'">'+lk[s.level]+'</span> '+s.name+'<small>'+s.sgg+' '+s.dong+'</small></a>'}).join('');box.classList.add('open')}).catch(function(){})},160)}
function schGo(form){var q=form.querySelector('input').value.trim();if(!q)return false;location.href='/search/?q='+encodeURIComponent(q);return false}
document.addEventListener('click',function(e){if(!e.target.closest('.search'))document.querySelectorAll('.sugg').forEach(function(b){b.classList.remove('open')})});
</script>`;

export const FORM_JS = `<script>
var _pc=null;function loadPostcode(cb){if(window.daum&&daum.Postcode)return cb();if(_pc){_pc.push(cb);return}_pc=[cb];var s=document.createElement('script');s.src='https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';s.onload=function(){_pc.forEach(function(f){f()});_pc=null};s.onerror=function(){alert('주소 검색을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');_pc=null};document.head.appendChild(s)}
function searchAddr(){loadPostcode(function(){new daum.Postcode({oncomplete:function(d){document.getElementById('addr1').value=d.roadAddress||d.jibunAddress||d.address;document.getElementById('addr2').focus()}}).open()})}
document.addEventListener('DOMContentLoaded',function(){var ids=['ph1','ph2','ph3'];ids.forEach(function(id,i){var el=document.getElementById(id);if(!el)return;el.addEventListener('input',function(){this.value=this.value.replace(/[^0-9]/g,'');if(this.value.length>=this.maxLength&&i<2)document.getElementById(ids[i+1]).focus()});el.addEventListener('keydown',function(e){if(e.key==='Backspace'&&this.value===''&&i>0)document.getElementById(ids[i-1]).focus()})})});
function pageName(){return ((document.title||'').split(/\\s[|·-]\\s/)[0].trim()||(location.pathname==='/'?'홈':location.pathname))+' · '+location.pathname}
async function submitForm(){var v=function(id){var el=document.getElementById(id);return el?el.value.trim():''};var adult=document.getElementById('f-adult')?true:false;
var name=v('sName'),school=v('sSchool'),grade=v('sGrade'),subj=v('sSubj'),p1=v('ph1'),p2=v('ph2'),p3=v('ph3'),a1=v('addr1'),a2=v('addr2'),memo=v('sMemo'),hp=v('sHp');
if(!name){alert((adult?'성함':'학생 이름')+'을 입력해 주세요.');document.getElementById('sName').focus();return}
if(!adult&&!grade){alert('학년을 선택해 주세요.');return}
if(!/^01[0-9]$/.test(p1)||!/^[0-9]{3,4}$/.test(p2)||!/^[0-9]{4}$/.test(p3)){alert('연락처를 확인해 주세요.');document.getElementById(p1.length<3?'ph1':p2.length<3?'ph2':'ph3').focus();return}
if(!a1){alert('주소 검색으로 도로명 주소를 선택해 주세요.');return}
if(!a2){alert('상세 주소(동·호수)를 입력해 주세요.');document.getElementById('addr2').focus();return}
var phone=p1+'-'+p2+'-'+p3,addr=a1+' '+a2;var btn=document.querySelector('.submit');btn.disabled=true;btn.textContent='전송 중...';
try{var r=await fetch('/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({학생이름:name,학교명:school,학년:grade,과목:subj,연락처:phone,주소:addr,상세문의:memo,hp:hp,page:pageName()})});var d=await r.json();
if(d.ok){var rows=[[adult?'성함':'학생 이름',name]];if(school)rows.push(['학교',school]);if(grade)rows.push(['학년',grade]);if(subj)rows.push(['과목',subj]);rows.push(['연락처',phone],['주소',addr]);if(memo)rows.push(['상담내용',memo]);var e=function(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;')};
document.getElementById('sum').innerHTML='<div class="sum">'+rows.map(function(x){return '<div><b>'+x[0]+'</b><span>'+e(x[1])+'</span></div>'}).join('')+'</div>';document.getElementById('form-body').style.display='none';var dn=document.getElementById('done');dn.style.display='block';dn.scrollIntoView({behavior:'smooth',block:'center'})}
else{alert(d.error||'접수 중 문제가 생겼습니다. 전화 ${SITE.tel} 로 연락 주시면 바로 도와드리겠습니다.');btn.disabled=false;btn.textContent='상담 신청하기'}}
catch(err){alert('네트워크 오류입니다. 잠시 후 다시 시도하거나 ${SITE.tel} 로 전화 주세요.');btn.disabled=false;btn.textContent='상담 신청하기'}}
</script>`;

// ---------------- 상담 폼 ----------------
// p: {grade, subject, addr, detail, school(문자열이면 학교명 칸 표시), adult(성인 대상: 성함·연락처)}
export function FORM_HTML(p = {}) {
  const adult = !!p.adult;
  const grades = [['초등', ['초1', '초2', '초3', '초4', '초5', '초6']], ['중등', ['중1', '중2', '중3']], ['고등', ['고1', '고2', '고3']], ['기타', ['N수', '검정고시', '성인', '기타']]];
  const gradeSel = `<select id="sGrade"><option value="">학년을 선택해 주세요</option>${grades.map(([g, arr]) => `<optgroup label="${g}">${arr.map(x => `<option${p.grade === x ? ' selected' : ''}>${x}</option>`).join('')}</optgroup>`).join('')}</select>`;
  let n = 0; const num = () => ++n;
  const schoolField = p.school !== undefined ? `<div class="fg"><label for="sSchool">${num()}. 학교명</label><input type="text" id="sSchool" value="${escAttr(p.school)}" placeholder="학교 이름 (선택)"></div>` : '';
  return `<section class="form" id="consult-form" aria-label="상담 신청">${adult ? '<span id="f-adult" hidden></span>' : ''}<h3>${esc(CONTENT.form.title)}</h3><p class="form-desc">${esc(CONTENT.form.desc)}</p><div id="form-body">
<div class="fg"><label for="sName">${num()}. ${adult ? '성함' : '학생 이름'} <span class="req">필수</span></label><input type="text" id="sName" placeholder="${adult ? '성함을 입력해 주세요' : '학생 이름을 입력해 주세요'}" autocomplete="off"></div>
${schoolField}
${adult ? `<input type="hidden" id="sGrade" value="${escAttr(p.grade || '성인')}">` : `<div class="fg"><label for="sGrade">${num()}. 학년 <span class="req">필수</span></label>${gradeSel}</div>`}
<div class="fg"><label for="sSubj">${num()}. 과목</label><input type="text" id="sSubj" value="${escAttr(p.subject || '')}" placeholder="예) 수학, 영어"></div>
<div class="fg"><label for="ph1">${num()}. ${adult ? '연락처' : '학부모 연락처'} <span class="req">필수</span></label><div class="ph3"><input type="tel" id="ph1" inputmode="numeric" maxlength="3" value="010" style="width:70px"><span>-</span><input type="tel" id="ph2" inputmode="numeric" maxlength="4" placeholder="0000" style="width:86px"><span>-</span><input type="tel" id="ph3" inputmode="numeric" maxlength="4" placeholder="0000" style="width:86px"></div></div>
<div class="fg"><label for="addr1">${num()}. 주소 <span class="req">필수</span></label><p class="hint">도로명 주소를 검색한 뒤 상세 주소(동·호수)까지 적어 주세요. 방문 가능 여부 확인에 쓰입니다.</p><div class="addr"><input type="text" id="addr1" value="${escAttr(p.addr || '')}" placeholder="도로명 주소 검색" readonly onclick="searchAddr()"><button type="button" onclick="searchAddr()">주소 검색</button></div><input type="text" id="addr2" placeholder="상세 주소 (동·호수)"></div>
<div class="fg"><label for="sMemo">${num()}. 상담 내용</label><textarea id="sMemo" placeholder="현재 상황, 목표, 원하는 수업 방식을 편하게 적어 주세요.">${esc(p.detail || '')}</textarea></div>
<div class="hp" aria-hidden="true"><label for="sHp">홈페이지</label><input type="text" id="sHp" tabindex="-1" autocomplete="off"></div>
<button type="button" class="submit" onclick="submitForm()">상담 신청하기</button><p class="form-note">남겨 주신 정보는 상담 안내에만 사용합니다. 수업료는 상담 시 안내해 드립니다.</p></div>
<div class="done" id="done"><div class="ok">✅</div><h4>상담 신청이 접수되었습니다</h4><p>확인 후 순서대로 연락드리겠습니다.</p><div id="sum"></div></div></section>`;
}

// ---------------- JSON-LD ----------------
const ld = o => `<script type="application/ld+json">${JSON.stringify(o)}</script>`;
export function orgLD() {
  return ld({ '@context': 'https://schema.org', '@type': 'EducationalOrganization', name: SITE.name, alternateName: SITE.nameEn, url: SITE.origin + '/', logo: SITE.origin + '/favicon.png', image: SITE.origin + '/og.png', description: SITE.desc, telephone: '+82-' + SITE.tel.slice(1), areaServed: { '@type': 'Country', name: 'South Korea' }, contactPoint: { '@type': 'ContactPoint', telephone: '+82-' + SITE.tel.slice(1), contactType: 'customer service', areaServed: 'KR', availableLanguage: 'Korean' } });
}
export function websiteLD() {
  return ld({ '@context': 'https://schema.org', '@type': 'WebSite', name: SITE.name, url: SITE.origin + '/', potentialAction: { '@type': 'SearchAction', target: { '@type': 'EntryPoint', urlTemplate: SITE.origin + '/search/?q={search_term_string}' }, 'query-input': 'required name=search_term_string' } });
}
export const breadcrumbLD = items => ld({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: it.url })) });
export const faqLD = faqs => ld({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map(f => ({ '@type': 'Question', name: f[0], acceptedAnswer: { '@type': 'Answer', text: f[1] } })) });
export const serviceLD = (name, desc, url, area) => ld({ '@context': 'https://schema.org', '@type': 'Service', serviceType: name, name, description: desc, url, provider: { '@type': 'EducationalOrganization', name: SITE.name, url: SITE.origin + '/', telephone: '+82-' + SITE.tel.slice(1) }, areaServed: area ? { '@type': 'Place', name: area } : { '@type': 'Country', name: 'South Korea' }, audience: { '@type': 'EducationalAudience', educationalRole: 'student' } });
export const articleLD = (g, url) => ld({ '@context': 'https://schema.org', '@type': 'Article', headline: g.h1, description: g.desc, datePublished: g.date, dateModified: g.updated || g.date, author: { '@type': 'Organization', name: SITE.name }, publisher: { '@type': 'Organization', name: SITE.name, url: SITE.origin + '/', logo: { '@type': 'ImageObject', url: SITE.origin + '/favicon.png' } }, mainEntityOfPage: url, image: SITE.origin + '/og.png', keywords: (g.tags || []).join(', ') });

// 주소에서 빵부스러기 자동 생성 (지역 페이지)
export function autoBC(pathname) {
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length < 2) return null;
  const last = parts[parts.length - 1];
  const s = subjInfo(last);
  if (!s) return null;
  const kor = s.kor + ' 과외';
  const items = [{ name: '홈', url: ABS('/') }, { name: s.kor + ' 과외', url: ABS('/' + last + '/') }];
  const sido = sidoFull(parts[0]); if (!sido) return null;
  if (parts.length === 2) { items.push({ name: sido + ' ' + kor, url: ABS(pathname) }); return items; }
  items.push({ name: sido, url: ABS(`/${parts[0]}/${last}/`) });
  const sgg = getSgg(parts[0], parts[1]); if (!sgg) return null;
  if (parts.length === 3) { items.push({ name: sgg.name + ' ' + kor, url: ABS(pathname) }); return items; }
  const g3 = GRADE_INFO[parts[2]];
  if (parts.length === 4 && g3) { items.push({ name: sgg.name, url: ABS(`/${parts[0]}/${parts[1]}/${last}/`) }); items.push({ name: g3.label + ' ' + kor, url: ABS(pathname) }); return items; }
  const dong = getDong(parts[0], parts[1], parts[2]); if (!dong) return null;
  items.push({ name: sgg.name, url: ABS(`/${parts[0]}/${parts[1]}/${last}/`) });
  if (parts.length === 4) { items.push({ name: dong.name + ' ' + kor, url: ABS(pathname) }); return items; }
  const g4 = GRADE_INFO[parts[3]]; if (parts.length !== 5 || !g4) return null;
  items.push({ name: dong.name, url: ABS(`/${parts[0]}/${parts[1]}/${parts[2]}/${last}/`) });
  items.push({ name: g4.label + ' ' + kor, url: ABS(pathname) });
  return items;
}
export function bcHtml(items) {
  return `<nav class="bc" aria-label="현재 위치">${items.map((it, i) => i === items.length - 1 ? `<strong>${esc(it.name)}</strong>` : `<a href="${it.url.replace(SITE.origin, '')}">${esc(it.name)}</a><span>›</span>`).join('')}</nav>`;
}

// ---------------- 페이지 응답 ----------------
// meta: {title, desc, keywords, canonical, breadcrumbs, faqs, ld:[], robots, ogType, noForm}
export function PR(meta, body, form = {}, opts = {}) {
  let bc = meta.breadcrumbs;
  if (!bc && meta.canonical) { try { bc = autoBC(new URL(meta.canonical).pathname); } catch (e) {} }
  const lds = [orgLD()];
  if (bc) lds.push(breadcrumbLD(bc));
  if (meta.faqs && meta.faqs.length) lds.push(faqLD(meta.faqs));
  if (meta.ld) lds.push(...[].concat(meta.ld));
  const html = HEAD(meta) + HDR() + '<main>' + body + (meta.noForm ? '' : '<div class="art" style="padding-top:0">' + FORM_HTML(form) + '</div>') + '</main>' + FTR() + NAV_JS + FORM_JS + lds.join('') + '</body></html>';
  const headers = { 'Content-Type': 'text/html;charset=UTF-8', 'Cache-Control': opts.cache || 'public, max-age=3600' };
  if (_host && _host !== SITE.domain) headers['X-Robots-Tag'] = 'noindex'; // workers.dev 등 미리보기 주소는 색인 제외
  return new Response(html, { status: opts.status || 200, headers });
}
export const faqHtml = (faqs, h2 = '자주 묻는 질문') => `<h2 class="h2">❓ ${esc(h2)}</h2><div class="faq">${faqs.map(f => `<div class="fi"><p class="fq">${esc(f[0])}</p><p class="fa">${esc(f[1])}</p></div>`).join('')}</div>`;
export const ctaHtml = (h3, p) => `<div class="cta"><h3>${esc(h3)}</h3><p>${esc(p)}</p><div class="btn-row"><a href="#consult-form" class="btn btn-p">상담 신청하기</a><a href="tel:${SITE.telRaw}" class="btn btn-o">📞 ${SITE.tel}</a></div></div>`;
export const updHtml = () => `<p class="upd">최종 업데이트: <time datetime="${SITE.updated}">${formatKR(SITE.updated)}</time></p>`;
export function pillsHtml(items, show = 8, cls = '') {
  const inner = items.map((it, i) => `<a class="pill${it.on ? ' on' : ''}${i >= show ? ' hid' : ''}" href="${it.href}">${esc(it.label)}</a>`).join('');
  return `<div class="pills ${cls}">${inner}</div>${items.length > show ? '<button type="button" class="more-btn" onclick="togglePills(this)">전체 보기 ▼</button>' : ''}`;
}
// gradeKey 가 있으면 그 학년 페이지가 없는 과목은 학년 없는 주소(basePrefix)로 연결한다
export function subjectBox(cur, prefix, gradeKey = '', basePrefix = '') {
  return `<div class="subj-box"><b>📚 과목 선택</b><div class="pills">${ALL_SUBJ_KEYS.map(k => { const s = subjInfo(k); const hasGrade = !gradeKey || (s.grade && s.grade[gradeKey]); return `<a class="pill${k === cur ? ' on' : ''}" href="${hasGrade ? prefix : basePrefix}/${k}/">${s.emoji} ${esc(s.kor)}</a>`; }).join('')}</div></div>`;
}
