// Design4Public CMS - 로그인 페이지

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  Form,
  Input,
  Button,
  Typography,
  Alert,
  Space,
  Divider,
  message
} from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { LoginFormData } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

const { Title, Text } = Typography;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form] = Form.useForm();

  const handleSubmit = async (values: LoginFormData) => {
    setLoading(true);
    setError(null);

    try {
      await login(values.email, values.password);
      message.success('로그인에 성공했습니다!');
      router.push('/projects');
    } catch (err: any) {
      setError(err.message || '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f0f2f5',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <Card 
        style={{ 
          width: '100%', 
          maxWidth: '400px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          borderRadius: '12px'
        }}
        bodyStyle={{ padding: '40px' }}
      >
        {/* 로고 및 타이틀 */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Title level={2} style={{ color: '#1890ff', marginBottom: '8px' }}>
            Design4Public
          </Title>
          <Text type="secondary" style={{ fontSize: '16px' }}>
            콘텐츠관리자 로그인
          </Text>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <Alert
            message={error}
            type="error"
            style={{ marginBottom: '24px' }}
            showIcon
          />
        )}

        {/* 로그인 폼 */}
        <Form
          form={form}
          name="login"
          onFinish={handleSubmit}
          size="large"
          autoComplete="off"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: '이메일을 입력해주세요.' },
              { type: 'email', message: '올바른 이메일 형식을 입력해주세요.' }
            ]}
          >
            <Input 
              prefix={<UserOutlined />}
              placeholder="이메일 주소"
              autoComplete="email"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: '비밀번호를 입력해주세요.' },
              { min: 6, message: '비밀번호는 6자 이상이어야 합니다.' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="비밀번호"
              autoComplete="current-password"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: '16px' }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              style={{ width: '100%', height: '48px' }}
              icon={<LoginOutlined />}
            >
              {loading ? '로그인 중...' : '로그인'}
            </Button>
          </Form.Item>
        </Form>

        <Divider plain>또는</Divider>

        {/* 회원가입 링크 */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Text type="secondary">
            계정이 없으신가요?{' '}
          </Text>
          <Link href="/signup" style={{ color: '#1890ff', textDecoration: 'none' }}>
            회원가입
          </Link>
        </div>

        {/* 테스트 계정 정보 */}
        <Card 
          size="small" 
          style={{
            backgroundColor: '#f9f9f9',
            border: '1px solid #e8e8e8'
          }}
        >
          <Text strong style={{ fontSize: '14px', display: 'block', marginBottom: '8px' }}>
            테스트 계정
          </Text>
          <Space direction="vertical" size={0} style={{ width: '100%' }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              <strong>관리자:</strong> admin@design4public.com / password
            </Text>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              <strong>마스터:</strong> master@design4public.com / master123
            </Text>
          </Space>
        </Card>
      </Card>
    </div>
  );
}
