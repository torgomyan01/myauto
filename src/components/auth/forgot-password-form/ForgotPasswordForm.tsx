'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ROUTES } from '@/constants/routes';

interface FormErrors {
  identifier?: string;
  general?: string;
}

export default function ForgotPasswordForm() {
  const [identifier, setIdentifier] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!identifier.trim()) {
      newErrors.identifier = 'Введите имя пользователя или электронную почту';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    try {
      // TODO: replace with real API call
      await new Promise((res) => setTimeout(res, 1000));
      setSuccess(true);
    } catch {
      setErrors({ general: 'Произошла ошибка. Попробуйте снова.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[520px] bg-white rounded-2xl shadow-xl px-10 py-10">
      <h1 className="text-2xl font-semibold text-center text-gray-900 mb-7">
        Восстановление доступа
      </h1>

      {success ? (
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#FFC857] flex items-center justify-center border-white border-[6px] shadow-xl">
            <i className="fa-solid fa-check text-white text-xl" />
          </div>

          <p className="text-lg font-bold text-gray-900 text-center">
            Письмо отправлено.
          </p>

          <p className="text-sm text-gray-700 text-center leading-relaxed">
            Оно содержит ссылку, при переходе по которой ваш пароль будет
            сброшен. Заметьте, вы сможете запросить новый пароль только через 2
            часов.
          </p>

          <p className="text-sm text-gray-400 text-center mt-1">
            Если вы не получили письмо{' '}
            <button
              type="button"
              onClick={() => {
                setSuccess(false);
                setIdentifier('');
              }}
              className="text-[#E21321] underline hover:no-underline"
            >
              попробуйте снова.
            </button>
          </p>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex flex-col gap-5"
        >
          <div className="flex flex-col gap-1">
            <label className="text-sm text-[#E21321] font-medium">
              Имя пользователя или электронная почта
            </label>
            <input
              type="text"
              placeholder="Имя пользователя-"
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value);
                if (errors.identifier)
                  setErrors((prev) => ({ ...prev, identifier: undefined }));
              }}
              className={`w-full h-[52px] px-4 rounded-xl border text-sm outline-none transition-colors bg-white ${
                errors.identifier
                  ? 'border-[#E21321] focus:border-[#E21321]'
                  : 'border-gray-200 focus:border-gray-400'
              }`}
            />
            {errors.identifier && (
              <span className="text-xs text-[#E21321]">
                {errors.identifier}
              </span>
            )}
          </div>

          {errors.general && (
            <span className="text-sm text-[#E21321] text-center">
              {errors.general}
            </span>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-[52px] bg-[#E21321] hover:bg-[#c41020] disabled:opacity-60 text-white font-bold rounded-xl text-base transition-colors mt-1 flex items-center justify-center gap-2"
          >
            {loading ? (
              <i className="fa-solid fa-spinner animate-spin" />
            ) : (
              'Сбросить пароль'
            )}
          </button>
        </form>
      )}

      {!success && (
        <p className="text-sm text-center text-gray-600 mt-5">
          Вспомнили пароль?{' '}
          <Link
            href={ROUTES.LOGIN}
            className="text-[#E21321] font-medium hover:underline"
          >
            Войти
          </Link>
        </p>
      )}
    </div>
  );
}
