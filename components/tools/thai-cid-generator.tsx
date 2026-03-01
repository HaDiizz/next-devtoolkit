'use client'

import { useState, useCallback } from 'react'
import { CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ToolLayout, OutputBox } from '@/components/tool-layout'

function generateThaiCID(): string {
  const digits: number[] = []
  // First digit 1-8
  digits.push(Math.floor(Math.random() * 8) + 1)
  // Next 11 random digits
  for (let i = 1; i < 12; i++) {
    digits.push(Math.floor(Math.random() * 10))
  }
  // Calculate check digit
  let sum = 0
  for (let i = 0; i < 12; i++) {
    sum += digits[i] * (13 - i)
  }
  const check = (11 - (sum % 11)) % 10
  digits.push(check)
  return digits.join('')
}

function formatCID(cid: string): string {
  // X-XXXX-XXXXX-XX-X
  return `${cid[0]}-${cid.slice(1, 5)}-${cid.slice(5, 10)}-${cid.slice(10, 12)}-${cid[12]}`
}

function validateCID(cid: string): boolean {
  const clean = cid.replace(/\D/g, '')
  if (clean.length !== 13) return false
  const digits = clean.split('').map(Number)
  let sum = 0
  for (let i = 0; i < 12; i++) {
    sum += digits[i] * (13 - i)
  }
  const check = (11 - (sum % 11)) % 10
  return digits[12] === check
}

export default function ThaiCidGeneratorTool() {
  const [count, setCount] = useState(1)
  const [results, setResults] = useState<string[]>([])
  const [validateInput, setValidateInput] = useState('')
  const [validationResult, setValidationResult] = useState<boolean | null>(null)

  const generate = useCallback(() => {
    setResults(Array.from({ length: Math.min(count, 20) }, generateThaiCID))
  }, [count])

  const handleValidate = () => {
    setValidationResult(validateCID(validateInput))
  }

  return (
    <ToolLayout
      title="Thai CID Generator"
      description="Generate valid random Thai Citizen ID numbers for testing purposes"
      icon={CreditCard}
    >
      <div className="border-border bg-card rounded-lg border p-5">
        <h3 className="text-foreground mb-4 text-sm font-semibold">Generate Random CIDs</h3>
        <div className="flex items-end gap-3">
          <div className="w-32">
            <Label htmlFor="cid-count" className="text-muted-foreground text-xs">
              Count (max 20)
            </Label>
            <Input
              id="cid-count"
              type="number"
              min={1}
              max={20}
              value={count}
              onChange={(e) => setCount(Math.max(1, Math.min(20, Number(e.target.value))))}
              className="bg-secondary border-border text-foreground mt-1"
            />
          </div>
          <Button
            onClick={generate}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Generate
          </Button>
        </div>
        {results.length > 0 && (
          <div className="mt-4 flex flex-col gap-2">
            {results.map((cid, i) => (
              <OutputBox
                key={i}
                value={formatCID(cid)}
                label={results.length > 1 ? `#${i + 1}` : undefined}
              />
            ))}
          </div>
        )}
      </div>

      <div className="border-border bg-card rounded-lg border p-5">
        <h3 className="text-foreground mb-4 text-sm font-semibold">Validate CID</h3>
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <Label htmlFor="validate-cid" className="text-muted-foreground text-xs">
              Thai CID (13 digits)
            </Label>
            <Input
              id="validate-cid"
              placeholder="X-XXXX-XXXXX-XX-X"
              value={validateInput}
              onChange={(e) => {
                setValidateInput(e.target.value)
                setValidationResult(null)
              }}
              className="bg-secondary border-border text-foreground mt-1 font-mono"
            />
          </div>
          <Button onClick={handleValidate} variant="secondary">
            Validate
          </Button>
        </div>
        {validationResult !== null && (
          <div
            className={`mt-3 rounded-lg px-4 py-2.5 text-sm font-medium ${validationResult ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}
          >
            {validationResult ? 'Valid Thai CID' : 'Invalid Thai CID'}
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
