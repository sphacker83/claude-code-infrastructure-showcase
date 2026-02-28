---
name: flutter-dev-guidelines
description: Flutter + Dart 애플리케이션을 위한 실무 개발 가이드라인입니다. 최신 stable Flutter/Dart, MVVM + Clean Architecture(features/<feature_name>/{presentation/viewmodel,domain,data} + app/core), 모델 설계(Entity/DTO/Model/Mapper/Value Object), DI(단일 Composition Root + Constructor Injection), Flutter Favorite 패키지 정책(pub.dev), 테스트/빌드/디버깅 기준을 다룹니다.
---

# Flutter 개발 가이드라인

## 목적

Flutter 프로젝트에서 아키텍처 일관성과 모델 품질, DI 완성도를 유지하기 위한 실무 가이드입니다.

## 이 스킬을 사용해야 하는 경우

- 새 Flutter 화면/기능을 구현할 때
- MVVM + Clean Architecture를 적용/점검할 때
- Entity/DTO/Model/Mapper/Value Object 설계를 다룰 때
- DI 구성(Composition Root, Constructor Injection, 바인딩)을 설계할 때
- 테스트/배포 전 완료 기준(게이트) 검증이 필요할 때

---

## 빠른 시작

### 새 화면 구현 체크리스트

- [ ] 개발 환경이 최신 stable Flutter/Dart인지 확인했는가?
- [ ] View 코드는 `features/<feature_name>/presentation/pages|widgets`, 상태 오케스트레이션은 `features/<feature_name>/presentation/viewmodel`에 배치했는가?
- [ ] 비즈니스 로직은 `domain/usecases`로 이동했는가?
- [ ] `presentation/pages|widgets -> domain` 직접 의존( `import/export/part` )이 없는가?
- [ ] `build()`는 가볍고, 정적 위젯에 `const`를 적용했는가?
- [ ] 모델은 immutable 우선으로 설계했는가?
- [ ] 직렬화(`fromJson`/`toJson`)를 domain이 아닌 data 레이어에서 처리하는가?

### 새 기능 추가 체크리스트

- [ ] `app`, `core`, `features/<feature_name>/{presentation/viewmodel,domain,data}` 경계를 유지했는가?
- [ ] `presentation/pages|widgets`가 `presentation/viewmodel`을 통해서만 domain/usecase를 호출하는가?
- [ ] `domain/entities`, `domain/value_objects`를 분리했는가?
- [ ] `data/dtos`, `data/models`, `data/mappers`를 분리했는가?
- [ ] Mapper가 DTO/Model <-> Entity 변환을 전담하는가?
- [ ] 단일 Composition Root(`lib/app/di/composition_root.dart`)에서만 의존성 구성을 수행하는가?
- [ ] Constructor Injection을 기본 주입 방식으로 사용했는가?
- [ ] Repository interface 기반 바인딩을 구성했는가?
- [ ] 테스트에서 fake/mock으로 주입 교체가 가능한가?
- [ ] 모델 변경 시 하위 호환/마이그레이션 계획을 포함했는가?
- [ ] 아래 `검증 가능한 완료 게이트(G1~G5 + G4b)`를 모두 통과했는가?

---

## 아키텍처 (MVVM + Clean Architecture)

```text
lib/
  app/
    di/
      composition_root.dart
  core/
    constants/
    errors/
    network/
    utils/
  features/
    <feature_name>/
      presentation/
        pages/
        widgets/
        viewmodel/
          <feature_name>_viewmodel.dart
      domain/
        entities/
        value_objects/
        repositories/
        usecases/
      data/
        datasources/
        dtos/
        models/
        mappers/
        repositories/
test/
integration_test/
```

### 레이어 책임

- `app`: 앱 조립 전용 레이어, Composition Root(`lib/app/di/composition_root.dart`) 위치
- `presentation`: UI 렌더링과 사용자 상호작용(`pages/widgets`)
- `presentation/viewmodel`: 상태 전이, 이벤트 처리, usecase 호출 조정
- `domain`: Entity/Value Object, usecase, repository interface
- `data`: DTO/Model/Mapper, 외부 I/O, repository 구현체
- `core`: 공통 인프라(Feature 독립 유틸/에러/네트워크)

### 모델 경계 규칙

- Entity/Value Object는 도메인 의미와 규칙만 포함
- DTO/Model은 외부 계약(API/DB) 표현만 담당
- Mapper가 계층 간 변환 책임을 단일화
- domain에서 `fromJson`/`toJson` 직접 사용 금지
- 모델 변경 시 버전/기본값/필드 폐기 전략을 문서화

### DI 규칙

- DI 구성은 `lib/app/di/composition_root.dart`에서만 수행
- feature 내부(`features/**`)에서 신규 Composition Root 생성 금지
- feature 내부 기본값은 Constructor Injection
- `domain/repositories` 인터페이스에 `data/repositories` 구현체 바인딩
- `get_it`/`injectable` 사용 시에도 등록은 진입점에서 제한
- 무분별한 전역 singleton 및 service locator 남용 금지

