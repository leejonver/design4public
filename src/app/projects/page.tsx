// Design4Public CMS - 프로젝트 리스트 페이지

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Card, 
  Table, 
  Button, 
  Tag, 
  Space, 
  Typography, 
  Input,
  Select,
  Badge,
  Image,
  Tooltip,
  message
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  EyeOutlined, 
  SearchOutlined,
  ProjectOutlined
} from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';
import { api } from '@/lib/api';
import type { Project, ProjectStatus } from '@/types';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;
const { Search } = Input;

export default function ProjectsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // 프로젝트 목록 가져오기
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await api.get('/projects');
      if (response.success) {
        setProjects(response.data || []);
      } else {
        message.error('프로젝트 목록을 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('프로젝트 목록 로딩 오류:', error);
      message.error('프로젝트 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 필터링된 프로젝트 목록
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (project.location && project.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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

  // 테이블 컬럼 정의
  const columns: ColumnsType<Project> = [
    {
      title: '이미지',
      dataIndex: 'images',
      key: 'image',
      width: 80,
      render: (images: Project['images']) => {
        const mainImage = images.find(img => img.isMain) || images[0];
        return mainImage ? (
          <Image
            width={50}
            height={50}
            src={mainImage.url}
            alt={mainImage.alt}
            style={{ objectFit: 'cover', borderRadius: '4px' }}
            fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN..."
          />
        ) : (
          <div style={{ 
            width: 50, 
            height: 50, 
            backgroundColor: '#f5f5f5', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            borderRadius: '4px'
          }}>
            <ProjectOutlined style={{ color: '#bfbfbf' }} />
          </div>
        );
      },
    },
    {
      title: '프로젝트명',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Project) => (
        <div>
          <div style={{ fontWeight: 500 }}>{text}</div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            {record.description.substring(0, 50)}...
          </div>
        </div>
      ),
    },
    {
      title: '지역 · 연도',
      key: 'location',
      render: (_, record: Project) => (
        <div>
          <div>{record.location}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.completionYear}년 · {record.area.toLocaleString()}m²
          </div>
        </div>
      ),
    },
    {
      title: '태그',
      dataIndex: 'tags',
      key: 'tags',
      render: (tags: Project['tags']) => (
        <Space wrap>
          {tags.slice(0, 2).map(tag => (
            <Tag key={tag.id}>{tag.name}</Tag>
          ))}
          {tags.length > 2 && (
            <Tag color="default">+{tags.length - 2}</Tag>
          )}
        </Space>
      ),
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      render: (status: ProjectStatus) => (
        <Badge
          status={getStatusColor(status) as any}
          text={getStatusText(status)}
        />
      ),
    },
    {
      title: '연결 아이템',
      dataIndex: 'connectedItems',
      key: 'connectedItems',
      render: (items: Project['connectedItems']) => (
        <span style={{ color: '#666' }}>
          {items.length}개
        </span>
      ),
    },
    {
      title: '작업',
      key: 'actions',
      width: 120,
      render: (_, record: Project) => (
        <Space>
          <Tooltip title="상세보기">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              size="small"
              onClick={() => router.push(`/projects/${record.id}`)}
            />
          </Tooltip>
          <Tooltip title="편집">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              size="small"
              onClick={() => router.push(`/projects/${record.id}/edit`)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <MainLayout>
      <div>
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={2} style={{ margin: 0 }}>
            프로젝트 관리
          </Title>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => router.push('/projects/new')}
          >
            새 프로젝트 추가
          </Button>
        </div>

        <Card>
          {/* 검색 및 필터 */}
          <div style={{ marginBottom: '16px', display: 'flex', gap: '16px', alignItems: 'center' }}>
            <Search
              placeholder="프로젝트명, 지역 또는 설명 검색"
              allowClear
              style={{ width: 300 }}
              onChange={(e) => setSearchTerm(e.target.value)}
              prefix={<SearchOutlined />}
            />
            <Select
              style={{ width: 150 }}
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { label: '모든 상태', value: 'all' },
                { label: '게시', value: 'published' },
                { label: '초안', value: 'draft' },
                { label: '숨김', value: 'hidden' },
              ]}
            />
          </div>

          {/* 프로젝트 테이블 */}
          <Table
            columns={columns}
            dataSource={filteredProjects}
            rowKey="id"
            loading={loading}
            pagination={{
              total: filteredProjects.length,
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} / 총 ${total}개`,
            }}
            scroll={{ x: 800 }}
          />
        </Card>
      </div>
    </MainLayout>
  );
}