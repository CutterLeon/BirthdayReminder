"""Minimaler Smoke-Test für die Organizer-Startseite (Playwright)."""

import os

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5179")
URL = f"http://127.0.0.1:{PORT}/"


def main() -> None:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(URL, wait_until="domcontentloaded")
        page.wait_for_selector(".landing-logo", timeout=30_000)
        assert "Organizer" in page.locator(".landing-logo").inner_text()
        page.get_by_text("Aufgaben", exact=False).first.wait_for(state="visible", timeout=15_000)
        page.locator('a[href="/register"]').first.wait_for(state="visible")
        browser.close()


if __name__ == "__main__":
    main()