### 의존성 매트릭스

아래 표는 컴파일 타임 `import/export/part` 방향 기준입니다.  
컴파일 타임 의존 방향 규칙: `presentation/pages|widgets -> presentation/viewmodel -> domain`, `data -> domain`, `app -> core + features/**`.  
런타임 호출 흐름 규칙: `presentation/pages|widgets -> presentation/viewmodel -> usecase(domain) -> repository interface(domain) -> repository impl(data) -> datasource`.

| import 주체 | 허용 import | 금지 import |
| --- | --- | --- |
| `app/**` | `core/**`, `features/**` | 조립 외 비즈니스 로직 구현 |
| `presentation/pages/**`, `presentation/widgets/**` | `presentation/viewmodel/**`, `core/**` | `domain/**`, `data/**` |
| `presentation/viewmodel/**` | `domain/**`, `core/**` | `data/**`, `presentation/pages/**`, `presentation/widgets/**` |
| `domain/**` | `domain/**`, `core/**` | `data/**`, `presentation/**` |
| `data/**` | `domain/**`, `data/**`, `core/**` | `presentation/**` |
| `core/**` | `core/**` | `features/**`에 대한 직접 import |

---

## 핵심 규칙

1. 최신 stable Flutter/Dart만 사용
- stable 채널 이외 버전/실험 기능 의존 코드는 금지합니다.

2. MVVM + Clean Architecture 강제
- `app`, `core`, `features/<feature_name>/{presentation/viewmodel,domain,data}` 경계 위반 시 완료가 아닙니다.
- `presentation/pages|widgets -> domain` 직접 의존은 금지하며, 반드시 `presentation/viewmodel`을 경유해야 합니다.

3. 모델 설계 강제
- Entity/DTO/Model/Mapper 경계를 혼합하지 않습니다.
- immutable 모델과 Value Object를 우선 채택합니다.
- 직렬화/역직렬화와 도메인 모델을 분리합니다.
- 모델 변경 시 호환성/마이그레이션 계획이 없으면 완료가 아닙니다.

4. DI 완전 적용
- Composition Root 위치는 `lib/app/di/composition_root.dart` 단일 경로로 고정합니다.
- `features/**` 내부에서 별도 Composition Root를 만들면 완료가 아닙니다.
- Constructor Injection 기본 적용이 필수입니다.
- 바인딩 스코프는 singleton/lazy singleton/factory 기준으로 선택해야 합니다.
- Repository interface 기반 바인딩이 없으면 완료가 아닙니다.
- 테스트 교체 가능한 주입 구조가 없으면 완료가 아닙니다.
- 테스트 오버라이드는 `등록 -> override -> teardown/reset` 절차를 고정합니다.
- service locator는 진입점에서만 제한적으로 허용합니다.

5. 패키지 정책 강제
- 공식 Flutter/Dart 패키지 우선 + pub.dev Flutter Favorite 배지 패키지만 허용합니다.

6. 테스트 및 품질 게이트
- Unit/Widget/Integration 테스트와 정적 분석을 모두 통과해야 완료입니다.
- G2(Unit)와 G2b(Integration) 증빙은 필수 게이트입니다.
- ViewModel 상태 전이는 Unit Test 책임이며, ViewModel 변경 시 상태 전이 assertion(`loading -> data` 또는 `loading -> error`)이 반드시 포함되어야 합니다.

---

## 패키지 정책 (Flutter Favorite Only)

### 허용 기준

- 1순위: Flutter/Dart 공식 패키지
- 2순위: pub.dev Flutter Favorite 배지 패키지
- 최신 stable Flutter/Dart 호환 + Null Safety 지원
- 유지보수 활동과 릴리스 품질이 확인되는 패키지

### 비허용 조건

- Flutter Favorite 배지 없음
- 최신 stable 미호환 또는 Null Safety 미지원
- 장기 미업데이트/치명 이슈 방치
- 모델 경계/DI 구조를 훼손하는 패키지

### 도입 절차

1. SDK/공식 패키지로 해결 가능한지 확인
2. Flutter Favorite 배지 확인
3. stable 호환성과 유지보수 상태 검증
4. 모델 경계/DI 영향도 검토
5. 테스트 가능성(교체 주입) 확인 후 채택

---

## 상태 관리 가이드

### 공통

- 프로젝트 표준(Riverpod/Bloc/Provider) 한 가지를 기본으로 유지
- ViewModel은 `features/<feature_name>/presentation/viewmodel`에 두고 상태 전이만 담당하며 domain/usecase 호출을 조정
- 상태관리 도입 시 DI 경계와 테스트 대체 가능성을 함께 설계

### Riverpod

- 비동기 상태는 `AsyncValue` 패턴 우선
- provider 등록과 의존성 해석은 Composition Root 전략과 일치시킴

