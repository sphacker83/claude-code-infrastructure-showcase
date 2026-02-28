---
name: flutter-dev-guidelines
description: Flutter + Dart 애플리케이션을 위한 실무 개발 가이드라인입니다. 최신 stable Flutter/Dart, MVVM + Clean Architecture(presentation/viewmodel/domain/data/core), 모델 설계(Entity/DTO/Model/Mapper/Value Object), DI(Composition Root + Constructor Injection), Flutter Favorite 패키지 정책(pub.dev), 테스트/빌드/디버깅 기준을 다룹니다.
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
- [ ] View 코드는 `presentation`, 상태 오케스트레이션은 `viewmodel`에 배치했는가?
- [ ] 비즈니스 로직은 `domain/usecases`로 이동했는가?
- [ ] `build()`는 가볍고, 정적 위젯에 `const`를 적용했는가?
- [ ] 모델은 immutable 우선으로 설계했는가?
- [ ] 직렬화(`fromJson`/`toJson`)를 domain이 아닌 data 레이어에서 처리하는가?

### 새 기능 추가 체크리스트

- [ ] `presentation/viewmodel/domain/data/core` 경계를 유지했는가?
- [ ] `domain/entities`, `domain/value_objects`를 분리했는가?
- [ ] `data/dtos`, `data/models`, `data/mappers`를 분리했는가?
- [ ] Mapper가 DTO/Model <-> Entity 변환을 전담하는가?
- [ ] Composition Root(앱 시작/feature 진입)에서 의존성 구성을 명시했는가?
- [ ] Constructor Injection을 기본 주입 방식으로 사용했는가?
- [ ] Repository interface 기반 바인딩을 구성했는가?
- [ ] 테스트에서 fake/mock으로 주입 교체가 가능한가?
- [ ] 모델 변경 시 하위 호환/마이그레이션 계획을 포함했는가?
- [ ] 아래 `아키텍처 완성도 게이트`를 모두 통과했는가?

---

## 아키텍처 (MVVM + Clean Architecture)

```text
lib/
  core/
    di/
      composition_root.dart
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

- `presentation`: UI 렌더링과 사용자 상호작용
- `viewmodel`: 상태 전이, 이벤트 처리, usecase 호출 조정
- `domain`: Entity/Value Object, usecase, repository interface
- `data`: DTO/Model/Mapper, 외부 I/O, repository 구현체
- `core`: 공통 인프라와 Composition Root

### 모델 경계 규칙

- Entity/Value Object는 도메인 의미와 규칙만 포함
- DTO/Model은 외부 계약(API/DB) 표현만 담당
- Mapper가 계층 간 변환 책임을 단일화
- domain에서 `fromJson`/`toJson` 직접 사용 금지
- 모델 변경 시 버전/기본값/필드 폐기 전략을 문서화

### DI 규칙

- DI 구성은 Composition Root에서만 수행
- feature 내부 기본값은 Constructor Injection
- `domain/repositories` 인터페이스에 `data/repositories` 구현체 바인딩
- `get_it`/`injectable` 사용 시에도 등록은 진입점에서 제한
- 무분별한 전역 singleton 및 service locator 남용 금지

---

## 핵심 규칙

1. 최신 stable Flutter/Dart만 사용
- stable 채널 이외 버전/실험 기능 의존 코드는 금지합니다.

2. MVVM + Clean Architecture 강제
- `presentation/viewmodel/domain/data/core` 경계 위반 시 완료가 아닙니다.

3. 모델 설계 강제
- Entity/DTO/Model/Mapper 경계를 혼합하지 않습니다.
- immutable 모델과 Value Object를 우선 채택합니다.
- 직렬화/역직렬화와 도메인 모델을 분리합니다.
- 모델 변경 시 호환성/마이그레이션 계획이 없으면 완료가 아닙니다.

4. DI 완전 적용
- Composition Root 명시 + Constructor Injection 기본 적용이 필수입니다.
- Repository interface 기반 바인딩이 없으면 완료가 아닙니다.
- 테스트 교체 가능한 주입 구조가 없으면 완료가 아닙니다.
- service locator는 진입점에서만 제한적으로 허용합니다.

5. 패키지 정책 강제
- 공식 Flutter/Dart 패키지 우선 + pub.dev Flutter Favorite 배지 패키지만 허용합니다.

6. 테스트 및 품질 게이트
- Unit/Widget/Integration 테스트와 정적 분석을 통과해야 완료입니다.

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
- ViewModel은 상태 전이만 담당하고 domain/usecase 호출을 조정
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

## 아키텍처 완성도 게이트

아래 항목 중 하나라도 미충족이면 완료가 아닙니다.

- 레이어 경계 위반 없음
- 모델 경계(Entity/DTO/Model/Mapper/Value Object) 위반 없음
- immutable 모델 우선 적용
- 직렬화 코드와 도메인 모델 분리
- 모델 변경 시 호환성/마이그레이션 계획 존재
- Composition Root 명시
- Constructor Injection 적용
- Repository interface 기반 바인딩 적용
- 테스트 주입 교체 가능 구조 확보
- Unit/Widget/Integration 테스트 기준 충족

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
3. 모델은 Entity/DTO/Model/Mapper/Value Object로 분리하고 immutable 우선으로 설계한다.
4. DI는 Composition Root + Constructor Injection + 추상화 바인딩으로 구성한다.
5. 모델/DI/테스트 게이트를 통과하지 못하면 완료가 아니다.
