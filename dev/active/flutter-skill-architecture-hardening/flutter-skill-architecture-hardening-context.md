# flutter-skill-architecture-hardening-context

## 배경
아키텍처 재검토 findings에서 다음 문제가 식별되었다.
- `presentation -> domain` 직접 의존이 문서에서 허용되는 해석 여지
- DI 구성이 "feature 진입점"까지 허용되는 표현
- G3 검사 범위가 `import`에만 한정됨
- G5가 파일 존재 여부만 확인해 품질 보장이 약함
- G2b(통합 테스트 증빙) 누락
- G4 추적 대상이 Mapper/Value Object 중심으로 제한됨
- G3 정규식이 인용부 경로를 직접 검사하지 않아 `as/show/hide` 변형에서 누락 가능
- `set -euo pipefail` 환경에서 G3 위반 0건일 때 카운트 계산이 중간 실패할 가능성
- G4가 `git diff HEAD` 기준이라 CI/PR 환경에서 우회 가능
- ViewModel 변경 시 대응 Unit Test 파일 + 상태 전이 assertion 자동 검증 게이트 부재
- `lib/app/di/composition_root.dart` 외 경로 DI 등록 API/어노테이션 사용 자동 차단 부재
- G3가 단일 Composition Root 정책에 대해 금지 규칙만 있고 양성 검증(파일 존재/엔트리포인트 초기화 호출) 부재
- G4/G4b에서 `BASE_SHA` 산출 실패 시 `HEAD` 계열 폴백으로 우회 가능

## 의사결정
- D1: 의존 방향 표준 경로를 `features/<feature_name>/{presentation/viewmodel,domain,data}`로 통일
- D2: DI 등록 위치를 `lib/app/di/composition_root.dart` 단일 Composition Root로 고정
- D3: G3 검사 대상을 `import|export|part`로 확장하고 app 레이어 위반을 포함
- D4: G2(Unit), G2b(Integration) 모두 필수 게이트로 승격
- D5: G4 추적 대상을 `entities|dtos|models|mappers|value_objects` 전부로 확장
- D6: G5를 `비어있지 않음 + 성공 토큰 + exit_code=0` 재검증 방식으로 강화
- D7: ViewModel 변경 시 대응 Unit Test + 상태 전이 assertion을 필수 요구로 고정
- D8: G3를 "인용부 경로 + `as/show/hide` 변형 포함" 정규식으로 교체하고 0건 안정 카운트 함수 적용
- D9: G4 비교 기준을 `BASE_SHA...HEAD`로 변경하고 재귀 경로(`**/*.dart`)로 고정
- D10: ViewModel 자동검증을 G4b 게이트로 분리(변경 감지/대응 Unit Test/상태 전이 토큰)
- D11: 단일 Composition Root 실행검증을 G3에 통합(`register*`, `@injectable` 등 non-root 사용 FAIL)
- D12: G3에 단일 Composition Root 양성 검증 추가(`lib/app/di/composition_root.dart` 비어있지 않음 + main/bootstrap 초기화 호출 토큰 1건 이상)
- D13: G4/G4b `BASE_SHA` 실패 처리 정책을 fail-fast로 고정(`HEAD` 폴백 금지, 사용자 액션 메시지 필수)

## 현재 변경 사항 (이번 세션)
- `SKILL.md` (flutter-validation-gates)
  - G3: `count_violations` 함수 도입, `import|export|part` 및 `as/show/hide` 정규식 적용
  - G3: `presentation/pages|widgets -> domain`/`-> data` 분리 집계 및 단일 Composition Root 위반 탐지
  - G3: `lib/app/di/composition_root.dart` 양성 검증(Positive Validation) 및 `TOTAL_VIOLATIONS` 집계 로직 구현
  - G4/G4b: `BASE_SHA` 폴백 제거 및 fail-fast 에러 핸들링/사용자 액션 가이드 추가
  - G4/G4b: 재귀 pathspec(`**/*.dart`) 및 `wc -l` 기반 안정화
  - G5: 모든 `.exit` 파일 완결성 및 성공 토큰 재검증 루프 구현
- `SKILL.md` (추가 정책)
  - CI 파이프라인 연동 가이드(GitHub Actions/GitLab CI) 및 `BASE_SHA` 주입 전략 추가 (R3 해결)
  - G3 DI 탐지 허용 목록(Allow-list) 정책 명시 (R4 해결)
- `dependency-injection.md`
  - App Layer 예외 허용 경로(`main.dart`, `bootstrap.dart`) 명시 (R2 해결)
- 전반적인 리소스 문서 (`widget-patterns.md` 등)
  - `presentation/viewmodel` 경로 및 직접 의존 금지 규칙 일관성 확인 및 보완 (R1 해결)

## 최종 상태
- 모든 아키텍처 가이드 및 검증 게이트 "Hardening" 완료
- T1-T14 및 R1-R4 모든 태스크 완결
- `flutter-validation-gates/SKILL.md`가 이제 실제 동작 가능한 검증 스크립트 가이드를 포함함

## 열린 이슈
- O1: 일부 프로젝트는 테스트 출력 문자열이 다를 수 있어 성공 토큰 정규식 미세 조정이 필요할 수 있음
- O2: `app/**` 위반 규칙의 예외 허용 범위(예: 부트스트랩 파일)는 팀 규약과 추가 정렬 필요
- O3: DI 탐지 패턴(`register*`)은 프로젝트별 네이밍 충돌 가능성이 있어 false positive 모니터링이 필요

## 인수인계 메모
- 후속 수정 시 G3/G4/G5 명령 예시의 파일명과 상태 파일(`*.exit`) 계약을 유지해야 한다.
- 문서 예시를 변경할 경우 `plan/tasks`의 AC와 검증 시나리오도 함께 갱신해야 한다.