### Bloc

- Event -> State 전이를 문서화
- Bloc 생성 시 생성자 주입으로 usecase를 전달

### Provider

- 단순 UI 상태에 우선 적용
- 복잡 도메인 로직은 usecase로 이동

---

## 성능 최적화

- 정적 위젯은 `const` 우선
- 긴 리스트는 `ListView.builder`/`SliverList` 사용
- `build()` 내 무거운 계산/동기 I/O 금지
- DevTools(Rebuild Stats, CPU Profiler) 기반으로 병목 측정
- 객체 생성/상태 변경 범위를 최소화해 불필요한 rebuild 억제

---

## 테스트 전략

### 테스트 계층

- Unit Test: usecase, mapper, value object, validation
- Widget Test: 화면 렌더링/상호작용/상태 변화
- Integration Test: 라우팅/플러그인/실사용 시나리오
- ViewModel 상태 전이는 Unit Test 책임
- ViewModel 변경 시 대응 Unit Test와 상태 전이 assertion을 함께 제출

### DI 관점 테스트 규칙

- Repository interface에 fake/mock 구현체를 주입해 검증
- Composition Root를 테스트 환경에서 대체 구성 가능해야 함
- 하드코딩 인스턴스 생성으로 테스트 대체 경로를 막지 않음

### 권장 명령

```bash
flutter analyze
dart format .
flutter test
flutter test integration_test
```

---

## 빌드 & 배포

### Android

- `applicationId`, `minSdk`, `targetSdk`, 서명 설정 확인
- `flutter build apk --release`
- `flutter build appbundle --release`

### iOS

- Bundle Identifier, Signing, Info.plist 권한 검증
- `flutter build ipa --release`

### 공통

- `pubspec.yaml` 버전 정책 유지
- 모델 변경이 포함되면 마이그레이션 노트를 릴리스 문서에 추가
- CI에서 analyze -> test -> build 게이트 유지

---

## 디버깅 가이드

- Flutter Inspector: 레이아웃/위젯 트리 이슈 확인
- Dart DevTools: 성능/메모리/네트워크 병목 추적
- `setState() called after dispose()`는 lifecycle/비동기 종료 시점 점검
- 플랫폼 이슈는 AndroidManifest.xml/Info.plist/Gradle/Pods 순서로 점검
- Mapper/DI 오배치로 인한 의존성 순환 여부를 함께 확인

---

## 검증 가능한 완료 게이트

아래 G1~G5와 G4b를 모두 통과해야 완료입니다. 증빙 기본 경로는 `dev/evidence/flutter/<task-name>/`입니다.
모든 게이트는 `로그(.txt) + 상태(.exit) + 성공 토큰`을 남겨야 하며, G5에서 이를 재검증합니다.

| Gate | 정량 기준 | 판정 명령 | 증빙 위치 |
| --- | --- | --- | --- |
| G1 정적 분석 | `flutter analyze` 이슈 `0`건 + `exit_code=0` + 성공 토큰(`No issues found!`) | 아래 `G1 판정 명령 예시` 실행 | `g1-analyze.txt`, `g1-analyze.exit` |
| G2 단위 테스트 | `flutter test` 실패 `0`건 + 실행 테스트 `1`건 이상 + `exit_code=0` | 아래 `G2 판정 명령 예시` 실행 | `g2-unit-test.txt`, `g2-unit-test.exit` |
| G2b 통합 테스트 | `flutter test integration_test` 실패 `0`건 + 실행 테스트 `1`건 이상 + `exit_code=0` | 아래 `G2b 판정 명령 예시` 실행 | `g2b-integration-test.txt`, `g2b-integration-test.exit` |
| G3 의존성 매트릭스 | `import/export/part` 인용부 경로 기준 금지 의존 `0`건 + non-composition-root DI 등록 `0`건 + `lib/app/di/composition_root.dart` 파일 존재/비어있지 않음 + main.dart 또는 app bootstrap의 composition root 초기화 호출 토큰 `1`건 이상 + `G3 PASS` 토큰 | 아래 `G3 판정 명령 예시` 실행 | `g3-import-export-part-matrix.txt`, `g3-import-export-part-matrix.exit` |
| G4 모델 경계 테스트 | `BASE_SHA...HEAD` 변경분에서 `entities|dtos|models|mappers|value_objects` 하위 `**/*.dart` `100%` 추적 + 대응 테스트 참조 + 테스트 `0건` 통과 방지 + BASE_SHA 미결정/merge-base 계산 실패 즉시 FAIL + `G4 PASS` 토큰 | 아래 `G4 판정 명령 예시` 실행 | `g4-model-boundary-test.txt`, `g4-model-boundary-test.exit`, `g4-changed-targets.txt` |
| G4b ViewModel 매핑 테스트 | `BASE_SHA...HEAD` 변경 ViewModel `100%` 추적 + 대응 Unit Test 파일 존재 + 상태 전이 assertion 토큰(`loading -> data` 또는 `loading -> error`) 확인 + BASE_SHA 미결정/merge-base 계산 실패 즉시 FAIL + `G4b PASS` 토큰 | 아래 `G4b 판정 명령 예시` 실행 | `g4b-viewmodel-mapping-test.txt`, `g4b-viewmodel-mapping-test.exit`, `g4b-changed-viewmodels.txt` |
| G5 증빙 완결성 | G1~G4b 증빙 파일이 모두 비어있지 않음 + 성공 토큰 확인 + 모든 `.exit` 파일이 `exit_code=0` | 아래 `G5 판정 명령 예시` 실행 | `g5-summary.md` |

