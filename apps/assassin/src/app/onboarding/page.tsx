import Link from "next/link";

export default function OnboardingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-4">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">시작하기</h1>
        <p className="text-muted-foreground">소속된 조직이 없습니다. 새 조직을 만들거나 초대를 확인하세요.</p>
      </div>
      <div className="flex gap-4">
        <Link
          href="/org/new"
          className="px-6 py-3 bg-primary text-primary-foreground rounded-md font-medium"
        >
          새 조직 만들기
        </Link>
      </div>
    </div>
  );
}
