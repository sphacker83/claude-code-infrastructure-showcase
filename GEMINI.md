# GEMINI.md

이 문서는 이 저장소에서 Gemini가 작업할 때 따르는 운영 가이드입니다.

## 1) 기본 규칙
- 모든 응답은 한국어로 작성합니다.
- 프로젝트 구조를 추측하지 말고, 필요한 파일을 먼저 확인합니다.
- 단순 수정은 빠르게 처리하고, 복잡 작업은 문서화부터 진행합니다.
- 동일한 내용이 `.codex`와 `.gemini`에 모두 있으면 Gemini 작업에서는 `.gemini`를 우선 참조합니다.

## 2) 작업 시작 체크리스트
1. 요청을 범주로 분류합니다.
2. 해당 범주에 맞는 스킬을 선택합니다.
3. 작업이 복잡한지 판단합니다(대략 2시간+, 다단계, 멀티세션).
4. 복잡 작업이면 `dev/active/[task-name]/`에 plan/context/tasks 3파일을 만들거나 갱신합니다.
5. 구현 후 `context/tasks`를 최신 상태로 반영합니다.

## 3) 스킬 선택 기준 (`.gemini/skills`)
- 스킬/훅/트리거/규칙 작업: `skill-developer`
- 프론트엔드(Next.js/React/TS/UI): `frontend-dev-guidelines`
- 백엔드/API/서비스/검증: `backend-dev-guidelines`
- 인증 라우트 테스트/디버깅: `route-tester`
- 에러 처리/모니터링/Sentry: `error-tracking`

## 4) Dev Docs 규칙
복잡 작업은 아래 3파일을 유지합니다.
- `[task-name]-plan.md`
- `[task-name]-context.md`
- `[task-name]-tasks.md`

메인 트랙과 별도 요구사항은 사이드 플랜으로 분리하고 우선순위(`P0/P1/P2`)를 표시합니다.

## 5) 훅/설정 점검 포인트
- 훅 스크립트 실행 권한 확인: `chmod +x .gemini/hooks/*.sh`
- JSON 유효성 확인:
  - `cat .gemini/skills/skill-rules.json | jq .`
  - `cat .gemini/settings.json | jq .`
- TypeScript 훅 의존성 확인(필요 시): `cd .gemini/hooks && npm install`

## 6) 금지 사항
- `.gemini/settings.json`을 예시 파일로 통째로 덮어쓰지 않습니다.
- 스킬을 한 번에 전부 추가하지 않습니다.
- 검증 없이 빌드/체크 훅을 강제 활성화하지 않습니다.
- 현재 스택과 맞지 않는 스킬을 그대로 적용하지 않습니다.

## 7) 빠른 실행 가이드
- UI 버그: `frontend-dev-guidelines` 확인 후 수정
- API/인증 라우트 검증: `route-tester`로 인증 전제 확인 후 테스트
- 스킬 트리거 문제: `skill-developer`로 `skill-rules.json`/훅 설정 점검
- 장기 작업 시작: Dev Docs 3파일 생성 후 구현