### G1 판정 명령 예시

```bash
set -euo pipefail
EVIDENCE_DIR="dev/evidence/flutter/<task-name>"
mkdir -p "$EVIDENCE_DIR"

set -o pipefail
flutter analyze --no-pub | tee "$EVIDENCE_DIR/g1-analyze.txt"
ANALYZE_EXIT="${PIPESTATUS[0]}"
echo "exit_code=${ANALYZE_EXIT}" > "$EVIDENCE_DIR/g1-analyze.exit"
test "$ANALYZE_EXIT" -eq 0
rg -q "No issues found!" "$EVIDENCE_DIR/g1-analyze.txt"
```

### G2 판정 명령 예시

```bash
set -euo pipefail
EVIDENCE_DIR="dev/evidence/flutter/<task-name>"
mkdir -p "$EVIDENCE_DIR"

set -o pipefail
flutter test --reporter expanded | tee "$EVIDENCE_DIR/g2-unit-test.txt"
UNIT_EXIT="${PIPESTATUS[0]}"
echo "exit_code=${UNIT_EXIT}" > "$EVIDENCE_DIR/g2-unit-test.exit"
test "$UNIT_EXIT" -eq 0
rg -q "\\+[1-9][0-9]*: All tests passed!" "$EVIDENCE_DIR/g2-unit-test.txt"
! rg -q "(\\+0: All tests passed!|No tests ran|No tests were found|No tests found)" "$EVIDENCE_DIR/g2-unit-test.txt"
```

### G2b 판정 명령 예시

```bash
set -euo pipefail
EVIDENCE_DIR="dev/evidence/flutter/<task-name>"
mkdir -p "$EVIDENCE_DIR"

set -o pipefail
flutter test integration_test --reporter expanded | tee "$EVIDENCE_DIR/g2b-integration-test.txt"
INTEGRATION_EXIT="${PIPESTATUS[0]}"
echo "exit_code=${INTEGRATION_EXIT}" > "$EVIDENCE_DIR/g2b-integration-test.exit"
test "$INTEGRATION_EXIT" -eq 0
rg -q "\\+[1-9][0-9]*: All tests passed!" "$EVIDENCE_DIR/g2b-integration-test.txt"
! rg -q "(\\+0: All tests passed!|No tests ran|No tests were found|No tests found)" "$EVIDENCE_DIR/g2b-integration-test.txt"
```

### G3 판정 명령 예시

