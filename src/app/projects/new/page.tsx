// Design4Public CMS - 새 프로젝트 추가 페이지

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
  InputNumber,
  Divider,
  Tag,
  List,
  Avatar,
  Checkbox
} from 'antd';
import { 
  ArrowLeftOutlined, 
  SaveOutlined, 
  PlusOutlined,
  ProjectOutlined,
  LinkOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  ExpandAltOutlined,
  TagsOutlined,
  AppstoreOutlined
} from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';
import { api } from '@/lib/api';
import type { ProjectFormData, ProjectStatus } from '@/types';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { CheckableTag } = Tag;

export default function NewProjectPage() {
  const router = useRouter();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState<any[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // 이미지 업로드 설정
  const uploadProps = {
    name: 'file',
    multiple: true,
    listType: 'picture-card' as const,
    fileList,
    beforeUpload: (file: File) => {
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
    onChange: ({ fileList: newFileList }: any) => {
      setFileList(newFileList);
    },
  };

  const handleSubmit = async (values: ProjectFormData) => {
    setLoading(true);
    
    try {
      // 1. 먼저 이미지들을 Supabase Storage에 업로드
      const uploadedImages = [];
      for (const file of fileList) {
        if (file.originFileObj) {
          // 파일 타입을 명시적으로 설정
          const fileObj = file.originFileObj;
          if (file.name.toLowerCase().endsWith('.png')) {
            Object.defineProperty(fileObj, 'type', { value: 'image/png' });
          } else if (file.name.toLowerCase().endsWith('.jpg') || file.name.toLowerCase().endsWith('.jpeg')) {
            Object.defineProperty(fileObj, 'type', { value: 'image/jpeg' });
          } else if (file.name.toLowerCase().endsWith('.webp')) {
            Object.defineProperty(fileObj, 'type', { value: 'image/webp' });
          } else if (file.name.toLowerCase().endsWith('.gif')) {
            Object.defineProperty(fileObj, 'type', { value: 'image/gif' });
          }
          
          const uploadResponse = await api.upload(fileObj, 'projects');
          if (uploadResponse.success) {
            uploadedImages.push({
              url: uploadResponse.data.url,
              alt: file.name,
              isMain: uploadedImages.length === 0 // 첫 번째 이미지를 대표 이미지로 설정
            });
          }
        }
      }

      // 2. 프로젝트 데이터 준비
      const projectData = {
        name: values.name,
        description: values.description,
        location: values.location || '',
        completionYear: values.completionYear,
        area: values.area,
        status: values.status,
        inquiryUrl: values.inquiryUrl || '',
        images: uploadedImages,
        tags: selectedTags,
        connectedItems: selectedItems
      };
      
      console.log('새 프로젝트 데이터:', projectData);
      console.log('업로드된 파일들:', fileList);
      
      // 3. 프로젝트 생성 API 호출
      const response = await api.post('/projects', projectData);
      
      if (response.success) {
        message.success('프로젝트가 성공적으로 추가되었습니다!');
        router.push('/projects');
      } else {
        message.error('프로젝트 추가 중 오류가 발생했습니다.');
      }
      
    } catch (error) {
      console.error('프로젝트 생성 오류:', error);
      message.error('프로젝트 추가 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const handleTagChange = (tag: string, checked: boolean) => {
    const nextSelectedTags = checked
      ? [...selectedTags, tag]
      : selectedTags.filter(t => t !== tag);
    setSelectedTags(nextSelectedTags);
  };

  const handleItemChange = (itemId: string, checked: boolean) => {
    const nextSelectedItems = checked
      ? [...selectedItems, itemId]
      : selectedItems.filter(id => id !== itemId);
    setSelectedItems(nextSelectedItems);
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
              새 프로젝트 추가
            </Title>
          </Space>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            status: 'draft',
            completionYear: new Date().getFullYear()
          }}
        >
          <Row gutter={[24, 0]}>
            {/* 기본 정보 */}
            <Col xs={24} lg={14}>
              <Card title="기본 정보" style={{ marginBottom: '24px' }}>
                <Form.Item
                  label="프로젝트명"
                  name="name"
                  rules={[
                    { required: true, message: '프로젝트명을 입력해주세요.' },
                    { min: 2, max: 100, message: '프로젝트명은 2-100자 사이여야 합니다.' }
                  ]}
                >
                  <Input 
                    placeholder="프로젝트명을 입력하세요"
                    prefix={<ProjectOutlined />}
                    showCount
                    maxLength={100}
                  />
                </Form.Item>

                <Form.Item
                  label="프로젝트 설명"
                  name="description"
                  rules={[
                    { required: true, message: '프로젝트 설명을 입력해주세요.' },
                    { min: 10, max: 1000, message: '설명은 10-1000자 사이여야 합니다.' }
                  ]}
                >
                  <TextArea
                    rows={4}
                    placeholder="프로젝트에 대한 자세한 설명을 입력하세요"
                    showCount
                    maxLength={1000}
                  />
                </Form.Item>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label="프로젝트 지역"
                      name="location"
                      rules={[
                        { required: true, message: '프로젝트 지역을 입력해주세요.' }
                      ]}
                    >
                      <Input 
                        placeholder="서울시 강남구"
                        prefix={<EnvironmentOutlined />}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="완공연도"
                      name="completionYear"
                      rules={[
                        { required: true, message: '완공연도를 입력해주세요.' }
                      ]}
                    >
                      <InputNumber
                        style={{ width: '100%' }}
                        min={1990}
                        max={2050}
                        prefix={<CalendarOutlined />}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label="면적 (m²)"
                      name="area"
                      rules={[
                        { required: true, message: '면적을 입력해주세요.' }
                      ]}
                    >
                      <InputNumber
                        style={{ width: '100%' }}
                        min={1}
                        prefix={<ExpandAltOutlined />}
                        formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="문의 URL"
                      name="inquiryUrl"
                      rules={[
                        { type: 'url', message: '올바른 URL을 입력해주세요.' }
                      ]}
                    >
                      <Input 
                        placeholder="https://forms.gle/..."
                        prefix={<LinkOutlined />}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>

              {/* 프로젝트 이미지 */}
              <Card title="프로젝트 이미지">
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

            {/* 태그 및 연결 아이템 */}
            <Col xs={24} lg={10}>
              <Card title="프로젝트 태그" style={{ marginBottom: '24px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <Text type="secondary">프로젝트와 관련된 태그를 선택하세요</Text>
                </div>
                <div>
                  {[].map((tag: any) => (
                    <CheckableTag
                      key={tag.id}
                      checked={selectedTags.includes(tag.id)}
                      onChange={(checked) => handleTagChange(tag.id, checked)}
                      style={{ marginBottom: '8px' }}
                    >
                      <TagsOutlined /> {tag.name}
                    </CheckableTag>
                  ))}
                </div>
                <div style={{ marginTop: '16px', fontSize: '12px', color: '#666' }}>
                  선택된 태그: {selectedTags.length}개
                </div>
              </Card>

              <Card title="연결된 아이템" style={{ marginBottom: '24px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <Text type="secondary">프로젝트에서 사용된 아이템을 선택하세요</Text>
                </div>
                
                <List
                  size="small"
                  dataSource={[]}
                  renderItem={(item: any) => (
                    <List.Item>
                      <Checkbox
                        checked={selectedItems.includes(item.id)}
                        onChange={(e) => handleItemChange(item.id, e.target.checked)}
                      >
                        <List.Item.Meta
                          avatar={
                            <Avatar 
                              size={32}
                              src={item.images[0]?.url}
                              icon={<AppstoreOutlined />}
                            />
                          }
                          title={<span style={{ fontSize: '14px' }}>{item.name}</span>}
                          description={<Text type="secondary" style={{ fontSize: '12px' }}>{item.brand.name}</Text>}
                        />
                      </Checkbox>
                    </List.Item>
                  )}
                  style={{ maxHeight: '300px', overflow: 'auto' }}
                />
                <div style={{ marginTop: '16px', fontSize: '12px', color: '#666' }}>
                  선택된 아이템: {selectedItems.length}개
                </div>
              </Card>

              {/* 상태 및 저장 */}
              <Card>
                <Form.Item
                  label="발행 상태"
                  name="status"
                  rules={[
                    { required: true, message: '발행 상태를 선택해주세요.' }
                  ]}
                >
                  <Select
                    options={[
                      { value: 'draft', label: '초안' },
                      { value: 'published', label: '게시' },
                      { value: 'hidden', label: '숨김' },
                    ]}
                  />
                </Form.Item>

                <Divider />

                <Space direction="vertical" style={{ width: '100%' }}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    icon={<SaveOutlined />}
                    style={{ width: '100%' }}
                    size="large"
                  >
                    {loading ? '저장 중...' : '프로젝트 저장'}
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
