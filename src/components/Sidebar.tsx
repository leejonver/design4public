// Design4Public CMS - 사이드바 컴포넌트
// 좌측 네비게이션 메뉴 및 사용자 정보를 표시
// 내비게이션, 배지 카운트, 사용자 프로필 기능 포함

'use client';

import { Layout, Menu, Avatar, Typography, Badge, Button, Space } from 'antd';
import {
  ProjectOutlined,
  AppstoreOutlined,
  ShopOutlined,
  TagsOutlined,
  UserOutlined,
  LogoutOutlined
} from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import type { MenuProps } from 'antd';

const { Sider } = Layout;
const { Text, Title } = Typography;

/**
 * 사이드바 컴포넌트 Props
 * @interface SidebarProps
 * @property {function} [onNavigate] - 외부 네비게이션 핸들러 (옵션)
 * @property {boolean} [collapsed] - 사이드바 접기 상태 (기본: false)
 * @property {object} [counts] - 각 메뉴별 데이터 개수
 */
interface SidebarProps {
  onNavigate?: (url: string) => void;
  collapsed?: boolean;
  counts?: {
    projects?: number;
    items?: number;
    brands?: number;
    tags?: number;
    managers?: number;
  };
}

/**
 * 사이드바 컴포넌트
 * 
 * 주요 기능:
 * - 메인 네비게이션 메뉴 (프로젝트, 아이템, 브랜드, 태그, 관리자)
 * - 각 메뉴별 데이터 개수 표시 (금색 배지)
 * - 현재 선택된 메뉴 하이라이트
 * - 사용자 프로필 및 로그아웃
 * - 콜라프스 지원
 * 
 * 디자인 특징:
 * - 고정 너비: 280px (확장시), 80px (축소시)
 * - 백색 배경에 연회색 테두리
 * - 브랜드 색상: #1890ff (Ant Design Blue)
 * 
 * @param {SidebarProps} props - 컴포넌트 props
 * @returns {JSX.Element} 사이드바 JSX
 */
export default function Sidebar({ onNavigate, collapsed = false, counts }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();

  // 현재 선택된 메뉴 키 계산
  // URL 경로에 따라 대응되는 메뉴 키를 반환
  const getSelectedKey = () => {
    if (pathname === '/' || pathname.startsWith('/projects')) return 'projects';
    if (pathname.startsWith('/items')) return 'items';
    if (pathname.startsWith('/brands')) return 'brands';
    if (pathname.startsWith('/tags')) return 'tags';
    if (pathname.startsWith('/managers')) return 'managers';
    return 'projects'; // 기본값: 프로젝트
  };

  /**
   * 내비게이션 핸들러
   * onNavigate prop이 있으면 외부 핸들러 사용,
   * 없으면 Next.js router로 내비게이션
   * @param {string} url - 이동할 URL 경로
   */
  const handleNavigation = (url: string) => {
    if (onNavigate) {
      onNavigate(url);
    } else {
      router.push(url);
    }
  };


  // 메뉴 아이템 설정
  // 각 메뉴에 아이콘, 레이블, 배지 카운트, 클릭 이벤트 설정
  const menuItems: MenuProps['items'] = [
    {
      key: 'projects',
      icon: <ProjectOutlined />,
      label: (
        <Space>
          프로젝트
          <Badge count={counts?.projects || 0} size="small" color="gold" />
        </Space>
      ),
      onClick: () => handleNavigation('/projects'),
    },
    {
      key: 'items',
      icon: <AppstoreOutlined />,
      label: (
        <Space>
          아이템
          <Badge count={counts?.items || 0} size="small" color="gold" />
        </Space>
      ),
      onClick: () => handleNavigation('/items'),
    },
    {
      key: 'brands',
      icon: <ShopOutlined />,
      label: (
        <Space>
          브랜드
          <Badge count={counts?.brands || 0} size="small" color="gold" />
        </Space>
      ),
      onClick: () => handleNavigation('/brands'),
    },
    {
      key: 'tags',
      icon: <TagsOutlined />,
      label: (
        <Space>
          태그
          <Badge count={counts?.tags || 0} size="small" color="gold" />
        </Space>
      ),
      onClick: () => handleNavigation('/tags'),
    },
    {
      key: 'managers',
      icon: <UserOutlined />,
      label: (
        <Space>
          관리자
          <Badge count={counts?.managers || 0} size="small" color="gold" />
        </Space>
      ),
      onClick: () => handleNavigation('/managers'),
    },
  ];

  /**
   * 로그아웃 핸들러
   * AuthContext의 logout 함수를 호출하여 로그아웃 처리
   */
  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('로그아웃 오류:', error);
    }
  };

  return (
    <Sider
      width={280}
      collapsed={collapsed}
      collapsedWidth={80}
      style={{
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        backgroundColor: '#fff',
        borderRight: '1px solid #f0f0f0',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* 브랜드 로고 및 사이트 타이틀 */}
        <div style={{
          padding: '24px 16px',
          borderBottom: '1px solid #f0f0f0',
          textAlign: collapsed ? 'center' : 'left'
        }}>
          {!collapsed ? (
            <>
              <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
                Design4Public
              </Title>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                콘텐츠관리자
              </Text>
            </>
          ) : (
            <div style={{ fontSize: '20px', color: '#1890ff' }}>D4P</div>
          )}
        </div>

        {/* 메인 네비게이션 메뉴 */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <Menu
            mode="inline"
            selectedKeys={[getSelectedKey()]}
            items={menuItems}
            style={{ border: 'none' }}
            inlineCollapsed={collapsed}
          />
        </div>

        {/* 하단 사용자 프로필 및 로그아웃 영역 */}
        <div style={{
          padding: '16px',
          borderTop: '1px solid #f0f0f0',
        }}>
          {!collapsed ? (
            <>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '12px',
              }}>
                <Avatar 
                  size="default" 
                  style={{ backgroundColor: '#1890ff' }}
                >
                  {user?.name?.charAt(0) || 'U'}
                </Avatar>
                <div style={{ marginLeft: '12px', flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 500 }}>
                    {user?.name || '사용자'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#999' }}>
                    {user?.role === 'master' ? '마스터' :
                     user?.role === 'admin' ? '관리자' : '콘텐츠매니저'}
                  </div>
                </div>
              </div>

              <Button
                type="default"
                icon={<LogoutOutlined />}
                onClick={handleLogout}
                style={{ width: '100%' }}
              >
                로그아웃
              </Button>
            </>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <Avatar 
                size="default" 
                style={{ backgroundColor: '#1890ff', marginBottom: '8px' }}
              >
                {user?.name?.charAt(0) || 'U'}
              </Avatar>
              <Button
                type="text"
                icon={<LogoutOutlined />}
                onClick={handleLogout}
                style={{ width: '100%' }}
              />
            </div>
          )}
        </div>
      </div>
    </Sider>
  );
}