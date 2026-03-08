'use server';

import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function register(data: {
  email: string;
  password: string;
  name: string;
  phone: string;
}): Promise<void> {
  const { email, password, name, phone } = data;

  if (!email || !password || !name || !phone) {
    throw new Error('Заполните все обязательные поля');
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Неверный формат почты');
  }

  if (!/^\d{8}$/.test(phone.replace(/\s/g, ''))) {
    throw new Error('Введите корректный номер телефона');
  }

  if (password.length < 6) {
    throw new Error('Пароль должен быть минимум 6 символов');
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error('Пользователь с таким email уже существует');
  }

  const hashed = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      email,
      name,
      phone,
      password: hashed,
      updatedAt: new Date(),
    },
  });
}

export async function forgotPassword(identifier: string): Promise<void> {
  if (!identifier?.trim()) {
    throw new Error('Укажите email или имя пользователя');
  }

  // TODO: реализовать отправку письма со ссылкой на сброс пароля
}
