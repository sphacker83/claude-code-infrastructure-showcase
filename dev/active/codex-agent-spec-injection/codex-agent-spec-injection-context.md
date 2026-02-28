# codex-agent-spec-injection-context

Last Updated: 2026-02-28

## 문제 정의

- 현 상태에서는 `.codex/agents/*.md` 내용이 서브 에이전트 호출 입력에 자동 반영되지 않는다.
- 결과적으로 에이전트별 강제 규칙(MVVM, DI, 리뷰 기준 등)이 호출 시 누락될 수 있다.

## 핵심 결정

1. "자동 주입 기대" 대신 "호출 시 명시 주입"을 표준으로 채택.
2. 표준 호출 프롬프트는 compile 스크립트가 생성.
3. 누락 방지는 PreToolUse guard로 차단(`exit code 2`)한다.
4. 운영자는 `/run-agent` 명령으로 표준 경로를 사용한다.

## 주요 파일

- `.codex/agents/manifest.json`
- `.codex/agents/compile-agent-prompt.mjs`
- `.codex/commands/run-agent.md`
- `.codex/hooks/agent-instruction-guard.sh`
- `.codex/hooks/agent-instruction-guard.ts`
- `.codex/settings.json`
- `.codex/agents/README.md`
- `.codex/hooks/README.md`
- `.codex/hooks/CONFIG.md`
- `CODEX_INTEGRATION_GUIDE.md`

## 검증 포인트

- compile 출력에 `AGENT_SPEC_BEGIN`, `AGENT_SPEC_END` 존재 여부
- guard 차단 조건(관리 대상 참조 + 마커 누락) 동작
- settings JSON 파싱 가능 여부
- manifest JSON 파싱 가능 여부

## 남은 확인 항목

- 실제 Codex 런타임에서 서브 에이전트 도구명이 `Task`인지 `spawn_agent`인지 운영 로그로 최종 확정
- 필요한 경우 `matcher` 패턴 축소/확장

## 현재 상태

- 구현 완료: manifest/compile/run-agent/guard/settings/doc 반영
- 로컬 스모크 통과:
  - compile 출력 마커 정상
  - guard 차단/허용 분기 정상(`exit=2`/`exit=0`)