```bash
set -euo pipefail
EVIDENCE_DIR="dev/evidence/flutter/<task-name>"
LOG_FILE="$EVIDENCE_DIR/g3-import-export-part-matrix.txt"
STATUS_FILE="$EVIDENCE_DIR/g3-import-export-part-matrix.exit"
mkdir -p "$EVIDENCE_DIR"

count_violations() {
  local pattern="$1"
  shift
  local hits
  hits="$(rg -n --pcre2 "$pattern" "$@" || true)"
  if [ -z "$hits" ]; then
    echo 0
    return
  fi
  printf '%s\n' "$hits" | wc -l | tr -d '[:space:]'
}

# 양성 검증: 단일 composition root 파일은 반드시 존재하고 비어있지 않아야 한다.
COMPOSITION_ROOT_FILE="lib/app/di/composition_root.dart"
if [ -s "$COMPOSITION_ROOT_FILE" ]; then
  COMPOSITION_ROOT_FILE_OK=1
else
  COMPOSITION_ROOT_FILE_OK=0
fi

# 양성 검증: main.dart 또는 app bootstrap 파일에서 composition root 초기화 호출 토큰이 최소 1개 있어야 한다.
ENTRYPOINT_COMPOSITION_ROOT_INIT_TOKENS="$(count_violations "\\b(configureDependencies|setupDependencies|initDependencies|initializeDependencies|initializeCompositionRoot|configureCompositionRoot|bootstrapDependencies|initCompositionRoot|setupCompositionRoot)\\s*\\(" --glob 'lib/main.dart' --glob 'lib/**/bootstrap*.dart' --glob 'lib/**/app_bootstrap*.dart' --glob 'lib/**/app_startup*.dart' lib)"

# import/export/part 라인의 인용부 경로를 검사하며, as/show/hide 변형도 포함한다.
PRESENTATION_TO_DOMAIN="$(count_violations "^\\s*(import|export|part)\\s+['\\\"][^'\\\"]*((\\.\\./)+domain/|/domain/)[^'\\\"]*['\\\"]\\s*([^;]*\\b(as|show|hide)\\b[^;]*)?;\\s*(//.*)?$" --glob 'lib/**/presentation/pages/**/*.dart' --glob 'lib/**/presentation/widgets/**/*.dart' lib)"
PRESENTATION_TO_DATA="$(count_violations "^\\s*(import|export|part)\\s+['\\\"][^'\\\"]*((\\.\\./)+data/|/data/)[^'\\\"]*['\\\"]\\s*([^;]*\\b(as|show|hide)\\b[^;]*)?;\\s*(//.*)?$" --glob 'lib/**/presentation/pages/**/*.dart' --glob 'lib/**/presentation/widgets/**/*.dart' lib)"
VIEWMODEL_TO_DATA_OR_UI="$(count_violations "^\\s*(import|export|part)\\s+['\\\"][^'\\\"]*((\\.\\./)+((pages|widgets)/|data/)|/presentation/(pages|widgets)/|/data/)[^'\\\"]*['\\\"]\\s*([^;]*\\b(as|show|hide)\\b[^;]*)?;\\s*(//.*)?$" --glob 'lib/**/presentation/viewmodel/**/*.dart' lib)"
DOMAIN_TO_PRESENTATION_OR_DATA="$(count_violations "^\\s*(import|export|part)\\s+['\\\"][^'\\\"]*((\\.\\./)+(presentation|data)/|/(presentation|data)/)[^'\\\"]*['\\\"]\\s*([^;]*\\b(as|show|hide)\\b[^;]*)?;\\s*(//.*)?$" --glob 'lib/**/domain/**/*.dart' lib)"
DATA_TO_PRESENTATION="$(count_violations "^\\s*(import|export|part)\\s+['\\\"][^'\\\"]*((\\.\\./)+presentation/|/presentation/)[^'\\\"]*['\\\"]\\s*([^;]*\\b(as|show|hide)\\b[^;]*)?;\\s*(//.*)?$" --glob 'lib/**/data/**/*.dart' lib)"
CORE_TO_FEATURES="$(count_violations "^\\s*(import|export|part)\\s+['\\\"][^'\\\"]*((\\.\\./)+features/|/features/)[^'\\\"]*['\\\"]\\s*([^;]*\\b(as|show|hide)\\b[^;]*)?;\\s*(//.*)?$" --glob 'lib/**/core/**/*.dart' lib)"
NON_COMPOSITION_ROOT_APP_TO_FEATURES="$(count_violations "^\\s*(import|export|part)\\s+['\\\"][^'\\\"]*((\\.\\./)+features/|/features/)[^'\\\"]*['\\\"]\\s*([^;]*\\b(as|show|hide)\\b[^;]*)?;\\s*(//.*)?$" --glob 'lib/**/app/**/*.dart' --glob '!lib/app/di/composition_root.dart' lib)"
FEATURES_OR_CORE_TO_APP="$(count_violations "^\\s*(import|export|part)\\s+['\\\"][^'\\\"]*((\\.\\./)+app/|/app/)[^'\\\"]*['\\\"]\\s*([^;]*\\b(as|show|hide)\\b[^;]*)?;\\s*(//.*)?$" --glob 'lib/**/features/**/*.dart' --glob 'lib/**/core/**/*.dart' lib)"
NON_COMPOSITION_ROOT_DI_REGISTRATION="$(count_violations "\\bregister[A-Za-z0-9_]*\\s*(<[^>]+>\\s*)?\\(|@([Ii]njectable|[Ss]ingleton|[Ll]azy[Ss]ingleton|[Mm]odule)\\b" --glob 'lib/**/*.dart' --glob '!lib/app/di/composition_root.dart' lib)"

POSITIVE_VALIDATION_FAILURES=0
if [ "$COMPOSITION_ROOT_FILE_OK" -ne 1 ]; then
  POSITIVE_VALIDATION_FAILURES=$((POSITIVE_VALIDATION_FAILURES + 1))
fi
if [ "$ENTRYPOINT_COMPOSITION_ROOT_INIT_TOKENS" -lt 1 ]; then
  POSITIVE_VALIDATION_FAILURES=$((POSITIVE_VALIDATION_FAILURES + 1))
fi

TOTAL_VIOLATIONS=$((PRESENTATION_TO_DOMAIN + PRESENTATION_TO_DATA + VIEWMODEL_TO_DATA_OR_UI + DOMAIN_TO_PRESENTATION_OR_DATA + DATA_TO_PRESENTATION + CORE_TO_FEATURES + NON_COMPOSITION_ROOT_APP_TO_FEATURES + FEATURES_OR_CORE_TO_APP + NON_COMPOSITION_ROOT_DI_REGISTRATION + POSITIVE_VALIDATION_FAILURES))

{
  echo "presentation/pages|widgets -> domain violations: ${PRESENTATION_TO_DOMAIN}"
  echo "presentation/pages|widgets -> data violations: ${PRESENTATION_TO_DATA}"
  echo "presentation/viewmodel -> presentation/pages|widgets|data violations: ${VIEWMODEL_TO_DATA_OR_UI}"
  echo "domain -> presentation|data violations: ${DOMAIN_TO_PRESENTATION_OR_DATA}"
  echo "data -> presentation violations: ${DATA_TO_PRESENTATION}"
  echo "core -> features violations: ${CORE_TO_FEATURES}"
  echo "non-composition-root app -> features violations: ${NON_COMPOSITION_ROOT_APP_TO_FEATURES}"
  echo "features|core -> app violations: ${FEATURES_OR_CORE_TO_APP}"
  echo "non-composition-root DI registration violations: ${NON_COMPOSITION_ROOT_DI_REGISTRATION}"
  echo "composition_root_file_present_and_non_empty: ${COMPOSITION_ROOT_FILE_OK}"
  echo "entrypoint_composition_root_init_tokens: ${ENTRYPOINT_COMPOSITION_ROOT_INIT_TOKENS}"
  echo "positive_validation_failures: ${POSITIVE_VALIDATION_FAILURES}"
  echo "total_violations: ${TOTAL_VIOLATIONS}"
} | tee "$LOG_FILE"

if [ "$COMPOSITION_ROOT_FILE_OK" -ne 1 ]; then
  echo "missing_or_empty_file: lib/app/di/composition_root.dart" | tee -a "$LOG_FILE"
fi
if [ "$ENTRYPOINT_COMPOSITION_ROOT_INIT_TOKENS" -lt 1 ]; then
  echo "missing_entrypoint_init_token: main.dart or app bootstrap must call composition root init token" | tee -a "$LOG_FILE"
fi

if [ "$TOTAL_VIOLATIONS" -ne 0 ]; then
  echo "G3 FAIL" | tee -a "$LOG_FILE"
  echo "exit_code=1" > "$STATUS_FILE"
  exit 1
fi

echo "G3 PASS" | tee -a "$LOG_FILE"
echo "exit_code=0" > "$STATUS_FILE"
```

