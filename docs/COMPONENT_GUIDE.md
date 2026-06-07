# Design4Public CMS - 컴포넌트 가이드

## 📋 개요
이 문서는 D4P-CMS 프로젝트의 주요 컴포넌트 구조와 사용법을 설명합니다.

## 🎨 디자인 시스템

### UI 라이브러리
- **Ant Design v5.27.3**: 메인 UI 컴포넌트 라이브러리
- **Ant Design Icons v6.0.1**: 아이콘 라이브러리
- **색상 팔레트**: 
  - Primary: `#1890ff` (Ant Design Blue)
  - Success: `#52c41a` (Green)
  - Warning: `#fa8c16` (Orange)
  - Error: `#ff4d4f` (Red)
  - Gold: `#faad14` (Badge 색상)

### 폰트
- **Pretendard**: 메인 폰트 (한글 최적화)

## 🏗️ 레이아웃 컴포넌트

### MainLayout (`/src/components/MainLayout.tsx`)
```typescript
interface MainLayoutProps {
  children: React.ReactNode;
}

// 사용법
<MainLayout>
  <YourPageContent />
</MainLayout>
```

**특징:**
- 좌측 사이드바 + 메인 콘텐츠 영역
- 반응형 디자인 지원
- 모든 페이지에서 공통으로 사용

### Sidebar (`/src/components/Sidebar.tsx`)
```typescript
interface SidebarProps {
  onNavigate?: (url: string) => void;
  collapsed?: boolean;
}
```

**주요 기능:**
- 네비게이션 메뉴 (프로젝트, 아이템, 브랜드, 태그, 관리자)
- 각 메뉴별 카운트 뱃지 (금색)
- 사용자 프로필 및 로그아웃
- 콜랩스 지원

**뱃지 색상:**
```typescript
<Badge count={count} size="small" color="gold" />
```

## 📄 페이지 컴포넌트 패턴

### 리스트 페이지 패턴
모든 리스트 페이지는 동일한 구조를 따릅니다:

```typescript
export default function ListPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [data, setData] = useState(dummyData);

  // 필터링된 데이터
  const filteredData = data.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || item.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <MainLayout>
      <div>
        {/* 헤더 */}
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={2} style={{ margin: 0 }}>페이지 제목</Title>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => router.push('/path/new')}>
            새 항목 추가
          </Button>
        </div>

        <Card>
          {/* 검색 및 필터 */}
          <div style={{ marginBottom: '16px', display: 'flex', gap: '16px', alignItems: 'center' }}>
            <Search placeholder="검색..." style={{ width: 300 }} />
            <Select style={{ width: 150 }} options={filterOptions} />
          </div>

          {/* 테이블 */}
          <Table columns={columns} dataSource={filteredData} />
        </Card>
      </div>
    </MainLayout>
  );
}
```

### 상세 페이지 패턴
```typescript
export default function DetailPage() {
  const params = useParams();
  const itemId = params.item_id as string;
  const item = dummyData.find(item => item.id === itemId);

  if (!item) {
    return (
      <MainLayout>
        <Empty description="항목을 찾을 수 없습니다." />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div>
        {/* 헤더 */}
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()}>
              돌아가기
            </Button>
            <Title level={2} style={{ margin: 0 }}>{item.name}</Title>
          </Space>
          <Button type="primary" icon={<EditOutlined />} onClick={() => router.push(`/path/${itemId}/edit`)}>
            편집
          </Button>
        </div>

        {/* 상세 내용 */}
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={16}>
            <Card title="기본 정보">
              <Descriptions column={1} bordered>
                {/* 상세 정보 항목들 */}
              </Descriptions>
            </Card>
          </Col>
        </Row>
      </div>
    </MainLayout>
  );
}
```

### 폼 페이지 패턴 (생성/편집)
```typescript
export default function FormPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: FormData) => {
    setLoading(true);
    try {
      // API 호출 로직
      message.success('성공적으로 저장되었습니다!');
      router.push('/list-page');
    } catch (error) {
      message.error('저장 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div>
        {/* 헤더 */}
        <div style={{ marginBottom: '24px' }}>
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()}>
              돌아가기
            </Button>
            <Title level={2} style={{ margin: 0 }}>제목</Title>
          </Space>
        </div>

        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={[24, 0]}>
            <Col xs={24} lg={14}>
              {/* 메인 폼 필드들 */}
            </Col>
            <Col xs={24} lg={10}>
              {/* 사이드 폼 필드들 및 저장 버튼 */}
            </Col>
          </Row>
        </Form>
      </div>
    </MainLayout>
  );
}
```

