"use client";

import { useId, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
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
  placeholder = "이름 검색",
  className,
}: UserSearchInputProps) {
  const { data: profiles } = useAllProfiles();
  const datalistId = useId();

  const [displayValue, setDisplayValue] = useState(() => {
    const matched = profiles?.find((p) => p.id === value);
    return matched?.realName ?? "";
  });

  useEffect(() => {
    const matched = profiles?.find((p) => p.id === value);
    setDisplayValue(matched?.realName ?? "");
  }, [value, profiles]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setDisplayValue(input);
    const matched = profiles?.find((p) => p.realName === input);
    if (matched) {
      onChange(matched.id, matched.realName);
    } else if (!input) {
      onChange("", "");
    }
  };

  return (
    <div className="flex-1">
      <Input
        list={datalistId}
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        autoComplete="off"
        className={cn(
          "h-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500/20 text-sm placeholder:text-slate-400",
          className,
        )}
      />
      <datalist id={datalistId}>
        {(profiles ?? []).map((p) => (
          <option key={p.id} value={p.realName} />
        ))}
      </datalist>
    </div>
  );
}
