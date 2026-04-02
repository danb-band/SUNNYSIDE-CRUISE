"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createOrgAction } from "@features/org/actions";

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
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-4">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">새 조직 만들기</h1>
        <p className="text-muted-foreground">조직 이름과 슬러그를 입력하세요.</p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="name" className="text-sm font-medium">
            조직 이름
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            maxLength={100}
            placeholder="예: 선셋 밴드"
            className="border rounded-md px-3 py-2 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="slug" className="text-sm font-medium">
            슬러그
          </label>
          <input
            id="slug"
            name="slug"
            type="text"
            required
            maxLength={50}
            placeholder="예: sunset-band"
            pattern="[a-z0-9-]+"
            className="border rounded-md px-3 py-2 text-sm"
          />
          <p className="text-xs text-muted-foreground">소문자, 숫자, 하이픈만 허용</p>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-md font-medium disabled:opacity-50"
        >
          {pending ? "생성 중..." : "조직 만들기"}
        </button>
      </form>
    </div>
  );
}
