import { useState } from "react"
import { format } from "date-fns"
import type { DateRange } from "react-day-picker"
import { Popover as PopoverPrimitive } from "@base-ui/react/popover"
import { Calendar } from "./calendar"
import { Button } from "./button"
import { CalendarDays } from "lucide-react"
import { cn } from "@/lib/utils"

interface DateRangePickerProps {
  value: DateRange | undefined
  onChange: (range: DateRange | undefined) => void
  className?: string
}

function DateRangePicker({ value, onChange, className }: DateRangePickerProps) {
  const [open, setOpen] = useState(false)

  const label =
    value?.from && value?.to
      ? `${format(value.from, "MMM d, yyyy")} – ${format(value.to, "MMM d, yyyy")}`
      : value?.from
        ? `${format(value.from, "MMM d, yyyy")} – select end`
        : "Pick your dates"

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger
        render={
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-semibold h-12 rounded-2xl border-2 px-5 text-base",
              !value?.from && "text-muted-foreground",
              className
            )}
          />
        }
      >
        <CalendarDays className="mr-3 h-5 w-5 opacity-60" />
        {label}
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Positioner sideOffset={8}>
          <PopoverPrimitive.Popup className="z-50 rounded-2xl border bg-popover p-0 shadow-2xl shadow-primary/10 animate-in fade-in-0 zoom-in-95">
            <Calendar
              mode="range"
              selected={value}
              onSelect={(range) => {
                onChange(range)
                if (range?.from && range?.to) setOpen(false)
              }}
              numberOfMonths={2}
              className="p-4"
            />
          </PopoverPrimitive.Popup>
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}

export { DateRangePicker }