### G4 판정 명령 예시

```bash
set -euo pipefail
EVIDENCE_DIR="dev/evidence/flutter/<task-name>"
CHANGED_TARGETS_FILE="$EVIDENCE_DIR/g4-changed-targets.txt"
LOG_FILE="$EVIDENCE_DIR/g4-model-boundary-test.txt"
STATUS_FILE="$EVIDENCE_DIR/g4-model-boundary-test.exit"
mkdir -p "$EVIDENCE_DIR"

# CI/PR에서는 BASE_SHA를 타깃 브랜치와 HEAD의 merge-base로 주입한다.
# 예) export BASE_SHA="$(git merge-base HEAD origin/main)"
BASE_SHA="${BASE_SHA:-}"
if [ -z "$BASE_SHA" ]; then
  if ! git rev-parse --verify origin/main >/dev/null 2>&1; then
    {
      echo "BASE_SHA is required and origin/main is missing."
      echo "action: export BASE_SHA=<ancestor-sha> or run 'git fetch origin main' and rerun."
    } > "$LOG_FILE"
    echo "exit_code=1" > "$STATUS_FILE"
    exit 1
  fi

  BASE_SHA="$(git merge-base HEAD origin/main || true)"
  if [ -z "$BASE_SHA" ]; then
    {
      echo "failed to compute BASE_SHA via git merge-base HEAD origin/main."
      echo "action: provide BASE_SHA manually or rerun after 'git fetch origin main'."
    } > "$LOG_FILE"
    echo "exit_code=1" > "$STATUS_FILE"
    exit 1
  fi
fi

if ! git merge-base --is-ancestor "$BASE_SHA" HEAD >/dev/null 2>&1; then
  {
    echo "invalid BASE_SHA=${BASE_SHA}"
    echo "action: provide ancestor BASE_SHA (target-branch merge-base) or rerun after 'git fetch origin main'."
  } > "$LOG_FILE"
  echo "exit_code=1" > "$STATUS_FILE"
  exit 1
fi

echo "base_sha=${BASE_SHA}" > "$LOG_FILE"

git diff --name-only --diff-filter=ACMR "$BASE_SHA"...HEAD -- \
  ':(glob)lib/**/entities/**/*.dart' \
  ':(glob)lib/**/dtos/**/*.dart' \
  ':(glob)lib/**/models/**/*.dart' \
  ':(glob)lib/**/mappers/**/*.dart' \
  ':(glob)lib/**/value_objects/**/*.dart' \
  > "$CHANGED_TARGETS_FILE"

TARGET_COUNT="$(wc -l < "$CHANGED_TARGETS_FILE" | tr -d '[:space:]')"
echo "changed_targets=${TARGET_COUNT}" >> "$LOG_FILE"

while IFS= read -r target; do
  [ -z "$target" ] && continue
  symbol="$(basename "${target%.dart}")"
  rg -n --glob 'test/**/*.dart' --glob 'integration_test/**/*.dart' "\\b${symbol}\\b" >/dev/null || {
    echo "missing test reference for ${target}" | tee -a "$LOG_FILE"
    echo "exit_code=1" > "$STATUS_FILE"
    exit 1
  }
  echo "referenced_test_symbol=${symbol}" >> "$LOG_FILE"
done < "$CHANGED_TARGETS_FILE"

if [ "${TARGET_COUNT}" -gt 0 ]; then
  set -o pipefail
  flutter test --reporter expanded | tee -a "$LOG_FILE"
  TEST_EXIT="${PIPESTATUS[0]}"
  echo "test_exit_code=${TEST_EXIT}" >> "$LOG_FILE"
  if [ "$TEST_EXIT" -ne 0 ]; then
    echo "exit_code=${TEST_EXIT}" > "$STATUS_FILE"
    exit "$TEST_EXIT"
  fi

  rg -q "\\+[1-9][0-9]*: All tests passed!" "$LOG_FILE" || {
    echo "missing success token with executed test count > 0" | tee -a "$LOG_FILE"
    echo "exit_code=1" > "$STATUS_FILE"
    exit 1
  }

  if rg -q "(\\+0: All tests passed!|No tests ran|No tests were found|No tests found)" "$LOG_FILE"; then
    echo "executed tests == 0 is not allowed when model boundary targets changed" | tee -a "$LOG_FILE"
    echo "exit_code=1" > "$STATUS_FILE"
    exit 1
  fi
else
  echo "no changed model targets; tracking evidence recorded" >> "$LOG_FILE"
fi

echo "G4 PASS" >> "$LOG_FILE"
echo "exit_code=0" > "$STATUS_FILE"
```

