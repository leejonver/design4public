// Design4Public CMS - 브랜드 편집 페이지

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  Upload, 
  Space, 
  Typography, 
  Row,
  Col,
  message,
  Empty,
  Spin
} from 'antd';
import { 
  ArrowLeftOutlined, 
  SaveOutlined, 
  PlusOutlined,
  ShopOutlined,
  LinkOutlined
} from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';
import { api } from '@/lib/api';
import type { BrandFormData } from '@/types';
import type { UploadFile, UploadProps } from 'antd';

const { Title } = Typography;
const { TextArea } = Input;

export default function EditBrandPage() {
  const router = useRouter();
  const params = useParams();
  const brandId = params.brand_id as string;
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [logoFileList, setLogoFileList] = useState<UploadFile[]>([]);
  const [coverFileList, setCoverFileList] = useState<UploadFile[]>([]);
  const [brand, setBrand] = useState<any>(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    const fetchBrand = async () => {
      if (!brandId) return;
      try {
        const response = await api.get(`/brands/${brandId}`);
        if (response.success) {
          setBrand(response.data);
        }
      } catch (error) {
        console.error('브랜드 조회 오류:', error);
        message.error('브랜드 정보를 불러오는 데 실패했습니다.');
      } finally {
        setDataLoading(false);
      }
    };
    fetchBrand();
  }, [brandId]);

  // 이미지 URL에 캐시 무효화를 위한 타임스탬프 추가
  const addCacheBuster = (url: string | null | undefined, updatedAt?: string): string | undefined => {
    if (!url) return undefined;
    const timestamp = updatedAt ? new Date(updatedAt).getTime() : Date.now();
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}v=${timestamp}`;
  };

  useEffect(() => {
    if (brand) {
      form.setFieldsValue({
        nameKo: brand.nameKo,
        nameEn: brand.nameEn,
        description: brand.description,
        websiteUrl: brand.websiteUrl,
      });
      if (brand.logoImageUrl) {
        setLogoFileList([{ 
          uid: '-1', 
          name: 'logo.png', 
          status: 'done', 
          url: addCacheBuster(brand.logoImageUrl, brand.updatedAt),
          thumbUrl: addCacheBuster(brand.logoImageUrl, brand.updatedAt)
        }]);
      }
      if (brand.coverImageUrl) {
        setCoverFileList([{ 
          uid: '-1', 
          name: 'cover.png', 
          status: 'done', 
          url: addCacheBuster(brand.coverImageUrl, brand.updatedAt),
          thumbUrl: addCacheBuster(brand.coverImageUrl, brand.updatedAt)
        }]);
      }
    }
  }, [brand, form]);

  const handleUpload = async (file: UploadFile, type: 'logo' | 'cover'): Promise<string | null> => {
    if (!file.originFileObj) {
      // 기존 이미지 URL에서 캐시 버스터 제거 후 반환
      const url = file.url || null;
      if (url && url.includes('?v=')) {
        return url.split('?v=')[0];
      }
      return url;
    }
    try {
      const response = await api.upload(file.originFileObj, 'brands');
      if (response.success && response.data?.url) {
        return response.data.url;
      }
      message.error(`${type === 'logo' ? '로고' : '커버'} 이미지 업로드 실패`);
      return null;
    } catch (error) {
      message.error(`${type === 'logo' ? '로고' : '커버'} 이미지 업로드 중 예외 발생`);
      return null;
    }
  };

  const handleSubmit = async (values: BrandFormData) => {
    setLoading(true);

    try {
      let logoImageUrl: string | null | undefined = brand.logoImageUrl;
      if (logoFileList.length > 0) {
        const file = logoFileList[0];
        // 새 파일인 경우에만 업로드
        if (file.originFileObj) {
          logoImageUrl = await handleUpload(file, 'logo');
          if (logoImageUrl === null) {
            setLoading(false);
            return;
          }
        }
      } else {
        // 파일 목록이 비어있으면 이미지 삭제
        logoImageUrl = null;
      }

      let coverImageUrl: string | null | undefined = brand.coverImageUrl;
      if (coverFileList.length > 0) {
        const file = coverFileList[0];
        // 새 파일인 경우에만 업로드
        if (file.originFileObj) {
          coverImageUrl = await handleUpload(file, 'cover');
          if (coverImageUrl === null) {
            setLoading(false);
            return;
          }
        }
      } else {
        // 파일 목록이 비어있으면 이미지 삭제
        coverImageUrl = null;
      }
      
      const brandData = { 
        ...values, 
        logoImageUrl, 
        coverImageUrl 
      };
      
      const response = await api.put(`/brands/${brandId}`, brandData);
      
      if (response.success) {
        message.success('브랜드가 성공적으로 수정되었습니다!');
        // 브랜드 목록으로 리다이렉트 (완전 새로고침을 위해 window.location 사용)
        // 이렇게 하면 이미지 캐시가 무효화되어 새 이미지가 표시됩니다
        setTimeout(() => {
          window.location.href = '/brands';
        }, 500);
      } else {
        message.error(`브랜드 수정 실패: ${response.error || '알 수 없는 오류'}`);
      }
    } catch (error) {
      message.error('브랜드 수정 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => router.back();

  const createUploadProps = (fileList: UploadFile[], setFileList: React.Dispatch<React.SetStateAction<UploadFile[]>>): UploadProps => ({
    listType: "picture-card",
    fileList,
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
      // UploadFile 형식으로 변환하여 저장
      const uploadFile: UploadFile = {
        uid: file.uid || `${Date.now()}`,
        name: file.name,
        status: 'done',
        originFileObj: file,
      };
      setFileList([uploadFile]);
      return false;
    },
    onRemove: () => setFileList([]),
    maxCount: 1,
  });

  if (dataLoading) return <MainLayout><Spin tip="로딩 중..." size="large" fullscreen /></MainLayout>;
  if (!brand) return <MainLayout><Empty description="브랜드를 찾을 수 없습니다." /></MainLayout>;

  return (
    <MainLayout>
      <div>
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={handleCancel}>돌아가기</Button>
            <Title level={2} style={{ margin: 0 }}>브랜드 편집: {brand.nameKo}</Title>
          </Space>
        </div>

        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={[24, 0]}>
            <Col xs={24} lg={14}>
              <Card title="기본 정보" style={{ marginBottom: '24px' }}>
                <Form.Item label="브랜드명 (한글)" name="nameKo" rules={[{ required: true, message: '한글 브랜드명을 입력해주세요.' }]}>
                  <Input placeholder="예: 허먼밀러" prefix={<ShopOutlined />} />
                </Form.Item>
                <Form.Item label="브랜드명 (영문)" name="nameEn">
                  <Input placeholder="예: Herman Miller" prefix={<ShopOutlined />} />
                </Form.Item>
                <Form.Item label="브랜드 설명" name="description" rules={[{ required: true, message: '브랜드 설명을 입력해주세요.' }]}>
                  <TextArea rows={4} placeholder="브랜드에 대한 자세한 설명을 입력하세요" />
                </Form.Item>
                <Form.Item label="브랜드 웹사이트 URL" name="websiteUrl" rules={[{ type: 'url', message: '올바른 URL을 입력해주세요.' }]}>
                  <Input placeholder="https://example.com" prefix={<LinkOutlined />} />
                </Form.Item>
              </Card>
            </Col>
            <Col xs={24} lg={10}>
              <Card title="이미지" style={{ marginBottom: '24px' }}>
                <Form.Item label="로고 이미지" help="1:1 비율의 이미지를 권장합니다.">
                  <Upload {...createUploadProps(logoFileList, setLogoFileList)}>
                    {logoFileList.length < 1 && <div><PlusOutlined /><div style={{ marginTop: 8 }}>로고 업로드</div></div>}
                  </Upload>
                </Form.Item>
                <Form.Item label="커버 이미지" help="2:1 비율의 이미지를 권장합니다.">
                  <Upload {...createUploadProps(coverFileList, setCoverFileList)}>
                    {coverFileList.length < 1 && <div><PlusOutlined /><div style={{ marginTop: 8 }}>커버 업로드</div></div>}
                  </Upload>
                </Form.Item>
              </Card>
              <Card>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />} style={{ width: '100%' }} size="large">
                    {loading ? '저장 중...' : '변경사항 저장'}
                  </Button>
                  <Button onClick={handleCancel} style={{ width: '100%' }}>취소</Button>
                </Space>
              </Card>
            </Col>
          </Row>
        </Form>
      </div>
    </MainLayout>
  );
}