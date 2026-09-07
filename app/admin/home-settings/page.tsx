// Design4Public CMS - 홈 화면 설정 페이지

'use client';

import { useEffect, useState } from 'react';
import { Button, Callout, Card, Spinner, Text } from '@vapor-ui/core';
import MainLayout from '@/components/admin/MainLayout';
import { PageHeader, EntityPicker, ImageUploader, SuccessCallout } from '@/components/admin/ui';
import { api } from '@/lib/admin-api';
import type { HomeFeaturedItem, HomeSettings, ImageData } from '@/lib/admin-types';

type EntityType = HomeFeaturedItem['entityType'];

export default function HomeSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [featuredProjectId, setFeaturedProjectId] = useState<string | null>(null);
  const [heroImage, setHeroImage] = useState<ImageData[]>([]);
  const [mainProjects, setMainProjects] = useState<string[]>([]);
  const [mainItems, setMainItems] = useState<string[]>([]);
  const [mainBrands, setMainBrands] = useState<string[]>([]);

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError(null);
    api
      .get('/home-settings')
      .then((res) => {
        if (!active) return;
        if (res.success && res.data) {
          const data = res.data as HomeSettings;
          const byType = (type: EntityType) =>
            data.featured
              .filter((f) => f.entityType === type)
              .sort((a, b) => a.order - b.order)
              .map((f) => f.entityId);
          setFeaturedProjectId(data.featuredProjectId);
          setHeroImage(
            data.featuredImageUrl
              ? [{ id: data.featuredImageUrl, url: data.featuredImageUrl, alt: '', isMain: true }]
              : [],
          );
          setMainProjects(byType('project'));
          setMainItems(byType('item'));
          setMainBrands(byType('brand'));
        } else {
          setLoadError(res.error ?? '홈 설정을 불러오지 못했습니다.');
        }
      })
      .catch(() => {
        if (active) setLoadError('홈 설정을 불러오지 못했습니다.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    const tag = (ids: string[], entityType: EntityType) =>
      ids.map((entityId) => ({ entityType, entityId }));
    const featured = [
      ...tag(mainProjects, 'project'),
      ...tag(mainItems, 'item'),
      ...tag(mainBrands, 'brand'),
    ];
    try {
      const res = await api.put('/home-settings', {
        featuredProjectId,
        featuredImageUrl: heroImage[0]?.url ?? null,
        featured,
      });
      if (res.success) {
        setSuccess(res.message ?? '홈 설정이 저장되었습니다.');
      } else {
        setSaveError(res.error ?? '홈 설정 저장에 실패했습니다.');
      }
    } catch (err) {
      console.error('홈 설정 저장 오류:', err);
      setSaveError('홈 설정 저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <MainLayout>
      <PageHeader
        title="홈 화면 설정"
        description="홈 화면 상단 대표 프로젝트와 메인 노출 콘텐츠를 관리합니다."
        action={
          <Button
            colorPalette="primary"
            variant="fill"
            onClick={handleSave}
            disabled={loading || saving}
          >
            {saving ? <Spinner size="md" /> : null}
            저장
          </Button>
        }
      />

      {loadError ? (
        <Callout.Root colorPalette="danger" className="mb-4">
          {loadError}
        </Callout.Root>
      ) : null}
      {saveError ? (
        <Callout.Root colorPalette="danger" className="mb-4">
          {saveError}
        </Callout.Root>
      ) : null}

      <SuccessCallout message={success} onClose={() => setSuccess(null)} />

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="space-y-6">
          <Card.Root>
            <Card.Header>
              <Text typography="heading6" className="text-gray-900">
                대표 프로젝트 (Featured)
              </Text>
              <Text typography="body3" render={<p />} className="mt-1 text-gray-500">
                홈 화면 상단에 강조할 프로젝트 1개를 선택합니다.
              </Text>
            </Card.Header>
            <Card.Body>
              <EntityPicker
                kind="project"
                value={featuredProjectId ? [featuredProjectId] : []}
                onChange={(ids) => setFeaturedProjectId(ids.length ? ids[ids.length - 1] : null)}
              />
              <div className="mt-6 space-y-2 border-t border-gray-100 pt-4">
                <Text typography="body2" render={<p />} className="font-medium text-gray-700">
                  히어로 전용 사진 (선택)
                </Text>
                <Text typography="body3" render={<p />} className="text-gray-500">
                  홈 상단 큰 이미지에만 쓰는 사진입니다. 등록하면 프로젝트 갤러리 슬라이드 대신 이 사진 1장이
                  노출됩니다. 가로 1920px 이상 권장.
                </Text>
                <ImageUploader value={heroImage} onChange={setHeroImage} folder="home" />
              </div>
            </Card.Body>
          </Card.Root>

          <Card.Root>
            <Card.Header>
              <Text typography="heading6" className="text-gray-900">
                메인 노출
              </Text>
              <Text typography="body3" render={<p />} className="mt-1 text-gray-500">
                홈 화면에 노출할 콘텐츠를 종류별로 선택합니다. 선택한 순서대로 노출되며, 화살표로 순서를 바꿀 수
                있습니다.
              </Text>
            </Card.Header>
            <Card.Body className="space-y-6">
              <div className="space-y-2">
                <Text typography="body2" render={<p />} className="font-medium text-gray-700">
                  프로젝트 — 홈 &lsquo;주요 프로젝트&rsquo; (최대 6개)
                </Text>
                <EntityPicker kind="project" value={mainProjects} onChange={setMainProjects} />
              </div>
              <div className="space-y-2">
                <Text typography="body2" render={<p />} className="font-medium text-gray-700">
                  아이템 — 홈 &lsquo;주요 아이템&rsquo; (최대 8개)
                </Text>
                <EntityPicker kind="item" value={mainItems} onChange={setMainItems} />
              </div>
              <div className="space-y-2">
                <Text typography="body2" render={<p />} className="font-medium text-gray-700">
                  브랜드 — 홈 &lsquo;협력사&rsquo; (비워두면 전체 브랜드 노출)
                </Text>
                <EntityPicker kind="brand" value={mainBrands} onChange={setMainBrands} />
              </div>
            </Card.Body>
          </Card.Root>
        </div>
      )}
    </MainLayout>
  );
}