## 🎛️ 공통 컴포넌트 패턴

### 테이블 액션 버튼
```typescript
{
  title: '작업',
  key: 'actions',
  width: 120,
  render: (_, record) => (
    <Space>
      <Tooltip title="상세보기">
        <Button type="text" icon={<EyeOutlined />} size="small" onClick={() => router.push(`/path/${record.id}`)} />
      </Tooltip>
      <Tooltip title="편집">
        <Button type="text" icon={<EditOutlined />} size="small" onClick={() => router.push(`/path/${record.id}/edit`)} />
      </Tooltip>
    </Space>
  ),
}
```

### 상태 표시 배지
```typescript
const getStatusColor = (status: Status) => {
  switch (status) {
    case 'active': return 'success';
    case 'pending': return 'warning';
    case 'inactive': return 'default';
    default: return 'default';
  }
};

<Badge status={getStatusColor(status) as any} text={getStatusText(status)} />
```

### 이미지 업로드
```typescript
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
  }
};
```

## 🔧 특수 기능 컴포넌트

### 인라인 편집 (관리자 이름 수정)
```typescript
// 편집 상태 관리
const [editingId, setEditingId] = useState<string | null>(null);
const [editingValue, setEditingValue] = useState('');

// 편집 모드 UI
{editingId === record.id ? (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
    <Input
      size="small"
      value={editingValue}
      onChange={(e) => setEditingValue(e.target.value)}
      onPressEnter={() => handleSave(record.id)}
    />
    <Button type="text" size="small" icon={<CheckOutlined />} onClick={() => handleSave(record.id)} />
    <Button type="text" size="small" icon={<CloseOutlined />} onClick={() => handleCancel()} />
  </div>
) : (
  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
    {record.name}
    <Button type="text" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record.id, record.name)} />
  </div>
)}
```

### 권한별 조건부 렌더링
```typescript
// 관리자 관리 페이지에서 마스터 권한 체크
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
```

### 태그 선택 (CheckableTag)
```typescript
<Space size={[0, 8]} wrap>
  {dummyTags.map(tag => (
    <CheckableTag
      key={tag.id}
      checked={selectedTags.includes(tag.id)}
      onChange={(checked) => handleTagChange(tag.id, checked)}
    >
      {tag.name}
    </CheckableTag>
  ))}
</Space>
```

## 📱 반응형 디자인

### 그리드 시스템
```typescript
<Row gutter={[24, 0]}>
  <Col xs={24} lg={14}>
    {/* 메인 콘텐츠 */}
  </Col>
  <Col xs={24} lg={10}>
    {/* 사이드 콘텐츠 */}
  </Col>
</Row>
```

### 모바일 대응
- `xs={24}`: 모바일에서 전체 너비
- `lg={14}`: 데스크톱에서 14/24 비율
- 테이블: `scroll={{ x: 800 }}` 설정으로 가로 스크롤 지원

## 🎨 스타일링 가이드

### 일관된 간격
```typescript
// 카드 간격
style={{ marginBottom: '24px' }}

// 버튼 간격
<Space>
  <Button>버튼1</Button>
  <Button>버튼2</Button>
</Space>

// 섹션 간격
<div style={{ marginBottom: '24px' }}>
```

### 색상 사용
```typescript
// 성공 (녹색)
style={{ color: '#52c41a' }}

// 경고 (주황색)  
style={{ color: '#fa8c16' }}

// 위험 (빨간색)
style={{ color: '#ff4d4f' }}

// 보조 텍스트 (회색)
<Text type="secondary">보조 텍스트</Text>
```

## 🚨 중요 규칙

### 1. 아이콘 사용 일관성
- 관리자 권한: `SafetyCertificateOutlined`
- 편집: `EditOutlined`
- 보기: `EyeOutlined`
- 저장: `SaveOutlined`
- 삭제: 아이콘 대신 "삭제" 텍스트 사용

### 2. 버튼 텍스트
- 승인/거절/삭제: 한글 텍스트 사용 (아이콘 사용 금지)
- 다른 액션 버튼: 아이콘 + 툴팁 사용

### 3. 권한 체크
- 자기 자신 편집/삭제 방지
- 마스터 권한 확인
- 조건부 렌더링 적극 활용

### 4. 에러 처리
```typescript
try {
  // API 호출
  message.success('성공 메시지');
} catch (error) {
  message.error('에러 메시지');
} finally {
  setLoading(false);
}
```

---

이 가이드를 따라 개발하면 일관된 사용자 경험과 코드 품질을 유지할 수 있습니다.