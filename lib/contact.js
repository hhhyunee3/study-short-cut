// 상담 접수 /api/contact — 이메일(Email Routing) + 텔레그램 + (선택) 구글 시트. 한 곳이라도 성공해야 접수 완료.
import SITE from '../site.js';

const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const b64 = s => btoa(String.fromCharCode(...new TextEncoder().encode(s)));
const word = s => `=?UTF-8?B?${b64(s)}?=`;

function mailHtml(r) {
  const row = (k, v, extra = '') => `<tr><td style="padding:10px 0;color:#64748B;width:110px;font-weight:600;vertical-align:top">${k}</td><td style="padding:10px 0;color:#0F172A;${extra}">${v}</td></tr>`;
  return `<div style="font-family:'Apple SD Gothic Neo','Malgun Gothic',sans-serif;max-width:600px;margin:0 auto;padding:16px">
<div style="background:${SITE.colors.c1};color:#fff;padding:20px 22px;border-radius:12px 12px 0 0"><div style="font-size:13px;opacity:.85">${esc(SITE.name)}</div><h1 style="font-size:20px;margin:4px 0 0">📞 새 상담 신청이 도착했습니다</h1></div>
<div style="border:1px solid #E2E8F0;border-top:none;padding:18px 22px;border-radius:0 0 12px 12px"><table style="width:100%;border-collapse:collapse;font-size:15px">
${row(r.adult ? '성함' : '학생 이름', `<b>${esc(r.name)}</b>`)}${r.school ? row('학교', esc(r.school)) : ''}${r.grade ? row('학년', esc(r.grade)) : ''}${r.subject ? row('과목', `<b style="color:${SITE.colors.c3}">${esc(r.subject)}</b>`) : ''}
${row('📞 연락처', `<a href="tel:${esc(r.phone)}" style="color:${SITE.colors.c1};font-weight:700;font-size:17px;text-decoration:none">${esc(r.phone)}</a>`)}${row('📍 주소', esc(r.address))}${row('상담 내용', esc(r.message || '(없음)').replace(/\n/g, '<br>'), 'line-height:1.7')}${row('유입 페이지', `<span style="font-size:13px;color:#7C8A99">${esc(r.page || '-')}</span>`)}
</table><div style="margin-top:16px;padding:14px;background:#F8FAFC;border-left:4px solid ${SITE.colors.c3};border-radius:6px"><a href="tel:${esc(r.phone)}" style="display:inline-block;background:${SITE.colors.c1};color:#fff;padding:10px 18px;border-radius:8px;font-weight:700;text-decoration:none">📞 전화 걸기</a></div>
<div style="margin-top:16px;font-size:12px;color:#94A3B8;text-align:center">${SITE.domain} · 신청 시각: ${esc(r.atDisplay)}</div></div></div>`;
}
function mime({ from, fromName, to, subject, html }) {
  const body = b64(html).match(/.{1,76}/g).join('\r\n');
  return [`From: ${word(fromName)} <${from}>`, `To: ${to}`, `Subject: ${word(subject)}`, 'MIME-Version: 1.0', 'Content-Type: text/html; charset=utf-8', 'Content-Transfer-Encoding: base64'].join('\r\n') + '\r\n\r\n' + body + '\r\n';
}
async function sendMail(env, r) {
  if (!env.NOTIFY) throw new Error('NOTIFY 바인딩 없음');
  const to = env.NOTIFY_TO || SITE.mailTo, from = env.NOTIFY_FROM || SITE.mailFrom;
  const subject = `[${SITE.name}] ${r.subject ? r.subject + ' ' : ''}상담 신청 - ${r.name}${r.region ? ' (' + r.region + ')' : ''}`;
  const raw = mime({ from, fromName: SITE.name, to, subject, html: mailHtml(r) });
  let EmailMessage = null;
  try { ({ EmailMessage } = await import('cloudflare:email')); } catch (e) {}
  if (EmailMessage) { try { await env.NOTIFY.send(new EmailMessage(from, to, raw)); return; } catch (e) { /* 객체 방식 재시도 */ } }
  await env.NOTIFY.send({ from, to, raw });
}
async function saveSheet(env, r) {
  if (!env.SHEET_WEBHOOK_URL) return false;
  const res = await fetch(env.SHEET_WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ site: SITE.name, atDisplay: r.atDisplay, name: r.name, phone: r.phone, grade: r.grade + (r.school ? ' / ' + r.school : ''), subjects: r.subject ? [r.subject] : [], address: r.address, message: r.message, page: r.page }) });
  if (!res.ok) return false;
  try { const j = await res.json(); return j && j.ok !== false; } catch (e) { return true; }
}

