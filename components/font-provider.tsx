'use client'

import * as React from 'react'

export type Font =
  | 'font-sans'
  | 'font-serif'
  | 'font-mono'
  | 'font-inter'
  | 'font-roboto'
  | 'font-playfair'
  | 'font-montserrat'
  | 'font-open-sans'
  | 'font-poppins'
  | 'font-lora'
  | 'font-oswald'

interface FontContextType {
  font: Font
  setFont: (font: Font) => void
}

const FontContext = React.createContext<FontContextType | undefined>(undefined)

export function FontProvider({ children }: { children: React.ReactNode }) {
  const [font, setFontState] = React.useState<Font>('font-sans')
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    const savedFont = localStorage.getItem('font-choice') as Font
    if (
      savedFont &&
      [
        'font-sans',
        'font-serif',
        'font-mono',
        'font-inter',
        'font-roboto',
        'font-playfair',
        'font-montserrat',
        'font-open-sans',
        'font-poppins',
        'font-lora',
        'font-oswald',
      ].includes(savedFont)
    ) {
      setFontState(savedFont)
    }
    setMounted(true)
  }, [])

  const setFont = (newFont: Font) => {
    setFontState(newFont)
    localStorage.setItem('font-choice', newFont)
  }

  return (
    <FontContext.Provider value={{ font, setFont }}>
      <div className={mounted ? font : 'font-sans'}>{children}</div>
    </FontContext.Provider>
  )
}

export const useFont = () => {
  const context = React.useContext(FontContext)
  if (context === undefined) {
    throw new Error('useFont must be used within a FontProvider')
  }
  return context
}
