---
name: flutter-dev-guidelines
description: Flutter + Dart 애플리케이션을 위한 실무 개발 가이드라인입니다. 최신 stable Flutter/Dart 기준, MVVM + Clean Architecture(presentation/viewmodel/domain/data/core), Flutter Favorite 배지 패키지 정책(pub.dev), 위젯 설계, 상태 관리, 성능 최적화, 테스트, iOS/Android 빌드 및 배포를 다룹니다.
---

# Flutter 개발 가이드라인

## 목적

Flutter 프로젝트에서 일관된 아키텍처, 예측 가능한 상태 관리, 안정적인 빌드/배포 흐름을 유지하기 위한 실무 가이드입니다.

## 이 스킬을 사용해야 하는 경우

- 새 Flutter 화면/위젯을 만들 때
- 앱 상태 관리 구조(Riverpod, Bloc, Provider)를 설계/수정할 때
- 렌더링 성능(jank, 과도한 rebuild)을 개선할 때
- 단위/위젯/통합 테스트를 추가할 때
- Android/iOS 빌드 및 배포(apk/ipa)를 준비할 때
- pubspec 의존성/플러그인 설정을 변경할 때
- 플랫폼 권한/네이티브 연동 이슈를 디버깅할 때

---

## 빠른 시작

### 새 화면 구현 체크리스트

- [ ] 개발 환경이 최신 stable Flutter/Dart인지 확인했는가?
- [ ] 라우팅 진입점과 화면 책임(표시/상태/비즈니스)을 분리했는가?
- [ ] 화면 루트 위젯은 `Scaffold`/`SafeArea`로 기본 레이아웃을 고정했는가?
- [ ] `const` 생성자를 적용해 불필요한 rebuild를 줄였는가?
- [ ] 비동기 데이터는 로딩/에러/성공 상태를 모두 정의했는가?
- [ ] 상태 관리는 기존 프로젝트 표준(Riverpod/Bloc/Provider) 하나로 통일했는가?
- [ ] 문자열/색상/간격은 하드코딩 대신 테마/상수로 관리하는가?
- [ ] View는 `presentation`, 상태 오케스트레이션은 `viewmodel`에 배치했는가?

### 새 기능 추가 체크리스트

- [ ] `lib/features/{feature_name}/` 단위로 구조를 분리했는가?
- [ ] `presentation`, `viewmodel`, `domain`, `data`, `core` 계층 경계를 명확히 했는가?
- [ ] `domain/usecases`와 `domain/repositories`(interface)를 정의했는가?
- [ ] `data/repositories` 구현체가 `domain` 계약을 따르는가?
- [ ] DTO/Entity/Model 매핑 책임을 분리했는가?
- [ ] 실패 케이스(네트워크 끊김, 타임아웃, 권한 없음) 처리 경로를 구현했는가?
- [ ] 최소 1개 이상 widget test와 핵심 use-case 단위 테스트를 추가했는가?
- [ ] 신규 의존성은 pub.dev Flutter Favorite 배지 여부를 검증했는가?

---

## 아키텍처 (MVVM + Clean Architecture)

```text
lib/
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
        repositories/
        usecases/
      data/
        datasources/
        models/
        repositories/
test/
integration_test/
```

핵심 원칙:
- MVVM + Clean Architecture는 선택이 아니라 필수
- `presentation`은 렌더링, `viewmodel`은 상태 전이/이벤트 처리
- `domain`은 usecase/repository 계약, `data`는 구현 세부
- 공통 유틸/인프라는 `core/`에 한정

---

## 핵심 규칙

1. 최신 stable Flutter/Dart만 사용
- stable 채널과 안정 릴리스 버전을 기준으로 개발합니다.
- beta/dev/master 채널, 실험적 API 의존 코드는 기본 금지입니다.

2. MVVM + Clean Architecture 강제
- `presentation/viewmodel/domain/data/core` 레이어를 유지합니다.
- View에서 비즈니스 로직/데이터 접근을 직접 수행하지 않습니다.
- UseCase와 Repository 계약은 `domain`에 정의하고 구현은 `data`에 둡니다.

3. 패키지 정책 강제
- 공식 Flutter/Dart 패키지를 우선 사용합니다.
- pub.dev 패키지는 Flutter Favorite 배지 패키지만 허용합니다.
- 최신 stable 미호환, 유지보수 부실, Null Safety 미지원 패키지는 금지합니다.

4. 단일 상태관리 패턴 유지
- Riverpod, Bloc, Provider 중 프로젝트 표준 1개를 기본값으로 사용합니다.
- 새 기능에서 다른 패턴을 혼합 도입하지 않습니다.

5. 위젯은 작게 나누고 `build()`를 가볍게 유지
- `build()` 안에서 무거운 계산, 동기 I/O, 큰 리스트 변환을 피합니다.
- 재사용 가능한 UI 조각은 별도 위젯으로 추출합니다.

6. 에러는 도메인 규칙으로 표준화
- 예외를 UI까지 raw 형태로 전달하지 않습니다.
- 사용자 메시지와 디버깅 로그를 분리합니다.

---

## 패키지 정책 (Flutter Favorite Only)

### 허용 기준

- 1순위: Flutter/Dart 공식 패키지
- 2순위: pub.dev Flutter Favorite 배지 패키지
- 최신 stable Flutter/Dart 호환 + Null Safety 지원
- 최근 유지보수 활동과 이슈 대응이 확인되는 패키지

### 비허용 조건

- Flutter Favorite 배지 없음
- 최신 stable Flutter/Dart 미호환
- 최근 장기 미업데이트 또는 치명 버그 방치
- 아키텍처 경계를 침범하는 전역 의존성 강제 패키지

