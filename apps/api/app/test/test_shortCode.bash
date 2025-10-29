?Token generation example:
curl -X POST "http://127.0.0.1:8000/auth/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=test@example.com&password=admin123"


?short code creation example:
curl -X POST "http://127.0.0.1:8000/links/" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"original_url": "https://example.com"}'

?Short code response example:
curl -X GET "http://127.0.0.1:8000/links/" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"


eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhbmFAZ21haWwuY29tIiwiZXhwIjoxNzYxMzgxOTYyfQ.W3M-cf6OGQL3tbvXG4Ew29kru3kZSWjmTYtLE0eevhI


curl -X POST "http://127.0.0.1:8000/links/" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbkBnbWFpbC5jb20iLCJleHAiOjE3NjEzODQ2ODh9.p_sucMQV4MJX61CyTEOBfwfuZhRbAIEvkGPNUg7rNN4" \
  -H "Content-Type: application/json" \
  -d '{"original_url": "https://admin.com"}'
  



SELECT id, original_url, short_code FROM links;
curl -v http://127.0.0.1:8000/yXhP_Q
