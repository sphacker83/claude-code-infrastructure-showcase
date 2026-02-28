# codex-agent-spec-injection-plan

Last Updated: 2026-02-28

## 요약

Codex 환경에서 `.codex/agents/*.md`가 서브 에이전트 호출 시 자동 주입되지 않는 문제를 해결한다.  
목표는 "에이전트 파일 규격이 실제 호출 프롬프트에 반영된 상태"를 기본 동작으로 만드는 것이다.

## 목표 상태

1. 에이전트 호출 시 `AGENT_SPEC_BEGIN ... AGENT_SPEC_END` 블록이 필수 주입된다.
2. 주입 누락 호출은 PreToolUse에서 차단된다.
3. 표준 호출 경로(`/run-agent`)가 문서화되고 재사용 가능하다.

## 구현 범위

- `.codex/agents/manifest.json` 추가
- `.codex/agents/compile-agent-prompt.mjs` 추가
- `.codex/commands/run-agent.md` 추가
- `.codex/hooks/agent-instruction-guard.{sh,ts}` 추가
- `.codex/settings.json` PreToolUse 훅 등록
- 문서 동기화:
  - `.codex/agents/README.md`
  - `.codex/hooks/README.md`
  - `.codex/hooks/CONFIG.md`
  - `CODEX_INTEGRATION_GUIDE.md`

## 수용 기준 (AC)

- AC1: compile 스크립트가 에이전트 md를 읽어 마커 포함 프롬프트를 생성한다.
- AC2: PreToolUse guard가 관리 대상 에이전트 호출에서 마커 누락을 `exit code 2`로 차단한다.
- AC3: `/run-agent` 명령 문서가 compile -> spawn 절차를 강제 안내한다.
- AC4: 관련 JSON(`settings.json`, `manifest.json`) 유효성 검증을 통과한다.

## 리스크

- 리스크1: 런타임별 서브 에이전트 도구명이 다를 수 있음(`Task`, `spawn_agent` 등).
- 리스크2: 너무 엄격한 차단으로 일반 Task 호출까지 막을 수 있음.

## 완화

- matcher를 다중 패턴으로 시작하고 운영 중 로그 기반으로 조정.
- guard는 "관리 대상 에이전트 참조 + 마커 누락" 조합일 때만 차단.