### G4b 판정 명령 예시

```bash
set -euo pipefail
EVIDENCE_DIR="dev/evidence/flutter/<task-name>"
CHANGED_VIEWMODELS_FILE="$EVIDENCE_DIR/g4b-changed-viewmodels.txt"
LOG_FILE="$EVIDENCE_DIR/g4b-viewmodel-mapping-test.txt"
STATUS_FILE="$EVIDENCE_DIR/g4b-viewmodel-mapping-test.exit"
mkdir -p "$EVIDENCE_DIR"

# CI/PR에서는 BASE_SHA를 타깃 브랜치와 HEAD의 merge-base로 주입한다.
# 예) export BASE_SHA="$(git merge-base HEAD origin/main)"
BASE_SHA="${BASE_SHA:-}"
if [ -z "$BASE_SHA" ]; then
  if ! git rev-parse --verify origin/main >/dev/null 2>&1; then
    {
      echo "BASE_SHA is required and origin/main is missing."
      echo "action: export BASE_SHA=<ancestor-sha> or run 'git fetch origin main' and rerun."
    } > "$LOG_FILE"
    echo "exit_code=1" > "$STATUS_FILE"
    exit 1
  fi

  BASE_SHA="$(git merge-base HEAD origin/main || true)"
  if [ -z "$BASE_SHA" ]; then
    {
      echo "failed to compute BASE_SHA via git merge-base HEAD origin/main."
      echo "action: provide BASE_SHA manually or rerun after 'git fetch origin main'."
    } > "$LOG_FILE"
    echo "exit_code=1" > "$STATUS_FILE"
    exit 1
  fi
fi

if ! git merge-base --is-ancestor "$BASE_SHA" HEAD >/dev/null 2>&1; then
  {
    echo "invalid BASE_SHA=${BASE_SHA}"
    echo "action: provide ancestor BASE_SHA (target-branch merge-base) or rerun after 'git fetch origin main'."
  } > "$LOG_FILE"
  echo "exit_code=1" > "$STATUS_FILE"
  exit 1
fi

echo "base_sha=${BASE_SHA}" > "$LOG_FILE"

git diff --name-only --diff-filter=ACMR "$BASE_SHA"...HEAD -- \
  ':(glob)lib/**/presentation/viewmodel/**/*.dart' \
  > "$CHANGED_VIEWMODELS_FILE"

VIEWMODEL_COUNT="$(wc -l < "$CHANGED_VIEWMODELS_FILE" | tr -d '[:space:]')"
echo "changed_viewmodels=${VIEWMODEL_COUNT}" >> "$LOG_FILE"

if [ "$VIEWMODEL_COUNT" -eq 0 ]; then
  echo "no changed viewmodels; mapping evidence recorded" >> "$LOG_FILE"
  echo "G4b PASS" >> "$LOG_FILE"
  echo "exit_code=0" > "$STATUS_FILE"
  exit 0
fi

while IFS= read -r target; do
  [ -z "$target" ] && continue
  vm_symbol="$(basename "${target%.dart}")"
  mapped_tests="$(rg -l --glob 'test/**/*.dart' "\\b${vm_symbol}\\b" test || true)"
  if [ -z "$mapped_tests" ]; then
    echo "missing unit test file for ${target}" | tee -a "$LOG_FILE"
    echo "exit_code=1" > "$STATUS_FILE"
    exit 1
  fi

  token_found=0
  while IFS= read -r test_file; do
    [ -z "$test_file" ] && continue
    echo "mapped_unit_test=${test_file}" >> "$LOG_FILE"
    if rg -q "loading\\s*->\\s*(data|error)" "$test_file"; then
      token_found=1
    fi
  done <<< "$mapped_tests"

  if [ "$token_found" -ne 1 ]; then
    echo "missing state transition assertion token for ${target}" | tee -a "$LOG_FILE"
    echo "required token: loading -> data | loading -> error" >> "$LOG_FILE"
    echo "exit_code=1" > "$STATUS_FILE"
    exit 1
  fi

  echo "state_transition_token_verified_for=${target}" >> "$LOG_FILE"
done < "$CHANGED_VIEWMODELS_FILE"

echo "G4b PASS" >> "$LOG_FILE"
echo "exit_code=0" > "$STATUS_FILE"
```

