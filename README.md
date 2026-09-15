# 공부지름길 (study-short-cut.com)

전국 초·중·고 1:1 방문·화상 과외 안내 사이트. Cloudflare Workers 단일 워커 + `public/` 정적 자산.

## 파일
| 파일 | 역할 |
|---|---|
| `worker.js` | 라우터(진입점). 주소 → 페이지 생성 함수 연결, 301/404, API |
| `site.js` | 브랜드·도메인·색상·과목 목록·IndexNow 키 (이 사이트만 다른 값) |
| `content.js` | 홈·과목·지역·학교 본문 문구. 치환자 `{법정동} {시군구} {시도} {학년} {과목} {학교} {급}` |
| `guides.js` | 정보글. 항목 추가만 하면 목록·사이트맵·RSS 에 자동 반영 |
| `regions.js` | 시도→시군구→동 데이터 (17 시도 · 255 시군구 · 5,067 동) |
| `schools.txt` | 학교 데이터 (`#시도` / `>시군구` / `동\|급설립남녀이름=슬러그,...`) |
| `lib/core.js` | head·헤더·푸터·상담 폼·스타일·JSON-LD·응답 헬퍼 |
| `lib/data.js` | 지역·학교 데이터 접근 |
| `lib/gen.js` | 문장 조합 엔진. `pools/` 문장 풀에서 페이지 주소 해시로 자리마다 대안 문장을 골라 본문을 만든다 |
| `pools/*.js` | 본문 문장 풀 — `common.js`(모든 페이지 공통), `school.js`(학교 급별), 과목별 파일(`extra1`·`extra2`는 특화 과목) |
| `lib/pages-subject.js` | 과목 메인·시도·시군구·동·학년·지역 허브 페이지 |
| `lib/pages-school.js` | 학교 허브·시도·시군구·학교·학교×과목 페이지 |
| `lib/pages-misc.js` | 홈·내신 계산기·정보글·404 |
| `lib/seo.js` | robots·분할 사이트맵·RSS·llms.txt·IndexNow. `SITEMAP_TIERS` 로 단계 개방 |
| `lib/contact.js` | `/api/contact` 상담 접수 (이메일 + 구글 시트) |
| `public/` | `og.png` `favicon.png` `apple-touch-icon.png` `images/…` `_headers` |

## 주소 체계 (끝 슬래시, 반대쪽은 301)
`/` · `/math/` `/english/` … · `/seoul/math/` · `/seoul/gangnam-gu/math/` · `/seoul/gangnam-gu/yeoksam-dong/math/` · `/seoul/gangnam-gu/high/math/` · `/regions/` · `/schools/` → `/schools/seoul/` → `/schools/seoul/gangnam-gu/` · `/school/gaepo-m/` · `/school/gaepo-m/math/` · `/search/?q=` · `/tools/grade-calculator/` · `/guides/` · `/guides/슬러그/`

## 배포
- `main` 에 push 하면 GitHub Actions(`.github/workflows/deploy.yml`) 가 wrangler 4.129.0 으로 배포한다.
- GitHub 저장소 → Settings → Secrets and variables → Actions 에 `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` 를 넣는다.
- 도메인이 같은 Cloudflare 계정에 있으면 `wrangler.toml` 의 `routes` 로 자동 연결된다.

## 환경변수 (Cloudflare 대시보드 → 워커 → Settings → Variables and Secrets, Secret 타입)
`NAVER_VERIFY` `GOOGLE_VERIFY` `DAUM_PIN` `SHEET_WEBHOOK_URL` (`NOTIFY_TO` `NOTIFY_FROM` 선택)

이메일 알림은 도메인의 Email Routing 을 켜고 수신 주소를 인증해야 동작한다. 구글 시트는 `상담신청_구글시트_AppsScript.gs`(공부모아 저장소와 같은 스크립트) 웹앱 URL 을 `SHEET_WEBHOOK_URL` 에 넣으면 사이트 이름 탭으로 나뉘어 쌓인다.

## 로컬 미리보기
```
~/projects/card-terminal-market/node_modules/.bin/wrangler dev --port 8788 --local --ip 127.0.0.1
```

## 사이트맵 단계 개방
`lib/seo.js` 의 `SITEMAP_TIERS`. 처음엔 홈·과목·시도·시군구·학교 페이지까지만 제출한다. 색인이 자리 잡으면 `dongPages` → `gradePagesSgg` → `schoolSubject` → `gradePagesDong` 순으로 켠다. 페이지 자체는 항상 열려 있다.

## 본문 분량과 페이지 유사도
지역·학년·학교 페이지 본문은 약 5,000자이며, 같은 과목의 이웃 페이지끼리 문장이 30% 이상 겹치지 않도록 만든다.
- 섹션마다 문장 자리 5개가 있고, 자리마다 역할이 같은 대안 문장 6개가 `pools/`에 있다. 페이지 주소 해시로 자리마다 하나씩 고른다.
- 문장을 고치거나 늘릴 때는 같은 자리의 대안끼리 표현을 확실히 다르게 쓴다. 한 문장은 60~120자로 쓴다.
- 해시(`lib/gen.js`의 `mix`)를 바꾸면 모든 페이지 본문이 한꺼번에 바뀐다. 색인된 뒤에는 건드리지 않는다.
