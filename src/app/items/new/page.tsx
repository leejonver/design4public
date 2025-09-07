// Design4Public CMS - 새 아이템 추가 페이지

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  Select, 
  Upload, 
  Space, 
  Typography, 
  Row,
  Col,
  message,
  Switch,
  Divider
} from 'antd';
import { 
  ArrowLeftOutlined, 
  SaveOutlined, 
  PlusOutlined,
  UploadOutlined,
  LinkOutlined,
  AppstoreOutlined
} from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';
import { dummyBrands, dummyTags } from '@/data/dummyData';
import type { ItemFormData, ItemStatus } from '@/types';
import type { UploadProps } from 'antd';

const { Title } = Typography;
const { TextArea } = Input;

export default function NewItemPage() {
  const router = useRouter();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState<any[]>([]);

  // 이미지 업로드 설정
  const uploadProps: UploadProps = {
    name: 'file',
    multiple: true,
    listType: 'picture-card',
    fileList,
    beforeUpload: (file) => {
      const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp';
      if (!isJpgOrPng) {
        message.error('JPG, PNG, WebP 파일만 업로드 가능합니다!');
        return false;
      }
      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        message.error('이미지는 10MB보다 작아야 합니다!');
        return false;
      }
      return false; // 자동 업로드 방지
    },
    onChange: ({ fileList: newFileList }) => {
      setFileList(newFileList);
    },
    onPreview: (file) => {
      // 미리보기 기능 (실제 구현 시 모달로 처리)
      console.log('Preview:', file);
    },
  };

  const handleSubmit = async (values: ItemFormData) => {
    setLoading(true);
    
    try {
      // 실제로는 API 호출을 해야 함
      console.log('새 아이템 데이터:', values);
      console.log('업로드된 파일들:', fileList);
      
      // 성공 메시지
      message.success('아이템이 성공적으로 추가되었습니다!');
      
      // 아이템 리스트로 이동
      router.push('/items');
      
    } catch (error) {
      message.error('아이템 추가 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <MainLayout>
      <div>
        {/* 헤더 */}
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={handleCancel}
            >
              돌아가기
            </Button>
            <Title level={2} style={{ margin: 0 }}>
              새 아이템 추가
            </Title>
          </Space>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            status: 'available'
          }}
        >
          <Row gutter={[24, 0]}>
            {/* 기본 정보 */}
            <Col xs={24} lg={14}>
              <Card title="기본 정보" style={{ marginBottom: '24px' }}>
                <Form.Item
                  label="아이템명"
                  name="name"
                  rules={[
                    { required: true, message: '아이템명을 입력해주세요.' },
                    { min: 2, max: 100, message: '아이템명은 2-100자 사이여야 합니다.' }
                  ]}
                >
                  <Input 
                    placeholder="아이템명을 입력하세요"
                    prefix={<AppstoreOutlined />}
                    showCount
                    maxLength={100}
                  />
                </Form.Item>

                <Form.Item
                  label="아이템 설명"
                  name="description"
                  rules={[
                    { required: true, message: '아이템 설명을 입력해주세요.' },
                    { min: 10, max: 1000, message: '설명은 10-1000자 사이여야 합니다.' }
                  ]}
                >
                  <TextArea
                    rows={4}
                    placeholder="아이템에 대한 자세한 설명을 입력하세요"
                    showCount
                    maxLength={1000}
                  />
                </Form.Item>

                <Form.Item
                  label="나라장터 URL"
                  name="mallUrl"
                  rules={[
                    { type: 'url', message: '올바른 URL을 입력해주세요.' }
                  ]}
                >
                  <Input 
                    placeholder="https://mall.g2b.go.kr/..."
                    prefix={<LinkOutlined />}
                  />
                </Form.Item>
              </Card>

              {/* 이미지 업로드 */}
              <Card title="아이템 이미지">
                <Form.Item
                  label="이미지 업로드"
                  extra="여러 장의 이미지를 업로드할 수 있습니다. 첫 번째 이미지가 대표 이미지로 설정됩니다."
                >
                  <Upload {...uploadProps}>
                    <div>
                      <PlusOutlined />
                      <div style={{ marginTop: 8 }}>이미지 업로드</div>
                    </div>
                  </Upload>
                </Form.Item>
              </Card>
            </Col>

            {/* 분류 및 상태 */}
            <Col xs={24} lg={10}>
              <Card title="분류 및 상태" style={{ marginBottom: '24px' }}>
                <Form.Item
                  label="브랜드"
                  name="brandId"
                  rules={[
                    { required: true, message: '브랜드를 선택해주세요.' }
                  ]}
                >
                  <Select
                    placeholder="브랜드를 선택하세요"
                    showSearch
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                      (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                    options={dummyBrands.map(brand => ({
                      value: brand.id,
                      label: brand.name
                    }))}
                  />
                </Form.Item>

                <Form.Item
                  label="태그"
                  name="tags"
                  rules={[
                    { required: true, message: '최소 1개의 태그를 선택해주세요.' }
                  ]}
                >
                  <Select
                    mode="multiple"
                    placeholder="태그를 선택하세요"
                    showSearch
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                      (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                    options={dummyTags.map(tag => ({
                      value: tag.id,
                      label: tag.name
                    }))}
                  />
                </Form.Item>

                <Divider />

                <Form.Item
                  label="상태"
                  name="status"
                  rules={[
                    { required: true, message: '상태를 선택해주세요.' }
                  ]}
                >
                  <Select
                    options={[
                      { value: 'available', label: '구입가능' },
                      { value: 'discontinued', label: '단종' },
                      { value: 'hidden', label: '숨김' },
                    ]}
                  />
                </Form.Item>
              </Card>

              {/* 저장 버튼 */}
              <Card>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    icon={<SaveOutlined />}
                    style={{ width: '100%' }}
                    size="large"
                  >
                    {loading ? '저장 중...' : '아이템 저장'}
                  </Button>
                  
                  <Button
                    onClick={handleCancel}
                    style={{ width: '100%' }}
                  >
                    취소
                  </Button>
                </Space>
              </Card>
            </Col>
          </Row>
        </Form>
      </div>
    </MainLayout>
  );
}"