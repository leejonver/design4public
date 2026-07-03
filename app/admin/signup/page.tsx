// Design4Public CMS - 회원가입 페이지

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Callout, Card, Field, Spinner, Text, TextInput } from '@vapor-ui/core';
import {
  CheckCircleOutlineIcon,
  LockOutlineIcon,
  MailOutlineIcon,
  UserOutlineIcon,
} from '@vapor-ui/icons';
import { useAuth } from '@/components/admin/AuthContext';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_RE = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const validate = () => {
    const next: FieldErrors = {};
    if (!name) next.name = '이름을 입력해주세요.';
    else if (name.length < 2) next.name = '이름은 2자 이상이어야 합니다.';
    else if (name.length > 20) next.name = '이름은 20자 이하이어야 합니다.';

    if (!email) next.email = '이메일을 입력해주세요.';
    else if (!EMAIL_RE.test(email)) next.email = '올바른 이메일 형식을 입력해주세요.';

    if (!password) next.password = '비밀번호를 입력해주세요.';
    else if (password.length < 8) next.password = '비밀번호는 8자 이상이어야 합니다.';
    else if (!PASSWORD_RE.test(password))
      next.password = '비밀번호는 영문, 숫자, 특수문자를 포함해야 합니다.';

    if (!confirmPassword) next.confirmPassword = '비밀번호 확인을 입력해주세요.';
    else if (password !== confirmPassword)
      next.confirmPassword = '비밀번호가 일치하지 않습니다.';

    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    setError(null);
    if (!validate()) return;

    setLoading(true);
    try {
      await signup(name, email, password);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '회원가입 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 p-6">
        <Card.Root className="w-full max-w-[500px] rounded-xl shadow-2xl">
          <Card.Body className="p-10 text-center">
            <CheckCircleOutlineIcon size={56} className="mx-auto text-green-500" />
            <Text typography="heading3" render={<h2 />} className="mt-4 text-gray-900">
              회원가입이 완료되었습니다!
            </Text>
            <Text typography="body1" render={<p />} className="mt-4 text-gray-500">
              이메일 인증 후 관리자 승인이 필요합니다. 승인 완료 후 로그인이 가능합니다.
            </Text>
            <Button
              colorPalette="primary"
              size="lg"
              onClick={() => router.push('/admin/login')}
              className="mt-8 w-full"
            >
              로그인 페이지로 이동
            </Button>
          </Card.Body>
        </Card.Root>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 p-6">
      <Card.Root className="w-full max-w-[450px] rounded-xl shadow-2xl">
        <Card.Body className="p-10">
          {/* 로고 및 타이틀 */}
          <div className="mb-8 text-center">
            <Text typography="heading2" render={<h1 />} className="text-v-primary-100">
              Design4Public
            </Text>
            <Text typography="body1" render={<p />} className="mt-2 text-gray-500">
              콘텐츠관리자 회원가입
            </Text>
          </div>

          {/* 에러 메시지 */}
          {error ? (
            <Callout.Root colorPalette="danger" className="mb-6">
              {error}
            </Callout.Root>
          ) : null}

          {/* 회원가입 폼 */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            className="space-y-4"
            noValidate
          >
            <Field.Root>
              <Field.Label>이름</Field.Label>
              <div className="relative">
                <UserOutlineIcon
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-gray-400"
                />
                <TextInput
                  type="text"
                  value={name}
                  onValueChange={setName}
                  placeholder="관리자 이름"
                  autoComplete="name"
                  maxLength={20}
                  size="lg"
                  className="pl-9"
                />
              </div>
              {fieldErrors.name ? (
                <Field.Error match>{fieldErrors.name}</Field.Error>
              ) : null}
            </Field.Root>

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
                <Field.Error match>{fieldErrors.email}</Field.Error>
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
                  placeholder="비밀번호 (최소 8자)"
                  autoComplete="new-password"
                  size="lg"
                  className="pl-9"
                />
              </div>
              {fieldErrors.password ? (
                <Field.Error match>{fieldErrors.password}</Field.Error>
              ) : null}
            </Field.Root>

            <Field.Root>
              <Field.Label>비밀번호 확인</Field.Label>
              <div className="relative">
                <LockOutlineIcon
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-gray-400"
                />
                <TextInput
                  type="password"
                  value={confirmPassword}
                  onValueChange={setConfirmPassword}
                  placeholder="비밀번호 확인"
                  autoComplete="new-password"
                  size="lg"
                  className="pl-9"
                />
              </div>
              {fieldErrors.confirmPassword ? (
                <Field.Error match>{fieldErrors.confirmPassword}</Field.Error>
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
              {loading ? '회원가입 중...' : '회원가입'}
            </Button>
          </form>

          {/* 로그인 링크 */}
          <div className="mt-6 text-center">
            <Text typography="body2" render={<span />} className="text-gray-500">
              이미 계정이 있으신가요?{' '}
            </Text>
            <Link href="/admin/login" className="text-v-primary-100 hover:underline">
              로그인
            </Link>
          </div>
        </Card.Body>
      </Card.Root>
    </div>
  );
}
