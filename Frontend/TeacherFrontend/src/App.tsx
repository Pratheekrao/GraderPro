import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import UploadQuestionPage from './pages/UploadQuestionPage';
import UploadAnswerPage from './pages/UploadAnswerPage';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 pb-12 pt-6">
        <Routes>
          <Route path="/" element={<UploadQuestionPage />} />
          <Route path="/upload_answer" element={<UploadAnswerPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;