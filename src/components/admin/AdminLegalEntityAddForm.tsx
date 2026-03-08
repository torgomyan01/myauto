'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Button,
} from '@heroui/react';
import { uploadImage } from '@/app/actions/uploads';
import {
  createLegalEntityByAdmin,
  searchUsersForLegalEntity,
} from '@/app/actions/admin/verifications';
import type { UserOption } from '@/app/actions/admin/verifications';

interface AdminLegalEntityAddFormProps {
  users: UserOption[];
}

export default function AdminLegalEntityAddForm({ users: _initialUsers }: AdminLegalEntityAddFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState<UserOption[]>([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);

  const loadUsers = useCallback(async (query: string = '') => {
    setUserSearchLoading(true);
    const list = await searchUsersForLegalEntity(query, query ? 20 : 10);
    setUserSearchResults(list);
    setUserSearchLoading(false);
  }, []);

  useEffect(() => {
    if (userModalOpen) {
      setUserSearchQuery('');
      loadUsers('');
    }
  }, [userModalOpen, loadUsers]);

  useEffect(() => {
    if (!userModalOpen) return;
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      loadUsers(userSearchQuery);
      searchTimeoutRef.current = null;
    }, 300);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [userSearchQuery, userModalOpen, loadUsers]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Загрузите изображение (JPG, PNG)');
      return;
    }
    setReceiptFile(file);
    setError(null);
    const reader = new FileReader();
    reader.onload = () => setReceiptPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleRemoveReceipt = () => {
    setReceiptFile(null);
    setReceiptPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const userId = selectedUser?.id ?? Number(formData.get('userId'));
    const companyName = (formData.get('companyName') as string)?.trim() ?? '';
    const taxId = (formData.get('taxId') as string)?.trim() ?? '';
    const legalAddress = (formData.get('legalAddress') as string)?.trim() ?? '';
    const approveImmediately = formData.get('approveImmediately') === 'on';

    if (!userId) {
      setError('Выберите пользователя');
      setLoading(false);
      return;
    }

    let paymentProofPath: string | null = null;
    if (receiptFile) {
      const uploadFormData = new FormData();
      uploadFormData.set('file', receiptFile);
      const uploadResult = await uploadImage(uploadFormData);
      if (!uploadResult.ok) {
        setError(uploadResult.error);
        setLoading(false);
        return;
      }
      paymentProofPath = uploadResult.path;
    }

    const result = await createLegalEntityByAdmin({
      userId,
      companyName,
      taxId,
      legalAddress,
      paymentProofPath,
      approveImmediately,
    });

    setLoading(false);
    if (result.ok) {
      setSuccess(approveImmediately ? 'Ир. лицо добавлено и подтверждено' : 'Ир. лицо добавлено на проверку');
      form.reset();
      setSelectedUser(null);
      setReceiptFile(null);
      setReceiptPreview(null);
      handleRemoveReceipt();
      router.refresh();
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="max-w-xl rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-zinc-800 mb-4">Добавить ир. лицо</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
        )}
        {success && (
          <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">{success}</div>
        )}

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Пользователь *</label>
          <input type="hidden" name="userId" value={selectedUser?.id ?? ''} />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setUserModalOpen(true)}
              className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-left text-zinc-800 hover:bg-zinc-50"
            >
              {selectedUser
                ? `${selectedUser.name} (${selectedUser.email})`
                : '— Выберите пользователя —'}
            </button>
            {selectedUser && (
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100"
              >
                Сбросить
              </button>
            )}
          </div>

          <Modal isOpen={userModalOpen} onClose={() => setUserModalOpen(false)} size="md">
            <ModalContent>
              <ModalHeader>Выбор пользователя</ModalHeader>
              <ModalBody>
                <input
                  type="text"
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  placeholder="Поиск по имени или email..."
                  className="mb-4 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-800"
                />
                <div className="max-h-64 overflow-y-auto rounded-lg border border-zinc-200">
                  {userSearchLoading ? (
                    <p className="px-4 py-6 text-center text-sm text-zinc-500">Загрузка…</p>
                  ) : userSearchResults.length === 0 ? (
                    <p className="px-4 py-6 text-center text-sm text-zinc-500">Ничего не найдено</p>
                  ) : (
                    <ul className="divide-y divide-zinc-100">
                      {userSearchResults.map((u) => (
                        <li key={u.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedUser(u);
                              setUserModalOpen(false);
                            }}
                            className="w-full px-4 py-3 text-left text-sm hover:bg-zinc-50"
                          >
                            <span className="font-medium text-zinc-800">{u.name}</span>
                            <span className="ml-2 text-zinc-500">{u.email}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <p className="mt-2 text-xs text-zinc-500">
                  {userSearchQuery ? 'Результаты поиска' : 'Последние 10 пользователей'}
                </p>
              </ModalBody>
            </ModalContent>
          </Modal>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Организация *</label>
          <input
            name="companyName"
            type="text"
            required
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-800"
            placeholder="ООО «Пример»"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">ИНН *</label>
          <input
            name="taxId"
            type="text"
            required
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-800"
            placeholder="1234567890"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Юр. адрес *</label>
          <textarea
            name="legalAddress"
            required
            rows={3}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-800"
            placeholder="Город, улица, дом"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Чек (необязательно)</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-100 file:px-4 file:py-2 file:text-sm"
          />
          {receiptPreview && (
            <div className="mt-2 flex items-start gap-2">
              <img
                src={receiptPreview}
                alt="Чек"
                className="max-h-32 rounded-lg border border-zinc-200 object-contain"
              />
              <button
                type="button"
                onClick={handleRemoveReceipt}
                className="rounded-lg border border-zinc-300 px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100"
              >
                Удалить
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <input
            id="approveImmediately"
            name="approveImmediately"
            type="checkbox"
            className="h-4 w-4 rounded border-zinc-300"
          />
          <label htmlFor="approveImmediately" className="text-sm text-zinc-700">
            Подтвердить сразу (дать право добавлять запчасти)
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Сохранение…' : 'Сохранить'}
        </button>
      </form>
    </div>
  );
}
