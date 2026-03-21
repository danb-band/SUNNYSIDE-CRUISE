"use client";

import { cn } from "@/libs/shadcn/utils";
import { useAllProfiles } from "@/features/user/queries/useAllProfiles";

interface UserSearchInputProps {
  value: string; // currently selected userId
  onChange: (userId: string, realName: string) => void;
  placeholder?: string;
  className?: string;
}

export function UserSearchInput({
  value,
  onChange,
  placeholder = "이름 선택",
  className,
}: UserSearchInputProps) {
  const { data: profiles } = useAllProfiles();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const userId = e.target.value;
    const profile = profiles?.find((p) => p.id === userId);
    onChange(userId, profile?.realName ?? "");
  };

  return (
    <select
      value={value}
      onChange={handleChange}
      className={cn(
        "h-9 flex-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 text-sm text-slate-900 dark:text-slate-50 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20",
        !value && "text-slate-400",
        className,
      )}
    >
      <option value="">{placeholder}</option>
      {(profiles ?? []).map((p) => (
        <option key={p.id} value={p.id}>
          {p.realName}
        </option>
      ))}
    </select>
  );
}
