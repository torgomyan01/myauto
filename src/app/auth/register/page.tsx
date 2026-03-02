import MainTemplate from '@/components/layout/main-template/MainTemplate';
import RegisterForm from '@/components/auth/register-form/RegisterForm';

export default function RegisterPage() {
  return (
    <MainTemplate>
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12">
        <RegisterForm />
      </div>
    </MainTemplate>
  );
}
