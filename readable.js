// 문장마다 줄바꿈 (2026-10-10 사용자 요청: "가독성 좋다는 건 문장마다 줄바꿈, 너무 줄글로 쓰지 말라").
// 워커가 만든 HTML 의 본문(<main>, 없으면 <body>) 안 <p> 에서 문장 끝(한글 + . ? !) 뒤 공백을 <br> 로 바꾼다.
// 문장 풀·본문 데이터는 그대로 두고 화면에서만 끊는다 — 검색엔진·AI 는 같은 문장을 그대로 읽는다.
// 푸터·폼 안내·업데이트 날짜·표·목록은 건드리지 않는다.
const SKIP_P = /class="[^"]*\b(upd|form-note|hint|fee-note|ft-|h1-sub|bc)\b/;
function breakText(inner) {
  // 태그 바깥 텍스트에서만 바꾼다. "2.5", "U.S." 같은 경우를 피하려고 문장 끝 앞 글자가 한글일 때만 끊는다.
  return inner.split(/(<[^>]+>)/).map(t => t.startsWith('<') ? t : t.replace(/([가-힣][.?!])\s+(?=\S)/g, '$1<br>')).join('');
}
export function breakSentences(html) {
  const start = html.search(/<main[\s>]/i) >= 0 ? html.search(/<main[\s>]/i) : html.search(/<body[\s>]/i);
  if (start < 0) return html;
  const endM = html.indexOf('</main>', start); const end = endM > 0 ? endM : html.length;
  let mid = html.slice(start, end);
  const keep = []; // script/style/form 블록은 손대지 않는다
  mid = mid.replace(/<(script|style|form|footer|table|textarea)\b[\s\S]*?<\/\1>/gi, m => `\u0000${keep.push(m) - 1}\u0000`);
  mid = mid.replace(/<p\b([^>]*)>([\s\S]*?)<\/p>/gi, (m, attrs, inner) => (SKIP_P.test(attrs) || /<(div|ul|ol|table|h\d)\b/i.test(inner)) ? m : `<p${attrs}>${breakText(inner)}</p>`);
  mid = mid.replace(/\u0000(\d+)\u0000/g, (_, i) => keep[+i]);
  return html.slice(0, start) + mid + html.slice(end);
}
export async function readableResponse(res) {
  const r = await res; const ct = r.headers.get('content-type') || '';
  if (!ct.includes('text/html') || !r.body) return r;
  let html = breakSentences(await r.text()); const h = new Headers(r.headers); h.delete('content-length');
  // 검색·AI 요약이 본문을 길게 인용해도 되도록 스니펫 제한을 푼다 (noindex 페이지·이미 지정한 페이지는 그대로)
  if (!/<meta name="robots"/i.test(html) && !/noindex/i.test(h.get('x-robots-tag') || '')) html = html.replace(/<\/head>/i, '<meta name="robots" content="index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1"></head>');
  return new Response(html, { status: r.status, statusText: r.statusText, headers: h });
}
