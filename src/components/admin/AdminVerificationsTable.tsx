'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from '@heroui/react';
import type { VerificationRow } from '@/app/actions/admin/verifications';
import {
  approveVerification,
  rejectVerification,
  blockUserAndVerification,
} from '@/app/actions/admin/verifications';

interface AdminVerificationsTableProps {
  list: VerificationRow[];
  showOnly?: 'verify' | 'all' | 'both';
}

export default function AdminVerificationsTable({
  list,
  showOnly = 'both',
}: AdminVerificationsTableProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [blockId, setBlockId] = useState<number | null>(null);
  const [blockReason, setBlockReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleApprove = async (id: number) => {
    setError(null);
    setSuccess(null);
    setLoading(true);
    const result = await approveVerification(id);
    setLoading(false);
    if (result.ok) {
      setSuccess('Пользователь верифицирован');
      router.refresh();
    } else {
      setError(result.error);
    }
  };

  const handleReject = async () => {
    if (rejectId === null) return;
    setError(null);
    setLoading(true);
    const result = await rejectVerification(
      rejectId,
      rejectReason.trim() || 'Отклонено'
    );
    setLoading(false);
    if (result.ok) {
      setSuccess('Заявка отклонена');
      setRejectId(null);
      setRejectReason('');
      router.refresh();
    } else {
      setError(result.error);
    }
  };

  const handleBlock = async () => {
    if (blockId === null) return;
    setError(null);
    setLoading(true);
    const result = await blockUserAndVerification(
      blockId,
      blockReason.trim() || 'Пользователь заблокирован администратором'
    );
    setLoading(false);
    if (result.ok) {
      setSuccess('Пользователь заблокирован и заявка отклонена');
      setBlockId(null);
      setBlockReason('');
      router.refresh();
    } else {
      setError(result.error);
    }
  };

  const pending = list.filter((v) => v.status === 'PENDING');
  const showVerify = showOnly === 'verify' || showOnly === 'both';
  const showAll = showOnly === 'all' || showOnly === 'both';

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

      {showVerify && pending.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-medium text-zinc-800 mb-3">
            Ожидают проверки
          </h2>
          <div className="space-y-4">
            {pending.map((v) => (
              <div
                key={v.id}
                className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium text-zinc-500">
                      Пользователь
                    </p>
                    <p className="text-zinc-800">
                      {v.userName} ({v.userEmail})
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-zinc-500">
                      Организация
                    </p>
                    <p className="text-zinc-800">{v.companyName}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-zinc-500">ИНН</p>
                    <p className="text-zinc-800">{v.taxId}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-zinc-500">
                      Юр. адрес
                    </p>
                    <p className="text-zinc-800 text-sm">{v.legalAddress}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-xs font-medium text-zinc-500 mb-1">
                      Чек об оплате
                    </p>
                    {v.paymentProofPath || v.paymentProofData ? (
                      <img
                        src={v.paymentProofPath || v.paymentProofData || ''}
                        alt="Чек"
                        className="max-h-48 rounded-lg border border-zinc-200 object-contain"
                      />
                    ) : (
                      <span className="text-zinc-500 text-sm">—</span>
                    )}
                  </div>
                </div>
                <p className="mt-2 text-xs text-zinc-500">
                  Подано: {new Date(v.submittedAt).toISOString().slice(0, 10)}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    color="primary"
                    size="sm"
                    onPress={() => handleApprove(v.id)}
                    isLoading={loading}
                  >
                    Подтвердить
                  </Button>
                  <Button
                    color="danger"
                    variant="flat"
                    size="sm"
                    onPress={() => {
                      setRejectId(v.id);
                      setRejectReason('');
                    }}
                  >
                    Сообщить об ошибке
                  </Button>
                  <Button
                    color="danger"
                    size="sm"
                    variant="bordered"
                    onPress={() => {
                      setBlockId(v.id);
                      setBlockReason('');
                    }}
                  >
                    Заблокировать
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showVerify && pending.length === 0 && showOnly === 'verify' && (
        <p className="rounded-xl border border-zinc-200 bg-white px-4 py-8 text-center text-zinc-500">
          Нет заявок на проверку
        </p>
      )}

      {showAll && (
        <div>
          <h2 className="text-lg font-medium text-zinc-800 mb-3">
            {showOnly === 'all' ? 'Все ир. лица' : 'Все заявки'}
          </h2>
          <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 text-zinc-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Пользователь</th>
                  <th className="px-4 py-3 font-medium">Организация</th>
                  <th className="px-4 py-3 font-medium">ИНН</th>
                  <th className="px-4 py-3 font-medium">Статус</th>
                  <th className="px-4 py-3 font-medium">Дата</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {list.map((v) => (
                  <tr key={v.id} className="hover:bg-zinc-50/50">
                    <td className="px-4 py-3 text-zinc-800">
                      {v.userName}
                      <br />
                      <span className="text-zinc-500 text-xs">
                        {v.userEmail}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-800">{v.companyName}</td>
                    <td className="px-4 py-3 text-zinc-600">{v.taxId}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          v.status === 'APPROVED'
                            ? 'bg-green-100 text-green-800'
                            : v.status === 'REJECTED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {v.status === 'PENDING'
                          ? 'Ожидает'
                          : v.status === 'APPROVED'
                            ? 'Подтверждено'
                            : 'Отклонено'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-500">
                      {new Date(v.submittedAt).toISOString().slice(0, 10)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {list.length === 0 && (
              <p className="px-4 py-8 text-center text-zinc-500">Нет заявок</p>
            )}
          </div>
        </div>
      )}

      <Modal
        isOpen={rejectId !== null}
        onClose={() => setRejectId(null)}
        size="sm"
      >
        <ModalContent>
          <ModalHeader>Сообщить об ошибке в заявке</ModalHeader>
          <ModalBody>
            <label className="block text-sm text-zinc-700 mb-1">
              Причина (увидит пользователь в уведомлении)
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-800"
              placeholder="Например: некорректный ИНН или неполные реквизиты"
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setRejectId(null)}>
              Отмена
            </Button>
            <Button color="danger" onPress={handleReject} isLoading={loading}>
              Отправить уведомление
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal
        isOpen={blockId !== null}
        onClose={() => setBlockId(null)}
        size="sm"
      >
        <ModalContent>
          <ModalHeader>Заблокировать пользователя</ModalHeader>
          <ModalBody>
            <p className="text-sm text-zinc-600 mb-2">
              Пользователь не сможет войти в аккаунт до разблокировки.
            </p>
            <label className="block text-sm text-zinc-700 mb-1">
              Причина блокировки (увидит пользователь)
            </label>
            <textarea
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-800"
              placeholder="Например: мошенническая активность или поддельные документы"
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setBlockId(null)}>
              Отмена
            </Button>
            <Button color="danger" onPress={handleBlock} isLoading={loading}>
              Заблокировать
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
