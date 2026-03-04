import { AppSidebar } from '@/components/app-sidebar'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler'

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="bg-background sticky top-0 flex h-14 shrink-0 items-center justify-between gap-2 border-b px-4 lg:hidden">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <span className="text-sm font-semibold">DevToolkit</span>
          </div>
          <AnimatedThemeToggler />
        </header>
        <header className="bg-background sticky top-0 hidden h-14 shrink-0 items-center justify-end border-b px-6 lg:flex">
          <AnimatedThemeToggler />
        </header>
        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">{children}</div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
