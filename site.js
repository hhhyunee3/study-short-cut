// 사이트 설정 — 브랜드·도메인·색상처럼 이 사이트에서만 다른 값.
// 문구(홈·과목·지역·학교 본문)는 content.js, 교육정보 글은 guides.js 에 있다.
export default {
  name: '공부지름길',
  nameEn: 'StudyShortcut',
  domain: 'study-short-cut.com',
  origin: 'https://study-short-cut.com',
  tel: '010-3038-8978',
  telRaw: '01030388978',
  tagline: '목표까지 가장 짧은 길, 1:1 맞춤 과외',
  // 검색결과·SNS 요약 한 줄
  desc: '전국 초·중·고 1:1 방문·화상 과외. 시험 대비에 필요한 것만 골라 가장 짧은 길로 성적을 올립니다. 무료 상담 010-3038-8978',
  // 디자인 토큰 — 기본(c1)·보조(c2)·버튼(c3)·포인트(c4)
  colors: { c1: '#14532D', c2: '#BBF7D0', c3: '#16A34A', c4: '#FACC15' },
  // 로고 마크 안 글자
  logoLetter: '길',
  // 지역 페이지까지 만드는 공통 과목(순서대로 메뉴에 표시)과 특화 프로그램
  subjects: ['math', 'english', 'korean', 'science', 'social'],
  extras: ['essay', 'ged'],
  // IndexNow 키 — /<키>.txt 로도 응답한다
  indexNowKey: '4a7c1e9b2d5f4083a6c9e1b7d3f2a5c8',
  // 본문 "최종 업데이트" 표시와 사이트맵 lastmod
  updated: '2026-09-14',
  mailFrom: 'noreply@study-short-cut.com',
  mailTo: 'hhhyunee3@naver.com',
};