### 도입 절차

1. 표준 SDK/공식 패키지로 해결 가능한지 확인
2. Flutter Favorite 배지 확인
3. 호환성(Flutter/Dart stable, Null Safety) 확인
4. 유지보수 상태/릴리스 품질 검토
5. `domain/data` 경계 영향 검토 후 채택

## 상태 관리 가이드

### Riverpod

- 비동기 상태는 `AsyncValue` 패턴을 기본으로 사용
- provider는 기능 단위 파일로 묶고 전역 난립을 피함
- `ref.watch`/`ref.read` 사용 위치를 명확히 구분

```dart
final userProvider = FutureProvider<User>((ref) async {
  return ref.read(userRepositoryProvider).fetchMe();
});
```

### Bloc

- `Event -> State` 전이 규칙을 문서화
- 하나의 Bloc이 너무 많은 도메인 책임을 가지지 않도록 분리
- `BlocBuilder` 범위를 최소화해 rebuild 영역을 제한

### Provider

- 단순 폼/로컬 상태에 우선 적용
- 복잡한 비동기 흐름은 Riverpod/Bloc 전환을 고려
- `notifyListeners()` 호출 지점을 최소화

---

## 성능 최적화

### 기본 체크리스트

- [ ] 가능한 모든 정적 위젯에 `const` 사용
- [ ] 긴 리스트는 `ListView.builder`/`SliverList` 사용
- [ ] 불필요한 `setState` 또는 광범위 상태 갱신 제거
- [ ] 이미지 캐시/사이즈 최적화 적용
- [ ] 애니메이션/스크롤 구간에서 과도한 rebuild 점검

### 자주 발생하는 성능 이슈

- `build()` 내 API 호출
- `MediaQuery.of(context)`/`Theme.of(context)` 중복 계산 남발
- 하나의 상위 state 변경으로 화면 전체 rebuild
- 거대한 JSON 파싱을 메인 isolate에서 동기 처리

개선 방향:
- 계산은 메모이제이션 또는 별도 계층으로 이동
- 필요 시 `compute()`/isolate 활용
- DevTools의 Rebuild Stats/CPU Profiler로 병목 구간 측정

---

## 테스트 전략

### 테스트 계층

- Unit Test: 순수 로직, 유스케이스, 매퍼, 유효성 검증
- Widget Test: 화면 렌더링, 사용자 상호작용, 상태 변화
- Integration Test: 실제 라우팅/플러그인/네트워크 경계 검증

### 실무 규칙

- 핵심 비즈니스 로직은 unit test 우선
- 주요 화면은 최소 1개 이상 widget test 작성
- 배포 전 smoke integration test 실행
- flakiness 있는 테스트는 즉시 격리 후 원인 수정

자주 쓰는 명령:

```bash
flutter analyze
dart format .
flutter test
flutter test integration_test
```

---

## 빌드 & 배포

### Android

- `android/app/build.gradle`의 `applicationId`, `minSdk`, `targetSdk` 확인
- keystore 서명 설정과 버전 코드(`versionCode`) 관리
- 배포 산출물:

```bash
flutter build apk --release
flutter build appbundle --release
```

### iOS

- `ios/Runner.xcodeproj`의 Bundle Identifier/Signing 설정 확인
- 권한 문자열(Info.plist)과 배포 타겟 버전 점검
- 배포 산출물:

```bash
flutter build ipa --release
```

### 공통

- `pubspec.yaml` 버전(`version: x.y.z+build`) 규칙 일관성 유지
- 릴리즈 노트에 기능/수정/마이그레이션 항목 기록
- CI에서 `analyze + test + build` 순서의 게이트를 유지

---

## 디버깅 가이드

### 우선 도구

- Flutter Inspector: 위젯 트리/레이아웃 문제 확인
- Dart DevTools: CPU, Memory, Network, Rebuild 추적
- 로그: `debugPrint`, 구조화된 에러 로깅

### 빈도 높은 이슈와 점검 포인트

1. `RenderFlex overflowed`
- `Expanded`/`Flexible` 적용 여부 확인
- 고정 높이/너비를 반응형으로 전환

2. `setState() called after dispose()`
- 비동기 완료 시 `mounted` 체크
- stream/subscription dispose 누락 확인

3. 플랫폼 권한 오류(Android/iOS)
- AndroidManifest.xml / Info.plist 권한 선언 검증
- 런타임 권한 요청 플로우 점검

4. 플러그인 초기화 실패
- `WidgetsFlutterBinding.ensureInitialized()` 호출 순서 확인
- iOS `pod install`, Android Gradle sync 상태 점검

---

## 리소스 링크

필요 시 아래 문서로 확장할 수 있습니다. 이번 버전은 `SKILL.md` 단일 파일로도 사용 가능합니다.

- [위젯 패턴 가이드](resources/widget-patterns.md)
- [상태 관리 패턴](resources/state-management.md)
- [성능 최적화 체크리스트](resources/performance.md)
- [테스트 가이드](resources/testing.md)
- [빌드/배포 런북](resources/build-and-release.md)
- [디버깅 플레이북](resources/debugging.md)

---

## 핵심 원칙 요약

1. 항상 최신 stable Flutter/Dart를 기준으로 개발한다.
2. MVVM + Clean Architecture(`presentation/viewmodel/domain/data/core`)를 필수로 유지한다.
3. pub.dev 패키지는 Flutter Favorite 배지 패키지만 사용하고 공식 패키지를 우선한다.
4. 성능 최적화는 추측이 아니라 DevTools 측정 기반으로 수행한다.
5. 테스트는 Unit -> Widget -> Integration 순으로 방어선을 구성한다.
