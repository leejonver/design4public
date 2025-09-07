// Design4Public CMS - 관리자 관리 페이지

'use client';

import { useState } from 'react';
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
  Avatar,
  message,
  Popconfirm
} from 'antd';
import { 
  UserOutlined, 
  SearchOutlined,
  CrownOutlined,
  SafetyCertificateOutlined,
  FileTextOutlined,
  EditOutlined,
  CheckOutlined,
  CloseOutlined
} from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';
import { dummyManagers, currentUser } from '@/data/dummyData';
import type { Manager, ManagerRole, ApprovalStatus } from '@/types';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;
const { Search } = Input;

export default function ManagersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<ManagerRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<ApprovalStatus | 'all'>('all');
  const [managers, setManagers] = useState(dummyManagers);
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  // 마스터 권한 확인
  const isMaster = currentUser.role === 'master';

  // 필터링된 관리자 목록
  const filteredManagers = managers.filter(manager => {
    const matchesSearch = manager.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         manager.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || manager.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || manager.approvalStatus === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  // 권한별 아이콘 매핑
  const getRoleIcon = (role: ManagerRole) => {
    switch (role) {
      case 'master':
        return <CrownOutlined style={{ color: '#ff4d4f' }} />;
      case 'admin':
        return <SafetyCertificateOutlined style={{ color: '#1890ff' }} />;
      case 'content_manager':
        return <FileTextOutlined style={{ color: '#52c41a' }} />;
      default:
        return <UserOutlined />;
    }
  };

  // 권한별 텍스트 매핑
  const getRoleText = (role: ManagerRole) => {
    switch (role) {
      case 'master':
        return '마스터';
      case 'admin':
        return '관리자';
      case 'content_manager':
        return '콘텐츠매니저';
      default:
        return role;
    }
  };

  // 승인 상태별 색상 매핑
  const getStatusColor = (status: ApprovalStatus) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'pending':
        return 'warning';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  // 승인 상태별 텍스트 매핑
  const getStatusText = (status: ApprovalStatus) => {
    switch (status) {
      case 'approved':
        return '승인됨';
      case 'pending':
        return '승인대기';
      case 'rejected':
        return '거부됨';
      default:
        return status;
    }
  };

  // 권한 변경
  const handleRoleChange = (managerId: string, newRole: ManagerRole) => {
    setManagers(prevManagers =>
      prevManagers.map(manager =>
        manager.id === managerId
          ? { ...manager, role: newRole, updatedAt: new Date().toISOString() }
          : manager
      )
    );
    message.success('권한이 변경되었습니다.');
  };

  // 승인 상태 변경
  const handleApprovalChange = (managerId: string, newStatus: ApprovalStatus) => {
    setManagers(prevManagers =>
      prevManagers.map(manager =>
        manager.id === managerId
          ? { ...manager, approvalStatus: newStatus, updatedAt: new Date().toISOString() }
          : manager
      )
    );
    message.success(`승인 상태가 '${getStatusText(newStatus)}'로 변경되었습니다.`);
  };

  // 관리자 삭제
  const handleDelete = (managerId: string) => {
    setManagers(prevManagers => prevManagers.filter(manager => manager.id !== managerId));
    message.success('관리자가 삭제되었습니다.');
  };

  // 관리자 이름 편집 시작
  const handleEditName = (managerId: string, currentName: string) => {
    setEditingNameId(managerId);
    setEditingName(currentName);
  };

  // 관리자 이름 편집 저장
  const handleSaveName = (managerId: string) => {
    if (!editingName.trim()) {
      message.error('이름을 입력해주세요.');
      return;
    }

    setManagers(prevManagers =>
      prevManagers.map(manager =>
        manager.id === managerId
          ? { ...manager, name: editingName.trim(), updatedAt: new Date().toISOString() }
          : manager
      )
    );
    message.success('관리자 이름이 수정되었습니다.');
    setEditingNameId(null);
    setEditingName('');
  };

  // 관리자 이름 편집 취소
  const handleCancelEditName = () => {
    setEditingNameId(null);
    setEditingName('');
  };

  // 테이블 컬럼 정의
  const columns: ColumnsType<Manager> = [
    {
      title: '관리자',
      key: 'manager',
      render: (_, record: Manager) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Avatar size={40} style={{ backgroundColor: '#1890ff' }}>
            {record.name.charAt(0)}
          </Avatar>
          <div style={{ flex: 1 }}>
            {editingNameId === record.id ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Input
                  size="small"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onPressEnter={() => handleSaveName(record.id)}
                  style={{ width: '150px' }}
                  placeholder="이름을 입력하세요"
                />
                <Button
                  type="text"
                  size="small"
                  icon={<CheckOutlined />}
                  style={{ color: '#52c41a' }}
                  onClick={() => handleSaveName(record.id)}
                />
                <Button
                  type="text"
                  size="small"
                  icon={<CloseOutlined />}
                  onClick={handleCancelEditName}
                />
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div>
                  <div style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {record.name}
                    {isMaster && record.id !== currentUser.id && (
                      <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        style={{ padding: '0 4px' }}
                        onClick={() => handleEditName(record.id, record.name)}
                      />
                    )}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>{record.email}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: '권한',
      dataIndex: 'role',
      key: 'role',
      render: (role: ManagerRole, record: Manager) => (
        <Space>
          {getRoleIcon(role)}
          <span>{getRoleText(role)}</span>
        </Space>
      ),
    },
    {
      title: '승인 상태',
      dataIndex: 'approvalStatus',
      key: 'approvalStatus',
      render: (status: ApprovalStatus) => (
        <Badge
          status={getStatusColor(status) as any}
          text={getStatusText(status)}
        />
      ),
    },
    {
      title: '최근 로그인',
      dataIndex: 'lastLoginAt',
      key: 'lastLoginAt',
      render: (date?: string) => (
        date ? new Date(date).toLocaleDateString('ko-KR') : '로그인 기록 없음'
      ),
    },
    {
      title: '등록일',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString('ko-KR'),
    },
  ];

  // 마스터만 작업 컬럼 추가
  if (isMaster) {
    columns.push({
      title: '작업',
      key: 'actions',
      width: 200,
      render: (_, record: Manager) => (
        <Space wrap>
          {/* 권한 변경 */}
          {record.id !== currentUser.id && (
            <Select
              size="small"
              value={record.role}
              style={{ width: 120 }}
              onChange={(newRole) => handleRoleChange(record.id, newRole)}
              options={[
                { label: '마스터', value: 'master' },
                { label: '관리자', value: 'admin' },
                { label: '콘텐츠매니저', value: 'content_manager' },
              ]}
            />
          )}

          {/* 승인 관련 버튼 */}
          {record.approvalStatus === 'pending' && (
            <Space>
              <Button 
                type="primary" 
                size="small"
                style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                onClick={() => handleApprovalChange(record.id, 'approved')}
              >
                승인
              </Button>
              <Button 
                danger
                size="small"
                onClick={() => handleApprovalChange(record.id, 'rejected')}
              >
                거절
              </Button>
            </Space>
          )}

          {/* 삭제 버튼 (자기 자신은 삭제 불가) */}
          {record.id !== currentUser.id && (
            <Popconfirm
              title="관리자 삭제"
              description="이 관리자를 삭제하시겠습니까?"
              okText="삭제"
              cancelText="취소"
              onConfirm={() => handleDelete(record.id)}
            >
              <Button 
                danger
                size="small"
              >
                삭제
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    });
  }

  // 마스터 권한이 없는 경우 접근 제한
  if (!isMaster) {
    return (
      <MainLayout>
        <Card>
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <SafetyCertificateOutlined style={{ fontSize: '64px', color: '#bfbfbf', marginBottom: '16px' }} />
            <Title level={3} type="secondary">접근 권한이 없습니다</Title>
            <p>관리자 관리 페이지는 마스터 권한이 필요합니다.</p>
          </div>
        </Card>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div>
        <div style={{ marginBottom: '24px' }}>
          <Title level={2} style={{ margin: 0 }}>
            관리자 관리
          </Title>
          <p style={{ color: '#666', marginTop: '8px' }}>
            시스템 관리자들의 권한을 승인하고 관리합니다.
          </p>
        </div>

        <Card>
          {/* 검색 및 필터 */}
          <div style={{ marginBottom: '16px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            <Search
              placeholder="관리자명 또는 이메일 검색"
              allowClear
              style={{ width: 300 }}
              onChange={(e) => setSearchTerm(e.target.value)}
              prefix={<SearchOutlined />}
            />
            <Select
              style={{ width: 150 }}
              value={roleFilter}
              onChange={setRoleFilter}
              options={[
                { label: '모든 권한', value: 'all' },
                { label: '마스터', value: 'master' },
                { label: '관리자', value: 'admin' },
                { label: '콘텐츠매니저', value: 'content_manager' },
              ]}
            />
            <Select
              style={{ width: 150 }}
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { label: '모든 상태', value: 'all' },
                { label: '승인됨', value: 'approved' },
                { label: '승인대기', value: 'pending' },
                { label: '거부됨', value: 'rejected' },
              ]}
            />
          </div>

          {/* 통계 정보 */}
          <div style={{ marginBottom: '16px', display: 'flex', gap: '24px' }}>
            <div>
              <span style={{ color: '#666' }}>총 관리자: </span>
              <strong>{managers.length}명</strong>
            </div>
            <div>
              <span style={{ color: '#666' }}>승인 대기: </span>
              <strong style={{ color: '#fa8c16' }}>
                {managers.filter(m => m.approvalStatus === 'pending').length}명
              </strong>
            </div>
            <div>
              <span style={{ color: '#666' }}>활성 관리자: </span>
              <strong style={{ color: '#52c41a' }}>
                {managers.filter(m => m.approvalStatus === 'approved').length}명
              </strong>
            </div>
          </div>

          {/* 관리자 테이블 */}
          <Table
            columns={columns}
            dataSource={filteredManagers}
            rowKey="id"
            pagination={{
              total: filteredManagers.length,
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