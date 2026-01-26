import os
import time
from playwright.sync_api import sync_playwright

def verify_settings_accessibility(page):
    print("Navigating to app...")
    page.goto("http://localhost:5173")

    print("Clicking Open Settings...")
    # Wait for the button to be visible
    page.wait_for_selector('button[aria-label="Open Settings"]')
    page.get_by_label("Open Settings").click()

    print("Waiting for Settings Panel...")
    # Wait for Settings Panel to appear
    page.wait_for_selector("#settings-title")

    # Give it a moment for transition
    time.sleep(1)

    print("Taking screenshot...")
    page.screenshot(path="/home/jules/verification/settings_panel.png")

    print("Verifying attributes...")
    # 1. Dialog role
    dialog = page.locator('div[role="dialog"]')
    print(f"Dialog count: {dialog.count()}")
    if dialog.count() > 0:
        print(f"Dialog aria-modal: {dialog.get_attribute('aria-modal')}")
        print(f"Dialog aria-labelledby: {dialog.get_attribute('aria-labelledby')}")

    # 2. Toggle attributes (Audio Alerts)
    # The first toggle is usually Audio Alerts in the list (Wait, Speed Threshold is first input, then Toggles)
    # Let's find specific toggle by text content of its label
    # The label text is inside a span with an ID

    # Helper to print switch details
    switches = page.locator('button[role="switch"]').all()
    for i, switch in enumerate(switches):
        lbl_id = switch.get_attribute('aria-labelledby')
        desc_id = switch.get_attribute('aria-describedby')
        print(f"Switch {i}: aria-labelledby={lbl_id}, aria-describedby={desc_id}")

        # Verify ids exist
        if lbl_id:
            lbl_text = page.locator(f"#{lbl_id}").text_content()
            print(f"  Label text: {lbl_text}")
        if desc_id:
            desc_text = page.locator(f"#{desc_id}").text_content()
            print(f"  Desc text: {desc_text}")

    # 3. Input attributes (Speed Threshold)
    input_el = page.locator('#speed-threshold')
    print(f"Speed Threshold Input count: {input_el.count()}")
    label_el = page.locator('label[for="speed-threshold"]')
    print(f"Speed Threshold Label count: {label_el.count()}")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Pixel 7 viewport
        context = browser.new_context(viewport={"width": 412, "height": 915})
        page = context.new_page()
        try:
            verify_settings_accessibility(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="/home/jules/verification/error.png")
        finally:
            browser.close()
