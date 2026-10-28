#!/usr/bin/env python3
"""Parse sitemap.xml and verify local canonical/indexability consistency.

Pass --live to additionally check production status codes and response metadata.
Live checks are best-effort so a DNS outage is reported as NOT VERIFIED rather
than being confused with a local sitemap defect.
"""

from __future__ import annotations

import argparse
import re
import sys
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
BASE = "https://cocoabridge.com"
NS = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}


def canonical(html: str) -> list[str]:
    return re.findall(r'<link\s+rel=["\']canonical["\']\s+href=["\']([^"\']+)', html, re.I)


def is_noindex(html: str) -> bool:
    return bool(re.search(r'<meta\s+name=["\']robots["\'][^>]*content=["\'][^"\']*noindex', html, re.I))


def local_target(url: str) -> Path | None:
    parsed = urlparse(url)
    if parsed.scheme != "https" or parsed.netloc != "cocoabridge.com" or parsed.query:
        return None
    path = parsed.path.lstrip("/")
    if not path or path.endswith("/"):
        path += "index.html"
    target = (ROOT / path).resolve()
    return target if target.is_relative_to(ROOT) and target.exists() else None


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--live", action="store_true", help="check production status codes and metadata")
    args = parser.parse_args()
    failures: list[str] = []
    sitemap_path = ROOT / "sitemap.xml"

    try:
        root = ET.parse(sitemap_path).getroot()
    except (ET.ParseError, OSError) as exc:
        print(f"Sitemap XML parse FAILED: {exc}")
        return 1

    locations = [node.text.strip() for node in root.findall("sm:url/sm:loc", NS) if node.text and node.text.strip()]
    url_nodes = root.findall("sm:url", NS)
    if root.tag != "{http://www.sitemaps.org/schemas/sitemap/0.9}urlset":
        failures.append("sitemap.xml root is not the Sitemap 0.9 urlset element.")
    if len(locations) != len(url_nodes):
        failures.append("Every sitemap url element must contain exactly one non-empty loc element.")
    if len(set(locations)) != len(locations):
        failures.append("sitemap.xml contains duplicate URLs.")

    for location in locations:
        target = local_target(location)
        if target is None:
            failures.append(f"Sitemap URL is not a valid local HTTPS page: {location}")
            continue
        html = target.read_text(encoding="utf-8")
        canonicals = canonical(html)
        if canonicals != [location]:
            failures.append(f"Sitemap URL does not match the page's unique canonical: {location}")
        if is_noindex(html):
            failures.append(f"Sitemap URL points to a noindex page: {location}")

    print(f"Sitemap XML parsed successfully with {len(locations)} URLs.")
    print("Local URL, canonical, and indexability checks passed." if not failures else "")

    if args.live:
        live_failures = []
        for location in locations:
            try:
                request = urllib.request.Request(location, method="GET", headers={"User-Agent": "COCOABRIDGE SEO audit"})
                with urllib.request.urlopen(request, timeout=10) as response:
                    if response.status != 200:
                        live_failures.append(f"{location} returned HTTP {response.status}")
            except (urllib.error.URLError, TimeoutError) as exc:
                print(f"Live status/indexability: NOT VERIFIED ({exc})")
                break
        else:
            print("Live status/indexability checks passed for all sitemap URLs.")
        if live_failures:
            failures.extend(live_failures)

    if failures:
        print("Sitemap validation FAILED:")
        for failure in failures:
            print(f"- {failure}")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
