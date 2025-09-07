// Design4Public CMS - 브랜드 편집 페이지

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
  Divider,
  Empty,
  Spin
} from 'antd';
import { 
  ArrowLeftOutlined, 
  SaveOutlined, 
  PlusOutlined,
  ShopOutlined,
  LinkOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';
import { api } from '@/lib/api';
import type { BrandFormData, BrandStatus, Brand } from '@/types';
import type { UploadProps, UploadFile } from 'antd';

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function EditBrandPage() {
  const router = useRouter();
  const params = useParams();
  const brandId = params.brand_id as string;
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [logoFileList, setLogoFileList] = useState<UploadFile[]>([]);
  const [coverFileList, setCoverFileList] = useState<UploadFile[]>([]);

  // 브랜드 데이터 조회
  const [brand, setBrand] = useState<any>(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    const fetchBrand = async () => {
      try {
        const response = await api.get(`/brands/${brandId}`);
        if (response.success) {
          setBrand(response.data);
        }
      } catch (error) {
        console.error('브랜드 조회 오류:', error);
      } finally {
        setDataLoading(false);
      }
    };

    if (brandId) {
      fetchBrand();
    }
  }, [brandId]);

  useEffect(() => {
    if (brand) {
      // 폼 초기값 설정
      form.setFieldsValue({
        name: brand.name,
        description: brand.description,
        websiteUrl: brand.websiteUrl,
        status: brand.status,
      });

      // 기존 로고 이미지 설정
      if (brand.logoImage) {
        const logoFile: UploadFile = {
          uid: brand.logoImage.id,
          name: 'logo.jpg',
          status: 'done',
          url: brand.logoImage.url,
          thumbUrl: brand.logoImage.url,
        };
        setLogoFileList([logoFile]);
      }

      // 기존 커버 이미지 설정
      if (brand.coverImage) {
        const coverFile: UploadFile = {
          uid: brand.coverImage.id,
          name: 'cover.jpg',
          status: 'done',
          url: brand.coverImage.url,
          thumbUrl: brand.coverImage.url,
        };
        setCoverFileList([coverFile]);
      }
    }
  }, [brand, form]);

  if (dataLoading) {
    return (
      <MainLayout>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
        </div>
      </MainLayout>
    );
  }

  if (!brand) {
    return (
      <MainLayout>
        <Empty description="브랜드를 찾을 수 없습니다." />
      </MainLayout>
    );
  }

  // 로고 이미지 업로드 설정
  const logoUploadProps: UploadProps = {
    name: 'logo',
    listType: 'picture-circle',
    fileList: logoFileList,
    beforeUpload: (file) => {
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error('이미지 파일만 업로드 가능합니다!');
        return false;
      }
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        message.error('이미지는 5MB보다 작아야 합니다!');
        return false;
      }
      return false; // 자동 업로드 방지
    },
    onChange: ({ fileList: newFileList }) => {
      setLogoFileList(newFileList);
    },
    onRemove: (file) => {
      console.log('Remove logo:', file);
      return true;
    },
    maxCount: 1,
  };

  // 커버 이미지 업로드 설정
  const coverUploadProps: UploadProps = {
    name: 'cover',
    listType: 'picture-card',
    fileList: coverFileList,
    beforeUpload: (file) => {
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error('이미지 파일만 업로드 가능합니다!');
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
      setCoverFileList(newFileList);
    },
    onRemove: (file) => {
      console.log('Remove cover:', file);
      return true;
    },
    maxCount: 1,
  };

  const handleSubmit = async (values: BrandFormData) => {
    setLoading(true);
    
    try {
      // 실제로는 API 호출을 해야 함
      console.log('브랜드 수정 데이터:', values);
      console.log('로고 파일:', logoFileList);
      console.log('커버 파일:', coverFileList);
      console.log('기존 브랜드 ID:', brandId);
      
      // 성공 메시지
      message.success('브랜드가 성공적으로 수정되었습니다!');
      
      // 브랜드 상세 페이지로 이동
      router.push(`/brands/${brandId}`);
      
    } catch (error) {
      message.error('브랜드 수정 중 오류가 발생했습니다.');
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
              브랜드 편집: {brand.name}
            </Title>
          </Space>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={[24, 0]}>
            {/* 기본 정보 */}
            <Col xs={24} lg={14}>
              <Card title="기본 정보" style={{ marginBottom: '24px' }}>
                <Form.Item
                  label="브랜드명"
                  name="name"
                  rules={[
                    { required: true, message: '브랜드명을 입력해주세요.' },
                    { min: 2, max: 50, message: '브랜드명은 2-50자 사이여야 합니다.' }
                  ]}
                >
                  <Input 
                    placeholder="브랜드명을 입력하세요"
                    prefix={<ShopOutlined />}
                    showCount
                    maxLength={50}
                  />
                </Form.Item>

                <Form.Item
                  label="브랜드 설명"
                  name="description"
                  rules={[
                    { required: true, message: '브랜드 설명을 입력해주세요.' },
                    { min: 10, max: 500, message: '설명은 10-500자 사이여야 합니다.' }
                  ]}
                >
                  <TextArea
                    rows={4}
                    placeholder="브랜드에 대한 자세한 설명을 입력하세요"
                    showCount
                    maxLength={500}
                  />
                </Form.Item>

                <Form.Item
                  label="브랜드 웹사이트 URL"
                  name="websiteUrl"
                  rules={[
                    { type: 'url', message: '올바른 URL을 입력해주세요.' }
                  ]}
                >
                  <Input 
                    placeholder="https://example.com"
                    prefix={<LinkOutlined />}
                  />
                </Form.Item>
              </Card>

              {/* 커버 이미지 */}
              <Card title="브랜드 커버 이미지">
                <Form.Item
                  label="커버 이미지"
                  extra="브랜드 페이지에 표시될 커버 이미지를 업로드하세요. (권장 크기: 800x400px)"
                >
                  <Upload {...coverUploadProps}>
                    <div>
                      <PlusOutlined />
                      <div style={{ marginTop: 8 }}>이미지 업로드</div>
                    </div>
                  </Upload>
                </Form.Item>
              </Card>
            </Col>

            {/* 로고 및 상태 */}
            <Col xs={24} lg={10}>
              <Card title="브랜드 로고" style={{ marginBottom: '24px' }}>
                <Form.Item
                  label="로고 이미지"
                  extra="브랜드 로고를 업로드하세요. 정사각형 비율을 권장합니다."
                >
                  <Upload {...logoUploadProps}>
                    <div>
                      <PlusOutlined />
                      <div style={{ marginTop: 8 }}>로고 업로드</div>
                    </div>
                  </Upload>
                </Form.Item>
              </Card>

              <Card title="상태 설정" style={{ marginBottom: '24px' }}>
                <Form.Item
                  label="브랜드 상태"
                  name="status"
                  rules={[
                    { required: true, message: '상태를 선택해주세요.' }
                  ]}
                >
                  <Select
                    options={[
                      { value: 'visible', label: '노출' },
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
                    {loading ? '저장 중...' : '변경사항 저장'}
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
}