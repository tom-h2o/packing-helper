import { useState, useMemo } from "react"
import { Popover as PopoverPrimitive } from "@base-ui/react/popover"
import { countries, getFlagEmoji, type Country } from "@/lib/countries"
import { Input } from "./input"
import { cn } from "@/lib/utils"
import { ChevronsUpDown, Check } from "lucide-react"

interface CountryComboboxProps {
  value: string
  onChange: (code: string) => void
  className?: string
}

function CountryCombobox({ value, onChange, className }: CountryComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    if (!search) return countries
    const q = search.toLowerCase()
    return countries.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    )
  }, [search])

  const selected = countries.find((c) => c.code === value)

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger
        className={cn(
          "flex h-12 w-full items-center justify-between rounded-2xl border-2 border-input bg-transparent px-5 text-base font-semibold transition-colors hover:border-ring/50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 cursor-pointer",
          !selected && "text-muted-foreground",
          className
        )}
      >
        {selected ? (
          <span className="flex items-center gap-3">
            <span className="text-2xl leading-none">{getFlagEmoji(selected.code)}</span>
            <span>{selected.name}</span>
          </span>
        ) : (
          <span>Select a country...</span>
        )}
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Positioner sideOffset={8} style={{ width: "var(--anchor-width)" }}>
          <PopoverPrimitive.Popup className="z-50 rounded-2xl border bg-popover shadow-2xl shadow-primary/10 animate-in fade-in-0 zoom-in-95 overflow-hidden">
            <div className="p-3 border-b">
              <Input
                placeholder="Search countries..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 rounded-xl"
                autoComplete="off"
                autoFocus
              />
            </div>
            <div className="max-h-[300px] overflow-y-auto p-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full">
              {filtered.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  No countries found.
                </div>
              ) : (
                filtered.map((country) => (
                  <CountryOption
                    key={country.code}
                    country={country}
                    isSelected={value === country.code}
                    onSelect={() => {
                      onChange(country.code)
                      setSearch("")
                      setOpen(false)
                    }}
                  />
                ))
              )}
            </div>
          </PopoverPrimitive.Popup>
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}

function CountryOption({
  country,
  isSelected,
  onSelect,
}: {
  country: Country
  isSelected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer",
        isSelected
          ? "bg-primary/10 text-primary"
          : "hover:bg-muted/80 text-foreground"
      )}
    >
      <span className="text-lg leading-none">{getFlagEmoji(country.code)}</span>
      <span className="flex-1 text-left">{country.name}</span>
      {isSelected && <Check className="h-4 w-4 text-primary" />}
    </button>
  )
}

export { CountryCombobox }
