import { ArrowRight, Sparkles } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { loginSchema } from '@shared/schemas'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/field'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { ApiError, getErrorMessage } from '@/lib/api-client'
import { zodFieldErrors, type FieldErrors } from '@/lib/form'
import { DEMO_CREDENTIALS, useLogin } from './api'
import { AuthLayout } from './auth-layout'
import { FormAlert } from './form-alert'
import { PasswordInput } from './password-input'
import { safeRedirect } from './safe-redirect'

export function LoginPage() {
  useDocumentTitle('Iniciar sesión')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const login = useLogin()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [usingDemo, setUsingDemo] = useState(false)

  const signIn = (credentials: { email: string; password: string }, demo = false) => {
    setFormError(null)
    setUsingDemo(demo)
    login.mutate(credentials, {
      onSuccess: () => navigate(safeRedirect(searchParams.get('redirect')), { replace: true }),
      onError: (error) => {
        if (demo && error instanceof ApiError && error.status === 401) {
          setFormError('La cuenta demo no está disponible. Ejecuta database/demo.sql en tu base de datos.')
          return
        }
        setFormError(getErrorMessage(error))
      },
    })
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const result = loginSchema.safeParse({ email, password })
    if (!result.success) {
      setErrors(zodFieldErrors(result.error))
      return
    }
    setErrors({})
    signIn(result.data)
  }

  return (
    <AuthLayout title="Bienvenido de nuevo" subtitle="Accede para seguir diseñando tus almacenes.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <FormAlert message={formError} />
        <Field label="Email" error={errors.email}>
          {(field) => (
            <Input
              {...field}
              type="email"
              autoComplete="email"
              placeholder="nombre@empresa.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoFocus
            />
          )}
        </Field>
        <Field label="Contraseña" error={errors.password}>
          {(field) => (
            <PasswordInput
              {...field}
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          )}
        </Field>
        <Button type="submit" variant="primary" size="lg" className="mt-2" loading={login.isPending && !usingDemo}>
          Iniciar sesión
          <ArrowRight />
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />o<span className="h-px flex-1 bg-slate-200" />
      </div>

      <Button
        variant="secondary"
        size="lg"
        className="w-full"
        onClick={() => signIn(DEMO_CREDENTIALS, true)}
        loading={login.isPending && usingDemo}
        disabled={login.isPending}
      >
        <Sparkles className="text-brand-600" />
        Explorar con la cuenta demo
      </Button>

      <p className="mt-8 text-center text-sm text-slate-500">
        ¿No tienes cuenta?{' '}
        <Link to="/register" className="font-medium text-brand-600 hover:text-brand-700 hover:underline">
          Crear cuenta
        </Link>
      </p>
    </AuthLayout>
  )
}
