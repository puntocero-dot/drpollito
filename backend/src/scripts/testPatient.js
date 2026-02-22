const axios = require('axios');

const API = 'http://localhost:3001/api';

async function test() {
  try {
    // Login
    const loginRes = await axios.post(`${API}/auth/login`, {
      email: 'admin@mydr.com',
      password: '123456'
    });
    
    const token = loginRes.data.token;
    console.log('Login OK, token:', token.substring(0, 20) + '...');
    
    // Create patient
    const patientRes = await axios.post(`${API}/patients`, {
      firstName: 'Juan',
      lastName: 'Pérez',
      dateOfBirth: '2020-05-15',
      gender: 'male'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('Patient created:', patientRes.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    if (error.response?.data?.errors) {
      console.error('Validation errors:', JSON.stringify(error.response.data.errors, null, 2));
    }
  }
}

test();
