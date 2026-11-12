// 상담 접수 /api/contact — KV 보관을 먼저 하고, KV 가 성공해야 접수 완료(2026-11-05). KV 가 실패하면 전화 안내.
// 그 뒤 이메일(Email Routing)·텔레그램·(선택) 구글 시트를 함께 보낸다. 이 셋은 실패해도 접수 결과에 영향 없음.
import SITE from '../site.js';
import { inquirySource, tgPayload, tgPreview } from './inqsrc.js';

const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const b64 = s => btoa(String.fromCharCode(...new TextEncoder().encode(s)));
const word = s => `=?UTF-8?B?${b64(s)}?=`;

const link = u => u ? `<a href="${esc(u)}" style="font-size:13px;color:#2563EB;word-break:break-all">${esc(decodeURI(u))}</a>` : '<span style="font-size:13px;color:#7C8A99">-</span>';
function mailHtml(r) {
  const row = (k, v, extra = '') => `<tr><td style="padding:10px 0;color:#64748B;width:110px;font-weight:600;vertical-align:top">${k}</td><td style="padding:10px 0;color:#0F172A;${extra}">${v}</td></tr>`;
  return `<div style="font-family:'Apple SD Gothic Neo','Malgun Gothic',sans-serif;max-width:600px;margin:0 auto;padding:16px">
<div style="background:${SITE.colors.c1};color:#fff;padding:20px 22px;border-radius:12px 12px 0 0"><div style="font-size:13px;opacity:.85">${esc(SITE.name)}</div><h1 style="font-size:20px;margin:4px 0 0">📞 새 상담 신청이 도착했습니다</h1></div>
<div style="border:1px solid #E2E8F0;border-top:none;padding:18px 22px;border-radius:0 0 12px 12px"><table style="width:100%;border-collapse:collapse;font-size:15px">
${row(r.adult ? '성함' : '학생 이름', `<b>${esc(r.name)}</b>`)}${r.school ? row('학교', esc(r.school)) : ''}${r.grade ? row('학년', esc(r.grade)) : ''}${r.subject ? row('과목', `<b style="color:${SITE.colors.c3}">${esc(r.subject)}</b>`) : ''}
${row('📞 연락처', `<a href="tel:${esc(r.phone)}" style="color:${SITE.colors.c1};font-weight:700;font-size:17px;text-decoration:none">${esc(r.phone)}</a>`)}${row('📍 주소', esc(r.address))}${row('상담 내용', esc(r.message || '(없음)').replace(/\n/g, '<br>'), 'line-height:1.7')}${row('신청 페이지', link(r.pageUrl))}${row('처음 들어온 페이지', link(r.firstUrl))}${row('유입', esc(r.source || '-'))}
</table><div style="margin-top:16px;padding:14px;background:#F8FAFC;border-left:4px solid ${SITE.colors.c3};border-radius:6px"><a href="tel:${esc(r.phone)}" style="display:inline-block;background:${SITE.colors.c1};color:#fff;padding:10px 18px;border-radius:8px;font-weight:700;text-decoration:none">📞 전화 걸기</a></div>
<div style="margin-top:16px;font-size:12px;color:#94A3B8;text-align:center">${SITE.domain} · 신청 시각: ${esc(r.atDisplay)}</div></div></div>`;
}
function mime({ from, fromName, to, subject, html }) {
  const body = b64(html).match(/.{1,76}/g).join('\r\n');
  // Date·Message-ID 가 없으면 Cloudflare 스팸 점수 5점(기준 5)으로 거부된다(2026-11-05, 공부지름길 8건 유실).
  return [`From: ${word(fromName)} <${from}>`, `To: ${to}`, `Subject: ${word(subject)}`,
    `Date: ${new Date().toUTCString().replace('GMT', '+0000')}`, `Message-ID: <${crypto.randomUUID()}@${from.split('@')[1]}>`, 'MIME-Version: 1.0', 'Content-Type: text/html; charset=utf-8', 'Content-Transfer-Encoding: base64'].join('\r\n') + '\r\n\r\n' + body + '\r\n';
}
async function sendMail(env, r) {
  if (!env.NOTIFY) throw new Error('NOTIFY 바인딩 없음');
  const to = env.NOTIFY_TO || SITE.mailTo, from = env.NOTIFY_FROM || SITE.mailFrom;
  const subject = `${r.flag ? '[' + r.flag + '] ' : ''}[${SITE.name}] ${r.subject ? r.subject + ' ' : ''}상담 신청 - ${r.name}${r.region ? ' (' + r.region + ')' : ''}`;
  const raw = mime({ from, fromName: SITE.name, to, subject, html: mailHtml(r) });
  let EmailMessage = null;
  try { ({ EmailMessage } = await import('cloudflare:email')); } catch (e) {}
  if (EmailMessage) { try { await env.NOTIFY.send(new EmailMessage(from, to, raw)); return; } catch (e) { /* 객체 방식 재시도 */ } }
  await env.NOTIFY.send({ from, to, raw });
}
async function saveSheet(env, r) {
  if (!env.SHEET_WEBHOOK_URL) return false;
  const res = await fetch(env.SHEET_WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(5000), body: JSON.stringify({ site: SITE.name, atDisplay: r.atDisplay, name: r.name, phone: r.phone, grade: r.grade + (r.school ? ' / ' + r.school : ''), subjects: r.subject ? [r.subject] : [], address: r.address, message: r.message, page: r.page }) });
  if (!res.ok) return false;
  try { const j = await res.json(); return j && j.ok !== false; } catch (e) { return true; }
}

