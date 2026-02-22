"use client";

import * as React from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { DayPicker, getDefaultClassNames, type DayButton } from "react-day-picker";

import { cn } from "@/libs/shadcn/utils";
import { Button, buttonVariants } from "@/components/ui/button";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"];
}) {
  const defaultClassNames = getDefaultClassNames();

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("group/calendar p-3 [--cell-size:--spacing(9)]", className)}
      captionLayout={captionLayout}
      formatters={{
        formatMonthDropdown: (date) => date.toLocaleString("default", { month: "short" }),
        ...formatters,
      }}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        months: cn("flex gap-4 flex-col md:flex-row relative", defaultClassNames.months),
        month: cn("flex flex-col w-full gap-3", defaultClassNames.month),
        nav: cn(
          "flex items-center gap-1 w-full absolute top-0 inset-x-0 justify-between",
          defaultClassNames.nav,
        ),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          "size-(--cell-size) aria-disabled:opacity-50 p-0 select-none text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50",
          defaultClassNames.button_previous,
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          "size-(--cell-size) aria-disabled:opacity-50 p-0 select-none text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50",
          defaultClassNames.button_next,
        ),
        month_caption: cn(
          "flex items-center justify-center h-(--cell-size) w-full px-(--cell-size)",
          defaultClassNames.month_caption,
        ),
        caption_label: cn(
          "select-none text-sm font-semibold text-slate-900 dark:text-slate-50",
          defaultClassNames.caption_label,
        ),
        table: "w-full border-collapse",
        weekdays: cn("flex", defaultClassNames.weekdays),
        weekday: cn(
          "text-slate-400 dark:text-slate-500 rounded-md flex-1 font-medium text-[0.75rem] select-none",
          defaultClassNames.weekday,
        ),
        week: cn("flex w-full mt-1", defaultClassNames.week),
        day: cn(
          "relative w-full h-full p-0 text-center group/day aspect-square select-none",
          defaultClassNames.day,
        ),
        today: cn(
          "rounded-md ring-1 ring-blue-400/60 dark:ring-blue-500/50",
          defaultClassNames.today,
        ),
        outside: cn(
          "text-slate-300 dark:text-slate-600 aria-selected:text-slate-300",
          defaultClassNames.outside,
        ),
        disabled: cn("text-slate-300 dark:text-slate-600 opacity-50", defaultClassNames.disabled),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => (
          <div data-slot="calendar" ref={rootRef} className={cn(className)} {...props} />
        ),
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left")
            return <ChevronLeftIcon className={cn("size-4", className)} {...props} />;
          return <ChevronRightIcon className={cn("size-4", className)} {...props} />;
        },
        DayButton: CalendarDayButton,
        ...components,
      }}
      {...props}
    />
  );
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const defaultClassNames = getDefaultClassNames();

  const ref = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      // toLocaleDateString() 대신 ISO 형식 사용 → hydration mismatch 방지
      data-day={day.date.toISOString().split("T")[0]}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        // 선택된 날: 프로젝트 blue-500
        "data-[selected-single=true]:bg-blue-500 data-[selected-single=true]:text-white data-[selected-single=true]:hover:bg-blue-600",
        "data-[range-start=true]:bg-blue-500 data-[range-start=true]:text-white",
        "data-[range-end=true]:bg-blue-500 data-[range-end=true]:text-white",
        "data-[range-middle=true]:bg-blue-50 data-[range-middle=true]:text-blue-600 dark:data-[range-middle=true]:bg-blue-900/30 dark:data-[range-middle=true]:text-blue-300",
        // 포커스
        "group-data-[focused=true]/day:ring-2 group-data-[focused=true]/day:ring-blue-400/50 group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10",
        // 기본
        "relative flex aspect-square size-auto w-full min-w-(--cell-size) items-center justify-center leading-none font-normal",
        "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-50",
        defaultClassNames.day,
        className,
      )}
      {...props}
    />
  );
}

export { Calendar, CalendarDayButton };
