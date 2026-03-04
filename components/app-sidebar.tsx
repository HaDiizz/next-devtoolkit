'use client'

import * as React from 'react'
import { ChevronRight, Terminal, Search, X, Star } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { tools, categories } from '@/lib/tools'
import { Label } from '@/components/ui/label'
import { useFavorites } from '@/hooks/use-favorites'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarGroupContent,
  SidebarInput,
} from '@/components/ui/sidebar'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const [searchQuery, setSearchQuery] = React.useState('')

  const { favorites } = useFavorites()

  const filteredTools = React.useMemo(() => {
    if (!searchQuery.trim()) return tools
    const lower = searchQuery.toLowerCase()
    return tools.filter(
      (t) => t.name.toLowerCase().includes(lower) || t.description.toLowerCase().includes(lower),
    )
  }, [searchQuery])

  const favoriteTools = React.useMemo(() => {
    return filteredTools.filter((t) => favorites.includes(t.id))
  }, [filteredTools, favorites])

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Terminal className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold tracking-tight">DevToolkit</span>
                  <span className="text-muted-foreground text-xs">Utilities</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <form onSubmit={(e: React.FormEvent) => e.preventDefault()}>
          <SidebarGroup className="py-0">
            <SidebarGroupContent className="relative">
              <Label htmlFor="search" className="sr-only">
                Search
              </Label>
              <SidebarInput
                id="search"
                placeholder="Search tools..."
                className="pr-8 pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 opacity-50 select-none" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-1/2 right-2 -translate-y-1/2 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:pointer-events-none"
                >
                  <X className="size-4" />
                  <span className="sr-only">Clear</span>
                </button>
              )}
            </SidebarGroupContent>
          </SidebarGroup>
        </form>
      </SidebarHeader>
      <SidebarContent>
        {favoriteTools.length > 0 && (
          <SidebarGroup>
            <SidebarMenu>
              <SidebarMenuItem>
                <div className="text-muted-foreground flex items-center px-2 py-1.5 text-xs font-semibold tracking-wider uppercase">
                  <Star className="mr-2 h-3 w-3 fill-yellow-500 text-yellow-500" />
                  Favorites
                </div>
                <SidebarMenuSub className="ml-0 border-none px-0">
                  {favoriteTools.map((tool) => {
                    const isActive = pathname === `/tools/${tool.id}`
                    return (
                      <SidebarMenuSubItem key={tool.id}>
                        <SidebarMenuSubButton asChild isActive={isActive}>
                          <Link href={`/tools/${tool.id}`}>
                            <tool.icon className="mr-2 h-4 w-4 shrink-0" />
                            <span>{tool.name}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    )
                  })}
                </SidebarMenuSub>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        )}
        <SidebarGroup>
          <SidebarMenu>
            {categories.map((category) => {
              const categoryTools = filteredTools.filter((t) => t.category === category)
              if (categoryTools.length === 0) return null

              return (
                <Collapsible key={category} defaultOpen className="group/collapsible">
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton>
                        <span className="font-medium">{category}</span>
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {categoryTools.map((tool) => {
                          const isActive = pathname === `/tools/${tool.id}`
                          return (
                            <SidebarMenuSubItem key={tool.id}>
                              <SidebarMenuSubButton asChild isActive={isActive}>
                                <Link href={`/tools/${tool.id}`}>
                                  <tool.icon className="mr-2 h-4 w-4 shrink-0" />
                                  <span>{tool.name}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          )
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
