"use client";

type Seed3ErrorProps = Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>;

export default function Seed3Error({ error, reset }: Seed3ErrorProps) {
  return (
    <div className="seed3-error">
      <div className="seed3-error-card">
        <p className="seed3-kicker">ERROR</p>
        <h1>Seed3 런타임 셸이 예외로 중단됐습니다.</h1>
        <p>{error.message}</p>
        <button type="button" onClick={reset}>
          다시 시도
        </button>
      </div>
    </div>
  );
}
