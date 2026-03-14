import { Seed3RuntimeHost } from "@/features/seed3/runtime/ui";

export default function Seed3Page() {
  return (
    <main className="seed3-page">
      <div className="seed3-shell">
        <header className="seed3-header">
          <div>
            <p className="seed3-kicker">NEXT.JS WEB PORT</p>
            <h1>Seed3 Runtime Boot</h1>
            <p>
              원본 iOS 구조의 다음 단계는 캔버스 기반 웹 런타임, 원본 리소스 무변환 서빙,
              브라우저 메모리 디코더입니다. 현재 화면은 그 첫 부트 셸과 리소스 검증 패널입니다.
            </p>
          </div>
          <div className="seed3-chip-list" aria-label="현재 페이즈">
            <span className="seed3-chip">Phase 1: App Router 셸</span>
            <span className="seed3-chip">Phase 2: 리소스 동기화 경로</span>
            <span className="seed3-chip">다음: zlib + 포맷 디코더</span>
          </div>
        </header>
        <Seed3RuntimeHost />
      </div>
    </main>
  );
}
