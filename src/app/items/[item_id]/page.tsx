// Design4Public CMS - 아이템 상세 페이지

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
  Divider,
  Row,
  Col,
  Empty,
  Spin
} from 'antd';
import { 
  EditOutlined, 
  ArrowLeftOutlined,
  LinkOutlined,
  ShopOutlined
} from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';
import { api } from '@/lib/api';
import type { ItemStatus } from '@/types';

const { Title, Paragraph, Text } = Typography;

export default function ItemDetailPage() {
  const router = useRouter();
  const params = useParams();
  const itemId = params.item_id as string;
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 아이템 데이터 조회
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
        setLoading(false);
      }
    };

    if (itemId) {
      fetchItem();
    }
  }, [itemId]);

  if (loading) {
    return (
      <MainLayout>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
        </div>
      </MainLayout>
    );
  }

  if (!item) {
    return (
      <MainLayout>
        <Empty description="아이템을 찾을 수 없습니다." />
      </MainLayout>
    );
  }

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

  const mainImage = item.images?.find((img: any) => img.isMain) || item.images?.[0];

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
              {item.name}
            </Title>
          </Space>
          <Button 
            type="primary" 
            icon={<EditOutlined />}
            onClick={() => router.push(`/items/${item.id}/edit`)}
          >
            편집
          </Button>
        </div>

        <Row gutter={[24, 24]}>
          {/* 이미지 영역 */}
          <Col xs={24} lg={10}>
            <Card title="아이템 이미지">
              {mainImage ? (
                <div>
                  <Image
                    width="100%"
                    height={300}
                    src={mainImage.url}
                    alt={mainImage.alt}
                    style={{ objectFit: 'cover', borderRadius: '8px' }}
                  />
                  
                  {(item.images?.length || 0) > 1 && (
                    <div style={{ marginTop: '16px' }}>
                      <Text strong>추가 이미지</Text>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                        {item.images?.filter((img: any) => !img.isMain).map((img: any) => (
                          <Image
                            key={img.id}
                            width={80}
                            height={80}
                            src={img.url}
                            alt={img.alt}
                            style={{ objectFit: 'cover', borderRadius: '4px' }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{
                  height: 300,
                  backgroundColor: '#f5f5f5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  borderRadius: '8px'
                }}>
                  <ShopOutlined style={{ fontSize: '48px', color: '#bfbfbf' }} />
                  <Text type="secondary" style={{ marginTop: '8px' }}>이미지 없음</Text>
                </div>
              )}
            </Card>
          </Col>

          {/* 정보 영역 */}
          <Col xs={24} lg={14}>
            <Card title="아이템 정보">
              <Descriptions column={1} bordered>
                <Descriptions.Item label="아이템명">
                  <Text strong>{item.name}</Text>
                </Descriptions.Item>
                
                <Descriptions.Item label="설명">
                  <Paragraph>{item.description}</Paragraph>
                </Descriptions.Item>
                
                <Descriptions.Item label="브랜드">
                  <Tag 
                    color="blue" 
                    style={{ cursor: 'pointer' }}
                    onClick={() => router.push(`/brands/${item.brand.id}`)}
                  >
                    {item.brand.name}
                  </Tag>
                </Descriptions.Item>
                
                <Descriptions.Item label="상태">
                  <Badge
                    status={getStatusColor(item.status) as any}
                    text={getStatusText(item.status)}
                  />
                </Descriptions.Item>
                
                <Descriptions.Item label="나라장터 URL">
                  {item.mallUrl ? (
                    <Button 
                      type="link" 
                      icon={<LinkOutlined />}
                      onClick={() => window.open(item.mallUrl, '_blank')}
                      style={{ padding: 0 }}
                    >
                      나라장터에서 보기
                    </Button>
                  ) : (
                    <Text type="secondary">등록되지 않음</Text>
                  )}
                </Descriptions.Item>
                
                <Descriptions.Item label="태그">
                  <Space wrap>
                    {item.tags?.map((tag: any) => (
                      <Tag key={tag.id}>{tag.name}</Tag>
                    ))}
                  </Space>
                </Descriptions.Item>
                
                <Descriptions.Item label="등록일">
                  {new Date(item.createdAt).toLocaleDateString('ko-KR')}
                </Descriptions.Item>
                
                <Descriptions.Item label="수정일">
                  {new Date(item.updatedAt).toLocaleDateString('ko-KR')}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
        </Row>

        {/* 브랜드 정보 */}
        <Card 
          title="브랜드 정보" 
          style={{ marginTop: '24px' }}
          extra={
            <Button 
              type="link" 
              onClick={() => router.push(`/brands/${item.brand.id}`)}
            >
              브랜드 상세보기
            </Button>
          }
        >
          <Row gutter={[16, 16]} align="middle">
            <Col>
              {item.brand.logoImage ? (
                <Image
                  width={60}
                  height={60}
                  src={item.brand.logoImage.url}
                  alt={item.brand.logoImage.alt}
                  style={{ objectFit: 'cover', borderRadius: '50%' }}
                />
              ) : (
                <div style={{
                  width: 60,
                  height: 60,
                  backgroundColor: '#f5f5f5',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <ShopOutlined style={{ color: '#bfbfbf' }} />
                </div>
              )}
            </Col>
            <Col flex="1">
              <div>
                <Text strong style={{ fontSize: '16px' }}>{item.brand.name}</Text>
                <Paragraph type="secondary" style={{ margin: '4px 0 0 0' }}>
                  {item.brand.description}
                </Paragraph>
              </div>
            </Col>
          </Row>
        </Card>
      </div>
    </MainLayout>
  );
}