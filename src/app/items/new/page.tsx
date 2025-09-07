// Design4Public CMS - 새 아이템 추가 페이지

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
  Switch,
  Divider
} from 'antd';
import { 
  ArrowLeftOutlined, 
  SaveOutlined, 
  PlusOutlined,
  UploadOutlined,
  LinkOutlined,
  AppstoreOutlined
} from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';
import { dummyBrands, dummyTags } from '@/data/dummyData';
import type { ItemFormData, ItemStatus } from '@/types';
import type { UploadProps } from 'antd';

const { Title } = Typography;
const { TextArea } = Input;

export default function NewItemPage() {
  const router = useRouter();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState<any[]>([]);

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
      // 미리보기 기능 (실제 구현 시 모달로 처리)
      console.log('Preview:', file);
    },
  };

  const handleSubmit = async (values: ItemFormData) => {
    setLoading(true);
    
    try {
      // 실제로는 API 호출을 해야 함
      console.log('새 아이템 데이터:', values);
      console.log('업로드된 파일들:', fileList);
      
      // 성공 메시지
      message.success('아이템이 성공적으로 추가되었습니다!');
      
      // 아이템 리스트로 이동
      router.push('/items');
      
    } catch (error) {
      message.error('아이템 추가 중 오류가 발생했습니다.');
    } finally {\n      setLoading(false);\n    }\n  };\n\n  const handleCancel = () => {\n    router.back();\n  };\n\n  return (\n    <MainLayout>\n      <div>\n        {/* 헤더 */}\n        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>\n          <Space>\n            <Button \n              icon={<ArrowLeftOutlined />} \n              onClick={handleCancel}\n            >\n              돌아가기\n            </Button>\n            <Title level={2} style={{ margin: 0 }}>\n              새 아이템 추가\n            </Title>\n          </Space>\n        </div>\n\n        <Form\n          form={form}\n          layout=\"vertical\"\n          onFinish={handleSubmit}\n          initialValues={{\n            status: 'available'\n          }}\n        >\n          <Row gutter={[24, 0]}>\n            {/* 기본 정보 */}\n            <Col xs={24} lg={14}>\n              <Card title=\"기본 정보\" style={{ marginBottom: '24px' }}>\n                <Form.Item\n                  label=\"아이템명\"\n                  name=\"name\"\n                  rules={[\n                    { required: true, message: '아이템명을 입력해주세요.' },\n                    { min: 2, max: 100, message: '아이템명은 2-100자 사이여야 합니다.' }\n                  ]}\n                >\n                  <Input \n                    placeholder=\"아이템명을 입력하세요\"\n                    prefix={<AppstoreOutlined />}\n                    showCount\n                    maxLength={100}\n                  />\n                </Form.Item>\n\n                <Form.Item\n                  label=\"아이템 설명\"\n                  name=\"description\"\n                  rules={[\n                    { required: true, message: '아이템 설명을 입력해주세요.' },\n                    { min: 10, max: 1000, message: '설명은 10-1000자 사이여야 합니다.' }\n                  ]}\n                >\n                  <TextArea\n                    rows={4}\n                    placeholder=\"아이템에 대한 자세한 설명을 입력하세요\"\n                    showCount\n                    maxLength={1000}\n                  />\n                </Form.Item>\n\n                <Form.Item\n                  label=\"나라장터 URL\"\n                  name=\"mallUrl\"\n                  rules={[\n                    { type: 'url', message: '올바른 URL을 입력해주세요.' }\n                  ]}\n                >\n                  <Input \n                    placeholder=\"https://mall.g2b.go.kr/...\"\n                    prefix={<LinkOutlined />}\n                  />\n                </Form.Item>\n              </Card>\n\n              {/* 이미지 업로드 */}\n              <Card title=\"아이템 이미지\">\n                <Form.Item\n                  label=\"이미지 업로드\"\n                  extra=\"여러 장의 이미지를 업로드할 수 있습니다. 첫 번째 이미지가 대표 이미지로 설정됩니다.\"\n                >\n                  <Upload {...uploadProps}>\n                    <div>\n                      <PlusOutlined />\n                      <div style={{ marginTop: 8 }}>이미지 업로드</div>\n                    </div>\n                  </Upload>\n                </Form.Item>\n              </Card>\n            </Col>\n\n            {/* 분류 및 상태 */}\n            <Col xs={24} lg={10}>\n              <Card title=\"분류 및 상태\" style={{ marginBottom: '24px' }}>\n                <Form.Item\n                  label=\"브랜드\"\n                  name=\"brandId\"\n                  rules={[\n                    { required: true, message: '브랜드를 선택해주세요.' }\n                  ]}\n                >\n                  <Select\n                    placeholder=\"브랜드를 선택하세요\"\n                    showSearch\n                    optionFilterProp=\"children\"\n                    filterOption={(input, option) =>\n                      (option?.label ?? '').toLowerCase().includes(input.toLowerCase())\n                    }\n                    options={dummyBrands.map(brand => ({\n                      value: brand.id,\n                      label: brand.name\n                    }))}\n                  />\n                </Form.Item>\n\n                <Form.Item\n                  label=\"태그\"\n                  name=\"tags\"\n                  rules={[\n                    { required: true, message: '최소 1개의 태그를 선택해주세요.' }\n                  ]}\n                >\n                  <Select\n                    mode=\"multiple\"\n                    placeholder=\"태그를 선택하세요\"\n                    showSearch\n                    optionFilterProp=\"children\"\n                    filterOption={(input, option) =>\n                      (option?.label ?? '').toLowerCase().includes(input.toLowerCase())\n                    }\n                    options={dummyTags.map(tag => ({\n                      value: tag.id,\n                      label: tag.name\n                    }))}\n                  />\n                </Form.Item>\n\n                <Divider />\n\n                <Form.Item\n                  label=\"상태\"\n                  name=\"status\"\n                  rules={[\n                    { required: true, message: '상태를 선택해주세요.' }\n                  ]}\n                >\n                  <Select\n                    options={[\n                      { value: 'available', label: '구입가능' },\n                      { value: 'discontinued', label: '단종' },\n                      { value: 'hidden', label: '숨김' },\n                    ]}\n                  />\n                </Form.Item>\n              </Card>\n\n              {/* 저장 버튼 */}\n              <Card>\n                <Space direction=\"vertical\" style={{ width: '100%' }}>\n                  <Button\n                    type=\"primary\"\n                    htmlType=\"submit\"\n                    loading={loading}\n                    icon={<SaveOutlined />}\n                    style={{ width: '100%' }}\n                    size=\"large\"\n                  >\n                    {loading ? '저장 중...' : '아이템 저장'}\n                  </Button>\n                  \n                  <Button\n                    onClick={handleCancel}\n                    style={{ width: '100%' }}\n                  >\n                    취소\n                  </Button>\n                </Space>\n              </Card>\n            </Col>\n          </Row>\n        </Form>\n      </div>\n    </MainLayout>\n  );\n}"