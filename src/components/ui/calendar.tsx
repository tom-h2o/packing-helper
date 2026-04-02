import { DayPicker } from "react-day-picker"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({ className, classNames, ...props }: CalendarProps) {
  return (
    <DayPicker
      className={cn("p-4", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-4",
        month: "flex flex-col gap-4",
        month_caption: "flex justify-center items-center h-10 relative",
        caption_label: "text-base font-extrabold",
        nav: "flex items-center gap-1 absolute inset-x-0 justify-between px-1",
        button_previous: "size-9 rounded-xl bg-muted/60 hover:bg-muted flex items-center justify-center transition-colors",
        button_next: "size-9 rounded-xl bg-muted/60 hover:bg-muted flex items-center justify-center transition-colors",
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "text-muted-foreground text-xs font-bold uppercase w-10 h-8 flex items-center justify-center",
        week: "flex mt-1",
        day: "relative p-0 text-center",
        day_button: "size-10 rounded-xl text-sm font-semibold transition-all hover:bg-primary/10 hover:text-primary focus-visible:ring-2 focus-visible:ring-ring inline-flex items-center justify-center cursor-pointer",
        selected: "!bg-primary !text-primary-foreground hover:!bg-primary/90 shadow-lg shadow-primary/30",
        today: "bg-accent text-accent-foreground font-extrabold",
        outside: "text-muted-foreground/40",
        disabled: "text-muted-foreground/30 cursor-not-allowed",
        range_start: "rounded-r-none",
        range_end: "rounded-l-none",
        range_middle: "!bg-primary/15 !text-primary rounded-none",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === "left" ? (
            <ChevronLeft className="size-4" />
          ) : (
            <ChevronRight className="size-4" />
          ),
      }}
      {...props}
    />
  )
}

export { Calendar }
export type { CalendarProps }
