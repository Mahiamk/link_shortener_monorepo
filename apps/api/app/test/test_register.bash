curl -X POST "http://127.0.0.1:8000/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "admin123"}'


curl -X POST "http://127.0.0.1:8000/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email": "anu@gmail.com", "password": "admin"}'




curl -X POST "https://your-backend.up.railway.app/api/auth/promote-to-admin/" \
     -H "Content-Type: application/json" \
     -d '{
           "email": "CAMK0966@gmail.com",
           "secret_key": "nqxYAut790SQi3YUVz1pRBXU12RpJvdGPdY5Ae6IGco"
         }'
         
