curl -X POST "http://127.0.0.1:8000/auth/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin@gmail.com&password=admin"










curl -X GET "http://127.0.0.1:8000/links/expired" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbkBnbWFpbC5jb20iLCJleHAiOjE3NjEzODUxMjB9.J1GpPewniYZUtofnOwfcr-zbWLpcpLhEDUpkuQeKPKM"
