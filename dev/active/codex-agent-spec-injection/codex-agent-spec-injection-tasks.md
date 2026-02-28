# codex-agent-spec-injection-tasks

Last Updated: 2026-02-28

## 진행 체크리스트

- [x] 에이전트 manifest 추가
- [x] agent prompt compile 스크립트 추가
- [x] `/run-agent` 명령 추가
- [x] PreToolUse guard 훅 추가
- [x] `.codex/settings.json`에 guard 훅 등록
- [x] 에이전트/훅/통합 가이드 문서 업데이트
- [ ] 운영 환경에서 matcher(`Task|spawn_agent|SpawnAgent|Agent`) 최종 튜닝

## 검증 로그

- [x] `node .codex/agents/compile-agent-prompt.mjs --agent flutter-developer --task "smoke" --ownership "lib/**"` 실행
- [x] `cat .codex/agents/manifest.json | jq .`
- [x] `cat .codex/settings.json | jq .`
- [x] `SKIP_AGENT_SPEC_GUARD=0` 상태에서 guard 차단 시나리오 확인

### 결과 요약

- `compile-agent-prompt.mjs` 출력에 `AGENT_SPEC_BEGIN`/`AGENT_SPEC_END` 확인
- guard 훅: 마커 누락 호출 `exit=2`, 마커 포함 호출 `exit=0`

## 리스크/메모

- guard가 너무 공격적으로 차단하면 비에이전트 Task까지 막을 수 있으므로 운영 로그 기반으로 조정 필요
