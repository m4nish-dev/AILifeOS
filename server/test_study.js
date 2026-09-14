import axios from 'axios';

(async () => {
  try {
    // 1. Login
    const res = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'm4nish@example.com', // user's likely email or we can just register one
      password: 'password123'
    });
  } catch (err) {
    console.error(err.message);
  }
})();
