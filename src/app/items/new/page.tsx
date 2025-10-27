// Design4Public CMS - 새 아이템 추가 페이지

'use client';

import { useState, useEffect } from 'react';
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
  Divider,
  Spin
} from 'antd';
import type { UploadProps, UploadFile } from 'antd';
import { 
  ArrowLeftOutlined, 
  SaveOutlined, 
  PlusOutlined,
  UploadOutlined,
  LinkOutlined,
  AppstoreOutlined,
  ShopOutlined,
  TagsOutlined
} from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';
import { api } from '@/lib/api';
import type { ItemFormData, ItemStatus } from '@/types';

const { Title } = Typography;
const { TextArea } = Input;

export default function NewItemPage() {
  const router = useRouter();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState<any[]>([]);
  
  // 브랜드와 태그 데이터
  const [allBrands, setAllBrands] = useState<any[]>([]);
  const [allTags, setAllTags] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // 브랜드와 태그 목록 가져오기
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [brandsResponse, tagsResponse] = await Promise.all([
          api.get<{items: any[]}>('/brands'),
          api.get<{items: any[]}>('/tags?type=item') // 아이템 태그만 가져오기
        ]);

        if (brandsResponse.success && brandsResponse.data) {
          setAllBrands(brandsResponse.data.items || brandsResponse.data || []);
        }

        if (tagsResponse.success && tagsResponse.data) {
          setAllTags(tagsResponse.data.items || tagsResponse.data || []);
        }
      } catch (error) {
        console.error('데이터 로드 오류:', error);
        message.error('브랜드 및 태그 목록을 불러오는 데 실패했습니다.');
      } finally {
        setDataLoading(false);
      }
    };
    fetchData();
  }, []);

  // 이미지 업로드 설정
  const uploadProps: UploadProps = {
    name: 'file',
    multiple: true,
    listType: 'picture-card',
    fileList,
    maxCount: 5, // 최대 5장으로 제한
    beforeUpload: (file) => {
      // 5장 제한 확인
      if (fileList.length >= 5) {
        message.error('이미지는 최대 5장까지만 업로드 가능합니다!');
        return false;
      }
      
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
      // UploadFile 형식으로 변환하여 fileList에 추가
      const uploadFile: UploadFile = {
        uid: file.uid || `${Date.now()}-${Math.random()}`,
        name: file.name,
        status: 'done',
        originFileObj: file,
      };
      setFileList(prev => [...prev, uploadFile]);
      return false; // 자동 업로드 방지
    },
    onPreview: (file) => {
      // 미리보기 기능 (실제 구현 시 모달로 처리)
      console.log('Preview:', file);
    },
    onRemove: (file) => {
      setFileList(prev => prev.filter(f => f.uid !== file.uid));
      return true;
    },
  };

  const handleSubmit = async (values: ItemFormData) => {
    setLoading(true);
    
    try {
      // 이미지 업로드 처리
      let uploadedImages: string[] = [];
      
      if (fileList.length > 0) {
        for (const file of fileList) {
          if (file.originFileObj) {
            const uploadResponse = await api.upload(file.originFileObj, 'items');
            if (uploadResponse.success && uploadResponse.data?.url) {
              uploadedImages.push(uploadResponse.data.url);
            }
          }
        }
      }

      // API 호출
      const response = await api.post('/items', {
        name: values.name,
        description: values.description,
        brandId: values.brandId,
        tags: values.tags || [],
        mallUrl: values.mallUrl || null,
        status: values.status,
        images: uploadedImages,
      });

      if (response.success) {
        message.success('아이템이 성공적으로 추가되었습니다!');
        router.push('/items');
      } else {
        throw new Error(response.error || '아이템 추가에 실패했습니다.');
      }
      
    } catch (error) {
      console.error('아이템 추가 중 예외 발생:', error);
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
                  extra={`최대 5장까지 업로드 가능합니다. 첫 번째 이미지가 대표 이미지로 설정됩니다. (현재: ${fileList.length}/5)`}
                >
                  <Upload {...uploadProps}>
                    {fileList.length >= 5 ? null : (
                      <div>
                        <PlusOutlined />
                        <div style={{ marginTop: 8 }}>이미지 업로드</div>
                      </div>
                    )}
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
                    placeholder={dataLoading ? "로딩 중..." : "브랜드를 검색하고 선택하세요"}
                    showSearch
                    optionFilterProp="label"
                    filterOption={(input, option) =>
                      ((option as any)?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                    loading={dataLoading}
                    disabled={dataLoading}
                    suffixIcon={<ShopOutlined />}
                    options={allBrands.map(brand => ({
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
                    placeholder={dataLoading ? "로딩 중..." : "태그를 검색하고 선택하세요"}
                    showSearch
                    optionFilterProp="label"
                    filterOption={(input, option) =>
                      ((option as any)?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                    loading={dataLoading}
                    disabled={dataLoading}
                    suffixIcon={<TagsOutlined />}
                    maxTagCount="responsive"
                    options={allTags.map(tag => ({
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
                      { value: 'available', label: '구매가능' },
                      { value: 'discontinued', label: '단종' },
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
}