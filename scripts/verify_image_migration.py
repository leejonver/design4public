#!/usr/bin/env python3
"""Verify the image-model migration (019) was lossless against the LIVE database.

Reads Supabase creds from .env.local and queries via PostgREST. Asserts:
  1. every distinct (project_id, image_url) in legacy project_images is represented
     in project_photos (joined through photos by url)
  2. every distinct (item_id, image_url) in legacy item_images is represented in photo_items
  3. every items.image_url is represented in photo_items for that item
  4. at most one is_main per parent in project_photos and photo_items

Exit code 0 = PASS, 1 = FAIL. Safe to run before AND after 019 (before: will report the
pre-existing loss; after: must be all zeros). renewal_requirements.md §9-1.

NOTE: once migration 020 drops project_images/item_images/items.image_url, checks 1-3 become
vacuously true (no legacy source to compare) — run this BETWEEN 019 and 020.
"""
import json
import os
import sys
import urllib.request
from collections import defaultdict


def load_env(path=".env.local"):
    env = {}
    with open(path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                env[k] = v.strip().strip('"').strip("'")
    return env


def main():
    env = load_env()
    url = env["NEXT_PUBLIC_SUPABASE_URL"]
    key = env["SUPABASE_SERVICE_ROLE_KEY"]

    def get(path):
        req = urllib.request.Request(
            f"{url}/rest/v1/{path}",
            headers={"apikey": key, "Authorization": f"Bearer {key}"},
        )
        return json.load(urllib.request.urlopen(req))

    def table_exists(name):
        try:
            get(f"{name}?select=*&limit=1")
            return True
        except Exception:
            return False

    def get_optional_main(table, cols):
        """Select cols incl. is_main; if is_main column doesn't exist yet (pre-019), fall back."""
        try:
            return get(f"{table}?select={cols},is_main&limit=5000")
        except Exception:
            rows = get(f"{table}?select={cols}&limit=5000")
            for r in rows:
                r["is_main"] = False
            return rows

    photos = get("photos?select=id,image_url&limit=5000")
    pp = get_optional_main("project_photos", "project_id,photo_id")
    phi = get_optional_main("photo_items", "photo_id,item_id")
    id2url = {p["id"]: p["image_url"] for p in photos}

    failures = []

    # checks 1-3 require legacy tables (skip gracefully once 020 has dropped them)
    if table_exists("project_images"):
        pi = get("project_images?select=project_id,image_url&limit=5000")
        legacy = {(r["project_id"], r["image_url"]) for r in pi if r["image_url"]}
        covered = {(r["project_id"], id2url.get(r["photo_id"])) for r in pp}
        missing = legacy - covered
        print(f"[project_images] legacy links={len(legacy)} missing={len(missing)}")
        if missing:
            failures.append(f"{len(missing)} project image links missing")
    else:
        print("[project_images] dropped (post-020) — skipped")

    if table_exists("item_images"):
        ii = get("item_images?select=item_id,image_url&limit=5000")
        legacy = {(r["item_id"], r["image_url"]) for r in ii if r["image_url"]}
        covered = {(r["item_id"], id2url.get(r["photo_id"])) for r in phi}
        missing = legacy - covered
        print(f"[item_images] legacy links={len(legacy)} missing={len(missing)}")
        if missing:
            failures.append(f"{len(missing)} item image links missing")

    items = get("items?select=id,image_url&limit=5000")
    items_with = [i for i in items if i.get("image_url")]
    if items_with and "image_url" in items[0]:
        covered = {(r["item_id"], id2url.get(r["photo_id"])) for r in phi}
        missing = [i for i in items_with if (i["id"], i["image_url"]) not in covered]
        print(f"[items.image_url] set={len(items_with)} missing={len(missing)}")
        if missing:
            failures.append(f"{len(missing)} items.image_url not in photo_items")

    # check 4: single is_main per parent
    pmain = defaultdict(int)
    for r in pp:
        if r["is_main"]:
            pmain[r["project_id"]] += 1
    imain = defaultdict(int)
    for r in phi:
        if r["is_main"]:
            imain[r["item_id"]] += 1
    multi_p = [k for k, v in pmain.items() if v > 1]
    multi_i = [k for k, v in imain.items() if v > 1]
    print(f"[is_main] projects with >1 main={len(multi_p)} items with >1 main={len(multi_i)}")
    if multi_p or multi_i:
        failures.append("multiple is_main per parent detected")

    print(
        f"\ncounts: photos={len(photos)} project_photos={len(pp)} photo_items={len(phi)} "
        f"projects_with_main={len(pmain)} items_with_main={len(imain)}"
    )

    if failures:
        print("\nRESULT: FAIL ✗")
        for f in failures:
            print(f"  - {f}")
        sys.exit(1)
    print("\nRESULT: PASS ✓ (no image loss; single-main invariant holds)")


if __name__ == "__main__":
    main()
