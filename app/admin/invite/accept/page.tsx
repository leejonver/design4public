// Design4Public CMS - 초대 수락 (비밀번호 설정) 페이지

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Callout, Card, Field, Spinner, Text, TextInput } from '@vapor-ui/core';
import { LockOutlineIcon } from '@vapor-ui/icons';
import { supabase } from '@/lib/supabase/browser';

const PASSWORD_RE = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

type Phase = 'verifying' | 'ready' | 'invalid' | 'saving';

export default function InviteAcceptPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('verifying');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirm?: string }>({});

  // The invite link carries the session in the URL fragment; @supabase/ssr's
  // detectSessionInUrl consumes it on mount. If it instead delivered a
  // token_hash query param, verify it explicitly. Either path ends with an
  // authenticated (still 'pending') session that can set a password.
  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        if (active) setPhase('ready');
        return;
      }
      const url = new URL(window.location.href);
      const tokenHash = url.searchParams.get('token_hash');
      if (tokenHash) {
        const { error: vErr } = await supabase.auth.verifyOtp({ type: 'invite', token_hash: tokenHash });
        if (!vErr && active) {
          setPhase('ready');
          return;
        }
      }
      // ConfirmationURL delivers the session in the URL fragment. The @supabase/ssr
      // PKCE client does not auto-consume implicit-flow hash tokens, so establish the
      // session explicitly.
      const hash = new URLSearchParams(window.location.hash.slice(1));
      const accessToken = hash.get('access_token');
      const refreshToken = hash.get('refresh_token');
      if (accessToken && refreshToken) {
        const { error: sErr } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (!sErr && active) {
          setPhase('ready');
          return;
        }
      }
      if (active) setPhase('invalid');
    })();
    return () => {
      active = false;
    };
  }, []);

  const validate = () => {
    const next: { password?: string; confirm?: string } = {};
    if (!password) next.password = '비밀번호를 입력해주세요.';
    else if (password.length < 8) next.password = '비밀번호는 8자 이상이어야 합니다.';
    else if (!PASSWORD_RE.test(password))
      next.password = '비밀번호는 영문, 숫자, 특수문자를 포함해야 합니다.';
    if (!confirm) next.confirm = '비밀번호 확인을 입력해주세요.';
    else if (password !== confirm) next.confirm = '비밀번호가 일치하지 않습니다.';
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    setError(null);
    if (!validate()) return;
    setPhase('saving');
    try {
      const { error: updErr } = await supabase.auth.updateUser({ password });
      if (updErr) throw new Error('비밀번호 설정에 실패했습니다.');
      const res = await fetch('/api/admin/invite/accept', { method: 'POST' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.success) throw new Error(body.error || '가입 처리에 실패했습니다.');
      router.push('/admin/projects');
    } catch (e) {
      setError(e instanceof Error ? e.message : '오류가 발생했습니다.');
      setPhase('ready');
    }
  };

  if (phase === 'verifying') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 p-6">
        <Spinner size="lg" />
      </div>
    );
  }

  if (phase === 'invalid') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 p-6">
        <Card.Root className="w-full max-w-[450px] rounded-xl shadow-2xl">
          <Card.Body className="p-10 text-center">
            <Text typography="heading3" render={<h2 />} className="text-gray-900">
              유효하지 않은 초대 링크
            </Text>
            <Text typography="body1" render={<p />} className="mt-4 text-gray-500">
              초대 링크가 만료되었거나 이미 사용되었습니다. 관리자에게 재전송을 요청해 주세요.
            </Text>
            <Link href="/admin/login" className="mt-8 inline-block text-v-primary-100 hover:underline">
              로그인 페이지로 이동
            </Link>
          </Card.Body>
        </Card.Root>
      </div>
    );
  }

  const saving = phase === 'saving';

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 p-6">
      <Card.Root className="w-full max-w-[450px] rounded-xl shadow-2xl">
        <Card.Body className="p-10">
          <div className="mb-8 text-center">
            <Text typography="heading2" render={<h1 />} className="text-v-primary-100">
              Design4Public
            </Text>
            <Text typography="body1" render={<p />} className="mt-2 text-gray-500">
              초대를 수락하고 비밀번호를 설정하세요
            </Text>
          </div>

          {error ? (
            <Callout.Root colorPalette="danger" className="mb-6">
              {error}
            </Callout.Root>
          ) : null}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            className="space-y-4"
            noValidate
          >
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
              {fieldErrors.password ? <Field.Error match>{fieldErrors.password}</Field.Error> : null}
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
                  value={confirm}
                  onValueChange={setConfirm}
                  placeholder="비밀번호 확인"
                  autoComplete="new-password"
                  size="lg"
                  className="pl-9"
                />
              </div>
              {fieldErrors.confirm ? <Field.Error match>{fieldErrors.confirm}</Field.Error> : null}
            </Field.Root>

            <Button type="submit" colorPalette="primary" size="lg" disabled={saving} className="w-full">
              {saving ? <Spinner size="md" /> : null}
              {saving ? '처리 중...' : '가입 완료'}
            </Button>
          </form>
        </Card.Body>
      </Card.Root>
    </div>
  );
}
