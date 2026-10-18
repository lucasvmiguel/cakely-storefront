import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, type DayPickerProps } from "react-day-picker";

// A month calendar in the style of shadcn/ui's Calendar (also built on
// react-day-picker), themed with the Cakely colours.
export function Calendar({ className = "", classNames, ...props }: DayPickerProps) {
  return (
    <DayPicker
      showOutsideDays
      className={`p-3 ${className}`}
      classNames={{
        months: "relative flex flex-col gap-4",
        month: "flex w-full flex-col gap-4",
        nav: "absolute inset-x-0 top-0 flex items-center justify-between",
        button_previous:
          "z-10 inline-flex size-8 items-center justify-center rounded-md border bg-background transition-colors hover:bg-muted aria-disabled:pointer-events-none aria-disabled:opacity-30",
        button_next:
          "z-10 inline-flex size-8 items-center justify-center rounded-md border bg-background transition-colors hover:bg-muted aria-disabled:pointer-events-none aria-disabled:opacity-30",
        month_caption: "flex h-8 items-center justify-center",
        caption_label: "text-sm font-semibold",
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "flex-1 pb-1 text-[0.8rem] font-normal text-muted-foreground",
        week: "mt-1 flex w-full",
        day: "relative aspect-square flex-1 p-0.5 text-center",
        day_button:
          "flex size-full items-center justify-center rounded-md text-sm transition-colors hover:bg-peach focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none disabled:cursor-not-allowed disabled:hover:bg-transparent",
        selected:
          "[&>button]:!bg-primary [&>button]:!text-primary-foreground [&>button]:font-semibold",
        today: "[&>button]:underline [&>button]:underline-offset-4",
        outside: "text-muted-foreground opacity-50",
        disabled: "text-muted-foreground opacity-35",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === "left" ? <ChevronLeft className="size-4" /> : <ChevronRight className="size-4" />,
      }}
      {...props}
    />
  );
}
