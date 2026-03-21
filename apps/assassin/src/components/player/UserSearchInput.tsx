"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
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
  const [user, setUser] = useState(() => {
    // Initialize display value from selected userId
    const matched = profiles?.find((p) => p.id === value);
    return matched?.realName ?? "";
  });
  const [open, setOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered =
    user.length > 0
      ? (profiles ?? []).filter((p) => p.realName.toLowerCase().includes(user.toLowerCase()))
      : (profiles ?? []);

  const handleSelect = (userId: string, realName: string) => {
    onChange(userId, realName);
    setUser(realName);
    setOpen(false);
  };

  const updateDropdownPosition = () => {
    if (!inputRef.current) return;
    const rect = inputRef.current.getBoundingClientRect();
    setDropdownStyle({
      position: "fixed",
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    });
  };

  const handleFocus = () => {
    updateDropdownPosition();
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const handleScroll = () => updateDropdownPosition();
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleScroll);
    };
  }, [open]);

  return (
    <div className="relative flex-1">
      <Input
        ref={inputRef}
        value={user}
        onChange={(e) => {
          setUser(e.target.value);
          updateDropdownPosition();
          setOpen(true);
        }}
        onFocus={handleFocus}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        className={cn(
          "h-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500/20 text-sm placeholder:text-slate-400",
          className,
        )}
      />
      {open && filtered.length > 0 &&
        createPortal(
          <ul
            style={dropdownStyle}
            className="z-[9999] rounded-md border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-700 shadow-md max-h-48 overflow-auto text-sm"
          >
            {filtered.map((p) => (
              <li
                key={p.id}
                className="cursor-pointer px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800"
                onMouseDown={() => handleSelect(p.id, p.realName)}
              >
                {p.realName}
              </li>
            ))}
          </ul>,
          document.body,
        )}
    </div>
  );
}
