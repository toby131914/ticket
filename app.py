import os
import subprocess
import time
import threading
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

app = Flask(__name__)
CORS(app)

driver = None
status = {"state": "idle", "message": "等待啟動"}

def run_sniper(url, cfg, target_time):
    global driver, status
    try:
        if driver is None:
            opt = Options()
            opt.add_experimental_option("debuggerAddress", "127.0.0.1:9527")
            driver = webdriver.Chrome(options=opt)

        if len(driver.window_handles) > 0:
            driver.switch_to.window(driver.window_handles[-1])

        # 等待目標時間
        while True:
            now = datetime.now().strftime("%H:%M:%S")
            status = {"state": "waiting", "message": f"等待中 {now}"}
            if now >= target_time:
                driver.get(url)
                break
            time.sleep(0.01)

        status = {"state": "loading", "message": "已開啟表單，等待載入..."}

        # 等待表單開放
        while True:
            src = driver.page_source
            if any(k in src for k in ["不再接受回應", "尚未開放", "不再開啟"]):
                driver.refresh()
                time.sleep(0.2)
                status = {"state": "retrying", "message": "表單尚未開放，重新整理中..."}
            elif "form" in src:
                break
            else:
                time.sleep(0.1)

        status = {"state": "filling", "message": "表單已開放，填寫中..."}

        # 取消記錄 email 的勾選
        try:
            email_checkbox = driver.find_element(By.XPATH, '//div[@role="checkbox" and contains(@aria-label, "記錄")]')
            if email_checkbox.get_attribute("aria-checked") == "false":
                driver.execute_script("arguments[0].click();", email_checkbox)
        except:
            pass

        js_f = "function setVal(el, v) { if(!el) return; el.value=v; el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true})); el.dispatchEvent(new Event('blur',{bubbles:true})); }"
        questions = driver.find_elements(By.XPATH, '//div[@role="listitem"] | //div[contains(@class, "geS5ce")]')

        for q in questions:
            txt = q.text.lower()
            try:
                inp = q.find_element(By.XPATH, './/input | .//textarea')
                val = ""
                if any(k in txt for k in ["郵件", "email", "信箱", "電子"]): val = cfg['email']
                elif any(k in txt for k in ["暱稱", "id", "nickname", "代號", "稱呼"]): val = cfg['nick']
                elif any(k in txt for k in ["姓名", "名字", "名稱", "真實", "name", "填寫人"]): val = cfg['name']
                elif any(k in txt for k in ["手機", "電話", "phone", "mobile", "號碼", "聯絡"]): val = cfg['phone']
                if val:
                    driver.execute_script(js_f + "setVal(arguments[0], arguments[1]);", inp, val)
            except:
                pass

        target_key = cfg.get('key', '')
        if target_key:
            options = driver.find_elements(By.XPATH, '//div[@role="radio"] | //div[@role="checkbox"]')
            for opt_el in options:
                opt_text = opt_el.get_attribute("data-value") or opt_el.text
                if target_key in opt_text:
                    driver.execute_script("arguments[0].scrollIntoView({block: 'center'}); arguments[0].click();", opt_el)
                    break

        driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        status = {"state": "done", "message": "✅ 填寫完成！請確認並送出表單。"}

    except Exception as e:
        status = {"state": "error", "message": f"❌ 錯誤：{str(e)}"}
        driver = None


@app.route('/api/login', methods=['POST'])
def pre_login():
    user_data = os.path.join(os.environ.get('USERPROFILE', os.path.expanduser('~')), "Documents", "ChromeSniperProfile")
    if not os.path.exists(user_data):
        os.makedirs(user_data)
    os.system("taskkill /F /IM chrome.exe /T >nul 2>&1")
    time.sleep(1)
    subprocess.Popen(
        f'start chrome.exe --remote-debugging-port=9527 --user-data-dir="{user_data}" "https://www.google.com"',
        shell=True
    )
    return jsonify({"success": True, "message": "Chrome 已開啟，請完成登入後不要關閉視窗"})


@app.route('/api/start', methods=['POST'])
def start_sniper():
    global status
    data = request.json
    url = data.get('url', '')
    target_time = data.get('time', '00:00:00')
    cfg = {
        'name': data.get('name', ''),
        'nick': data.get('nick', ''),
        'phone': data.get('phone', ''),
        'email': data.get('email', ''),
        'key': data.get('key', '')
    }
    if not url:
        return jsonify({"success": False, "message": "請填寫表單網址"})

    status = {"state": "starting", "message": "啟動中..."}
    t = threading.Thread(target=run_sniper, args=(url, cfg, target_time), daemon=True)
    t.start()
    return jsonify({"success": True, "message": "已啟動搶票"})


@app.route('/api/status', methods=['GET'])
def get_status():
    return jsonify(status)


if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=False)
