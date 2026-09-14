// 정보글. 항목을 추가하면 /guides/ 목록·/guides/<slug>/·사이트맵·RSS·llms.txt 에 자동으로 실린다.
// 규칙: 가격·합격 수치 금지. 제도·일정은 "해마다 바뀔 수 있으니 공고 확인"을 넣는다.
// 항목 구조:
// {
//   slug: 'middle-first-exam',            // /guides/middle-first-exam/
//   title: '검색 결과용 제목 (60자 이내)',
//   h1: '본문 제목',
//   desc: '요약 (70~150자)',
//   date: '2026-09-14', updated: '2026-09-14',
//   tags: ['중1', '첫 시험'],
//   intro: '도입 문단',
//   sections: [{ h: '소제목', ps: ['문단', ...], ul: ['목록', ...] }],
//   faq: [['질문', '답']],
//   related: [['링크 이름', '/math/']],
//   cta: '중1 첫 시험',
// }
export default [];
