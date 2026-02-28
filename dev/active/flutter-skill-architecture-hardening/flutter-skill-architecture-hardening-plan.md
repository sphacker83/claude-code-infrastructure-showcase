# flutter-skill-architecture-hardening-plan

## 개요
Flutter 가이드 스킬 문서(`.agents/workflows/skills/flutter-dev-guidelines`)의 아키텍처 정책과 완료 게이트(G1~G5)를 재검토 findings 기준으로 강화한다.

## 목표
- `presentation/pages|widgets -> domain` 직접 의존 금지 정책을 문서에 고정한다.
- DI 정책을 `lib/app/di/composition_root.dart` 단일 Composition Root로 고정한다.
- G2/G2b/G3/G4/G5 게이트를 증빙 중심으로 강화한다.
- 리소스 문서 간 경로/용어를 `features/<feature_name>/presentation/viewmodel` 기준으로 통일한다.

## 수용 기준 (AC)
- AC1: `SKILL.md`에 직접 의존 금지(`presentation -> domain`) 및 단일 Composition Root 정책이 명시된다.
- AC2: G2(Unit) + G2b(Integration) 증빙 요구가 모두 필수 게이트로 정의된다.
- AC3: G3가 `import|export|part`를 검사하고, `app` 레이어 위반 검사를 포함한다.
- AC4: G4가 `entities|dtos|models|mappers|value_objects` 변경 추적과 실행 테스트 0건 통과 방지를 포함한다.
- AC5: G5가 단순 존재 여부가 아닌 `비어있지 않음 + 성공 토큰 + exit_code=0` 검증으로 정의된다.
- AC6: ViewModel 변경 시 대응 Unit Test + 상태 전이 assertion 요구가 문서화된다.
- AC7: 리소스 문서 경로/용어 충돌이 제거된다.
- AC8: 최신 stable Flutter/Dart, Flutter Favorite, MVVM/CleanArch/DI 강제 문구가 유지된다.

## 범위
- 포함:
  - `.agents/workflows/skills/flutter-dev-guidelines/SKILL.md`
  - `.agents/workflows/skills/flutter-dev-guidelines/resources/*.md`
  - `dev/active/flutter-skill-architecture-hardening/*`
- 제외:
  - 상기 범위 외 코드/문서/설정 파일

## 작업 단계
1. 기존 게이트/정책 문구 분석 및 충돌 지점 식별
2. `SKILL.md` 정책/게이트 강화
3. 리소스 문서 용어/경로 통일 및 테스트 요구 반영
4. Dev Docs(context/tasks) 업데이트
5. 변경 범위 정적 검증(검색 기반) 수행

## 검증 시나리오
- 시나리오 V1: G2/G2b 표와 명령 예시에 통합 테스트 증빙이 필수로 기재되어 있는지 확인
- 시나리오 V2: G3 명령 예시에 `import|export|part` 및 `app` 레이어 검사식이 포함되는지 확인
- 시나리오 V3: G4 명령 예시에 5개 모델 경계 디렉터리와 `0건 통과 방지` 조건이 포함되는지 확인
- 시나리오 V4: G5 명령 예시에 `test -s`, 성공 토큰 검사, `.exit`의 `exit_code=0` 검사가 포함되는지 확인
- 시나리오 V5: 리소스 문서에 `features/<feature_name>/presentation/viewmodel` 기준이 일관되게 사용되는지 확인

## 리스크
- R1: 경로 정책 강화로 기존 문서 예시와 충돌할 수 있음
- R2: 게이트 명령 예시가 길어져 가독성이 떨어질 수 있음
- R3: 팀별 테스트 출력 포맷 차이로 성공 토큰 정규식이 과도할 수 있음

## 완화 전략
- M1: 경로 정책은 "컴파일 타임 의존"과 "런타임 호출"을 분리해 설명
- M2: 게이트별 산출물 파일명과 목적을 표로 고정해 추적성 확보
- M3: 성공 토큰은 대표 패턴으로 제시하고, 필요 시 프로젝트별 토큰 치환 가능하도록 명시
