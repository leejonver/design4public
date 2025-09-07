// Design4Public CMS - 브랜드 상세 페이지

'use client';

import { useRouter, useParams } from 'next/navigation';
import { 
  Card, 
  Descriptions, 
  Button, 
  Space, 
  Typography, 
  Image,
  Badge,
  Row,
  Col,
  Empty,
  Avatar,
  Divider
} from 'antd';
import { 
  EditOutlined, 
  ArrowLeftOutlined,
  GlobalOutlined,
  ShopOutlined
} from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';
import { dummyBrands } from '@/data/dummyData';
import type { BrandStatus } from '@/types';

const { Title, Paragraph, Text } = Typography;

export default function BrandDetailPage() {
  const router = useRouter();
  const params = useParams();
  const brandId = params.brand_id as string;

  // 브랜드 데이터 조회
  const brand = dummyBrands.find(brand => brand.id === brandId);

  if (!brand) {
    return (
      <MainLayout>
        <Empty description="브랜드를 찾을 수 없습니다." />
      </MainLayout>
    );
  }

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
              {brand.name}
            </Title>
          </Space>
          <Button 
            type="primary" 
            icon={<EditOutlined />}
            onClick={() => router.push(`/brands/${brand.id}/edit`)}
          >
            편집
          </Button>
        </div>

        {/* 브랜드 커버 이미지 */}
        {brand.coverImage && (
          <Card style={{ marginBottom: '24px' }}>
            <Image
              width="100%"
              height={300}
              src={brand.coverImage.url}
              alt={brand.coverImage.alt}
              style={{ objectFit: 'cover', borderRadius: '8px' }}
            />
          </Card>
        )}

        <Row gutter={[24, 24]}>
          {/* 브랜드 로고 및 기본 정보 */}
          <Col xs={24} lg={8}>
            <Card title="브랜드 로고">
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                {brand.logoImage ? (
                  <Avatar
                    size={120}
                    src={brand.logoImage.url}
                    alt={brand.logoImage.alt}
                  />
                ) : (
                  <Avatar 
                    size={120}
                    style={{ backgroundColor: '#f5f5f5', color: '#bfbfbf' }}
                  >
                    <ShopOutlined style={{ fontSize: '48px' }} />
                  </Avatar>
                )}
                <Title level={3} style={{ marginTop: '16px', marginBottom: '8px' }}>
                  {brand.name}
                </Title>
                <Badge
                  status={getStatusColor(brand.status) as any}
                  text={getStatusText(brand.status)}
                />
              </div>
            </Card>
          </Col>

          {/* 상세 정보 */}
          <Col xs={24} lg={16}>
            <Card title="브랜드 정보">
              <Descriptions column={1} bordered>
                <Descriptions.Item label="브랜드명">
                  <Text strong>{brand.name}</Text>
                </Descriptions.Item>
                
                <Descriptions.Item label="브랜드 설명">
                  <Paragraph>{brand.description}</Paragraph>
                </Descriptions.Item>
                
                <Descriptions.Item label="상태">
                  <Badge
                    status={getStatusColor(brand.status) as any}
                    text={getStatusText(brand.status)}
                  />
                </Descriptions.Item>
                
                <Descriptions.Item label="웹사이트">
                  {brand.websiteUrl ? (
                    <Button 
                      type="link" 
                      icon={<GlobalOutlined />}
                      onClick={() => window.open(brand.websiteUrl, '_blank')}
                      style={{ padding: 0 }}
                    >
                      {brand.websiteUrl}
                    </Button>
                  ) : (
                    <Text type="secondary">등록되지 않음</Text>
                  )}
                </Descriptions.Item>
                
                <Descriptions.Item label="등록일">
                  {new Date(brand.createdAt).toLocaleDateString('ko-KR')}
                </Descriptions.Item>
                
                <Descriptions.Item label="수정일">
                  {new Date(brand.updatedAt).toLocaleDateString('ko-KR')}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
        </Row>

        {/* 추가 정보 (필요시 확장 가능) */}
        <Card title="추가 정보" style={{ marginTop: '24px' }}>
          <Row gutter={[24, 16]}>
            <Col span={12}>
              <div>
                <Text type="secondary">등록 ID</Text>
                <div>{brand.id}</div>
              </div>
            </Col>
            <Col span={12}>
              <div>
                <Text type="secondary">최종 수정일시</Text>
                <div>{new Date(brand.updatedAt).toLocaleString('ko-KR')}</div>
              </div>
            </Col>
          </Row>
        </Card>
      </div>
    </MainLayout>
  );
}