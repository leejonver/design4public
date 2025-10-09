// Design4Public CMS - 프로젝트 상세 페이지

'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { 
  Card, 
  Descriptions, 
  Button, 
  Tag, 
  Space, 
  Typography, 
  Image,
  Badge,
  Row,
  Col,
  Empty,
  List,
  Avatar,
  Popconfirm,
  message,
  Spin
} from 'antd';
import { 
  EditOutlined, 
  ArrowLeftOutlined,
  DeleteOutlined,
  LinkOutlined,
  ProjectOutlined,
  AppstoreOutlined
} from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';
import { api } from '@/lib/api';
import type { ProjectStatus } from '@/types';

const { Title, Paragraph, Text } = Typography;

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.project_id as string;
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 프로젝트 데이터 조회
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
        setLoading(false);
      }
    };

    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  if (loading) {
    return (
      <MainLayout>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
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

  // 상태별 색상 매핑
  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case 'published':
        return 'success';
      case 'draft':
        return 'default';
      case 'hidden':
        return 'warning';
      default:
        return 'default';
    }
  };

  // 상태별 텍스트 매핑
  const getStatusText = (status: ProjectStatus) => {
    switch (status) {
      case 'published':
        return '게시';
      case 'draft':
        return '초안';
      case 'hidden':
        return '숨김';
      default:
        return status;
    }
  };

  const handleDelete = async () => {
    try {
      const response = await api.delete(`/projects/${projectId}`);
      if (response.success) {
        message.success('프로젝트가 삭제되었습니다.');
        router.push('/projects');
      } else {
        message.error(response.error || '프로젝트 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('프로젝트 삭제 오류:', error);
      message.error('프로젝트 삭제 중 오류가 발생했습니다.');
    }
  };

  const mainImage = project.images?.find((img: any) => img.isMain) || project.images?.[0];

  return (
    <MainLayout>
      <div>
        {/* 헤더 */}
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={() => router.back()}
            >
              돌아가기
            </Button>
            <Title level={2} style={{ margin: 0 }}>
              {project.name}
            </Title>
          </Space>
          <Space>
            <Button 
              type="primary" 
              icon={<EditOutlined />}
              onClick={() => router.push(`/projects/${project.id}/edit`)}
            >
              편집
            </Button>
            <Popconfirm
              title="프로젝트 삭제"
              description="정말로 이 프로젝트를 삭제하시겠습니까?"
              okText="삭제"
              cancelText="취소"
              onConfirm={handleDelete}
            >
              <Button danger icon={<DeleteOutlined />}>
                삭제
              </Button>
            </Popconfirm>
          </Space>
        </div>

        {/* 프로젝트 이미지들 */}
        {(project.images?.length || 0) > 0 && (
          <Card title="프로젝트 이미지" style={{ marginBottom: '24px' }}>
            <Row gutter={[16, 16]}>
              {project.images?.map((image: any) => (
                <Col key={image.id} xs={24} sm={12} md={8} lg={6}>
                  <Image
                    width="100%"
                    height={200}
                    src={image.url}
                    alt={image.alt}
                    style={{ objectFit: 'cover', borderRadius: '8px' }}
                  />
                  {image.isMain && (
                    <div style={{ textAlign: 'center', marginTop: '8px' }}>
                      <Tag color="gold">대표 이미지</Tag>
                    </div>
                  )}
                </Col>
              ))}
            </Row>
          </Card>
        )}

        <Row gutter={[24, 24]}>
          {/* 기본 정보 */}
          <Col xs={24} lg={16}>
            <Card title="프로젝트 정보">
              <Descriptions column={1} bordered>
                <Descriptions.Item label="프로젝트명">
                  <Text strong>{project.name}</Text>
                </Descriptions.Item>
                
                <Descriptions.Item label="설명">
                  <Paragraph>{project.description}</Paragraph>
                </Descriptions.Item>
                
                <Descriptions.Item label="프로젝트 지역">
                  {project.location}
                </Descriptions.Item>
                
                <Descriptions.Item label="완공연도">
                  {project.completionYear}년
                </Descriptions.Item>
                
                <Descriptions.Item label="면적">
                  {project.area.toLocaleString()}m²
                </Descriptions.Item>
                
                <Descriptions.Item label="상태">
                  <Badge
                    status={getStatusColor(project.status) as any}
                    text={getStatusText(project.status)}
                  />
                </Descriptions.Item>
                
                <Descriptions.Item label="문의 URL">
                  {project.inquiryUrl ? (
                    <Button 
                      type="link" 
                      icon={<LinkOutlined />}
                      onClick={() => window.open(project.inquiryUrl, '_blank')}
                      style={{ padding: 0 }}
                    >
                      문의하기
                    </Button>
                  ) : (
                    <Text type="secondary">등록되지 않음</Text>
                  )}
                </Descriptions.Item>
                
                <Descriptions.Item label="태그">
                  <Space wrap>
                    {project.tags?.map((tag: any) => (
                      <Tag key={tag.id}>{tag.name}</Tag>
                    ))}
                  </Space>
                </Descriptions.Item>
                
                <Descriptions.Item label="등록일">
                  {new Date(project.createdAt).toLocaleDateString('ko-KR')}
                </Descriptions.Item>
                
                <Descriptions.Item label="수정일">
                  {new Date(project.updatedAt).toLocaleDateString('ko-KR')}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>

          {/* 연결된 아이템 */}
          <Col xs={24} lg={8}>
            <Card 
              title={`연결된 아이템 (${project.connectedItems.length}개)`}
              extra={
                project.connectedItems.length > 0 && (
                  <Button 
                    type="link" 
                    onClick={() => router.push('/items')}
                  >
                    전체보기
                  </Button>
                )
              }
            >
              {(project.connectedItems?.length || 0) > 0 ? (
                <List
                  dataSource={project.connectedItems || []}
                  renderItem={(item: any) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={
                          item.images?.[0] ? (
                            <Avatar 
                              size={40}
                              src={item.images?.[0]?.url}
                              shape="square"
                            />
                          ) : (
                            <Avatar 
                              size={40}
                              icon={<AppstoreOutlined />}
                              shape="square"
                            />
                          )
                        }
                        title={
                          <Button 
                            type="link" 
                            style={{ padding: 0, height: 'auto' }}
                            onClick={() => router.push(`/items/${item.id}`)}
                          >
                            {item.name}
                          </Button>
                        }
                        description={item.brand.name}
                      />
                    </List.Item>
                  )}
                />
              ) : (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '40px 0',
                  color: '#999'
                }}>
                  <AppstoreOutlined style={{ fontSize: '32px', marginBottom: '8px' }} />
                  <div>연결된 아이템이 없습니다</div>
                </div>
              )}
            </Card>
          </Col>
        </Row>
      </div>
    </MainLayout>
  );
}