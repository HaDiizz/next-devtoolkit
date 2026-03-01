'use client'

import { useCallback } from 'react'
import { toast } from 'sonner'

export function useCopyToClipboard() {
  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Copied to clipboard')
    } catch {
      toast.error('Failed to copy')
    }
  }, [])

  return copy
}
