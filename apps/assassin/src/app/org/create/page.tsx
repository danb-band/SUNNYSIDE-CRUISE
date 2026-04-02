"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createOrgAction } from "@features/org/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function CreateOrgPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const slug = formData.get("slug") as string;

    setPending(true);
    setError(null);
    try {
      const org = await createOrgAction({ name, slug });
      router.push(`/org/${org.slug}/season`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
      setPending(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 p-4">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-lg p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">새 조직 만들기</h1>
          <p className="text-sm text-muted-foreground mt-1">조직 이름과 슬러그를 입력하세요.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">조직 이름</Label>
            <Input
              id="name"
              name="name"
              type="text"
              required
              maxLength={100}
              placeholder="예: 선셋 밴드"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="slug">슬러그</Label>
            <Input
              id="slug"
              name="slug"
              type="text"
              required
              maxLength={50}
              placeholder="예: sunset-band"
              pattern="[a-z0-9-]+"
            />
            <p className="text-xs text-muted-foreground">소문자, 숫자, 하이픈만 허용</p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "생성 중..." : "조직 만들기"}
          </Button>
        </form>

        <Link
          href="/"
          className="text-sm text-center text-muted-foreground hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
        >
          취소
        </Link>
      </div>
    </div>
  );
}
