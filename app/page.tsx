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
    <div className="group border-border bg-card hover:border-primary/50 flex flex-col items-center gap-6 rounded-2xl border p-8 text-center transition-all hover:-translate-y-2 hover:shadow-2xl">
      <div className="bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground flex h-14 w-14 shrink-0 items-center justify-center rounded-xl transition-colors duration-300">
        <Icon className="h-7 w-7" />
      </div>
      <div>
        <h4 className="text-foreground mb-3 text-lg font-bold">{title}</h4>
        <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  )
}

export default function HomePage() {
  return (
    <div className="bg-background min-h-screen">
      <header className="border-border flex min-h-screen flex-col items-center justify-center border-b">
        <div className="mx-auto flex max-w-6xl flex-col items-center px-6 py-20 text-center lg:py-28">
          <div className="bg-primary text-primary-foreground mb-8 flex h-20 w-20 items-center justify-center rounded-2xl shadow-xl">
            <Terminal className="h-10 w-10" />
          </div>
          <h1 className="text-foreground text-5xl font-extrabold tracking-tight text-balance lg:text-7xl">
            Developer Toolkit
          </h1>
          <p className="text-muted-foreground mt-6 max-w-2xl text-lg leading-relaxed text-pretty lg:text-xl">
            A comprehensive collection of 24+ developer utilities and SDK tools. Generate IDs, hash
            passwords, decode JWTs, compare JSON, test regex, and more.
          </p>
          <div className="mt-12 flex flex-wrap justify-center gap-4">
            <Link
              href="/tools/uuid-generator"
              className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-xl px-8 py-4 text-base font-semibold transition-all hover:scale-105 active:scale-95"
            >
              Get Started
              <ArrowRight className="h-5 w-5" />
            </Link>
            <a
              href="#tools"
              className="border-border bg-secondary text-secondary-foreground hover:bg-secondary/80 inline-flex items-center gap-2 rounded-xl border px-8 py-4 text-base font-semibold transition-all hover:scale-105 active:scale-95"
            >
              Browse Tools
            </a>
          </div>
        </div>
      </header>

      <section className="border-border relative flex min-h-screen items-center overflow-hidden border-b py-24">
        <div className="bg-primary/5 absolute top-1/2 left-1/2 -z-10 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px]" />

        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-16 text-center">
            <h2 className="text-foreground mb-4 text-3xl font-bold tracking-tight lg:text-4xl">
              Powerful tools, built for privacy
            </h2>
            <p className="text-muted-foreground mx-auto max-w-2xl text-base lg:text-lg">
              Our toolkit is designed with the modern developer in mind. Fast, secure, and
              accessible anywhere, ensuring your workflow remains uninterrupted and private.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            <FeatureCard
              icon={Zap}
              title="Instant Results"
              description="All tools run entirely in the browser with zero server latency. No data ever leaves your machine, ensuring maximum speed."
            />
            <FeatureCard
              icon={Lock}
              title="Privacy First"
              description="Nothing is stored or tracked. Your sensitive data stays in your browser session and is never sent to any external server."
            />
            <FeatureCard
              icon={Globe}
              title="Always Available"
              description="Full offline support after the initial load. No sign-up required. Free and open-source for all developers globally."
            />
          </div>
        </div>
      </section>

      <section id="tools" className="flex min-h-screen items-center py-20">
        <div className="mx-auto w-full max-w-6xl px-6">
          {categories.map((category) => (
            <div key={category} className="mb-16 last:mb-0">
              <h2 className="text-foreground mb-2 text-2xl font-bold">{category}</h2>
              <p className="text-muted-foreground mb-8 text-base">
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
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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

      <footer className="border-border border-t py-10">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <p className="text-muted-foreground text-sm">
            DevToolkit — Built with Next.js & shadcn/ui. All tools run client-side for maximum
            privacy.
          </p>
        </div>
      </footer>
    </div>
  )
}