async function sendTelegram(env, r) {
  const token = env.TELEGRAM_BOT_TOKEN, chat = env.TELEGRAM_CHAT_ID;
  if (!token || !chat) return false;
  const lines = ['📞 <b>' + esc(SITE.name) + ' 새 상담 신청</b>', '',
    (r.adult ? '👤 성함: ' : '👤 학생: ') + esc(r.name),
    r.school ? '🏫 학교: ' + esc(r.school) : '',
    r.grade ? '📚 학년: ' + esc(r.grade) : '',
    r.subject ? '✏️ 과목: ' + esc(r.subject) : '',
    '📞 연락처: ' + esc(r.phone),
    '📍 주소: ' + esc(r.address),
    r.message ? '💬 내용: ' + esc(r.message) : '',
    '🔗 유입: ' + esc(r.page || '-'),
    '🕒 ' + esc(r.atDisplay)].filter(Boolean);
  const res = await fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chat, text: lines.join('\n'), parse_mode: 'HTML', disable_web_page_preview: true }),
  });
  if (!res.ok) { console.log('텔레그램 실패:', res.status, (await res.text()).slice(0, 200)); return false; }
  return true;
}

async function saveKV(env, r) {
  if (!env.INQUIRY) return false;
  const t = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
  const key = `${t}-${SITE.domain}-${Math.random().toString(36).slice(2, 8)}`;
  await env.INQUIRY.put(key, JSON.stringify({ site: SITE.name, domain: SITE.domain, ...r }), { expirationTtl: 60 * 60 * 24 * 365 });
  return true;
}

export async function handleContact(request, env) {
  let d;
  try { d = await request.json(); } catch (e) { return json({ ok: false, error: '요청 형식이 올바르지 않습니다.' }, 400); }
  // 사람에게 보이지 않는 칸이 채워져 있으면 봇 — 접수한 척하고 버린다.
  if (String(d.hp || '').trim()) return json({ ok: true });
  const s = (k, n) => String(d[k] ?? '').trim().slice(0, n);
  const r = {
    name: s('학생이름', 30), school: s('학교명', 40), grade: s('학년', 12), subject: s('과목', 40), phone: s('연락처', 14), address: s('주소', 160), message: s('상세문의', 800), page: s('page', 200),
    atDisplay: new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
  };
  r.adult = r.grade === '성인' || r.grade === '검정고시';
  r.region = r.address.split(' ').slice(0, 2).join(' ');
  if (!r.name || !/^01[0-9]-[0-9]{3,4}-[0-9]{4}$/.test(r.phone) || !r.address) return json({ ok: false, error: '이름·연락처·주소를 확인해 주세요.' }, 400);
  let mailOk = false, sheetOk = false, tgOk = false, kvOk = false, err = '';
  try { await sendMail(env, r); mailOk = true; } catch (e) { err = String(e && e.message || e); console.log('메일 실패:', err); }
  try { sheetOk = await saveSheet(env, r); } catch (e) { console.log('시트 실패:', String(e && e.message || e)); }
  try { tgOk = await sendTelegram(env, r); } catch (e) { console.log('텔레그램 실패:', String(e && e.message || e)); }
  // 알림이 모두 실패해도 내용은 남긴다(알림 설정 전 유실 방지).
  try { kvOk = await saveKV(env, r); } catch (e) { console.log('보관 실패:', String(e && e.message || e)); }
  console.log('상담 신청', SITE.name, '| 메일:', mailOk, '| 시트:', sheetOk, '| 텔레그램:', tgOk, '| 보관:', kvOk, '| 페이지:', r.page);
  if (!mailOk && !sheetOk && !tgOk && !kvOk) return json({ ok: false, error: `접수 중 문제가 생겼습니다. 전화 ${SITE.tel} 로 연락 주시면 바로 도와드리겠습니다.` }, 500);
  return json({ ok: true });
}
