type ExperienceItem = {
  company: string
  role: string
  period: string
  location: string
  achievements: string[]
}

export type Highlight = {
  label: string
  value: number
  suffix?: string
  source: string
}

const numberRegex = /(\d+[\d,.]*)(\s*[mkMK\+%])?/g

function parseValue(raw: string, unit?: string | null): number {
  const clean = Number(String(raw).replace(/[,]/g, ''))
  if (!unit) return clean
  const u = unit.trim().toLowerCase()
  if (u.startsWith('m')) return clean * 1_000_000
  if (u.startsWith('k')) return clean * 1_000
  return clean
}

function humanizeSuffix(unit?: string | null): string | undefined {
  if (!unit) return undefined
  const u = unit.trim().toLowerCase()
  if (u.startsWith('m')) return 'M'
  if (u.startsWith('k')) return 'K'
  if (u.includes('%')) return '%'
  if (u.includes('+')) return '+'
  return undefined
}

export function extractHighlights(experience: ExperienceItem[]): Highlight[] {
  const results: Highlight[] = []
  for (const job of experience) {
    for (const a of job.achievements) {
      const matches = [...a.matchAll(numberRegex)]
      for (const m of matches) {
        const raw = m[1]
        const unit = m[2] || ''
        const value = parseValue(raw, unit)
        const suffix = humanizeSuffix(unit)
        // Create a label based on keywords
        let label = 'Impact'
        const lower = a.toLowerCase()
        if (lower.includes('users')) label = 'Users served'
        else if (lower.includes('latency') || lower.includes('rate')) label = 'Performance'
        else if (lower.includes('load') || lower.includes('traffic')) label = 'Scale'
        else if (lower.includes('donation') || lower.includes('remittance')) label = 'Transactions'
        results.push({ label, value, suffix, source: a })
      }
    }
  }
  // Deduplicate by label keeping the max value
  const byLabel = new Map<string, Highlight>()
  for (const h of results) {
    const existing = byLabel.get(h.label)
    if (!existing || h.value > existing.value) byLabel.set(h.label, h)
  }
  return Array.from(byLabel.values()).slice(0, 6)
}


