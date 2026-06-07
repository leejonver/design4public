// Design4Public CMS - 홈 화면 설정 페이지

'use client';

import { useEffect, useState } from 'react';
import { Button, Callout, Card, Spinner, Text } from '@vapor-ui/core';
import MainLayout from '@/components/MainLayout';
import { PageHeader, EntityPicker, SuccessCallout } from '@/components/ui';
import { api } from '@/lib/api';
import type { HomeFeaturedItem, HomeSettings } from '@/types';

type EntityType = HomeFeaturedItem['entityType'];

export default function HomeSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [featuredProjectId, setFeaturedProjectId] = useState<string | null>(null);
  const [mainProjects, setMainProjects] = useState<string[]>([]);
  const [mainItems, setMainItems] = useState<string[]>([]);
  const [mainPhotos, setMainPhotos] = useState<string[]>([]);
  const [mainBrands, setMainBrands] = useState<string[]>([]);

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError(null);
    api.homeSettings
      .get()
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
          setMainProjects(byType('project'));
          setMainItems(byType('item'));
          setMainPhotos(byType('photo'));
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
      ...tag(mainPhotos, 'photo'),
      ...tag(mainBrands, 'brand'),
    ];
    try {
      const res = await api.homeSettings.update({ featuredProjectId, featured });
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
            </Card.Body>
          </Card.Root>

          <Card.Root>
            <Card.Header>
              <Text typography="heading6" className="text-gray-900">
                메인 노출
              </Text>
              <Text typography="body3" render={<p />} className="mt-1 text-gray-500">
                홈 화면에 노출할 콘텐츠를 종류별로 선택합니다. 선택한 순서대로 노출됩니다.
              </Text>
            </Card.Header>
            <Card.Body className="space-y-6">
              <div className="space-y-2">
                <Text typography="body2" render={<p />} className="font-medium text-gray-700">
                  프로젝트
                </Text>
                <EntityPicker kind="project" value={mainProjects} onChange={setMainProjects} />
              </div>
              <div className="space-y-2">
                <Text typography="body2" render={<p />} className="font-medium text-gray-700">
                  아이템
                </Text>
                <EntityPicker kind="item" value={mainItems} onChange={setMainItems} />
              </div>
              <div className="space-y-2">
                <Text typography="body2" render={<p />} className="font-medium text-gray-700">
                  사진
                </Text>
                <EntityPicker kind="photo" value={mainPhotos} onChange={setMainPhotos} />
              </div>
              <div className="space-y-2">
                <Text typography="body2" render={<p />} className="font-medium text-gray-700">
                  브랜드
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
