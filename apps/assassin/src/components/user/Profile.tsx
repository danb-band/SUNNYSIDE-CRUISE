"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Loader2, Save, User } from "lucide-react";
import { useCurrentUserProfile } from "@/features/user/queries/useCurrentUserProfile";
import { useProfileHandlers } from "@/features/user/hooks/useProfileHandlers";

export function Profile() {
  const router = useRouter();
  const { data: profile } = useCurrentUserProfile();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { formState, isProcessing, handleSubmit, handleChangeField } = useProfileHandlers({
    initialData: { name: profile?.name ?? "" },
    onSuccess: (message) => {
      setSuccessMessage(message);
    },
  });

  const { formData, errors, isDirty } = formState;

  const handleSave = async () => {
    setSuccessMessage(null);
    await handleSubmit();
  };

  const inputClassName =
    "h-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500/20 text-sm placeholder:text-slate-400";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-500 hover:text-slate-900 dark:hover:text-slate-50 flex-shrink-0"
                  onClick={() => router.back()}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="min-w-0">
                  <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                    회원 정보 편집
                  </h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    프로필 정보를 수정할 수 있습니다
                  </p>
                </div>
              </div>
              <Button
                type="button"
                onClick={handleSave}
                disabled={isProcessing || !isDirty}
                className="bg-blue-500 hover:bg-blue-600 text-white flex-shrink-0"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                    저장 중...
                  </>
                ) : (
                  <>
                    <Save className="mr-1 h-4 w-4" />
                    저장
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            <div className="max-w-lg space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="edit-name"
                  className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400"
                >
                  <User className="h-3.5 w-3.5" />
                  이름
                </label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => handleChangeField("name", e.target.value)}
                  placeholder="닉네임"
                  className={inputClassName}
                />
                {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="edit-real-name"
                  className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400"
                >
                  <User className="h-3.5 w-3.5" />
                  실명
                </label>
                <Input
                  id="edit-real-name"
                  value={profile?.realName ?? ""}
                  readOnly
                  className={`${inputClassName} cursor-not-allowed opacity-60`}
                />
              </div>

              {errors._root && <p className="text-xs text-red-500">{errors._root}</p>}
              {successMessage && <p className="text-xs text-green-600">{successMessage}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
