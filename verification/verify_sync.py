from playwright.sync_api import sync_playwright, expect
import time

def verify_sync_button():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        # Set localStorage items before navigation (need to be on page first, but can use evaluate)
        page.goto("http://localhost:5173")

        # Ensure we are in a clean state or force settings
        page.evaluate("localStorage.setItem('data_logging_enabled', 'true')")
        page.evaluate("localStorage.setItem('cloud_sync_enabled', 'true')")

        # Reload to apply settings
        page.reload()

        # Wait for app to load
        page.wait_for_timeout(1000)

        # Open Settings
        print("Opening settings...")
        page.get_by_label("Open Settings").click()

        # Find Sync Now button
        print("Finding Sync Now button...")
        sync_button = page.get_by_role("button", name="Sync Now")
        expect(sync_button).to_be_visible()

        # Click Sync Now
        print("Clicking Sync Now...")
        sync_button.click()

        # Expect "Syncing..." state
        print("Checking for Syncing... state")
        expect(page.get_by_text("Syncing...")).to_be_visible()

        # Wait for success state (approx 500ms + render time)
        # The text changes to "Synced!"
        print("Waiting for Synced! state...")
        synced_text = page.get_by_text("Synced!")
        expect(synced_text).to_be_visible()

        # Take screenshot
        print("Taking screenshot...")
        page.screenshot(path="/home/jules/verification/sync_success.png")
        print("Screenshot saved.")

        browser.close()

if __name__ == "__main__":
    verify_sync_button()
