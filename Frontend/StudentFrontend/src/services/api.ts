import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/student';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const authService = {
  login: async (usn: string, password: string) => {
    const response = await api.post('/login/', { usn, password });
    return response.data;
  },
  
  register: async (usn: string, password: string) => {
    const response = await api.post('/signup/', { usn, password });
    return response.data;
  }
};

export const studentService = {
  getSubjects: async (usn: string) => {
    const response = await api.post('/subjects/', { usn });
    return response.data;
  },
  
  getSubjectDetails: async (usn: string, subject: string, examType: string) => {
    const response = await api.get(`/feedback/?usn=${usn}&subject=${subject}&exam_type=${examType}`);
    return response.data;
  }
};

export default api;