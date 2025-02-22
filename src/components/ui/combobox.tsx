import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "~components/lib/utils"
import { Button } from "~components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "~components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~components/ui/popover"

interface ComboBoxProps {
  items: any[]
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  labelField?: string
  valueField?: string
}

export function ComboBox({ 
  items, 
  value, 
  onChange, 
  placeholder = "Select item...",
  disabled = false,
  labelField = "label",
  valueField = "value"
}: ComboBoxProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {value
            ? items.find((item) => item[valueField] === value)?.[labelField] || value
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder={placeholder} />
          <CommandEmpty>No item found.</CommandEmpty>
          <CommandGroup>
            {items.map((item) => (
              <CommandItem
                key={item[valueField]}
                value={item[valueField]}
                onSelect={(currentValue) => {
                  onChange(currentValue)
                  setOpen(false)
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === item[valueField] ? "opacity-100" : "opacity-0"
                  )}
                />
                {item[labelField]}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
} 