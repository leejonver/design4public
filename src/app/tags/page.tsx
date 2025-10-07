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
  Tooltip,
  Tabs,
  Radio,
  Badge
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  SearchOutlined,
  TagOutlined,
  ProjectOutlined,
  ShoppingOutlined
} from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';
import { api } from '@/lib/api';
import type { Tag, TagFormData, TagType } from '@/types';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;
const { Search } = Input;

export default function TagsPage() {
  const [activeTab, setActiveTab] = useState<TagType>('project');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [form] = Form.useForm();
  const [projectTags, setProjectTags] = useState<Tag[]>([]);
  const [itemTags, setItemTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  // 태그 목록 가져오기
  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      setLoading(true);
      
      // 프로젝트 태그와 아이템 태그를 동시에 가져오기
      const [projectResponse, itemResponse] = await Promise.all([
        api.get<{items: Tag[]}>('/tags?type=project'),
        api.get<{items: Tag[]}>('/tags?type=item')
      ]);
      
      if (projectResponse.success) {
        setProjectTags(projectResponse.data?.items || []);
      }
      
      if (itemResponse.success) {
        setItemTags(itemResponse.data?.items || []);
      }
      
      if (!projectResponse.success && !itemResponse.success) {
        message.error('태그 목록을 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('태그 목록 로딩 오류:', error);
      message.error('태그 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 현재 탭의 태그 목록
  const currentTags = activeTab === 'project' ? projectTags : itemTags;

  // 필터링된 태그 목록
  const filteredTags = currentTags.filter(tag => 
    tag.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 모달 열기
  const showModal = (tag?: Tag) => {
    setEditingTag(tag || null);
    setIsModalVisible(true);
    
    if (tag) {
      form.setFieldsValue({
        name: tag.name,
        type: tag.type
      });
    } else {
      form.setFieldsValue({
        type: activeTab // 현재 활성 탭의 타입으로 기본 설정
      });
      form.resetFields(['name']);
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
        // 수정 - 태그 타입은 기존 값 유지 (변경 불가)
        const payload = {
          name: values.name,
          type: editingTag.type // 기존 타입 유지
        };
        
        const response = await api.put(`/tags/${editingTag.id}`, payload);
        if (response.success) {
          message.success('태그가 수정되었습니다.');
          fetchTags(); // 목록 새로고침
          handleCancel();
        } else {
          const errorMsg = response.error || '태그 수정에 실패했습니다.';
          console.error('태그 수정 실패:', response);
          message.error(errorMsg);
        }
      } else {
        // 새로 추가
        const response = await api.post('/tags', values);
        if (response.success) {
          message.success('태그가 추가되었습니다.');
          fetchTags(); // 목록 새로고침
          handleCancel();
        } else {
          const errorMsg = response.error || '태그 추가에 실패했습니다.';
          console.error('태그 추가 실패:', response);
          message.error(errorMsg);
        }
      }
    } catch (error) {
      console.error('태그 저장 오류:', error);
      message.error(`태그 저장 중 오류가 발생했습니다: ${(error as Error).message}`);
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
      render: (_, record) => (
        <TagOutlined style={{ 
          color: record.type === 'project' ? '#1890ff' : '#52c41a', 
          fontSize: '16px' 
        }} />
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
      title: '타입',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: TagType) => (
        <Badge 
          color={type === 'project' ? 'blue' : 'green'} 
          text={type === 'project' ? '프로젝트' : '아이템'} 
        />
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

  // 탭 아이템 정의
  const tabItems = [
    {
      key: 'project',
      label: (
        <span>
          <ProjectOutlined /> 프로젝트 태그 ({projectTags.length})
        </span>
      ),
      children: (
        <>
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
        </>
      ),
    },
    {
      key: 'item',
      label: (
        <span>
          <ShoppingOutlined /> 아이템 태그 ({itemTags.length})
        </span>
      ),
      children: (
        <>
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
        </>
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
          <Tabs 
            activeKey={activeTab} 
            items={tabItems} 
            onChange={(key) => {
              setActiveTab(key as TagType);
              setSearchTerm(''); // 탭 변경 시 검색어 초기화
            }}
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
            {editingTag ? (
              // 수정 모드: 타입을 읽기 전용으로 표시
              <Form.Item label="태그 타입">
                <Badge 
                  color={editingTag.type === 'project' ? 'blue' : 'green'} 
                  text={
                    <span style={{ fontSize: '14px' }}>
                      {editingTag.type === 'project' ? (
                        <><ProjectOutlined /> 프로젝트 태그 (변경 불가)</>
                      ) : (
                        <><ShoppingOutlined /> 아이템 태그 (변경 불가)</>
                      )}
                    </span>
                  }
                />
              </Form.Item>
            ) : (
              // 생성 모드: 타입 선택 가능
              <Form.Item
                label="태그 타입"
                name="type"
                rules={[
                  { required: true, message: '태그 타입을 선택해주세요.' }
                ]}
              >
                <Radio.Group>
                  <Radio.Button value="project">
                    <ProjectOutlined /> 프로젝트
                  </Radio.Button>
                  <Radio.Button value="item">
                    <ShoppingOutlined /> 아이템
                  </Radio.Button>
                </Radio.Group>
              </Form.Item>
            )}

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
