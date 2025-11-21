import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MapPin, Menu } from 'lucide-react'

export function Navigation() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <MapPin className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-semibold">LocalPath</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link href="/browse" className="text-sm font-medium hover:text-primary transition-colors">
            Browse Tours
          </Link>
          <Link href="/become-guide" className="text-sm font-medium hover:text-primary transition-colors">
            Become a Guide
          </Link>
          <Link href="#how-it-works" className="text-sm font-medium hover:text-primary transition-colors">
            How It Works
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="hidden md:flex">
            Sign In
          </Button>
          <Button size="sm">Get Started</Button>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}
