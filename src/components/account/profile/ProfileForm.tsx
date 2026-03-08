'use client';

import { useState } from 'react';
import { addToast } from '@heroui/toast';
import { updateProfile } from '@/app/actions/user';

export interface ProfileData {
  email: string;
  name: string;
  phone: string | null;
}

interface ProfileFormProps {
  initialData: ProfileData;
}

export default function ProfileForm({ initialData }: ProfileFormProps) {
  const [form, setForm] = useState<ProfileData>(initialData);
  const [loading, setLoading] = useState(false);

  const handleChange = (field: keyof ProfileData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile({
        name: form.name,
        phone: form.phone ?? '',
      });
      addToast({
        title: 'Данные сохранены',
        description: 'Ваши личные данные успешно обновлены.',
        color: 'success',
      });
    } catch (error) {
      addToast({
        title: 'Ошибка',
        description:
          error instanceof Error
            ? error.message
            : 'Не удалось сохранить изменения. Попробуйте снова.',
        color: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl bg-white rounded-3xl px-10 py-10 shadow-xl flex flex-col gap-8 mt-10">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">
            Личные данные
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Управляйте информацией аккаунта и контактными данными.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#E21321]/5 flex items-center justify-center">
            <span className="text-lg font-semibold text-[#E21321]">
              {form.name?.charAt(0).toUpperCase() ||
                form.email.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="hidden sm:flex flex-col text-sm">
            <span className="font-medium text-gray-900">{form.name}</span>
            <span className="text-gray-500">{form.email}</span>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8"
      >
        <div className="flex flex-col gap-1 md:col-span-2">
          <label className="text-sm text-gray-500 font-medium">
            Электронная почта
          </label>
          <input
            type="email"
            value={form.email}
            disabled
            className="w-full h-[50px] px-4 rounded-xl border text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-500 font-medium">
            Имя пользователя
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className="w-full h-[50px] px-4 rounded-xl border text-sm outline-none transition-colors bg-white border-gray-200 focus:border-gray-400"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-500 font-medium">Телефон</label>
          <input
            type="tel"
            value={form.phone ?? ''}
            onChange={(e) => handleChange('phone', e.target.value)}
            className="w-full h-[50px] px-4 rounded-xl border text-sm outline-none transition-colors bg-white border-gray-200 focus:border-gray-400"
          />
        </div>

        <div className="md:col-span-2 flex justify-end pt-2">
          <button
            type="submit"
            disabled={loading}
            className="min-w-[220px] h-[50px] bg-[#E21321] hover:bg-[#c41020] disabled:opacity-60 text-white font-bold rounded-xl text-base transition-colors"
          >
            {loading ? 'Сохранение...' : 'Сохранить изменения'}
          </button>
        </div>
      </form>
    </div>
  );
}
