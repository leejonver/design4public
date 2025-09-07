// Design4Public CMS - 아이템 편집 페이지

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
  Image,
  Empty
} from 'antd';
import { 
  ArrowLeftOutlined, 
  SaveOutlined, 
  PlusOutlined,
  LinkOutlined,
  AppstoreOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';
import { api } from '@/lib/api';
import type { ItemFormData, ItemStatus, Item } from '@/types';
import type { UploadProps, UploadFile } from 'antd';

const { Title } = Typography;
const { TextArea } = Input;

export default function EditItemPage() {
  const router = useRouter();
  const params = useParams();
  const itemId = params.item_id as string;
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  // 아이템 데이터 조회
  const [item, setItem] = useState<any>(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const response = await api.get(`/items/${itemId}`);
        if (response.success) {
          setItem(response.data);
        }
      } catch (error) {
        console.error('아이템 조회 오류:', error);
      } finally {
        setDataLoading(false);
      }
    };

    if (itemId) {
      fetchItem();
    }
  }, [itemId]);

  useEffect(() => {
    if (item) {
      // 폼 초기값 설정
      form.setFieldsValue({
        name: item.name,
        description: item.description,
        mallUrl: item.mallUrl,
        brandId: item.brand.id,
        tags: item.tags?.map((tag: any) => tag.id) || [],
        status: item.status,
      });

      // 기존 이미지를 fileList에 설정
      const existingFiles: UploadFile[] = item.images?.map((image: any, index: number) => ({
        uid: image.id,
        name: `image-${index + 1}.jpg`,
        status: 'done',
        url: image.url,
        thumbUrl: image.url,
      }));
      setFileList(existingFiles);
    }
  }, [item, form]);

  if (!item) {
    return (
      <MainLayout>
        <Empty description="아이템을 찾을 수 없습니다." />
      </MainLayout>
    );
  }

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
      // 미리보기 기능
      console.log('Preview:', file);
    },
    onRemove: (file) => {
      console.log('Remove:', file);
      return true;
    },
  };

  const handleSubmit = async (values: ItemFormData) => {
    setLoading(true);
    
    try {
      // 실제로는 API 호출을 해야 함
      console.log('아이템 수정 데이터:', values);
      console.log('업로드된 파일들:', fileList);
      console.log('기존 아이템 ID:', itemId);
      
      // 성공 메시지
      message.success('아이템이 성공적으로 수정되었습니다!');
      
      // 아이템 상세 페이지로 이동
      router.push(`/items/${itemId}`);
      
    } catch (error) {
      message.error('아이템 수정 중 오류가 발생했습니다.');
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
              아이템 편집: {item.name}
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
                      ((option as any)?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                    options={[]}
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
                      ((option as any)?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                    options={[]}
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