// Design4Public CMS - 관리자 관리 페이지 (마스터 전용, §8)

'use client';

import { useCallback, useEffect, useState } from 'react';
import { Badge, Button, Callout, IconButton, Select, Spinner, Text, TextInput } from '@vapor-ui/core';
import {
  CloseOutlineIcon,
  ConfirmOutlineIcon,
  EditOutlineIcon,
  GroupOutlineIcon,
} from '@vapor-ui/icons';
import MainLayout from '@/components/MainLayout';
import {
  PageHeader,
  ListToolbar,
  FilterSelect,
  StatusBadge,
  ConfirmDialog,
  DataTable,
  EmptyState,
  Pagination,
} from '@/components/ui';
import type { DataTableColumn } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { Manager, ManagerRole, ApprovalStatus } from '@/types';

const LIMIT = 10;

const ROLE_LABELS: Record<ManagerRole, string> = {
  master: '마스터',
  admin: '관리자',
  content_manager: '콘텐츠매니저',
};

type Option = { value: string; label: string };

const ROLE_OPTIONS: Option[] = [
  { value: 'master', label: '마스터' },
  { value: 'admin', label: '관리자' },
  { value: 'content_manager', label: '콘텐츠매니저' },
];

const ROLE_FILTER_OPTIONS: Option[] = [{ value: 'all', label: '모든 권한' }, ...ROLE_OPTIONS];

const STATUS_FILTER_OPTIONS: Option[] = [
  { value: 'all', label: '모든 상태' },
  { value: 'approved', label: '승인됨' },
  { value: 'pending', label: '승인대기' },
  { value: 'rejected', label: '거부됨' },
];

const SORT_OPTIONS: Option[] = [
  { value: 'created_at', label: '가입일순' },
  { value: 'last_login_at', label: '최근 로그인순' },
  { value: 'name', label: '이름순' },
  { value: 'email', label: '이메일순' },
];

type SelectSize = 'sm' | 'md' | 'lg' | 'xl';

function SelectField({
  value,
  onValueChange,
  options,
  ariaLabel,
  disabled,
  size = 'md',
  className,
}: {
  value: string;
  onValueChange: (v: string) => void;
  options: Option[];
  ariaLabel: string;
  disabled?: boolean;
  size?: SelectSize;
  className?: string;
}) {
  return (
    <Select.Root
      value={value}
      onValueChange={(v) => {
        if (v !== null) onValueChange(v);
      }}
      items={options}
      disabled={disabled}
      size={size}
    >
      <Select.Trigger aria-label={ariaLabel} className={className} />
      <Select.Popup>
        {options.map((o) => (
          <Select.Item key={o.value} value={o.value}>
            {o.label}
          </Select.Item>
        ))}
      </Select.Popup>
    </Select.Root>
  );
}

const formatDate = (d?: string) => (d ? new Date(d).toLocaleDateString('ko-KR') : '-');

