'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { uploadImage } from '@/app/actions/uploads';
import { submitLegalEntityVerification } from '@/app/actions/legal-entity';
import { ROUTES } from '@/constants/routes';

const AMOUNT = 1000;
const BANK_INFO =
  'Переведите 1000 драм на наш банковский счёт. Реквизиты уточняйте у поддержки.';

export default function LegalEntityVerifyForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<'idle' | 'uploading' | 'done'>('idle');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Загрузите изображение (JPG, PNG)');
      return;
    }
    setReceiptFile(file);
    setError(null);
    setUploadProgress('idle');
    const reader = new FileReader();
    reader.onload = () => setReceiptPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleRemoveReceipt = () => {
    setReceiptFile(null);
    setReceiptPreview(null);
    setUploadProgress('idle');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const companyName = (formData.get('companyName') as string)?.trim() ?? '';
    const taxId = (formData.get('taxId') as string)?.trim() ?? '';
    const legalAddress = (formData.get('legalAddress') as string)?.trim() ?? '';

    if (!receiptFile) {
      setError('Прикрепите чек об оплате');
      setLoading(false);
      return;
    }

    setUploadProgress('uploading');
    const uploadFormData = new FormData();
    uploadFormData.set('file', receiptFile);
    const uploadResult = await uploadImage(uploadFormData);

    if (!uploadResult.ok) {
      setError(uploadResult.error);
      setUploadProgress('idle');
      setLoading(false);
      return;
    }

    setUploadProgress('done');
    const result = await submitLegalEntityVerification({
      companyName,
      taxId,
      legalAddress,
      paymentProofPath: uploadResult.path,
    });

    setLoading(false);
    setUploadProgress('idle');
    if (result.ok) {
      router.push(ROUTES.ADD_PART);
      router.refresh();
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8 mt-10">
      <h1 className="text-xl font-semibold text-zinc-800 mb-1">
        Верификация юридического лица
      </h1>
      <p className="text-zinc-600 text-sm mb-6">
        Чтобы добавлять запчасти, нужно подтвердить статус юридического лица и
        оплатить взнос 1000 драм.
      </p>

      <div className="mb-6 rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
        <p className="font-medium mb-1">Оплата</p>
        <p>{BANK_INFO}</p>
        <p className="mt-2">
          Сумма: <strong>{AMOUNT} драм</strong>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <div>
          <label
            htmlFor="companyName"
            className="block text-sm font-medium text-zinc-700 mb-1"
          >
            Наименование организации *
          </label>
          <input
            id="companyName"
            name="companyName"
            type="text"
            required
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-800"
            placeholder="ООО «Пример»"
          />
        </div>

        <div>
          <label
            htmlFor="taxId"
            className="block text-sm font-medium text-zinc-700 mb-1"
          >
            ИНН / Налоговый номер *
          </label>
          <input
            id="taxId"
            name="taxId"
            type="text"
            required
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-800"
            placeholder="1234567890"
          />
        </div>

        <div>
          <label
            htmlFor="legalAddress"
            className="block text-sm font-medium text-zinc-700 mb-1"
          >
            Юридический адрес *
          </label>
          <textarea
            id="legalAddress"
            name="legalAddress"
            required
            rows={3}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-800"
            placeholder="Город, улица, дом, офис"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">
            Чек об оплате 1000 драм *
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-zinc-800 hover:file:bg-zinc-200"
          />
          {receiptPreview && (
            <div className="mt-2 flex items-start gap-2">
              <img
                src={receiptPreview}
                alt="Чек"
                className="max-h-40 rounded-lg border border-zinc-200 object-contain"
              />
              <div className="flex flex-col gap-1">
                {uploadProgress === 'uploading' && (
                  <span className="text-xs text-zinc-500">Загрузка…</span>
                )}
                <button
                  type="button"
                  onClick={handleRemoveReceipt}
                  disabled={loading}
                  className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 disabled:opacity-50"
                >
                  Удалить
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Отправка…' : 'Отправить на проверку'}
          </button>
          <a
            href={ROUTES.HOME}
            className="rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Отмена
          </a>
        </div>
      </form>
    </div>
  );
}
