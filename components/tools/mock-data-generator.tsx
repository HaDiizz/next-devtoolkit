'use client'

import { useState, useCallback } from 'react'
import { UserRound, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { ToolLayout, OutputArea } from '@/components/tool-layout'

const firstNames = [
  'James',
  'Emma',
  'Liam',
  'Olivia',
  'Noah',
  'Ava',
  'Ethan',
  'Sophia',
  'Mason',
  'Isabella',
  'Lucas',
  'Mia',
  'Oliver',
  'Charlotte',
  'Aiden',
  'Harper',
  'Elijah',
  'Amelia',
  'Logan',
  'Evelyn',
]
const lastNames = [
  'Smith',
  'Johnson',
  'Williams',
  'Brown',
  'Jones',
  'Garcia',
  'Miller',
  'Davis',
  'Rodriguez',
  'Martinez',
  'Hernandez',
  'Lopez',
  'Gonzalez',
  'Wilson',
  'Anderson',
  'Thomas',
  'Taylor',
  'Moore',
  'Jackson',
  'Martin',
]
const domains = [
  'gmail.com',
  'yahoo.com',
  'outlook.com',
  'protonmail.com',
  'icloud.com',
  'example.com',
]
const streets = [
  'Main St',
  'Oak Ave',
  'Cedar Ln',
  'Elm St',
  'Pine Rd',
  'Maple Dr',
  'Washington Blvd',
  'Park Ave',
  'Lake St',
  'Hill Rd',
]
const cities = [
  'New York',
  'Los Angeles',
  'Chicago',
  'Houston',
  'Phoenix',
  'Philadelphia',
  'San Antonio',
  'San Diego',
  'Dallas',
  'San Jose',
  'Austin',
  'Jacksonville',
]
const states = ['CA', 'TX', 'FL', 'NY', 'PA', 'IL', 'OH', 'GA', 'NC', 'MI']
const jobs = [
  'Software Engineer',
  'Product Manager',
  'Designer',
  'Data Scientist',
  'DevOps Engineer',
  'Frontend Developer',
  'Backend Developer',
  'QA Engineer',
  'Project Manager',
  'CTO',
]
const companies = [
  'Acme Corp',
  'TechFlow',
  'DataVerse',
  'CloudNine',
  'PixelPerfect',
  'CodeCraft',
  'Innovatech',
  'NexGen',
  'ByteWorks',
  'DigitalEdge',
]

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function generateUser() {
  const first = pick(firstNames)
  const last = pick(lastNames)
  const email = `${first.toLowerCase()}.${last.toLowerCase()}${randomInt(1, 999)}@${pick(domains)}`
  return {
    id: crypto.randomUUID(),
    firstName: first,
    lastName: last,
    email,
    phone: `+1-${randomInt(200, 999)}-${randomInt(100, 999)}-${randomInt(1000, 9999)}`,
    age: randomInt(18, 65),
    job: pick(jobs),
    company: pick(companies),
    address: {
      street: `${randomInt(100, 9999)} ${pick(streets)}`,
      city: pick(cities),
      state: pick(states),
      zip: String(randomInt(10000, 99999)),
      country: 'US',
    },
    avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${first}+${last}`,
    createdAt: new Date(Date.now() - randomInt(0, 365 * 24 * 60 * 60 * 1000)).toISOString(),
  }
}

export default function MockDataGeneratorTool() {
  const [count, setCount] = useState(3)
  const [output, setOutput] = useState('')

  const generate = useCallback(() => {
    const users = Array.from({ length: Math.min(count, 50) }, generateUser)
    setOutput(JSON.stringify(count === 1 ? users[0] : users, null, 2))
  }, [count])

  return (
    <ToolLayout
      title="Mock Data Generator"
      description="Generate random user profiles with realistic data as JSON"
      icon={UserRound}
    >
      <div className="flex items-end gap-3">
        <div className="w-32">
          <Label htmlFor="mock-count" className="text-muted-foreground text-xs">
            Count (max 50)
          </Label>
          <Input
            id="mock-count"
            type="number"
            min={1}
            max={50}
            value={count}
            onChange={(e) => setCount(Math.max(1, Math.min(50, Number(e.target.value))))}
            className="bg-secondary border-border text-foreground mt-1"
          />
        </div>
        <Button
          onClick={generate}
          className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Generate
        </Button>
      </div>

      {output && <OutputArea label="Generated JSON" value={output} rows={16} />}
    </ToolLayout>
  )
}
