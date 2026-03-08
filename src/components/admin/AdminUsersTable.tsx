'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from '@heroui/react';
import type { AdminUserRow } from '@/app/actions/admin/users';
import {
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
  setAdminUserBlocked,
} from '@/app/actions/admin/users';

interface AdminUsersTableProps {
  users: AdminUserRow[];
}

export default function AdminUsersTable({ users: initialUsers }: AdminUsersTableProps) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editUser, setEditUser] = useState<AdminUserRow | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const clearFeedback = () => {
    setError(null);
    setSuccess(null);
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearFeedback();
    setLoading(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const result = await createAdminUser({
      email: formData.get('email') as string,
      name: formData.get('name') as string,
      password: formData.get('password') as string,
      phone: (formData.get('phone') as string) || undefined,
      role: (formData.get('role') as 'USER' | 'ADMIN') || 'USER',
    });
    setLoading(false);
    if (result.ok) {
      setSuccess('Пользователь создан');
      setAddOpen(false);
      form.reset();
      router.refresh();
    } else {
      setError(result.error);
    }
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editUser) return;
    clearFeedback();
    setLoading(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const password = formData.get('newPassword') as string;
    const result = await updateAdminUser(editUser.id, {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: (formData.get('phone') as string) || null,
      role: (formData.get('role') as 'USER' | 'ADMIN') || editUser.role,
      password: password && password.length >= 6 ? password : undefined,
    });
    setLoading(false);
    if (result.ok) {
      setSuccess('Изменения сохранены');
      setEditUser(null);
      router.refresh();
    } else {
      setError(result.error);
    }
  };

  const handleDelete = async (id: number) => {
    clearFeedback();
    setLoading(true);
    const result = await deleteAdminUser(id);
    setLoading(false);
    if (result.ok) {
      setSuccess('Пользователь удалён');
      setDeleteId(null);
      router.refresh();
    } else {
      setError(result.error);
    }
  };

  const handleBlock = async (id: number, blocked: boolean) => {
    clearFeedback();
    setLoading(true);
    const result = await setAdminUserBlocked(id, blocked);
    setLoading(false);
    if (result.ok) {
      setSuccess(blocked ? 'Пользователь заблокирован' : 'Пользователь разблокирован');
      router.refresh();
    } else {
      setError(result.error);
    }
  };

  return (
    <div>
      {(error || success) && (
        <div
          className={`mb-4 rounded-lg px-4 py-3 text-sm ${
            error ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'
          }`}
        >
          {error ?? success}
        </div>
      )}

      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={() => { setAddOpen(true); clearFeedback(); }}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Добавить пользователя
        </button>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-zinc-50 text-zinc-600 text-sm">
            <tr>
              <th className="px-4 py-3 font-medium">ID</th>
              <th className="px-4 py-3 font-medium">Имя</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Телефон</th>
              <th className="px-4 py-3 font-medium">Роль</th>
              <th className="px-4 py-3 font-medium">Статус</th>
              <th className="px-4 py-3 font-medium">Регистрация</th>
              <th className="px-4 py-3 font-medium w-40">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {users.map((u) => (
              <tr
                key={u.id}
                className={`hover:bg-zinc-50/50 ${u.blocked ? 'bg-zinc-50 opacity-75' : ''}`}
              >
                <td className="px-4 py-3 text-zinc-800">{u.id}</td>
                <td className="px-4 py-3 text-zinc-800">{u.name}</td>
                <td className="px-4 py-3 text-zinc-600">{u.email}</td>
                <td className="px-4 py-3 text-zinc-600">{u.phone ?? '—'}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      u.role === 'ADMIN'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-zinc-100 text-zinc-600'
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {u.blocked ? (
                    <span className="text-red-600 text-sm font-medium">Заблокирован</span>
                  ) : (
                    <span className="text-green-600 text-sm">Активен</span>
                  )}
                </td>
                <td className="px-4 py-3 text-zinc-500 text-sm">
                  {new Date(u.createdAt).toISOString().slice(0, 10)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => { setEditUser(u); clearFeedback(); }}
                      className="rounded px-2 py-1 text-sm text-blue-600 hover:bg-blue-50"
                      title="Изменить"
                    >
                      <i className="fa-solid fa-pen" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBlock(u.id, !u.blocked)}
                      disabled={loading}
                      className={`rounded px-2 py-1 text-sm ${u.blocked ? 'text-green-600 hover:bg-green-50' : 'text-amber-600 hover:bg-amber-50'}`}
                      title={u.blocked ? 'Разблокировать' : 'Заблокировать'}
                    >
                      <i className={`fa-solid ${u.blocked ? 'fa-unlock' : 'fa-lock'}`} />
                    </button>
                    <button
                      type="button"
                      onClick={() => { setDeleteId(u.id); clearFeedback(); }}
                      className="rounded px-2 py-1 text-sm text-red-600 hover:bg-red-50"
                      title="Удалить"
                    >
                      <i className="fa-solid fa-trash" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Модальное окно: Добавить */}
      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} size="md">
        <ModalContent>
          <ModalHeader className="text-lg font-semibold text-zinc-800">
            Добавить пользователя
          </ModalHeader>
          <form onSubmit={handleCreate}>
            <ModalBody className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Email *</label>
                <input
                  type="email"
                  name="email"
                  required
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Имя *</label>
                <input
                  type="text"
                  name="name"
                  required
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Пароль *</label>
                <input
                  type="password"
                  name="password"
                  required
                  minLength={6}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Телефон</label>
                <input
                  type="text"
                  name="phone"
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Роль</label>
                <select
                  name="role"
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-800"
                >
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={() => setAddOpen(false)}>
                Отмена
              </Button>
              <Button color="primary" type="submit" isLoading={loading}>
                {loading ? 'Сохранение…' : 'Создать'}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* Модальное окно: Редактировать */}
      <Modal isOpen={!!editUser} onClose={() => setEditUser(null)} size="md" key={editUser?.id ?? 'edit'}>
        <ModalContent>
          <ModalHeader className="text-lg font-semibold text-zinc-800">
            Редактировать пользователя
          </ModalHeader>
          <form onSubmit={handleUpdate}>
            <ModalBody className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Email *</label>
                <input
                  type="email"
                  name="email"
                  required
                  defaultValue={editUser?.email}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Имя *</label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={editUser?.name}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Новый пароль (оставьте пустым, чтобы не менять)</label>
                <input
                  type="password"
                  name="newPassword"
                  minLength={6}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Телефон</label>
                <input
                  type="text"
                  name="phone"
                  defaultValue={editUser?.phone ?? ''}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Роль</label>
                <select
                  name="role"
                  defaultValue={editUser?.role}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-800"
                >
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={() => setEditUser(null)}>
                Отмена
              </Button>
              <Button color="primary" type="submit" isLoading={loading}>
                {loading ? 'Сохранение…' : 'Сохранить'}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* Подтверждение удаления */}
      <Modal isOpen={deleteId !== null} onClose={() => setDeleteId(null)} size="sm">
        <ModalContent>
          <ModalHeader className="text-lg font-semibold text-zinc-800">
            Удалить пользователя?
          </ModalHeader>
          <ModalBody>
            <p className="text-zinc-600 text-sm">
              Это действие нельзя отменить. Все данные пользователя будут удалены.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setDeleteId(null)}>
              Отмена
            </Button>
            <Button
              color="danger"
              onPress={() => deleteId !== null && handleDelete(deleteId)}
              isLoading={loading}
            >
              Удалить
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
