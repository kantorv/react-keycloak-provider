
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


# https://googlechromelabs.github.io/chrome-for-testing/#beta
# https://googlechromelabs.github.io/chrome-for-testing/
# CHROME_VERSION="129.0.6634.0" # CANARY
#

# local env



def get_default_chrome_options():
    options = webdriver.ChromeOptions()
    options.add_argument("--no-sandbox")
    return options


def init_browser():
    # local env
    # CHROME_VERSION = "128.0.6613.119"  # STABLE
    # DRIVER_PATH = f"../chrome/{CHROME_VERSION}/chromedriver-linux64/chromedriver"
    # BINARY_PATH = f"../chrome/{CHROME_VERSION}/chrome-linux64/chrome"

    DRIVER_PATH = f"/tmp/chromedriver-linux64/chromedriver"
    BINARY_PATH = f"/tmp/chrome-linux64/chrome"

    chrome_options =   get_default_chrome_options()
    assert chrome_options.capabilities['browserName'] == 'chrome'
    #  chrome_options.add_experimental_option("prefs", prefs)

    chrome_options.add_argument("--headless")  # Enable headless mode
    chrome_options.add_argument("--disable-gpu")  # Disable GPU acceleration
    chrome_options.add_argument("--window-size=1920,1080")  # Set window size (optional)
    chrome_options.binary_location = BINARY_PATH

    service = Service(executable_path=DRIVER_PATH)
    browser = webdriver.Chrome(options=chrome_options, service=service)
    return browser


def run_test():
    print(f"[run_test] browser init")
    browser = init_browser()


    browser.get("http://localhost:3000")
    WebDriverWait(browser, 10).until(EC.element_to_be_clickable((By.XPATH, ".//a[text()='Login']")))
    print(f"[run_test] browser open: localhost:3000")


    print(f"[run_test] Login btn click")
    btn = browser.find_element(By.XPATH, ".//a[text()='Login']")
    btn.click()

    WebDriverWait(browser, 10).until(EC.url_contains('localhost:8282'))
    print(f"[run_test] Redirected to localhost:8282")

    username_input = browser.find_element(By.ID, "username")
    password_input = browser.find_element(By.ID, 'password')
    username_input.send_keys('demo3@example.com')
    password_input.send_keys('demo@pass')
    browser.find_element(By.ID, 'kc-login').click()
    print(f"[run_test] Passed credentials and clicked 'Sign In'")


    WebDriverWait(browser, 10).until(EC.url_contains('localhost:3000'))
    print(f"[run_test] Redirected to localhost:3000")




    # click on logout button
    WebDriverWait(browser, 10).until(EC.element_to_be_clickable((By.XPATH, ".//a[text()='Logout']")))
    logout_btn = browser.find_element(By.XPATH, ".//a[text()='Logout']")
    logout_btn.click()
    print(f"[run_test] Clicked on 'Logout' button")

    # verify login btn exists
    WebDriverWait(browser, 10).until(EC.element_to_be_clickable((By.XPATH, ".//a[text()='Login']")))
    login_btn = browser.find_element(By.XPATH, ".//a[text()='Login']")
    # will raise an exception if non found

    print(f"[run_test] Logout success") # logout success





def main():
    print("keycloak login integration test started")
    run_test()


if __name__ == "__main__":
    main()