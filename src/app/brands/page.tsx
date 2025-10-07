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
      // API 응답 타입에 맞게 수정
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
    const searchTermLower = searchTerm.toLowerCase();
    const matchesSearch = 
      brand.nameKo.toLowerCase().includes(searchTermLower) ||
      (brand.nameEn && brand.nameEn.toLowerCase().includes(searchTermLower)) ||
      (brand.description && brand.description.toLowerCase().includes(searchTermLower));
    return matchesSearch;
  });

  // 테이블 컬럼 정의
  const columns: ColumnsType<Brand> = [
    {
      title: '로고',
      dataIndex: 'logoImageUrl',
      key: 'logo',
      width: 80,
      render: (logoUrl: string, record: Brand) => (
        logoUrl ? (
          <Avatar
            size={50}
            src={logoUrl}
            alt={`${record.nameKo} 로고`}
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
      dataIndex: 'nameKo',
      key: 'name',
      render: (text: string, record: Brand) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.nameKo}</div>
          {record.nameEn && <div style={{ fontSize: '12px', color: '#888' }}>{record.nameEn}</div>}
        </div>
      ),
    },
    {
      title: '설명',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text}>
          {text}
        </Tooltip>
      )
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
              placeholder="한글/영문 브랜드명 검색"
              allowClear
              style={{ width: 300 }}
              onChange={(e) => setSearchTerm(e.target.value)}
              prefix={<SearchOutlined />}
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