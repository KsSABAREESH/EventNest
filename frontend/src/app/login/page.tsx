import AuthPanel from '@/components/auth/AuthPanel';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ registered?: string }> }) {
  const params = await searchParams;
  return <AuthPanel mode="login" signupSuccess={params.registered === 'true'} />;
}
