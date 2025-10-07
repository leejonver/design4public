// Design4Public CMS - 아이템 리스트 페이지

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
  ShopOutlined,
  LinkOutlined
} from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';
import { api } from '@/lib/api';
import type { Item, ItemStatus } from '@/types';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;
const { Search } = Input;

export default function ItemsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ItemStatus | 'all'>('all');
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  // 아이템 목록 가져오기
  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await api.get<{items: Item[]}>('/items');
      if (response.success) {
        setItems(response.data?.items || []);
      } else {
        message.error('아이템 목록을 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('아이템 목록 로딩 오류:', error);
      message.error('아이템 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 필터링된 아이템 목록
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // 상태별 색상 매핑
  const getStatusColor = (status: ItemStatus) => {
    switch (status) {
      case 'available':
        return 'success';
      case 'discontinued':
        return 'error';
      case 'hidden':
        return 'default';
      default:
        return 'default';
    }
  };

  // 상태별 텍스트 매핑
  const getStatusText = (status: ItemStatus) => {
    switch (status) {
      case 'available':
        return '구입가능';
      case 'discontinued':
        return '단종';
      case 'hidden':
        return '숨김';
      default:
        return status;
    }
  };

  // 테이블 컬럼 정의
  const columns: ColumnsType<Item> = [
    {
      title: '이미지',
      dataIndex: 'images',
      key: 'image',
      width: 100,
      render: (images: Item['images']) => {
        const mainImage = Array.isArray(images) && images.length > 0 
          ? (images.find(img => img.isMain) || images[0]) 
          : null;
        
        return mainImage ? (
          <Image
            width={60}
            height={60}
            src={mainImage.url}
            alt={mainImage.alt || '아이템 이미지'}
            style={{ objectFit: 'cover', borderRadius: '8px' }}
            preview={{
              mask: <div style={{ fontSize: '12px' }}>미리보기</div>
            }}
            fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN..."
          />
        ) : (
          <div style={{ 
            width: 60, 
            height: 60, 
            backgroundColor: '#f5f5f5', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            borderRadius: '8px',
            border: '1px dashed #d9d9d9'
          }}>
            <ShopOutlined style={{ fontSize: '20px', color: '#bfbfbf' }} />
          </div>
        );
      },
    },
    {
      title: '아이템명',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Item) => (
        <div>
          <div style={{ fontWeight: 500 }}>{text}</div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            {record.description.substring(0, 50)}...
          </div>
        </div>
      ),
    },
    {
      title: '브랜드',
      dataIndex: 'brand',
      key: 'brand',
      render: (brand: Item['brand']) => (
        <Tag color="blue">{brand.name}</Tag>
      ),
    },
    {
      title: '태그',
      dataIndex: 'tags',
      key: 'tags',
      render: (tags: Item['tags']) => (
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
      render: (status: ItemStatus) => (
        <Badge
          status={getStatusColor(status) as any}
          text={getStatusText(status)}
        />
      ),
    },
    {
      title: '나라장터',
      dataIndex: 'mallUrl',
      key: 'mallUrl',
      render: (url: string) => (
        url ? (
          <Tooltip title="나라장터에서 보기">
            <Button 
              type="text" 
              icon={<LinkOutlined />} 
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
      title: '작업',
      key: 'actions',
      width: 120,
      render: (_, record: Item) => (
        <Space>
          <Tooltip title="상세보기">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              size="small"
              onClick={() => router.push(`/items/${record.id}`)}
            />
          </Tooltip>
          <Tooltip title="편집">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              size="small"
              onClick={() => router.push(`/items/${record.id}/edit`)}
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
            아이템 관리
          </Title>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => router.push('/items/new')}
          >
            새 아이템 추가
          </Button>
        </div>

        <Card>
          {/* 검색 및 필터 */}
          <div style={{ marginBottom: '16px', display: 'flex', gap: '16px', alignItems: 'center' }}>
            <Search
              placeholder="아이템명 또는 설명 검색"
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
                { label: '구입가능', value: 'available' },
                { label: '단종', value: 'discontinued' },
                { label: '숨김', value: 'hidden' },
              ]}
            />
          </div>

          {/* 아이템 테이블 */}
          <Table
            columns={columns}
            dataSource={filteredItems}
            rowKey="id"
            loading={loading}
            pagination={{
              total: filteredItems.length,
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