// 텔레그램: 이모티콘 없이 항목 이름으로 구분한다(2026-11-05). 첫 줄 [사이트 이름] + [봇 의심] 표시.
// 일반 텍스트로 보낸다(링크가 그대로 눌린다). 5초 넘으면 끊는다. TG_PREVIEW(로컬 --var)면 보낼 내용을 로그로 남긴다.
export function telegramText(r) {
  const head = '[' + SITE.name + ']' + (r.flag ? ' [' + r.flag + ']' : '') + ' 새 상담 신청';
  return [head, r.flag ? '숨은 칸 값: ' + r.hp : '', '',
    (r.adult ? '성함: ' : '학생: ') + r.name, '연락처: ' + r.phone,
    r.school ? '학교: ' + r.school : '', r.grade ? '학년: ' + r.grade : '', r.subject ? '과목: ' + r.subject : '',
    '주소: ' + r.address, r.message ? '내용: ' + r.message : '',
    '신청 페이지: ' + (r.pageUrl || '-'), '처음 들어온 페이지: ' + (r.firstUrl || '-'), '유입: ' + (r.source || '-'),
    '접수: ' + r.atDisplay].filter((x, i) => x || i === 2).join('\n');
}
async function sendTelegram(env, r) {
  const text = telegramText(r);
  if (env.TG_PREVIEW) console.log('[텔레그램 미리보기]\n' + tgPreview(text));
  const token = env.TELEGRAM_BOT_TOKEN, chat = env.TELEGRAM_CHAT_ID;
  if (!token || !chat) return false;
  const res = await fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(5000),
    body: JSON.stringify(tgPayload(chat, text)),
  });
  if (!res.ok) throw new Error('텔레그램 응답 ' + res.status);
  return true;
}

async function saveKV(env, r) {
  if (!env.INQUIRY) throw new Error('INQUIRY 바인딩 없음');
  const t = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
  const key = `${t}-${SITE.domain}-${r.flag ? 'suspect-' : ''}${Math.random().toString(36).slice(2, 8)}`;
  await env.INQUIRY.put(key, JSON.stringify({ site: SITE.name, domain: SITE.domain, ...r }), { expirationTtl: 60 * 60 * 24 * 365 });
  return true;
}

export async function handleContact(request, env, ctx) {
  let d;
  try { d = await request.json(); } catch (e) { return json({ ok: false, error: '요청 형식이 올바르지 않습니다.' }, 400); }
  // 보이지 않는 칸이 채워졌으면 봇 의심. 사람을 놓치지 않도록 버리지 않고 메일·텔레그램·KV 모두 보내되,
  // 제목에 [봇 의심]을 붙이고 KV 키에 suspect 를 넣는다. 구글 시트에는 넣지 않는다.
  const hp = String(d.hp || '').trim();
  const s = (k, n) => String(d[k] ?? '').trim().slice(0, n);
  const r = {
    name: s('학생이름', 30), school: s('학교명', 40), grade: s('학년', 12), subject: s('과목', 40), phone: s('연락처', 14), address: s('주소', 160), message: s('상세문의', 800), page: s('page', 200),
    atDisplay: new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
  };
  r.adult = r.grade === '성인' || r.grade === '검정고시';
  r.region = r.address.split(' ').slice(0, 2).join(' ');
  if (!r.name || !/^01[0-9]-[0-9]{3,4}-[0-9]{4}$/.test(r.phone) || !r.address) return json({ ok: false, error: '이름·연락처·주소를 확인해 주세요.' }, 400);
  if (hp) Object.assign(r, { flag: '봇 의심', hp: hp.slice(0, 200) });
  Object.assign(r, inquirySource(d, SITE.origin, r.page)); // 신청 페이지·처음 들어온 페이지(전체 URL)·유입
  try { await saveKV(env, r); } catch (e) {
    console.log('보관 실패:', String(e && e.message || e));
    return json({ ok: false, error: `접수 중 문제가 생겼습니다. 번거로우시겠지만 ${SITE.tel} 로 전화나 문자 주시면 바로 상담 도와드리겠습니다.` }, 500);
  }
  // 2026-11-12: KV 성공 = 접수 완료를 바로 돌려주고, 메일·시트·텔레그램은 응답 뒤 ctx.waitUntil 로 이어서 보낸다(손님이 창을 닫아도 끊기지 않음).
  const job = (async () => {
    const res = await Promise.allSettled([sendMail(env, r).then(() => true), r.flag ? Promise.resolve(false) : saveSheet(env, r), sendTelegram(env, r)]);
    const st = x => x.status === 'fulfilled' ? (x.value ? '성공' : '건너뜀') : '실패';
    res.forEach((x, i) => { if (x.status === 'rejected') console.log(['메일', '시트', '텔레그램'][i] + ' 실패:', String(x.reason && x.reason.message || x.reason)); });
    console.log(r.flag ? '상담 신청(' + r.flag + ')' : '상담 신청', SITE.name, '| 보관: 성공 | 메일:', st(res[0]), '| 시트:', st(res[1]), '| 텔레그램:', st(res[2]), '| 페이지:', r.page);
  })();
  if (ctx && typeof ctx.waitUntil === 'function') ctx.waitUntil(job); else await job;
  return json({ ok: true });
}