### G5 판정 명령 예시

```bash
set -euo pipefail
EVIDENCE_DIR="dev/evidence/flutter/<task-name>"

for file in \
  "$EVIDENCE_DIR/g1-analyze.txt" \
  "$EVIDENCE_DIR/g2-unit-test.txt" \
  "$EVIDENCE_DIR/g2b-integration-test.txt" \
  "$EVIDENCE_DIR/g3-import-export-part-matrix.txt" \
  "$EVIDENCE_DIR/g4-model-boundary-test.txt" \
  "$EVIDENCE_DIR/g4b-viewmodel-mapping-test.txt"; do
  test -s "$file"
done

for status in \
  "$EVIDENCE_DIR/g1-analyze.exit" \
  "$EVIDENCE_DIR/g2-unit-test.exit" \
  "$EVIDENCE_DIR/g2b-integration-test.exit" \
  "$EVIDENCE_DIR/g3-import-export-part-matrix.exit" \
  "$EVIDENCE_DIR/g4-model-boundary-test.exit" \
  "$EVIDENCE_DIR/g4b-viewmodel-mapping-test.exit"; do
  test -s "$status"
  rg -q "^exit_code=0$" "$status"
done

rg -q "No issues found!" "$EVIDENCE_DIR/g1-analyze.txt"
rg -q "\\+[1-9][0-9]*: All tests passed!" "$EVIDENCE_DIR/g2-unit-test.txt"
rg -q "\\+[1-9][0-9]*: All tests passed!" "$EVIDENCE_DIR/g2b-integration-test.txt"
rg -q "G3 PASS" "$EVIDENCE_DIR/g3-import-export-part-matrix.txt"
rg -q "G4 PASS" "$EVIDENCE_DIR/g4-model-boundary-test.txt"
rg -q "G4b PASS" "$EVIDENCE_DIR/g4b-viewmodel-mapping-test.txt"

cat > "$EVIDENCE_DIR/g5-summary.md" <<'EOF'
# G5 PASS
- all evidence files are non-empty
- all gate exit codes are zero
- all required success tokens are verified
EOF
```

---

## 리소스 링크

필요 시 아래 문서로 확장할 수 있습니다. 이번 버전은 `SKILL.md` 단일 파일로도 사용 가능합니다.

- [위젯 패턴 가이드](resources/widget-patterns.md)
- [상태 관리 패턴](resources/state-management.md)
- [모델 설계 가이드](resources/modeling.md)
- [DI 가이드](resources/dependency-injection.md)
- [성능 최적화 체크리스트](resources/performance.md)
- [테스트 가이드](resources/testing.md)
- [빌드/배포 런북](resources/build-and-release.md)
- [디버깅 플레이북](resources/debugging.md)

---

## 핵심 원칙 요약

1. 항상 최신 stable Flutter/Dart를 사용한다.
2. MVVM + Clean Architecture 레이어 경계를 지킨다.
3. `presentation/pages|widgets -> domain` 직접 의존은 금지하고 `presentation/viewmodel`을 통해서만 호출한다.
4. DI는 `lib/app/di/composition_root.dart` 단일 Composition Root 정책을 지킨다.
5. 모델은 Entity/DTO/Model/Mapper/Value Object로 분리하고 immutable 우선으로 설계한다.
6. 패키지는 Flutter/Dart 공식 + Flutter Favorite 배지 정책을 따른다.
7. ViewModel 변경 시 대응 Unit Test와 상태 전이 assertion을 반드시 포함한다.
8. G2(Unit)+G2b(Integration)를 포함한 검증 가능한 완료 게이트(G1~G5 + G4b)를 통과하지 못하면 완료가 아니다.
