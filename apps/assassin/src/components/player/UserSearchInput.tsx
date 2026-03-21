"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/libs/shadcn/utils";
import { useAllProfiles } from "@/features/user/queries/useAllProfiles";

const MAX_VISIBLE_ITEMS = 6;
const ITEM_HEIGHT = 36; // py-2(8+8) + text-sm line-height(20)

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
  const [displayValue, setDisplayValue] = useState(
    () => profiles?.find((p) => p.id === value)?.realName ?? "",
  );
  const [open, setOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLUListElement>(null);
  // Store initial position in a ref so the portal renders at the correct spot immediately
  const initialPos = useRef<React.CSSProperties>({ position: "fixed" });

  useEffect(() => {
    const matched = profiles?.find((p) => p.id === value);
    setDisplayValue(matched?.realName ?? "");
  }, [value, profiles]);

  // Direct DOM update — no setState → no re-render → no scroll reset inside dropdown
  const updatePosition = useCallback(() => {
    if (!inputRef.current || !dropdownRef.current) return;
    const rect = inputRef.current.getBoundingClientRect();
    dropdownRef.current.style.top = `${rect.bottom + 4}px`;
    dropdownRef.current.style.left = `${rect.left}px`;
    dropdownRef.current.style.width = `${rect.width}px`;
  }, []);

  const openDropdown = useCallback(() => {
    if (!inputRef.current) return;
    const rect = inputRef.current.getBoundingClientRect();
    // Set position before rendering portal so there's no initial jump
    initialPos.current = {
      position: "fixed" as const,
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    };
    setOpen(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        !containerRef.current?.contains(target) &&
        !dropdownRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [open]);

  const filtered =
    displayValue.length > 0
      ? (profiles ?? []).filter((p) =>
          p.realName.toLowerCase().includes(displayValue.toLowerCase()),
        )
      : (profiles ?? []);

  const handleSelect = (userId: string, realName: string) => {
    onChange(userId, realName);
    setDisplayValue(realName);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative flex-1">
      <div className="relative">
        <Input
          ref={inputRef}
          value={displayValue}
          onChange={(e) => {
            setDisplayValue(e.target.value);
            if (!open) openDropdown();
          }}
          onFocus={openDropdown}
          placeholder={placeholder}
          className={cn(
            "h-9 pr-8 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500/20 text-sm placeholder:text-slate-400",
            className,
          )}
        />
        <ChevronDown
          className={cn(
            "absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none transition-transform duration-150",
            open && "rotate-180",
          )}
        />
      </div>
      {open &&
        filtered.length > 0 &&
        typeof document !== "undefined" &&
        createPortal(
          <ul
            ref={dropdownRef}
            onScroll={(e) => e.stopPropagation()}
            style={{
              ...initialPos.current,
              maxHeight: `${ITEM_HEIGHT * MAX_VISIBLE_ITEMS}px`,
              zIndex: 9999,
            }}
            className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-md text-sm overflow-y-auto"
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
