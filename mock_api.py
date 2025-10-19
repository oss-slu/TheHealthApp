from http.server import BaseHTTPRequestHandler, HTTPServer
import json

class MockHandler(BaseHTTPRequestHandler):
    def _send(self, code, data):
        self.send_response(code)
        # CORS headers so browser-based requests from the dev server are allowed
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.send_header('Content-Type','application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def do_OPTIONS(self):
        # Respond to preflight requests
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()

    def do_POST(self):
        if self.path == '/api/v1/auth/login':
            content_len = int(self.headers.get('Content-Length',0))
            body = self.rfile.read(content_len).decode()
            # naive accept any login
            tokens = { 'access_token': 'mock-access', 'refresh_token': 'mock-refresh' }
            self._send(200, { 'data': { 'tokens': tokens } })
            return
        self._send(404, {'detail':'not found'})

    def do_GET(self):
        if self.path == '/api/v1/users/me':
            auth = self.headers.get('Authorization','')
            if auth == 'Bearer mock-access':
                user = { 'id': '1', 'name': 'Naasir', 'photo': 'https://placehold.co/64x64' }
                self._send(200, { 'data': user })
                return
            else:
                self._send(401, {'detail': 'Invalid or expired access token'})
                return
        self._send(404, {'detail':'not found'})

if __name__ == '__main__':
    server = HTTPServer(('0.0.0.0', 8000), MockHandler)
    print('Mock API running on http://0.0.0.0:8000')
    server.serve_forever()
