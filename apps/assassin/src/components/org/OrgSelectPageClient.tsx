"use client";

import Link from "next/link";
import { Building2, ChevronRight, Mail } from "lucide-react";
import type { Org } from "@/features/org/schema";
import { useRealtimeOrgSync } from "@/features/org/hooks/useRealtimeOrgSync";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/navigation/LogoutButton";

type PendingInvitation = {
  id: string;
  org: { name: string };
};

interface OrgSelectPageClientProps {
  orgs: Org[];
  pendingInvitations: PendingInvitation[];
}

export function OrgSelectPageClient({ orgs, pendingInvitations }: OrgSelectPageClientProps) {
  useRealtimeOrgSync();

  const hasContent = orgs.length > 0 || pendingInvitations.length > 0;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
      <Card className="w-full max-w-sm border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500 mb-2">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-xl text-slate-900 dark:text-slate-50">시작하기</CardTitle>
          <CardDescription className="text-slate-500 dark:text-slate-400">
            {hasContent
              ? "소속된 밴드를 선택하세요."
              : "소속된 밴드가 없습니다. 새 밴드를 만들거나 초대를 확인하세요."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {orgs.length > 0 && (
            <div className="flex flex-col gap-2">
              {orgs.map((org) => (
                <Link
                  key={org.id}
                  href={`/org/${org.slug}/season`}
                  className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-blue-500 hover:shadow-sm transition-all"
                >
                  <span className="font-medium text-slate-900 dark:text-slate-50">{org.name}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-slate-400">{org.slug}</span>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </div>
                </Link>
              ))}
            </div>
          )}
          {pendingInvitations.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                초대받은 밴드
              </p>
              {pendingInvitations.map((inv) => (
                <Link
                  key={inv.id}
                  href={`/invite/accept?id=${inv.id}`}
                  className="flex items-center justify-between px-4 py-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg hover:border-blue-400 hover:shadow-sm transition-all"
                >
                  <span className="font-medium text-slate-900 dark:text-slate-50">
                    {inv.org.name}
                  </span>
                  <div className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5 text-blue-500" />
                    <span className="text-xs text-blue-500">초대 대기</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
          <Button asChild className="w-full bg-blue-500 hover:bg-blue-600 text-white">
            <Link href="/org/create">새 밴드 만들기</Link>
          </Button>
          <LogoutButton />
        </CardContent>
      </Card>
    </div>
  );
}
