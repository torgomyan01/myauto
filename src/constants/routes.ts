export const ROUTES = {
  HOME: '/',
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  FORGOT_PASSWORD: '/auth/forgot-password',
  PRODUCT: (id: number | string) => `/product/${id}`,
  CART: '/cart',
} as const;
