# 투자사업 부식검토

투자사업 발의 내용을 입력하면 과거 부식검토 사례를 검색하여 ChatGPT에서 검토 초안을 작성하는 도구입니다.

- 운영 사이트: https://corrosion-review-dhl.leadventure.chatgpt.site
- 플러그인 MCP: https://corrosion-review-dhl.leadventure.chatgpt.site/mcp
- 소스 저장소: https://github.com/DHL1125/corrosion-review
- 운영 방식: GitHub 비공개 소스 보관 + 기존 ChatGPT Sites 호스팅

## 사용 방법

1. ChatGPT에서 설치한 투자사업 부식검토 플러그인을 선택합니다.
2. 발의 제목, 배경, 개선안, 운전조건과 재질을 입력하고 부식검토 초안을 요청합니다.
3. 검토한 결과를 확정한 뒤 명시적으로 DB 등록을 요청합니다.

## DB 저장 위치

| 구분 | 저장 위치 | 갱신 방식 |
|---|---|---|
| 과거 사례 6,425건 | data/cases.json | 원본 데이터 정비 후 소스 수정 및 재배포 |
| 신규 확정 사례 | 운영 사이트 D1 | 플러그인 저장 도구로 등록, 인증 사용자별 구분 |
| 이전 파일 기반 공용 DB | 별도 파일 | 사이트 DB와 자동 동기화되지 않음 |

GitHub에 신규 사례가 자동 커밋되는 구조가 아닙니다. 현재 신규 사례는 사용자별로 구분되므로 팀 전체 공유 DB라고 간주하면 안 됩니다. 본 저장소에는 운영 D1 데이터 백업이 포함되지 않습니다.

## 수정 및 배포

현재 사이트는 이미 배포되어 있습니다. GitHub main 브랜치에 커밋하는 것만으로 운영 사이트가 자동 변경되지는 않습니다.

ChatGPT에서 이 저장소 주소와 함께 수정할 내용을 지정하고 기존 부식검토 사이트에 배포해 달라고 요청하세요. 작업 시 GitHub 최신 소스를 확인하여 기존 Sites 소스에 반영하고, 검증 후 동일한 사이트 ID로 배포해야 합니다. GitHub와 Sites는 별도 소스 저장소이며 양쪽 변경을 확인해야 합니다.

- 기존 Site ID: appgprj_6abc51b75c8c81918c00b865966b78e0
- 기존 사이트의 비공개 접근 범위를 유지합니다.
- 배포는 ChatGPT Sites의 지원되는 빌드·배포 절차를 사용합니다.
- GitHub Actions 자동 배포는 구성되어 있지 않습니다.
- 서버 API, MCP 및 D1을 사용하므로 이 소스를 그대로 GitHub Pages에 올려도 전체 기능이 실행되지 않습니다.
- 인증은 Sites의 신뢰된 사용자 헤더에 의존합니다. 다른 호스팅으로 옮기려면 별도의 인증 및 DB 연동 구현이 필요합니다.

## 개발 확인

Node.js 및 패키지 관리자 요구사항은 package.json을 참조하세요. 의존성 설치 후 기존 검증 스크립트를 실행합니다.

```sh
node scripts/check-review.mjs
node node_modules/typescript/bin/tsc --noEmit
```

회사 사례가 포함되어 있으므로 저장소는 비공개로 유지합니다. 접근 토큰, 비밀번호 및 환경변수 파일은 커밋하지 않습니다.

---

## 기존 데이터 및 구현 명세

# 투자사업 부식검토 v1.0

ChatGPT MCP plugin and private case browser. Korean output, source-based draft support.

## Data

- Supplied PDF: ★ Corrosion Control팀 RTSMOC 부식검토처리현황 파악.pdf
- 162 pages; 6,425 numbered populated records, IDs 1 through 6425.
- Dates 2012-12-27 through 2026-09-29.
- 6,331 completed records with non-empty review are eligible for draft retrieval.
- 94 records are retained but excluded as incomplete, missing review or other status.
- 83 missing review fields (including 9 marked complete).
- Keyword/length heuristic classification: 4,251 simple no-issue entries, 2,080 detailed entries. Classification is not engineering validation.
- No personal reviewer/initiator names are stored.
- Source page and uncorrected review text are retained. PDF line wrapping, clipping, OCR-like glyph and overlapping-cell issues may remain; source XLSX is preferable for a later data-quality refresh. Management numbers are not unique keys; source record IDs are.
- Historical data is an immutable server-side JSON database checked into the private source repository. New confirmed entries persist in D1, scoped by trusted authenticated user ID. No browser storage is authoritative.

## Workflow

Use prepare_corrosion_review for a new proposal. It retrieves eligible historical and confirmed cases and supplies the drafting instructions. The connected ChatGPT produces the actual draft; the website itself does not call a paid model API. Search uses weighted lexical matching and Korean/English aliases, not embeddings. Retrieval scores do not express technical confidence.

Do not automatically transfer historical numeric requirements to a new proposal. Compare conditions, identify information gaps and cite case IDs/page numbers. No automatic approvals, and no automatic draft ingestion. Save only a user-confirmed result on an explicit save request.

## Verification

node scripts/check-review.mjs
node node_modules/typescript/bin/tsc --noEmit

Generated Drizzle migration is schema-only. Site boundary controls owner-private access; data-bearing routes require the trusted Sites identity header. MCP discovery exposes no records. Database writes use bound parameters and user scoping.
