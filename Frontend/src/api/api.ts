import axios from 'axios';

// In a real app, this would come from environment variables
const API_BASE_URL = 'http://localhost:8000';

// Creating axios instance with base URL
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface PaperData {
  paper: string[];
  sem: string;
}

export interface FeedbackData {
  marks: number;
  feedback: any;
}

export interface SubjectData {
  subject: string;
  paperTypes: string[];
  sem: string;
}

// Function to fetch student's papers
export const fetchPaper = async (usn: string, subject: string, paperType: string): Promise<PaperData> => {
  try {
    const response = await api.get(`/add_or_get_paper?usn=${usn}&subject=${subject}&paper_type=${paperType}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching paper:', error);
    throw new Error('Failed to fetch paper');
  }
};

// Function to fetch feedback and marks for a specific question
export const fetchFeedbackAndMarks = async (
  usn: string, 
  subject: string, 
  paperType: string, 
  qno: string
): Promise<FeedbackData> => {
  try {
    const response = await api.get(
      `/add_or_get_feedback_marks?usn=${usn}&subject=${subject}&paper_type=${paperType}&qno=${qno}`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching feedback and marks:', error);
    throw new Error('Failed to fetch feedback and marks');
  }
};

// For demo purposes, simulate fetching subjects for a student
export const fetchSubjects = async (usn: string): Promise<SubjectData[]> => {
  // In a real app, this would be an API call
  // For now, return mock data
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { subject: 'Mathematics', paperTypes: ['CIE', 'SEE'], sem: '3' },
        { subject: 'Data Structures', paperTypes: ['CIE', 'SEE'], sem: '3' },
        { subject: 'Operating Systems', paperTypes: ['CIE'], sem: '3' },
        { subject: 'Computer Networks', paperTypes: ['SEE'], sem: '4' }
      ]);
    }, 800);
  });
};

// For demo purposes, simulate fetching feedback for a question
export const fetchDemoFeedback = async (
  subject: string,
  paperType: string,
  qno: string
): Promise<FeedbackData> => {
  // Simulate API delay
  return new Promise((resolve) => {
    setTimeout(() => {
      // Sample feedback data
      if (subject === 'Mathematics') {
        if (qno === 'Q1') {
          resolve({
            marks: 8,
            feedback: {
              improvement: "Show more steps in your calculation",
              positives: "Good approach to the problem",
              errors: ["Mistake in formula application", "Sign error in final step"]
            }
          });
        } else {
          resolve({
            marks: 7,
            feedback: {
              improvement: "Work on clarity of explanations",
              positives: "Correct method used",
              errors: ["Minor calculation error"]
            }
          });
        }
      } else {
        resolve({
          marks: 9,
          feedback: {
            improvement: "Add more examples to illustrate concepts",
            positives: "Excellent understanding of core principles",
            errors: []
          }
        });
      }
    }, 600);
  });
};

// For demo purposes, simulate fetching a paper image
export const fetchDemoPaper = async (
  subject: string,
  paperType: string
): Promise<PaperData> => {
  // Simulate API delay
  return new Promise((resolve) => {
    setTimeout(() => {
      // Sample paper images (placeholders)
      const placeholderImages = [
        'https://images.pexels.com/photos/4145354/pexels-photo-4145354.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        'https://images.pexels.com/photos/4145355/pexels-photo-4145355.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
      ];
      
      resolve({
        paper: placeholderImages,
        sem: subject === 'Computer Networks' ? '4' : '3'
      });
    }, 800);
  });
};

export default api;