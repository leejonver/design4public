// Design4Public CMS - 관리자 관리 페이지 (마스터 전용, §8)

'use client';

import { useEffect, useState } from 'react';
import { Badge, Button, Callout, Card, Dialog, Field, IconButton, Select, Spinner, Text, TextInput } from '@vapor-ui/core';
import {
  CloseOutlineIcon,
  ConfirmOutlineIcon,
  EditOutlineIcon,
  GroupOutlineIcon,
  MailOutlineIcon,
} from '@vapor-ui/icons';
import MainLayout from '@/components/admin/MainLayout';
import {
  PageHeader,
  ListToolbar,
  FilterSelect,
  StatusBadge,
  ConfirmDialog,
  DataTable,
  EmptyState,
  Pagination,
} from '@/components/admin/ui';
import type { DataTableColumn } from '@/components/admin/ui';
import { api } from '@/lib/admin-api';
import { useListController } from '@/lib/use-list-controller';
import { useAuth } from '@/components/admin/AuthContext';
import type { Manager, ManagerRole, ApprovalStatus } from '@/lib/admin-types';

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
  { value: 'approved', label: '활성' },
  { value: 'pending', label: '초대됨' },
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

  const {
    items: managers,
    total,
    loading,
    error,
    clearError,
    search,
    setSearch,
    filters,
    setFilter,
    sort,
    setSort,
    page,
    setPage,
    refetch,
  } = useListController<Manager>({
    initialFilters: { role: 'all', status: 'all' },
    initialSort: { key: 'created_at', dir: 'desc' },
    limit: LIMIT,
    fetch: async (params) => {
      if (!isMaster) return { items: [], total: 0 };
      const res = await api.get('/managers', {
        search: params.search || undefined,
        role: params.role === 'all' ? undefined : params.role,
        status: params.status === 'all' ? undefined : params.status,
        sort: params.sort,
        page: params.page,
        limit: params.limit,
      });
      if (!res.success) throw new Error(res.error || '관리자 목록을 불러오는데 실패했습니다.');
      const data = res.data as { items?: Manager[]; total?: number } | undefined;
      return { items: data?.items ?? [], total: data?.total ?? 0 };
    },
  });
  const roleFilter = (filters.role ?? 'all') as ManagerRole | 'all';
  const statusFilter = (filters.status ?? 'all') as ApprovalStatus | 'all';
  const sortValue = sort?.key ?? 'created_at';

  const [feedback, setFeedback] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<Manager | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<ManagerRole>('content_manager');
  const [inviting, setInviting] = useState(false);

  const submitInvite = async () => {
    const email = inviteEmail.trim();
    if (!email) {
      setFeedback({ type: 'danger', text: '이메일을 입력해주세요.' });
      return;
    }
    setInviting(true);
    try {
      const res = await api.post('/managers/invite', {
        email,
        role: inviteRole,
        name: inviteName.trim() || undefined,
      });
      if (res.success) {
        setFeedback({ type: 'success', text: '초대 메일을 발송했습니다.' });
        setInviteOpen(false);
        setInviteEmail('');
        setInviteName('');
        setInviteRole('content_manager');
        refetch();
      } else {
        setFeedback({ type: 'danger', text: res.error || '초대에 실패했습니다.' });
      }
    } catch (e) {
      setFeedback({
        type: 'danger',
        text: e instanceof Error ? e.message : '초대 중 오류가 발생했습니다.',
      });
    } finally {
      setInviting(false);
    }
  };

  const resendInvite = async (m: Manager) => {
    const res = await api.post('/managers/invite', { email: m.email, role: m.role });
    setFeedback(
      res.success
        ? { type: 'success', text: '초대 메일을 다시 발송했습니다.' }
        : { type: 'danger', text: res.error || '재전송에 실패했습니다.' },
    );
  };

  useEffect(() => {
    if (isMaster) refetch();
  }, [isMaster, refetch]);

  // 필터 변경 시 첫 페이지로 이동
  const handleSearch = (v: string) => {
    setSearch(v);
  };
  const handleRoleFilter = (v: string) => {
    setFilter('role', v);
  };
  const handleStatusFilter = (v: string) => {
    setFilter('status', v);
  };
  const handleSort = (v: string) => {
    setSort({ key: v, dir: 'desc' });
  };

  // 공통 업데이트: 서버 가드(403/409) 메시지를 Callout으로 노출한다.
  const applyUpdate = async (
    id: string,
    patch: { name: string } | { role: ManagerRole } | { approvalStatus: ApprovalStatus },
    successText: string,
  ): Promise<boolean> => {
    try {
      const res = await api.put(`/managers/${id}`, patch);
      if (res.success) {
        refetch();
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
      const res = await api.delete(`/managers/${deleteTarget.id}`);
      if (res.success) {
        refetch();
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
        <div className="flex items-center gap-2">
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
                  if (e.key === 'Enter') {
                    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
                    saveEditName(m.id);
                  }
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
      truncate: true,
      render: (m) => (
        <span className="text-gray-600" title={m.email}>
          {m.email}
        </span>
      ),
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
      width: 'w-52',
      nowrap: true,
      render: (m) => (
        <div className="flex flex-wrap items-center gap-2">
          {m.approvalStatus === 'pending' && (
            <Button
              size="sm"
              variant="outline"
              colorPalette="primary"
              onClick={() => resendInvite(m)}
            >
              초대 재전송
            </Button>
          )}
          {m.id !== user?.id && (
            <Button
              size="sm"
              variant="ghost"
              colorPalette="danger"
              onClick={() => setDeleteTarget(m)}
            >
              {m.approvalStatus === 'pending' ? '초대 취소' : '삭제'}
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
      <PageHeader
        title="관리자 관리"
        description="관리자를 초대하고 역할을 관리합니다."
        action={
          <Button colorPalette="primary" onClick={() => setInviteOpen(true)}>
            <MailOutlineIcon size={16} /> 관리자 초대
          </Button>
        }
      />

      {(feedback || error) && (
        <Callout.Root
          colorPalette={error || feedback?.type !== 'success' ? 'danger' : 'success'}
          className="mb-4 flex items-start justify-between gap-2"
        >
          <Text typography="body2" render={<p />}>
            {error ?? feedback?.text}
          </Text>
          <IconButton
            size="sm"
            variant="ghost"
            colorPalette="secondary"
            aria-label="알림 닫기"
            onClick={() => {
              setFeedback(null);
              clearError();
            }}
          >
            <CloseOutlineIcon size={16} />
          </IconButton>
        </Callout.Root>
      )}

      <Card.Root>
        <Card.Body>
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
                value={sortValue}
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
        </Card.Body>
      </Card.Root>

      <ConfirmDialog
        open={!!deleteTarget}
        title={deleteTarget?.approvalStatus === 'pending' ? '초대 취소' : '관리자 삭제'}
        description={
          deleteTarget
            ? deleteTarget.approvalStatus === 'pending'
              ? `"${deleteTarget.email}" 초대를 취소하시겠습니까?`
              : `"${deleteTarget.name || deleteTarget.email}" 관리자를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`
            : undefined
        }
        confirmText={deleteTarget?.approvalStatus === 'pending' ? '초대 취소' : '삭제'}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <Dialog.Root
        open={inviteOpen}
        onOpenChange={(next) => {
          if (!next) setInviteOpen(false);
        }}
      >
        <Dialog.Popup>
          <Dialog.Title>관리자 초대</Dialog.Title>
          <Dialog.Body>
            <div className="flex flex-col gap-4 py-2">
              <Field.Root>
                <Field.Label>이메일</Field.Label>
                <TextInput
                  type="email"
                  value={inviteEmail}
                  onValueChange={setInviteEmail}
                  placeholder="초대할 이메일 주소"
                />
              </Field.Root>
              <Field.Root>
                <Field.Label>이름 (선택)</Field.Label>
                <TextInput value={inviteName} onValueChange={setInviteName} placeholder="이름" />
              </Field.Root>
              <Field.Root>
                <Field.Label>역할</Field.Label>
                <SelectField
                  value={inviteRole}
                  onValueChange={(v) => setInviteRole(v as ManagerRole)}
                  options={ROLE_OPTIONS}
                  ariaLabel="역할 선택"
                />
              </Field.Root>
            </div>
          </Dialog.Body>
          <Dialog.Footer>
            <Button
              variant="outline"
              colorPalette="secondary"
              onClick={() => setInviteOpen(false)}
              disabled={inviting}
            >
              취소
            </Button>
            <Button variant="fill" colorPalette="primary" onClick={submitInvite} disabled={inviting}>
              {inviting ? <Spinner size="md" /> : '초대 보내기'}
            </Button>
          </Dialog.Footer>
        </Dialog.Popup>
      </Dialog.Root>
    </MainLayout>
  );
}
