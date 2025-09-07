// Design4Public CMS - 태그 관리 페이지

'use client';

import { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Space, 
  Typography, 
  Input,
  Modal,
  Form,
  message,
  Popconfirm,
  Tooltip
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  SearchOutlined,
  TagOutlined
} from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';
import { api } from '@/lib/api';
import type { Tag, TagFormData } from '@/types';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;
const { Search } = Input;

export default function TagsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [form] = Form.useForm();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  // 태그 목록 가져오기
  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      setLoading(true);
      const response = await api.get('/tags');
      if (response.success) {
        setTags(response.data || []);
      } else {
        message.error('태그 목록을 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('태그 목록 로딩 오류:', error);
      message.error('태그 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 필터링된 태그 목록
  const filteredTags = tags.filter(tag => 
    tag.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 모달 열기
  const showModal = (tag?: Tag) => {
    setEditingTag(tag || null);
    setIsModalVisible(true);
    
    if (tag) {
      form.setFieldsValue({
        name: tag.name
      });
    } else {
      form.resetFields();
    }
  };

  // 모달 닫기
  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingTag(null);
    form.resetFields();
  };

  // 태그 저장
  const handleSave = async (values: TagFormData) => {
    try {
      if (editingTag) {
        // 수정
        const response = await api.put(`/tags/${editingTag.id}`, values);
        if (response.success) {
          message.success('태그가 수정되었습니다.');
          fetchTags(); // 목록 새로고침
        } else {
          message.error('태그 수정에 실패했습니다.');
        }
      } else {
        // 새로 추가
        const response = await api.post('/tags', values);
        if (response.success) {
          message.success('태그가 추가되었습니다.');
          fetchTags(); // 목록 새로고침
        } else {
          message.error('태그 추가에 실패했습니다.');
        }
      }
      
      handleCancel();
    } catch (error) {
      console.error('태그 저장 오류:', error);
      message.error('태그 저장 중 오류가 발생했습니다.');
    }
  };

  // 태그 삭제
  const handleDelete = async (tagId: string) => {
    try {
      const response = await api.delete(`/tags/${tagId}`);
      if (response.success) {
        message.success('태그가 삭제되었습니다.');
        fetchTags(); // 목록 새로고침
      } else {
        message.error('태그 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('태그 삭제 오류:', error);
      message.error('태그 삭제 중 오류가 발생했습니다.');
    }
  };

  // 테이블 컬럼 정의
  const columns: ColumnsType<Tag> = [
    {
      title: '아이콘',
      width: 60,
      render: () => (
        <TagOutlined style={{ color: '#1890ff', fontSize: '16px' }} />
      ),
    },
    {
      title: '태그명',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => (
        <span style={{ fontWeight: 500 }}>{text}</span>
      ),
    },
    {
      title: '등록일',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (date: string) => new Date(date).toLocaleDateString('ko-KR'),
    },
    {
      title: '수정일',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 150,
      render: (date: string) => new Date(date).toLocaleDateString('ko-KR'),
    },
    {
      title: '작업',
      key: 'actions',
      width: 120,
      render: (_, record: Tag) => (
        <Space>
          <Tooltip title="편집">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              size="small"
              onClick={() => showModal(record)}
            />
          </Tooltip>
          <Popconfirm
            title="태그 삭제"
            description="이 태그를 삭제하시겠습니까?"
            okText="삭제"
            cancelText="취소"
            onConfirm={() => handleDelete(record.id)}
          >
            <Tooltip title="삭제">
              <Button 
                type="text" 
                danger
                icon={<DeleteOutlined />} 
                size="small"
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <MainLayout>
      <div>
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={2} style={{ margin: 0 }}>
            태그 관리
          </Title>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => showModal()}
          >
            새 태그 추가
          </Button>
        </div>

        <Card>
          {/* 검색 */}
          <div style={{ marginBottom: '16px' }}>
            <Search
              placeholder="태그명 검색"
              allowClear
              style={{ width: 300 }}
              onChange={(e) => setSearchTerm(e.target.value)}
              prefix={<SearchOutlined />}
            />
          </div>

          {/* 태그 테이블 */}
          <Table
            columns={columns}
            dataSource={filteredTags}
            rowKey="id"
            loading={loading}
            pagination={{
              total: filteredTags.length,
              pageSize: 20,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} / 총 ${total}개`,
            }}
            size="middle"
          />
        </Card>

        {/* 태그 추가/수정 모달 */}
        <Modal
          title={editingTag ? '태그 수정' : '새 태그 추가'}
          open={isModalVisible}
          onCancel={handleCancel}
          footer={null}
          width={500}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSave}
            style={{ marginTop: '20px' }}
          >
            <Form.Item
              label="태그명"
              name="name"
              rules={[
                { required: true, message: '태그명을 입력해주세요.' },
                { min: 1, max: 20, message: '태그명은 1-20자 사이여야 합니다.' },
                { 
                  pattern: /^[가-힣a-zA-Z0-9\s]+$/, 
                  message: '태그명은 한글, 영문, 숫자만 사용할 수 있습니다.' 
                }
              ]}
            >
              <Input 
                placeholder="태그명을 입력하세요"
                prefix={<TagOutlined />}
                maxLength={20}
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
              <Space>
                <Button onClick={handleCancel}>
                  취소
                </Button>
                <Button type="primary" htmlType="submit">
                  {editingTag ? '수정' : '추가'}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </MainLayout>
  );
}