import { ChevronDown, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useCurrentUser, useLogout } from '@/features/auth/api'
import { cn } from '@/lib/cn'

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

export function UserMenu({ compact = false }: { compact?: boolean }) {
  const user = useCurrentUser()
  const logout = useLogout()
  const navigate = useNavigate()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          'flex items-center gap-2 rounded-lg p-1 text-left transition outline-none hover:bg-slate-100 focus-visible:ring-4 focus-visible:ring-brand-500/30 data-[state=open]:bg-slate-100',
          !compact && 'pr-2',
        )}
        aria-label="Menú de usuario"
      >
        <span className="flex size-7 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-700 text-[11px] font-semibold text-white">
          {initialsOf(user.name)}
        </span>
        {!compact && (
          <>
            <span className="hidden max-w-32 truncate text-[13px] font-medium text-slate-700 sm:block">{user.name}</span>
            <ChevronDown className="size-3.5 text-slate-400" />
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-60">
        <DropdownMenuLabel>
          <p className="truncate text-sm font-medium text-slate-900">{user.name}</p>
          <p className="truncate text-xs text-slate-500">{user.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          icon={<LogOut />}
          onSelect={() => logout.mutate(undefined, { onSettled: () => navigate('/login', { replace: true }) })}
        >
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
