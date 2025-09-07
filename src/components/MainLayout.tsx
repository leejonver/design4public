// Design4Public CMS - 메인 레이아웃 컴포넌트
// 모든 페이지에서 공통으로 사용되는 레이아웃
// 좌측 사이드바 + 우측 메인 콘텐츠 영역으로 구성

'use client';

import { ReactNode } from 'react';
import { Layout } from 'antd';
import Sidebar from './Sidebar';

const { Content } = Layout;

/**
 * 메인 레이아웃 컴포넌트 Props
 * @interface MainLayoutProps
 * @property {ReactNode} children - 메인 콘텐츠 영역에 렌더링될 자식 컴포넌트
 */
interface MainLayoutProps {
  children: ReactNode;
}

/**
 * 메인 레이아웃 컴포넌트
 * 
 * 특징:
 * - 좌측 고정 사이드바 (너비: 280px)
 * - 우측 메인 콘텐츠 영역
 * - 반응형 디자인 지원
 * - 일관된 패딩 및 배경색 적용
 * 
 * 사용법:
 * ```tsx
 * <MainLayout>
 *   <YourPageContent />
 * </MainLayout>
 * ```
 * 
 * @param {MainLayoutProps} props - 컴포넌트 props
 * @returns {JSX.Element} 메인 레이아웃 JSX
 */
export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* 좌측 고정 사이드바 - 네비게이션 메뉴 포함 */}
      <Sidebar />
      
      {/* 우측 메인 콘텐츠 영역 */}
      <Layout style={{ 
        marginLeft: 280 // 사이드바 너비만큼 여백 설정
      }}>
        <Content 
          style={{
            padding: '24px', // 외부 패딩
            backgroundColor: '#f5f5f5', // 배경색 (연한 회색)
            minHeight: '100vh' // 최소 높이 설정
          }}
        >
          {/* 실제 페이지 콘텐츠가 렌더링되는 컨테이너 */}
          <div style={{
            padding: '24px', // 내부 패딩
            backgroundColor: '#fff', // 흰색 배경
            borderRadius: '8px', // 모서리 둥글게
            minHeight: 'calc(100vh - 48px)' // 패딩을 제외한 최소 높이
          }}>
            {children}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
