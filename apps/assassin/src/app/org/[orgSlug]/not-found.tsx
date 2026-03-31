import Link from "next/link";

export default function OrgNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-2xl font-bold">접근 권한이 없습니다</h1>
      <p className="text-muted-foreground">이 조직에 접근할 권한이 없거나 존재하지 않는 조직입니다.</p>
      <Link href="/" className="text-primary underline">
        홈으로 돌아가기
      </Link>
    </div>
  );
}
