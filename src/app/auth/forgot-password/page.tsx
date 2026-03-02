import MainTemplate from '@/components/layout/main-template/MainTemplate';
import ForgotPasswordForm from '@/components/auth/forgot-password-form/ForgotPasswordForm';

export default function ForgotPasswordPage() {
  return (
    <MainTemplate>
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12">
        <ForgotPasswordForm />
      </div>
    </MainTemplate>
  );
}
