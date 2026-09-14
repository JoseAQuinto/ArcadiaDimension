import { Link, NavLink } from 'react-router'
import { Logo } from '@/components/brand/logo'
import { cn } from '@/lib/cn'
import { UserMenu } from './user-menu'

export function AppHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4 sm:px-6">
        <Link to="/" className="rounded-lg focus-visible:ring-4 focus-visible:ring-brand-500/30 focus-visible:outline-none">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-1 sm:flex" aria-label="Principal">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              cn(
                'rounded-md px-3 py-1.5 text-[13px] font-medium transition',
                isActive ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-900',
              )
            }
          >
            Almacenes
          </NavLink>
        </nav>
        <div className="ml-auto">
          <UserMenu />
        </div>
      </div>
    </header>
  )
}