export default function ManagersPage() {
  const { user, isMaster, loading: authLoading } = useAuth();

  const [managers, setManagers] = useState<Manager[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<ManagerRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<ApprovalStatus | 'all'>('all');
  const [sort, setSort] = useState('created_at');

  const [feedback, setFeedback] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<Manager | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchManagers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.managers.getList({
        search: search || undefined,
        role: roleFilter === 'all' ? undefined : roleFilter,
        status: statusFilter === 'all' ? undefined : statusFilter,
        sort,
        page,
        limit: LIMIT,
      });
      if (res.success) {
        const data = res.data as { items: Manager[]; total: number } | undefined;
        setManagers(data?.items ?? []);
        setTotal(data?.total ?? 0);
      } else {
        setFeedback({ type: 'danger', text: res.error || '관리자 목록을 불러오는데 실패했습니다.' });
      }
    } catch (e) {
      setFeedback({
        type: 'danger',
        text: e instanceof Error ? e.message : '관리자 목록을 불러오는 중 오류가 발생했습니다.',
      });
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statusFilter, sort, page]);

  useEffect(() => {
    if (isMaster) fetchManagers();
  }, [isMaster, fetchManagers]);

  // 필터 변경 시 첫 페이지로 이동
  const handleSearch = (v: string) => {
    setSearch(v);
    setPage(1);
  };
  const handleRoleFilter = (v: string) => {
    setRoleFilter(v as ManagerRole | 'all');
    setPage(1);
  };
  const handleStatusFilter = (v: string) => {
    setStatusFilter(v as ApprovalStatus | 'all');
    setPage(1);
  };
  const handleSort = (v: string) => {
    setSort(v);
    setPage(1);
  };

  // 공통 업데이트: 서버 가드(403/409) 메시지를 Callout으로 노출한다.
  const applyUpdate = async (
    id: string,
    patch: { name: string } | { role: ManagerRole } | { approvalStatus: ApprovalStatus },
    successText: string,
  ): Promise<boolean> => {
    try {
      const res = await api.managers.update(id, patch);
      if (res.success) {
        const updated = res.data as Manager | null;
        if (updated) {
          setManagers((prev) => prev.map((m) => (m.id === id ? updated : m)));
        }
        setFeedback({ type: 'success', text: successText });
        return true;
      }
      setFeedback({ type: 'danger', text: res.error || '수정에 실패했습니다.' });
      return false;
    } catch (e) {
      setFeedback({
        type: 'danger',
        text: e instanceof Error ? e.message : '수정 중 오류가 발생했습니다.',
      });
      return false;
    }
  };

  const handleRoleChange = (id: string, role: ManagerRole) =>
    applyUpdate(id, { role }, '권한이 변경되었습니다.');

  const handleApproval = (id: string, approvalStatus: ApprovalStatus) =>
    applyUpdate(
      id,
      { approvalStatus },
      approvalStatus === 'approved' ? '승인되었습니다.' : '거부되었습니다.',
    );

  const startEditName = (m: Manager) => {
    setEditingId(m.id);
    setEditingName(m.name);
  };
  const cancelEditName = () => {
    setEditingId(null);
    setEditingName('');
  };
  const saveEditName = async (id: string) => {
    const name = editingName.trim();
    if (!name) {
      setFeedback({ type: 'danger', text: '이름을 입력해주세요.' });
      return;
    }
    const ok = await applyUpdate(id, { name }, '이름이 수정되었습니다.');
    if (ok) cancelEditName();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await api.managers.delete(deleteTarget.id);
      if (res.success) {
        setManagers((prev) => prev.filter((m) => m.id !== deleteTarget.id));
        setTotal((t) => Math.max(0, t - 1));
        setFeedback({ type: 'success', text: '관리자가 삭제되었습니다.' });
        setDeleteTarget(null);
      } else {
        setFeedback({ type: 'danger', text: res.error || '관리자 삭제에 실패했습니다.' });
      }
    } catch (e) {
      setFeedback({
        type: 'danger',
        text: e instanceof Error ? e.message : '관리자 삭제 중 오류가 발생했습니다.',
      });
    } finally {
      setDeleting(false);
    }
  };

  const columns: DataTableColumn<Manager>[] = [
    {
      key: 'name',
      header: '이름',
      render: (m) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-v-primary-200 text-sm font-medium text-white">
            {m.name?.charAt(0) || '?'}
          </div>
          {editingId === m.id ? (
            <div className="flex items-center gap-1">
              <TextInput
                value={editingName}
                onValueChange={setEditingName}
                placeholder="이름을 입력하세요"
                aria-label="이름 편집"
                className="w-40"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveEditName(m.id);
                  if (e.key === 'Escape') cancelEditName();
                }}
              />
              <IconButton
                size="sm"
                variant="ghost"
                colorPalette="success"
                aria-label="이름 저장"
                onClick={() => saveEditName(m.id)}
              >
                <ConfirmOutlineIcon size={16} />
              </IconButton>
              <IconButton
                size="sm"
                variant="ghost"
                colorPalette="secondary"
                aria-label="편집 취소"
                onClick={cancelEditName}
              >
                <CloseOutlineIcon size={16} />
              </IconButton>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <span className="font-medium text-gray-900">{m.name || '(이름 없음)'}</span>
              {m.id !== user?.id && (
                <IconButton
                  size="sm"
                  variant="ghost"
                  colorPalette="secondary"
                  aria-label="이름 수정"
                  onClick={() => startEditName(m)}
                >
                  <EditOutlineIcon size={14} />
                </IconButton>
              )}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'email',
      header: '이메일',
      render: (m) => <span className="text-gray-600">{m.email}</span>,
    },
    {
      key: 'role',
      header: '역할',
      width: 'w-44',
      nowrap: true,
      render: (m) =>
        m.id === user?.id ? (
          <Badge colorPalette="primary" size="sm">
            {ROLE_LABELS[m.role]}
          </Badge>
        ) : (
          <SelectField
            value={m.role}
            onValueChange={(v) => handleRoleChange(m.id, v as ManagerRole)}
            options={ROLE_OPTIONS}
            ariaLabel="역할 변경"
            size="sm"
            className="w-32"
          />
        ),
    },
    {
      key: 'approvalStatus',
      header: '승인상태',
      width: 'w-28',
      nowrap: true,
      render: (m) => <StatusBadge kind="approval" value={m.approvalStatus} />,
    },
    {
      key: 'lastLoginAt',
      header: '최근 로그인',
      width: 'w-40',
      nowrap: true,
      render: (m) => (
        <span className="text-gray-600">
          {m.lastLoginAt ? formatDate(m.lastLoginAt) : '로그인 기록 없음'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: '가입일',
      width: 'w-32',
      nowrap: true,
      render: (m) => <span className="text-gray-600">{formatDate(m.createdAt)}</span>,
    },
    {
      key: 'actions',
      header: '작업',
      width: 'w-44',
      nowrap: true,
      render: (m) => (
        <div className="flex flex-wrap items-center gap-2">
          {m.approvalStatus === 'pending' && (
            <>
              <Button
                size="sm"
                variant="fill"
                colorPalette="success"
                onClick={() => handleApproval(m.id, 'approved')}
              >
                승인
              </Button>
              <Button
                size="sm"
                variant="outline"
                colorPalette="danger"
                onClick={() => handleApproval(m.id, 'rejected')}
              >
                거부
              </Button>
            </>
          )}
          {m.id !== user?.id && (
            <Button
              size="sm"
              variant="ghost"
              colorPalette="danger"
              onClick={() => setDeleteTarget(m)}
            >
              삭제
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (authLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      </MainLayout>
    );
  }

  // 클라이언트 측 권한 가드 (미들웨어/서버 가드와 더불어 마스터만 접근)
  if (!isMaster) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center gap-2 py-20 text-center">
          <Text typography="heading4" render={<h3 />} className="text-gray-700">
            접근 권한이 없습니다
          </Text>
          <Text typography="body2" render={<p />} className="text-gray-500">
            관리자 관리 페이지는 마스터 권한이 필요합니다.
          </Text>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageHeader title="관리자 관리" description="시스템 관리자들의 권한을 승인하고 관리합니다." />

      <Callout.Root colorPalette="primary" className="mb-4">
        <Text typography="body2" render={<p />}>
          신규 가입자는 이메일 인증 후 관리자 승인이 필요합니다. 승인 대기 중인 계정을 검토하여 승인 또는 거부해 주세요.
        </Text>
      </Callout.Root>

      {feedback && (
        <Callout.Root
          colorPalette={feedback.type === 'success' ? 'success' : 'danger'}
          className="mb-4 flex items-start justify-between gap-3"
        >
          <Text typography="body2" render={<p />}>
            {feedback.text}
          </Text>
          <IconButton
            size="sm"
            variant="ghost"
            colorPalette="secondary"
            aria-label="알림 닫기"
            onClick={() => setFeedback(null)}
          >
            <CloseOutlineIcon size={16} />
          </IconButton>
        </Callout.Root>
      )}

      <ListToolbar
        search={search}
        onSearchChange={handleSearch}
        searchPlaceholder="이름 또는 이메일 검색"
        filters={
          <>
            <FilterSelect
              value={roleFilter}
              onValueChange={handleRoleFilter}
              options={ROLE_FILTER_OPTIONS}
              placeholder="모든 권한"
              width="w-40"
            />
            <FilterSelect
              value={statusFilter}
              onValueChange={handleStatusFilter}
              options={STATUS_FILTER_OPTIONS}
              placeholder="모든 상태"
              width="w-40"
            />
          </>
        }
        sort={
          <FilterSelect
            value={sort}
            onValueChange={handleSort}
            options={SORT_OPTIONS}
            placeholder="가입일순"
            width="w-44"
          />
        }
      />

      <DataTable
        columns={columns}
        rows={managers}
        rowKey={(m) => m.id}
        loading={loading}
        empty={
          <EmptyState
            icon={<GroupOutlineIcon size={40} />}
            title="관리자가 없습니다."
            description="검색 조건을 변경해 보세요."
          />
        }
      />

      <div className="mt-4 flex items-center justify-between gap-4">
        <Text typography="body3" className="text-gray-500">
          총 {total}명
        </Text>
        <Pagination page={page} total={total} limit={LIMIT} onPageChange={setPage} />
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="관리자 삭제"
        description={
          deleteTarget
            ? `"${deleteTarget.name || deleteTarget.email}" 관리자를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`
            : undefined
        }
        confirmText="삭제"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </MainLayout>
  );
}
