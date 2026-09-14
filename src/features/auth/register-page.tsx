import { ArrowRight } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { registerSchema } from '@shared/schemas'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/field'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { getErrorMessage } from '@/lib/api-client'
import { apiFieldErrors, zodFieldErrors, type FieldErrors } from '@/lib/form'
import { useRegister } from './api'
import { AuthLayout } from './auth-layout'
import { FormAlert } from './form-alert'
import { PasswordInput } from './password-input'

export function RegisterPage() {
  useDocumentTitle('Crear cuenta')
  const navigate = useNavigate()
  const register = useRegister()

  const [values, setValues] = useState({ name: '', email: '', password: '' })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)

  const update = (field: keyof typeof values) => (event: { target: { value: string } }) =>
    setValues((current) => ({ ...current, [field]: event.target.value }))

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setFormError(null)
    const result = registerSchema.safeParse(values)
    if (!result.success) {
      setErrors(zodFieldErrors(result.error))
      return
    }
    setErrors({})
    register.mutate(result.data, {
      onSuccess: () => navigate('/', { replace: true }),
      onError: (error) => {
        const fieldErrors = apiFieldErrors(error)
        if (Object.keys(fieldErrors).length > 0) setErrors(fieldErrors)
        else setFormError(getErrorMessage(error))
      },
    })
  }

  return (
    <AuthLayout title="Crea tu cuenta" subtitle="Empieza a diseñar almacenes en menos de un minuto.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <FormAlert message={formError} />
        <Field label="Nombre" error={errors.name}>
          {(field) => (
            <Input
              {...field}
              autoComplete="name"
              placeholder="Ana García"
              value={values.name}
              onChange={update('name')}
              autoFocus
            />
          )}
        </Field>
        <Field label="Email" error={errors.email}>
          {(field) => (
            <Input
              {...field}
              type="email"
              autoComplete="email"
              placeholder="nombre@empresa.com"
              value={values.email}
              onChange={update('email')}
            />
          )}
        </Field>
        <Field label="Contraseña" error={errors.password} hint="Mínimo 8 caracteres">
          {(field) => (
            <PasswordInput
              {...field}
              autoComplete="new-password"
              placeholder="••••••••"
              value={values.password}
              onChange={update('password')}
            />
          )}
        </Field>
        <Button type="submit" variant="primary" size="lg" className="mt-2" loading={register.isPending}>
          Crear cuenta
          <ArrowRight />
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-slate-500">
        ¿Ya tienes cuenta?{' '}
        <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700 hover:underline">
          Iniciar sesión
        </Link>
      </p>
    </AuthLayout>
  )
}
