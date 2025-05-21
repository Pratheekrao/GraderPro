import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import Button from '../components/Button';
import QuestionItem from '../components/QuestionItem';

type ExtractedQuestions = Record<string, string>;
type DiagramRequirement = Record<string, boolean>;
type DiagramImages = Record<string, File | null>;

const UploadQuestionPage = () => {
  const navigate = useNavigate();

  const [numQuestions, setNumQuestions] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [examType, setExamType] = useState('');
  const [questionPaper, setQuestionPaper] = useState<File | null>(null);
  const [paperPreview, setPaperPreview] = useState('');

  const [extractedQuestions, setExtractedQuestions] = useState<ExtractedQuestions>({});
  const [questionRequiresDiagram, setQuestionRequiresDiagram] = useState<DiagramRequirement>({});
  const [diagramImages, setDiagramImages] = useState<DiagramImages>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);

  const GROQ_API_KEY = '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';
  const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
  const GROQ_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';

  const handleQuestionPaperChange = (file: File | null) => {
    if (!file) {
      setQuestionPaper(null);
      setPaperPreview('');
      return;
    }
    setQuestionPaper(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setPaperPreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const extractQuestions = async () => {
    if (!questionPaper) return;

    setIsLoading(true);
    setError('');

    try {
      const base64Image = await convertImageToBase64(questionPaper);

      const prompt = `
        You are an expert in extracting questions from question papers.
        Please extract ${numQuestions} questions from the following image of a ${subjectName} ${examType} paper.
        Return the result as a JSON object where the keys are question numbers and values are the question text.
        For questions that mention diagrams or appear to require diagrams, please add "(requires diagram)" at the end.
      `;

      const payload = {
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: prompt },
          {
            role: 'user',
            content: [
              { type: 'text', text: `This is a ${subjectName} ${examType} question paper.` },
              { type: 'image_url', image_url: { url: base64Image } },
            ],
          },
        ],
        temperature: 0.1,
        max_tokens: 4000,
      };

      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`Groq API error: ${response.status}`);
      const data = await response.json();
      const assistantMessage = data.choices?.[0]?.message?.content;

      const match = assistantMessage.match(/\{[\s\S]*\}/);
      const questionsJson = match ? JSON.parse(match[0]) : {};

      if (!Object.keys(questionsJson).length) throw new Error('No questions extracted');

      const requiresDiagram: DiagramRequirement = {};
      const processedQuestions: ExtractedQuestions = {};

      Object.entries(questionsJson).forEach(([qNum, qText]) => {
        const text = String(qText);
        const needsDiagram = text.toLowerCase().includes('(requires diagram)');
        requiresDiagram[qNum] = needsDiagram;
        processedQuestions[qNum] = text.replace('(requires diagram)', '').trim();
      });

      const diagramInit: DiagramImages = {};
      Object.keys(processedQuestions).forEach((qNum) => {
        if (requiresDiagram[qNum]) {
          diagramInit[qNum] = null;
        }
      });

      setExtractedQuestions(processedQuestions);
      setQuestionRequiresDiagram(requiresDiagram);
      setDiagramImages(diagramInit);
      setStep(2);

    } catch (err: any) {
      console.error('Extraction error:', err);
      setError(`Failed to extract questions: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDiagramUpload = (qNum: string, file: File | null) => {
    setDiagramImages((prev) => ({ ...prev, [qNum]: file }));
  };

  const saveToBackend = async () => {
    setIsLoading(true);
    setError('');

    try {
      const questions = Object.entries(extractedQuestions).map(([qno, question]) => ({
        qno: parseInt(qno),
        question,
      }));

      const formData = new FormData();
      formData.append('exam_type', examType);
      formData.append('subject', subjectName);
      formData.append('questions', JSON.stringify(questions));

      Object.entries(diagramImages).forEach(([qNum, file]) => {
        if (file) formData.append(`image_${qNum}`, file);
      });

      const response = await fetch('http://127.0.0.1:8000/upload/upload_qp_json/', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save questions');
      }

      localStorage.setItem('subject', subjectName);
      localStorage.setItem('examType', examType);
      alert('Questions saved successfully!');
      navigate('/upload_answer');

    } catch (err: any) {
      console.error('Save error:', err);
      setError(`Failed to save questions: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setNumQuestions('');
    setSubjectName('');
    setExamType('');
    setQuestionPaper(null);
    setPaperPreview('');
    setExtractedQuestions({});
    setQuestionRequiresDiagram({});
    setDiagramImages({});
    setStep(1);
    setError('');
  };

  const isSubmitDisabled = () =>
    Object.entries(questionRequiresDiagram).some(
      ([qNum, required]) => required && !diagramImages[qNum]
    );

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center mb-2">
          <h2 className="text-2xl font-bold text-gray-800">
            {step === 1 ? 'Upload Question Paper' : 'Review Questions'}
          </h2>
        </div>
        <div className="flex mb-8">
          <div className="flex items-center">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full ${step >= 1 ? 'bg-blue-600' : 'bg-gray-200'}`}>
              <CheckCircle className={`h-5 w-5 ${step >= 1 ? 'text-white' : 'text-gray-500'}`} />
            </div>
            <span className={`ml-2 text-sm font-medium ${step >= 1 ? 'text-blue-600' : 'text-gray-500'}`}>Upload</span>
          </div>
          <div className={`ml-2 mr-2 h-0.5 w-16 self-center ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
          <div className="flex items-center">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}>
              <span className={`text-sm font-medium ${step >= 2 ? 'text-white' : 'text-gray-500'}`}>2</span>
            </div>
            <span className={`ml-2 text-sm font-medium ${step >= 2 ? 'text-blue-600' : 'text-gray-500'}`}>Review & Submit</span>
          </div>
        </div>
      </div>

      {step === 1 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Input label="Subject Name" value={subjectName} onChange={setSubjectName} placeholder="e.g. Mathematics" />
            <Input label="Type of Exam" value={examType} onChange={setExamType} placeholder="e.g. Final Term" />
          </div>

          <Input
            label="Number of Questions"
            value={numQuestions}
            onChange={setNumQuestions}
            placeholder="Enter total number of questions"
            type="number"
          />

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Upload Question Paper Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleQuestionPaperChange(e.target.files?.[0] || null)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2.5"
            />
            {paperPreview && (
              <div className="mt-4">
                <img src={paperPreview} alt="Preview" className="max-w-full max-h-96 rounded border" />
              </div>
            )}
          </div>

          <div className="flex justify-end mt-8">
            <Button
              onClick={extractQuestions}
              disabled={!numQuestions || !subjectName || !examType || !questionPaper || isLoading}
              isLoading={isLoading}
            >
              Extract Questions
            </Button>
          </div>

          {error && <ErrorBox message={error} />}
        </div>
      )}

      {step === 2 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Extracted Questions</h3>
          <div className="space-y-4">
            {Object.entries(extractedQuestions).map(([qNum, qText]) => (
              <QuestionItem
                key={qNum}
                questionNum={qNum}
                questionText={qText}
                requiresDiagram={questionRequiresDiagram[qNum]}
                onDiagramUpload={handleDiagramUpload}
              />
            ))}
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8">
            <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
            <div className="flex gap-4">
              <Button variant="danger" onClick={resetForm}>Reset</Button>
              <Button onClick={saveToBackend} disabled={isSubmitDisabled() || isLoading} isLoading={isLoading}>
                Save & Continue
              </Button>
            </div>
          </div>

          {error && <ErrorBox message={error} />}
          {isSubmitDisabled() && (
            <div className="mt-4 p-4 bg-yellow-50 rounded-md border border-yellow-200 text-yellow-700">
              Please upload diagrams for all required questions before continuing.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const Input = ({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  type?: string;
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2.5"
    />
  </div>
);

const ErrorBox = ({ message }: { message: string }) => (
  <div className="mt-4 p-4 bg-red-50 rounded-md border border-red-200 text-red-700">{message}</div>
);

export default UploadQuestionPage;
