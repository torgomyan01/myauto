'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/constants/routes';

interface FormState {
  email: string;
  username: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  email?: string;
  username?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

const PHONE_PREFIX = '+374';

export default function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    email: '',
    username: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const validate = (): boolean => {
    const e: FormErrors = {};

    if (!form.email.trim()) {
      e.email = 'Введите электронную почту';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      e.email = 'Неверный формат почты';
    }

    if (!form.username.trim()) {
      e.username = 'Введите имя пользователя';
    } else if (form.username.trim().length < 2) {
      e.username = 'Минимум 2 символа';
    }

    if (!form.phone.trim()) {
      e.phone = 'Введите номер телефона';
    } else if (!/^\d{8}$/.test(form.phone.replace(/\s/g, ''))) {
      e.phone = 'Введите 8 цифр после +374';
    }

    if (!form.password) {
      e.password = 'Введите пароль';
    } else if (form.password.length < 6) {
      e.password = 'Минимум 6 символов';
    }

    if (!form.confirmPassword) {
      e.confirmPassword = 'Подтвердите пароль';
    } else if (form.password !== form.confirmPassword) {
      e.confirmPassword = 'Пароли не совпадают';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handlePhoneInput = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    handleChange('phone', digits);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    try {
      // TODO: replace with real API call
      await new Promise((res) => setTimeout(res, 1000));
      router.push(ROUTES.LOGIN);
    } catch {
      setErrors({ general: 'Ошибка регистрации. Попробуйте снова.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[520px] bg-white rounded-2xl px-10 py-10 shadow-xl">
      <h1 className="text-2xl font-semibold text-center text-gray-900 mb-7">
        Регистрация
      </h1>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        {/* Email */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-500 font-medium">
            Электронная почта
          </label>
          <input
            type="email"
            placeholder="Электронная почта"
            value={form.email}
            onChange={(e) => handleChange('email', e.target.value)}
            className={`w-full h-[52px] px-4 rounded-xl border text-sm outline-none transition-colors bg-white
              ${errors.email ? 'border-[#E21321]' : 'border-gray-200 focus:border-gray-400'}`}
          />
          {errors.email && (
            <span className="text-xs text-[#E21321]">{errors.email}</span>
          )}
        </div>

        {/* Username */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-500 font-medium">
            Имя пользователя
          </label>
          <input
            type="text"
            placeholder="Имя пользователя"
            value={form.username}
            onChange={(e) => handleChange('username', e.target.value)}
            className={`w-full h-[52px] px-4 rounded-xl border text-sm outline-none transition-colors bg-white
              ${errors.username ? 'border-[#E21321]' : 'border-gray-200 focus:border-gray-400'}`}
          />
          {errors.username && (
            <span className="text-xs text-[#E21321]">{errors.username}</span>
          )}
        </div>

        {/* Phone */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-500 font-medium">Телефон</label>
          <div
            className={`flex items-center h-[52px] rounded-xl border bg-white transition-colors
            ${errors.phone ? 'border-[#E21321]' : 'border-gray-200 focus-within:border-gray-400'}`}
          >
            <div className="flex items-center gap-2 px-4 border-r border-gray-200 h-full shrink-0">
              <i className="fa-solid fa-flag text-[#D90012] text-sm" />
              <span className="text-sm text-gray-500 font-medium">
                {PHONE_PREFIX}
              </span>
            </div>
            <input
              type="tel"
              placeholder="XXXXXXXX"
              value={form.phone}
              onChange={(e) => handlePhoneInput(e.target.value)}
              maxLength={8}
              className="flex-1 h-full px-3 text-sm outline-none bg-transparent rounded-r-xl"
            />
          </div>
          {errors.phone && (
            <span className="text-xs text-[#E21321]">{errors.phone}</span>
          )}
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-500 font-medium">Пароль</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Пароль"
              value={form.password}
              onChange={(e) => handleChange('password', e.target.value)}
              className={`w-full h-[52px] px-4 pr-11 rounded-xl border text-sm outline-none transition-colors bg-white
                ${errors.password ? 'border-[#E21321]' : 'border-gray-200 focus:border-gray-400'}`}
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
        </div>

        {/* Confirm Password */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-500 font-medium">
            Подтвердите пароль
          </label>
          <div className="relative">
            <input
              type={showConfirm ? 'text' : 'password'}
              placeholder="Подтвердите пароль"
              value={form.confirmPassword}
              onChange={(e) => handleChange('confirmPassword', e.target.value)}
              className={`w-full h-[52px] px-4 pr-11 rounded-xl border text-sm outline-none transition-colors bg-white
                ${errors.confirmPassword ? 'border-[#E21321]' : 'border-gray-200 focus:border-gray-400'}`}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <i
                className={
                  showConfirm ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'
                }
              />
            </button>
          </div>
          {errors.confirmPassword && (
            <span className="text-xs text-[#E21321]">
              {errors.confirmPassword}
            </span>
          )}
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
            'Регистрация'
          )}
        </button>
      </form>

      <p className="text-sm text-center text-gray-600 mt-5">
        У вас есть учетная запись?{' '}
        <Link
          href={ROUTES.LOGIN}
          className="text-[#E21321] font-medium hover:underline"
        >
          Войти
        </Link>
      </p>
    </div>
  );
}
