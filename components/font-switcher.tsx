'use client'

import { Type } from 'lucide-react'
import { useFont, type Font } from './font-provider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function FontSwitcher() {
  const { font, setFont } = useFont()

  return (
    <Select value={font} onValueChange={(value) => setFont(value as Font)}>
      <SelectTrigger className="bg-secondary/30 ring-offset-background hover:bg-secondary/50 focus:ring-primary/20 h-9 w-[150px] focus:ring-1">
        <div className="flex w-full items-center gap-2 overflow-hidden">
          <Type className="text-muted-foreground h-4 w-4 shrink-0" />
          <div className="flex-1 truncate text-left">
            <SelectValue placeholder="Font" />
          </div>
        </div>
      </SelectTrigger>
      <SelectContent
        position="popper"
        align="end"
        className="z-[10000] max-h-[300px] min-w-[200px]"
      >
        <div className="text-muted-foreground px-2 py-1.5 text-xs font-semibold">Sans Serif</div>
        <SelectItem value="font-sans" className="font-sans">
          Geist Sans
        </SelectItem>
        <SelectItem value="font-inter" className="font-inter">
          Inter
        </SelectItem>
        <SelectItem value="font-roboto" className="font-roboto">
          Roboto
        </SelectItem>
        <SelectItem value="font-open-sans" className="font-open-sans">
          Open Sans
        </SelectItem>
        <SelectItem value="font-poppins" className="font-poppins">
          Poppins
        </SelectItem>
        <SelectItem value="font-montserrat" className="font-montserrat">
          Montserrat
        </SelectItem>

        <div className="text-muted-foreground mt-1 border-t px-2 py-1.5 text-xs font-semibold">
          Serif
        </div>
        <SelectItem value="font-serif" className="font-serif text-base">
          EB Garamond
        </SelectItem>
        <SelectItem value="font-lora" className="font-lora text-base">
          Lora
        </SelectItem>
        <SelectItem value="font-playfair" className="font-playfair text-base">
          Playfair Display
        </SelectItem>

        <div className="text-muted-foreground mt-1 border-t px-2 py-1.5 text-xs font-semibold">
          Others
        </div>
        <SelectItem value="font-oswald" className="font-oswald text-xs uppercase">
          Oswald
        </SelectItem>
        <SelectItem value="font-mono" className="font-mono text-xs">
          Geist Mono
        </SelectItem>
      </SelectContent>
    </Select>
  )
}
