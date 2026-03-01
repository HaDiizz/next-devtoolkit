import Link from 'next/link'
import { tools, categories } from '@/lib/tools'
import { Terminal, ArrowRight, Zap, Lock, Globe } from 'lucide-react'

function ToolCard({ tool }: { tool: (typeof tools)[0] }) {
  return (
    <Link
      href={`/tools/${tool.id}`}
      className="group border-border bg-card hover:border-primary/40 hover:bg-card/80 flex flex-col rounded-xl border p-5 transition-all"
    >
      <div className="bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground mb-4 flex h-10 w-10 items-center justify-center rounded-lg transition-colors">
        <tool.icon className="h-5 w-5" />
      </div>
      <h3 className="text-foreground mb-1.5 text-sm font-semibold">{tool.name}</h3>
      <p className="text-muted-foreground flex-1 text-xs leading-relaxed">{tool.description}</p>
      <div className="text-primary mt-4 flex items-center gap-1 text-xs font-medium opacity-0 transition-opacity group-hover:opacity-100">
        Open tool
        <ArrowRight className="h-3 w-3" />
      </div>
    </Link>
  )
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}) {
  return (
    <div className="border-border bg-card flex items-start gap-4 rounded-xl border p-5">
      <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h4 className="text-foreground text-sm font-semibold">{title}</h4>
        <p className="text-muted-foreground mt-1 text-xs leading-relaxed">{description}</p>
      </div>
    </div>
  )
}

export default function HomePage() {
  return (
    <div className="bg-background min-h-screen">
      {/* Hero */}
      <header className="border-border border-b">
        <div className="mx-auto flex max-w-6xl flex-col items-center px-6 py-20 text-center lg:py-28">
          <div className="bg-primary text-primary-foreground mb-6 flex h-16 w-16 items-center justify-center rounded-2xl">
            <Terminal className="h-8 w-8" />
          </div>
          <h1 className="text-foreground text-4xl font-bold tracking-tight text-balance lg:text-5xl">
            Developer Toolkit
          </h1>
          <p className="text-muted-foreground mt-4 max-w-xl text-base leading-relaxed text-pretty lg:text-lg">
            A comprehensive collection of 24+ developer utilities and SDK tools. Generate IDs, hash
            passwords, decode JWTs, compare JSON, test regex, and more.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/tools/uuid-generator"
              className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-colors"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#tools"
              className="border-border bg-secondary text-secondary-foreground hover:bg-secondary/80 inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-medium transition-colors"
            >
              Browse Tools
            </a>
          </div>
        </div>
      </header>

      {/* Features */}
      <section className="border-border border-b py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <FeatureCard
              icon={Zap}
              title="Instant Results"
              description="All tools run entirely in the browser with zero server latency. No data ever leaves your machine."
            />
            <FeatureCard
              icon={Lock}
              title="Privacy First"
              description="Nothing is stored or tracked. Your data stays in your browser session and is never sent to any server."
            />
            <FeatureCard
              icon={Globe}
              title="Always Available"
              description="Works offline after first load. No sign-up required. Free and open for all developers."
            />
          </div>
        </div>
      </section>

      {/* Tools Grid */}
      <section id="tools" className="py-16">
        <div className="mx-auto max-w-6xl px-6">
          {categories.map((category) => (
            <div key={category} className="mb-12 last:mb-0">
              <h2 className="text-foreground mb-1 text-lg font-bold">{category}</h2>
              <p className="text-muted-foreground mb-6 text-sm">
                {category === 'Generators' &&
                  'Create unique identifiers, passwords, hashes, encryption, secure hashing, and placeholder text'}
                {category === 'Converters' &&
                  'Transform data, images, timestamps, and encodings between formats'}
                {category === 'JSON Tools' && 'Format, convert, compare, and transform JSON data'}
                {category === 'Encode / Decode' &&
                  'Encode, decode, and inspect URLs, JWTs, and more'}
                {category === 'String & Regex' &&
                  'Case conversion, text analysis, and regex pattern testing'}
                {category === 'Date / Time' && 'Parse cron expressions and work with timezones'}
                {category === 'Data' && 'Generate mock data and test IDs'}
              </p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {tools
                  .filter((t) => t.category === category)
                  .map((tool) => (
                    <ToolCard key={tool.id} tool={tool} />
                  ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-border border-t py-8">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <p className="text-muted-foreground text-xs">
            DevToolkit — Built with Next.js & shadcn/ui. All tools run client-side for maximum
            privacy.
          </p>
        </div>
      </footer>
    </div>
  )
}
