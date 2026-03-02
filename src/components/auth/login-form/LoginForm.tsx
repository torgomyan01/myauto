'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/constants/routes';

interface FormState {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

export default function LoginForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({ email: '', password: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!form.email.trim()) {
      newErrors.email = 'Введите электронную почту';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Неверный формат почты';
    }
    if (!form.password) {
      newErrors.password = 'Введите пароль';
    } else if (form.password.length < 6) {
      newErrors.password = 'Минимум 6 символов';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    try {
      // TODO: replace with real API call
      await new Promise((res) => setTimeout(res, 1000));
      router.push(ROUTES.HOME);
    } catch {
      setErrors({ general: 'Неверный логин или пароль' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[480px] bg-white rounded-2xl shadow-sm px-10 py-10 shadow-xl">
      <h1 className="text-2xl font-semibold text-center text-gray-900 mb-7">
        Вход
      </h1>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        {/* Email */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-[#E21321] font-medium">
            Имя пользователя
          </label>
          <input
            type="email"
            placeholder="Электронная почта"
            value={form.email}
            onChange={(e) => handleChange('email', e.target.value)}
            className={`
              w-full h-[52px] px-4 rounded-xl border text-sm outline-none transition-colors bg-white
              ${
                errors.email
                  ? 'border-[#E21321] focus:border-[#E21321]'
                  : 'border-gray-200 focus:border-gray-400'
              }
            `}
          />
          {errors.email && (
            <span className="text-xs text-[#E21321]">{errors.email}</span>
          )}
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-700 font-medium">Пароль</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Пароль"
              value={form.password}
              onChange={(e) => handleChange('password', e.target.value)}
              className={`
                w-full h-[52px] px-4 pr-11 rounded-xl border text-sm outline-none transition-colors bg-white
                ${
                  errors.password
                    ? 'border-[#E21321] focus:border-[#E21321]'
                    : 'border-gray-200 focus:border-gray-400'
                }
              `}
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <i
                className={
                  showPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'
                }
              />
            </button>
          </div>
          {errors.password && (
            <span className="text-xs text-[#E21321]">{errors.password}</span>
          )}
          <div className="flex justify-end">
            <Link
              href={ROUTES.FORGOT_PASSWORD}
              className="text-xs text-[#E21321] hover:underline"
            >
              Забыли пароль?
            </Link>
          </div>
        </div>

        {/* General error */}
        {errors.general && (
          <span className="text-sm text-[#E21321] text-center">
            {errors.general}
          </span>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-[52px] bg-[#E21321] hover:bg-[#c41020] disabled:opacity-60 text-white font-bold rounded-xl text-base transition-colors mt-1 flex items-center justify-center gap-2"
        >
          {loading ? (
            <i className="fa-solid fa-spinner animate-spin" />
          ) : (
            'Войти'
          )}
        </button>
      </form>

      {/* Register link */}
      <p className="text-sm text-center text-gray-600 mt-5">
        Нет аккаунта?{' '}
        <Link
          href={ROUTES.REGISTER}
          className="text-[#E21321] font-medium hover:underline"
        >
          Регистрация
        </Link>
      </p>
    </div>
  );
}
