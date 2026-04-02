"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, Loader2 } from "lucide-react";
import { createOrgAction } from "@features/org/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
      <Card className="w-full max-w-sm border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500 mb-2">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-xl text-slate-900 dark:text-slate-50">
            새 조직 만들기
          </CardTitle>
          <CardDescription className="text-slate-500 dark:text-slate-400">
            조직 이름과 슬러그를 입력하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-700 dark:text-slate-300">
                조직 이름
              </Label>
              <Input
                id="name"
                name="name"
                type="text"
                required
                maxLength={100}
                placeholder="예: 선셋 밴드"
                className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug" className="text-slate-700 dark:text-slate-300">
                슬러그
              </Label>
              <Input
                id="slug"
                name="slug"
                type="text"
                required
                maxLength={50}
                placeholder="예: sunset-band"
                pattern="[a-z0-9-]+"
                className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                소문자, 숫자, 하이픈만 허용 · 생성 후 변경 불가
              </p>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button
              type="submit"
              disabled={pending}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white"
            >
              {pending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  생성 중...
                </>
              ) : (
                "조직 만들기"
              )}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
            <Link href="/" className="text-blue-500 hover:text-blue-600 font-medium">
              취소
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
