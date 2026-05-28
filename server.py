#!/usr/bin/env python3
"""
搶票助手 - 本機測試伺服器

使用方式：
  python3 server.py
  
或在 PowerShell 上：
  python server.py
  
然後打開瀏覽器：
  http://localhost:8000
"""

import http.server
import socketserver
import os
import sys
import webbrowser
from pathlib import Path

PORT = 8000

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # 防止快取，每次都重新載入
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        super().end_headers()
    
    def log_message(self, format, *args):
        # 美化日誌輸出
        print(f'[{self.log_date_time_string()}] {format % args}')

def main():
    # 確保在正確的目錄
    current_dir = Path(__file__).parent / 'github-pages'
    if not current_dir.exists():
        current_dir = Path.cwd()
    
    print(f'📁 伺服器目錄：{current_dir}')
    print(f'🌐 訪問網址：http://localhost:{PORT}')
    print(f'🛑 停止伺服器：按 Ctrl+C\n')
    
    os.chdir(current_dir)
    
    with socketserver.TCPServer(('', PORT), MyHTTPRequestHandler) as httpd:
        # 嘗試自動開啟瀏覽器
        try:
            webbrowser.open(f'http://localhost:{PORT}')
            print('✅ 已自動開啟瀏覽器\n')
        except:
            print('⚠️  無法自動開啟瀏覽器，請手動訪問：http://localhost:8000\n')
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print('\n\n👋 伺服器已停止')
            sys.exit(0)

if __name__ == '__main__':
    main()
