// Design4Public CMS - 브랜드 리스트 페이지

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
  Avatar,
  message
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  EyeOutlined, 
  SearchOutlined,
  ShopOutlined,
  LinkOutlined,
  GlobalOutlined
} from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';
import { api } from '@/lib/api';
import type { Brand, BrandStatus } from '@/types';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;
const { Search } = Input;

export default function BrandsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<BrandStatus | 'all'>('all');
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  // 브랜드 목록 가져오기
  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      setLoading(true);
      const response = await api.get<{items: Brand[]}>('/brands');
      if (response.success) {
        setBrands(response.data?.items || []);
      } else {
        message.error('브랜드 목록을 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('브랜드 목록 로딩 오류:', error);
      message.error('브랜드 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 필터링된 브랜드 목록
  const filteredBrands = brands.filter(brand => {
    const matchesSearch = brand.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (brand.description && brand.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || brand.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // 상태별 색상 매핑
  const getStatusColor = (status: BrandStatus) => {
    switch (status) {
      case 'visible':
        return 'success';
      case 'hidden':
        return 'default';
      default:
        return 'default';
    }
  };

  // 상태별 텍스트 매핑
  const getStatusText = (status: BrandStatus) => {
    switch (status) {
      case 'visible':
        return '노출';
      case 'hidden':
        return '숨김';
      default:
        return status;
    }
  };

  // 테이블 컬럼 정의
  const columns: ColumnsType<Brand> = [
    {
      title: '로고',
      dataIndex: 'logoImage',
      key: 'logo',
      width: 80,
      render: (logoImage: Brand['logoImage'], record: Brand) => (
        logoImage ? (
          <Avatar
            size={50}
            src={logoImage.url}
            alt={logoImage.alt}
          />
        ) : (
          <Avatar 
            size={50}
            style={{ backgroundColor: '#f5f5f5', color: '#bfbfbf' }}
          >
            <ShopOutlined />
          </Avatar>
        )
      ),
    },
    {
      title: '브랜드명',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Brand) => (
        <div>
          <div style={{ fontWeight: 500, marginBottom: '4px' }}>{text}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.description.substring(0, 60)}...
          </div>
        </div>
      ),
    },
    {
      title: '웹사이트',
      dataIndex: 'websiteUrl',
      key: 'websiteUrl',
      render: (url: string) => (
        url ? (
          <Tooltip title="웹사이트 방문">
            <Button 
              type="text" 
              icon={<GlobalOutlined />} 
              size="small"
              onClick={() => window.open(url, '_blank')}
            />
          </Tooltip>
        ) : (
          <span style={{ color: '#bfbfbf' }}>-</span>
        )
      ),
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      render: (status: BrandStatus) => (
        <Badge
          status={getStatusColor(status) as any}
          text={getStatusText(status)}
        />
      ),
    },
    {
      title: '등록일',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString('ko-KR'),
    },
    {
      title: '작업',
      key: 'actions',
      width: 120,
      render: (_, record: Brand) => (
        <Space>
          <Tooltip title="상세보기">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              size="small"
              onClick={() => router.push(`/brands/${record.id}`)}
            />
          </Tooltip>
          <Tooltip title="편집">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              size="small"
              onClick={() => router.push(`/brands/${record.id}/edit`)}
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
            브랜드 관리
          </Title>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => router.push('/brands/new')}
          >
            새 브랜드 추가
          </Button>
        </div>

        <Card>
          {/* 검색 및 필터 */}
          <div style={{ marginBottom: '16px', display: 'flex', gap: '16px', alignItems: 'center' }}>
            <Search
              placeholder="브랜드명 또는 설명 검색"
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
                { label: '노출', value: 'visible' },
                { label: '숨김', value: 'hidden' },
              ]}
            />
          </div>

          {/* 브랜드 테이블 */}
          <Table
            columns={columns}
            dataSource={filteredBrands}
            rowKey="id"
            loading={loading}
            pagination={{
              total: filteredBrands.length,
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