import axios from 'axios';

describe('GET /api', () => {
  it('should return a message', async () => {
    const res = await axios.get(`/api`);

    expect(res.status).toBe(200);
    expect(res.data).toEqual({ message: 'Hello API' });
  });
});

describe('POST /auth/login', () => {
  it('should return a 401 for invalid credentials', async () => {
    try {
      await axios.post(`/auth/login`, {
        email: 'fake@example.com',
        password: 'fakepassword',
      });
    } catch (error) {
      expect(error.response.status).toBe(401);
      expect(error.response.data.message).toBe('Unauthorized');
    }
  });
});
