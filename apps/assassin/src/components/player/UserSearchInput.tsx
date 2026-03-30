"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/libs/shadcn/utils";
import { useAllProfiles } from "@/features/user/queries/useAllProfiles";

const MAX_VISIBLE_ITEMS = 4;
const ITEM_HEIGHT = 36;

interface UserSearchInputProps {
  value: string;
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

  const selectedProfile = profiles?.find((p) => p.id === value);
  const selectedRealName = selectedProfile?.realName ?? "";

  const [searchValue, setSearchValue] = useState("");
  const [open, setOpen] = useState(false);

  const inputValue = open ? searchValue : selectedRealName;
  const filtered =
    inputValue.length > 0
      ? (profiles ?? []).filter((p) => p.realName.toLowerCase().includes(inputValue.toLowerCase()))
      : (profiles ?? []);

  const handleSelect = (userId: string, realName: string) => {
    onChange(userId, realName);
    setSearchValue(realName);
    setOpen(false);
  };

  return (
    <Popover open={open && filtered.length > 0} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div className="relative flex-1">
          <Input
            value={inputValue}
            onChange={(e) => {
              setSearchValue(e.target.value);
              setOpen(true);
            }}
            onFocus={() => {
              setSearchValue(selectedRealName);
              setOpen(true);
            }}
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
      </PopoverAnchor>

      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={4}
        collisionPadding={12}
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="w-[var(--radix-popover-trigger-width)] min-w-[var(--radix-popover-trigger-width)] max-w-[calc(100vw-24px)] rounded-md border border-slate-200 bg-white p-0 text-sm shadow-md dark:border-slate-700 dark:bg-slate-900"
      >
        <ScrollArea
          className="overflow-hidden"
          style={{
            height: `${Math.min(filtered.length, MAX_VISIBLE_ITEMS) * ITEM_HEIGHT}px`,
          }}
        >
          <ul className="py-1">
            {filtered.map((p) => (
              <li
                key={p.id}
                className="cursor-pointer px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(p.id, p.realName);
                }}
              >
                {p.realName}
              </li>
            ))}
          </ul>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
