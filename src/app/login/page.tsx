// Design4Public CMS - 로그인 페이지

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Callout, Card, Field, Spinner, Text, TextInput } from '@vapor-ui/core';
import { LockOutlineIcon, MailOutlineIcon } from '@vapor-ui/icons';
import { useAuth } from '@/contexts/AuthContext';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const next: { email?: string; password?: string } = {};
    if (!email) next.email = '이메일을 입력해주세요.';
    else if (!EMAIL_RE.test(email)) next.email = '올바른 이메일 형식을 입력해주세요.';
    if (!password) next.password = '비밀번호를 입력해주세요.';
    else if (password.length < 6) next.password = '비밀번호는 6자 이상이어야 합니다.';
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    setError(null);
    if (!validate()) return;

    setLoading(true);
    try {
      await login(email, password);
      router.push('/projects');
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 p-5">
      <Card.Root className="w-full max-w-[400px] rounded-xl shadow-2xl">
        <Card.Body className="p-10">
          {/* 로고 및 타이틀 */}
          <div className="mb-8 text-center">
            <Text typography="heading2" render={<h1 />} className="text-v-primary-100">
              Design4Public
            </Text>
            <Text typography="body1" render={<p />} className="mt-2 text-gray-500">
              콘텐츠관리자 로그인
            </Text>
          </div>

          {/* 에러 메시지 */}
          {error ? (
            <Callout.Root colorPalette="danger" className="mb-6">
              {error}
            </Callout.Root>
          ) : null}

          {/* 로그인 폼 */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            className="space-y-4"
            noValidate
          >
            <Field.Root>
              <Field.Label>이메일</Field.Label>
              <div className="relative">
                <MailOutlineIcon
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-gray-400"
                />
                <TextInput
                  type="email"
                  value={email}
                  onValueChange={setEmail}
                  placeholder="이메일 주소"
                  autoComplete="email"
                  size="lg"
                  className="pl-9"
                />
              </div>
              {fieldErrors.email ? (
                <Text typography="body3" render={<p />} className="mt-1 text-red-600">
                  {fieldErrors.email}
                </Text>
              ) : null}
            </Field.Root>

            <Field.Root>
              <Field.Label>비밀번호</Field.Label>
              <div className="relative">
                <LockOutlineIcon
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-gray-400"
                />
                <TextInput
                  type="password"
                  value={password}
                  onValueChange={setPassword}
                  placeholder="비밀번호"
                  autoComplete="current-password"
                  size="lg"
                  className="pl-9"
                />
              </div>
              {fieldErrors.password ? (
                <Text typography="body3" render={<p />} className="mt-1 text-red-600">
                  {fieldErrors.password}
                </Text>
              ) : null}
            </Field.Root>

            <Button
              type="submit"
              colorPalette="primary"
              size="lg"
              disabled={loading}
              className="w-full"
            >
              {loading ? <Spinner size="md" /> : null}
              {loading ? '로그인 중...' : '로그인'}
            </Button>
          </form>

          {/* 회원가입 링크 */}
          <div className="mt-6 text-center">
            <Text typography="body2" render={<span />} className="text-gray-500">
              계정이 없으신가요?{' '}
            </Text>
            <Link href="/signup" className="text-v-primary-100 hover:underline">
              회원가입
            </Link>
          </div>
        </Card.Body>
      </Card.Root>
    </div>
  );
}
