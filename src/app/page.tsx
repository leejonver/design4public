// Design4Public CMS - 메인 페이지 (프로젝트 리스트로 리다이렉트)

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Spin } from 'antd';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // 프로젝트 리스트 페이지로 리다이렉트
    router.replace('/projects');
  }, [router]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh'
    }}>
      <Spin size="large" tip="로딩 중..." />
    </div>
  );
}
