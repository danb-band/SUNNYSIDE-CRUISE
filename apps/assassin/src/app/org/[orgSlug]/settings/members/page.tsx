import { AppNav } from "@/components/navigation/AppNav";

export default function SettingsMembersPage() {
  return (
    <div className="h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <div className="w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-6 h-full">
        <div className="bg-white dark:bg-slate-900 rounded-lg p-4 sm:p-6 shadow-sm border border-slate-200 dark:border-slate-800 h-full flex flex-col min-h-0 overflow-y-auto">
          <AppNav />
          <div className="max-w-lg flex flex-col gap-4 pt-4">
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">멤버 관리</h1>
            <p className="text-sm text-muted-foreground">멤버 관리 기능은 준비 중입니다.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
