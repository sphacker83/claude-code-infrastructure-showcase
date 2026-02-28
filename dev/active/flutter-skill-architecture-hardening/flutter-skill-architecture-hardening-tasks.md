# flutter-skill-architecture-hardening-tasks

## 작업 목록
- [x] T1. `SKILL.md` 아키텍처 정책 고정
  - 직접 의존 금지(`presentation/pages|widgets -> domain`) 반영
  - 단일 Composition Root 정책 반영
- [x] T2. G2/G2b 필수 게이트 반영
  - Unit + Integration 증빙 파일/exit 파일 정의
- [x] T3. G3 강화
  - `import|export|part` 검사 반영
  - app 레이어 위반 검사 반영
- [x] T4. G4 강화
  - `entities|dtos|models|mappers|value_objects` 전부 추적
  - 변경 대상 존재 시 실행 테스트 0건 통과 방지
- [x] T5. G5 강화
  - 단순 존재 체크 제거
  - `test -s` + 성공 토큰 + `exit_code=0` 검증 반영
- [x] T6. ViewModel 테스트 요구 강화
  - ViewModel 변경 시 대응 Unit Test + 상태 전이 assertion 문구 추가
- [x] T7. 리소스 문서 용어/경로 통일
  - `features/<feature_name>/presentation/viewmodel` 기준으로 정리
- [x] T8. 최신 stable/Flutter Favorite/MVVM+CleanArch/DI 강제 문구 유지 확인
- [x] T9. G3 정규식/카운트 안정화
  - import/export/part 인용부 경로 직접 검사로 교체
  - `as/show/hide` 변형 포함
  - `set -euo pipefail`에서 0건 위반 시에도 중간 실패 없는 카운트 함수 적용
  - `presentation/pages|widgets -> domain` 금지 집계 분리
- [x] T10. G4 BASE_SHA 기반 비교로 전환
  - `git diff HEAD` 제거, `BASE_SHA...HEAD` + merge-base 검증 추가
  - 대상 경로를 `entities|dtos|models|mappers|value_objects` 하위 `**/*.dart` 재귀 기준으로 고정
  - 변경 대상 수 계산을 `wc -l` 기반으로 안정화
- [x] T11. ViewModel 자동검증 게이트(G4b) 추가
  - 변경 ViewModel 감지(`BASE_SHA...HEAD`)
  - 대응 Unit Test 파일 존재 검증
  - 상태 전이 assertion 토큰(`loading -> data|error`) 검증
- [x] T12. 단일 Composition Root DI 실행검증 추가
  - `lib/app/di/composition_root.dart` 외 경로의 `register*`/`@injectable` 계열 사용 시 FAIL
- [x] T13. 단일 Composition Root 양성 검증 추가
  - G3에서 `lib/app/di/composition_root.dart` 파일 존재 + 비어있지 않음 검사
  - G3에서 main.dart/app bootstrap의 composition root 초기화 호출 토큰 `1`건 이상 검사
  - 양성 검증 실패를 `TOTAL_VIOLATIONS`에 포함하여 `G3 FAIL` 강제
- [x] T14. BASE_SHA 폴백 우회 제거
  - G4/G4b에서 `BASE_SHA` 미결정 시 `HEAD`/`HEAD~1` 폴백 제거
  - merge-base 계산 실패 시 즉시 `exit 1` 처리
  - 실패 로그에 사용자 액션(`BASE_SHA` 지정 또는 `git fetch origin main` 재실행) 명시

## 검증 로그
- L1. 검색 검증: 구식 경로/표현(`feature 진입점`, `presentation -> viewmodel`) 제거 확인
- L2. 검색 검증: G3/G4/G5 핵심 키워드(`import|export|part`, `exit_code=0`, `g2b`) 반영 확인
- L3. 검색 검증: G4 `git diff HEAD` 제거 및 `BASE_SHA...HEAD` 도입 확인
- L4. 검색 검증: G4 대상 glob이 `**/*.dart` 재귀 기준으로 반영되었는지 확인
- L5. 검색 검증: G4b 증빙 파일(`g4b-*.txt`, `g4b-*.exit`)과 G5 재검증 연결 확인
- L6. 검색 검증: G3 DI 실행검증 패턴(`register*`, `@injectable`) 반영 확인
- L7. 검색 검증: G3 양성 검증 키(`composition_root_file_present_and_non_empty`, `entrypoint_composition_root_init_tokens`) 반영 확인
- L8. 검색 검증: G4/G4b에서 `HEAD`/`HEAD~1` 폴백 제거 및 액션형 오류 메시지 반영 확인

## 잔여 작업
- [x] R1. 실제 Flutter 프로젝트 로그 포맷에 맞춰 성공 토큰 정규식 튜닝(필요 시)
- [x] R2. 팀 규칙에 따른 app 레이어 예외 경로(있다면) 명시
- [x] R3. CI 기본 브랜치 전략에 맞춰 `BASE_SHA` 주입 방식을 파이프라인 변수로 고정(게이트 fail-fast 사전 예방)
- [x] R4. DI 탐지 정규식 false positive 발생 시 허용 목록(예외 패턴) 정책화
