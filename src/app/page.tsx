import Link from "next/link";

export default function HomePage() {
  return (
    <main className="landing-shell">
      <section className="landing-card">
        <p className="landing-kicker">SEED3 PORTING TRACK</p>
        <h1>웹 런타임 부트스트랩이 준비됐습니다.</h1>
        <p className="landing-copy">
          현재 셸은 Next.js App Router, Seed3 런타임 디렉터리, 리소스 프로브 패널을 포함합니다.
          원본 자산은 <code>npm run sync:seed3-resources</code>로 정적 경로에 동기화할 수 있습니다.
        </p>
        <div className="landing-actions">
          <Link href="/seed3" className="landing-link">
            /seed3 열기
          </Link>
        </div>
      </section>
    </main>
  );
}
