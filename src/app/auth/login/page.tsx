import MainTemplate from '@/components/layout/main-template/MainTemplate';
import LoginForm from '@/components/auth/login-form/LoginForm';

export default function LoginPage() {
  return (
    <MainTemplate>
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12">
        <LoginForm />
      </div>
    </MainTemplate>
  );
}
