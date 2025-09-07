// Design4Public CMS - 회원가입 페이지

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
  Result,
  message
} from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, UserAddOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { SignupFormData } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

const { Title, Text } = Typography;

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [form] = Form.useForm();

  const handleSubmit = async (values: SignupFormData) => {
    setLoading(true);
    setError(null);

    try {
      await signup(values.name, values.email, values.password);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || '회원가입 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
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
            maxWidth: '500px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            borderRadius: '12px'
          }}
          bodyStyle={{ padding: '40px' }}
        >
          <Result
            status="success"
            title="회원가입이 완료되었습니다!"
            subTitle="이메일 인증 후 관리자 승인이 필요합니다. 승인 완료 후 로그인이 가능합니다."
            extra={[
              <Button type="primary" key="login" onClick={() => router.push('/login')}>
                로그인 페이지로 이동
              </Button>
            ]}
          />
        </Card>
      </div>
    );
  }

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
          maxWidth: '450px',
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
            콘텐츠관리자 회원가입
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

        {/* 회원가입 폼 */}
        <Form
          form={form}
          name="signup"
          onFinish={handleSubmit}
          size="large"
          autoComplete="off"
        >
          <Form.Item
            name="name"
            rules={[
              { required: true, message: '이름을 입력해주세요.' },
              { min: 2, message: '이름은 2자 이상이어야 합니다.' },
              { max: 20, message: '이름은 20자 이하이어야 합니다.' }
            ]}
          >
            <Input 
              prefix={<UserOutlined />}
              placeholder="관리자 이름"
              autoComplete="name"
            />
          </Form.Item>

          <Form.Item
            name="email"
            rules={[
              { required: true, message: '이메일을 입력해주세요.' },
              { type: 'email', message: '올바른 이메일 형식을 입력해주세요.' }
            ]}
          >
            <Input 
              prefix={<MailOutlined />}
              placeholder="이메일 주소"
              autoComplete="email"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: '비밀번호를 입력해주세요.' },
              { min: 8, message: '비밀번호는 8자 이상이어야 합니다.' },
              {
                pattern: /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                message: '비밀번호는 영문, 숫자, 특수문자를 포함해야 합니다.'
              }
            ]}
            hasFeedback
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="비밀번호 (최소 8자)"
              autoComplete="new-password"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: '비밀번호 확인을 입력해주세요.' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('비밀번호가 일치하지 않습니다.'));
                },
              }),
            ]}
            hasFeedback
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="비밀번호 확인"
              autoComplete="new-password"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: '16px' }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              style={{ width: '100%', height: '48px' }}
              icon={<UserAddOutlined />}
            >
              {loading ? '회원가입 중...' : '회원가입'}
            </Button>
          </Form.Item>
        </Form>

        <Divider plain>또는</Divider>

        {/* 로그인 링크 */}
        <div style={{ textAlign: 'center' }}>
          <Text type="secondary">
            이미 계정이 있으신가요?{' '}
          </Text>
          <Link href="/login" style={{ color: '#1890ff', textDecoration: 'none' }}>
            로그인
          </Link>
        </div>
      </Card>
    </div>
  );
}
