// Design4Public CMS - 프로젝트 편집 페이지

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import imageCompression from 'browser-image-compression';
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
  Checkbox,
  Empty
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
  AppstoreOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';
import { api } from '@/lib/api';
import type { ProjectFormData, ProjectStatus, Project } from '@/types';
import type { UploadFile } from 'antd';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { CheckableTag } = Tag;

export default function EditProjectPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.project_id as string;
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // 프로젝트 데이터 조회
  const [project, setProject] = useState<any>(null);
  const [dataLoading, setDataLoading] = useState(true);
  
  // 태그와 아이템 데이터
  const [allTags, setAllTags] = useState<any[]>([]);
  const [allItems, setAllItems] = useState<any[]>([]);
  const [tagSearchText, setTagSearchText] = useState('');
  const [itemSearchText, setItemSearchText] = useState('');

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await api.get(`/projects/${projectId}`);
        if (response.success) {
          setProject(response.data);
        }
      } catch (error) {
        console.error('프로젝트 조회 오류:', error);
      } finally {
        setDataLoading(false);
      }
    };

    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  // 태그와 아이템 목록 가져오기
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tagsResponse, itemsResponse] = await Promise.all([
          api.get<{items: any[]}>('/tags?type=project'), // 프로젝트 태그만 가져오기
          api.get<{items: any[]}>('/items')
        ]);

        if (tagsResponse.success && tagsResponse.data) {
          const tagsData = tagsResponse.data as any;
          setAllTags(tagsData.items || tagsData || []);
        }

        if (itemsResponse.success && itemsResponse.data) {
          const itemsData = itemsResponse.data as any;
          setAllItems(itemsData.items || itemsData || []);
        }
      } catch (error) {
        console.error('데이터 로드 오류:', error);
        message.error('태그 및 아이템 목록을 불러오는 데 실패했습니다.');
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (project) {
      // 폼 초기값 설정
      form.setFieldsValue({
        name: project.name,
        description: project.description,
        location: project.location,
        completionYear: project.completionYear,
        area: project.area,
        inquiryUrl: project.inquiryUrl,
        status: project.status,
      });

      // 태그와 연결된 아이템 설정
      setSelectedTags(project.tags?.map((tag: any) => tag.id) || []);
      setSelectedItems(project.connectedItems?.map((item: any) => item.id) || []);

      // 기존 이미지를 fileList에 설정
      const existingFiles: UploadFile[] = project.images?.map((image: any, index: number) => ({
        uid: image.id,
        name: `image-${index + 1}.jpg`,
        status: 'done' as const,
        url: image.url,
        thumbUrl: image.url,
      })) || [];
      setFileList(existingFiles);
    }
  }, [project, form]);

  // 필터링된 태그와 아이템
  const filteredTags = allTags.filter(tag =>
    tag.name.toLowerCase().includes(tagSearchText.toLowerCase())
  );

  const filteredItems = allItems.filter(item =>
    item.name.toLowerCase().includes(itemSearchText.toLowerCase()) ||
    item.brand?.name.toLowerCase().includes(itemSearchText.toLowerCase())
  );

  if (dataLoading) {
    return (
      <MainLayout>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Text>프로젝트 정보를 불러오는 중...</Text>
        </div>
      </MainLayout>
    );
  }

  if (!project) {
    return (
      <MainLayout>
        <Empty description="프로젝트를 찾을 수 없습니다." />
      </MainLayout>
    );
  }

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
    onRemove: (file: UploadFile) => {
      console.log('Remove:', file);
      return true;
    },
  };

  const handleSubmit = async (values: ProjectFormData) => {
    setLoading(true);
    
    try {
      // 1. 이미지 처리: 기존 이미지 유지 + 새 이미지 압축 및 업로드
      const allImages = [];
      const newFilesCount = fileList.filter(f => f.originFileObj).length;
      let uploadedCount = 0;
      let hideLoading: any = null;
      
      if (newFilesCount > 0) {
        hideLoading = message.loading(`이미지 업로드 중... (0/${newFilesCount})`, 0);
      }
      
      for (const file of fileList) {
        if (file.status === 'done' && file.url) {
          // 기존 이미지 (이미 업로드된 것)
          allImages.push({
            url: file.url,
            alt: values.name,
            isMain: allImages.length === 0 // 첫 번째 이미지를 대표 이미지로
          });
        } else if (file.originFileObj) {
          try {
            // 이미지 압축
            const options = {
              maxSizeMB: 2, // 최대 2MB
              maxWidthOrHeight: 1920, // 최대 해상도
              useWebWorker: true,
            };
            
            const compressedFile = await imageCompression(file.originFileObj, options);
            console.log(`이미지 압축: ${(file.originFileObj.size / 1024 / 1024).toFixed(2)}MB → ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
            
            // 업로드 진행률 업데이트
            uploadedCount++;
            if (hideLoading) {
              hideLoading();
              hideLoading = message.loading(`이미지 업로드 중... (${uploadedCount}/${newFilesCount})`, 0);
            }
            
            // 프로젝트 업로드 API 호출 (RLS 우회)
            const uploadResponse = await api.upload(compressedFile, 'projects');
            
            if (uploadResponse.success && uploadResponse.data?.url) {
              allImages.push({
                url: uploadResponse.data.url,
                alt: values.name,
                isMain: allImages.length === 0 // 첫 번째 이미지를 대표 이미지로
              });
            } else {
              if (hideLoading) hideLoading();
              message.error(`이미지 업로드 실패: ${uploadResponse.error || '알 수 없는 오류'}`);
              setLoading(false);
              return;
            }
          } catch (error) {
            if (hideLoading) hideLoading();
            console.error('이미지 처리 오류:', error);
            message.error(`이미지 처리 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
            setLoading(false);
            return;
          }
        }
      }
      
      if (hideLoading) hideLoading();
      
      // 2. 프로젝트 데이터 구성
      
      const projectData = {
        name: values.name,
        description: values.description,
        location: values.location || '',
        completionYear: values.completionYear,
        area: values.area,
        status: values.status,
        inquiryUrl: values.inquiryUrl || '',
        images: allImages,
        tags: selectedTags,
        connectedItems: selectedItems
      };
      
      console.log('전송할 프로젝트 데이터:', projectData);
      
      // 3. 프로젝트 업데이트 API 호출
      const response = await api.put(`/projects/${projectId}`, projectData);
      
      console.log('API 응답:', response);
      
      if (response.success) {
        message.success('프로젝트가 성공적으로 수정되었습니다!');
        router.push(`/projects/${projectId}`);
      } else {
        console.error('API 오류:', response.error);
        message.error(`프로젝트 수정 중 오류가 발생했습니다: ${response.error || '알 수 없는 오류'}`);
      }
      
    } catch (error) {
      console.error('프로젝트 수정 중 예외 발생:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      message.error(`프로젝트 수정 중 오류가 발생했습니다: ${errorMessage}`);
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
              프로젝트 편집: {project.name}
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
                        { required: true, message: '완공연도를 입력해주세요.' },
                        { 
                          type: 'number', 
                          min: 1900, 
                          max: new Date().getFullYear() + 10,
                          message: `1900년부터 ${new Date().getFullYear() + 10}년까지 입력 가능합니다.`
                        }
                      ]}
                    >
                      <InputNumber 
                        placeholder={new Date().getFullYear().toString()}
                        prefix={<CalendarOutlined />}
                        style={{ width: '100%' }}
                        min={1900}
                        max={new Date().getFullYear() + 10}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  label="프로젝트 면적 (m²)"
                  name="area"
                  rules={[
                    { type: 'number', min: 1, message: '면적은 1m² 이상이어야 합니다.' }
                  ]}
                >
                  <InputNumber 
                    placeholder="면적을 입력하세요 (선택사항)"
                    prefix={<ExpandAltOutlined />}
                    style={{ width: '100%' }}
                    min={1}
                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(value) => Number(value!.replace(/\$\s?|(,*)/g, '')) as any}
                  />
                </Form.Item>

                <Form.Item
                  label="문의 URL"
                  name="inquiryUrl"
                  rules={[
                    { type: 'url', message: '올바른 URL을 입력해주세요.' }
                  ]}
                >
                  <Input 
                    placeholder="https://example.com/inquiry"
                    prefix={<LinkOutlined />}
                  />
                </Form.Item>
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

            {/* 분류 및 상태 */}
            <Col xs={24} lg={10}>
              <Card title="상태 설정" style={{ marginBottom: '24px' }}>
                <Form.Item
                  label="프로젝트 상태"
                  name="status"
                  rules={[
                    { required: true, message: '상태를 선택해주세요.' }
                  ]}
                >
                  <Select
                    options={[
                      { value: 'published', label: '게시' },
                      { value: 'draft', label: '초안' },
                      { value: 'hidden', label: '숨김' },
                    ]}
                  />
                </Form.Item>
              </Card>

              {/* 태그 선택 */}
              <Card title="태그 선택" style={{ marginBottom: '24px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <Text type="secondary">프로젝트와 관련된 태그를 선택하세요</Text>
                </div>
                
                <Input
                  placeholder="태그 검색..."
                  prefix={<TagsOutlined />}
                  value={tagSearchText}
                  onChange={(e) => setTagSearchText(e.target.value)}
                  style={{ marginBottom: '16px' }}
                  allowClear
                />
                
                <div style={{ maxHeight: '200px', overflow: 'auto', marginBottom: '16px' }}>
                  <Space size={[0, 8]} wrap>
                    {filteredTags.length > 0 ? (
                      filteredTags.map((tag: any) => (
                        <CheckableTag
                          key={tag.id}
                          checked={selectedTags.includes(tag.id)}
                          onChange={(checked) => handleTagChange(tag.id, checked)}
                        >
                          {tag.name}
                        </CheckableTag>
                      ))
                    ) : (
                      <Text type="secondary">태그가 없습니다</Text>
                    )}
                  </Space>
                </div>
                
                <div style={{ fontSize: '12px', color: '#666' }}>
                  <Text strong>선택된 태그: {selectedTags.length}개</Text>
                </div>
              </Card>

              {/* 연결된 아이템 */}
              <Card title="연결된 아이템" style={{ marginBottom: '24px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <Text type="secondary">프로젝트에 사용된 아이템을 선택하세요</Text>
                </div>
                
                {/* 선택된 아이템 표시 */}
                {selectedItems.length > 0 && (
                  <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '6px' }}>
                    <div style={{ marginBottom: '8px', fontWeight: 500 }}>
                      선택된 아이템 ({selectedItems.length}개)
                    </div>
                    <Space size={[8, 8]} wrap>
                      {selectedItems.map((itemId) => {
                        const item = allItems.find(i => i.id === itemId);
                        if (!item) return null;
                        return (
                          <Tag
                            key={item.id}
                            closable
                            onClose={() => handleItemChange(item.id, false)}
                            style={{ margin: 0 }}
                          >
                            {item.name}
                          </Tag>
                        );
                      })}
                    </Space>
                  </div>
                )}
                
                <Input
                  placeholder="아이템 또는 브랜드 검색..."
                  prefix={<AppstoreOutlined />}
                  value={itemSearchText}
                  onChange={(e) => setItemSearchText(e.target.value)}
                  style={{ marginBottom: '16px' }}
                  allowClear
                />
                
                {filteredItems.length > 0 ? (
                  <List
                    size="small"
                    dataSource={filteredItems}
                    renderItem={(item: any) => (
                      <List.Item style={{ padding: '8px 0', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', alignItems: 'center', width: '100%', minWidth: 0 }}>
                          <Checkbox
                            checked={selectedItems.includes(item.id)}
                            onChange={(e) => handleItemChange(item.id, e.target.checked)}
                            style={{ marginRight: '12px', flexShrink: 0 }}
                          />
                          <Avatar 
                            size={40}
                            src={item.images?.[0]?.url}
                            icon={<AppstoreOutlined />}
                            shape="square"
                            style={{ marginRight: '12px', flexShrink: 0 }}
                          />
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ 
                              fontSize: '14px', 
                              fontWeight: 500,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {item.name}
                            </div>
                            <div style={{ 
                              fontSize: '12px', 
                              color: '#999',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {item.brand?.name || '브랜드 없음'}
                            </div>
                          </div>
                        </div>
                      </List.Item>
                    )}
                    style={{ maxHeight: '300px', overflow: 'auto' }}
                  />
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <Text type="secondary">아이템이 없습니다</Text>
                  </div>
                )}
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