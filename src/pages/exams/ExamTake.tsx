import { Navigate, useParams } from 'react-router-dom';

/** Existing exam links use the same runner, timing and results as the exam catalog. */
export const ExamTake = () => {
  const { id } = useParams();
  const examId = id === 'exam_ielts_academic_1' ? 'exam_jlpt_n1_1' : id;
  const params = new URLSearchParams();
  if (examId) params.set('examId', examId);
  const level = examId?.match(/n[1-5]/i)?.[0].toUpperCase();
  if (level) params.set('level', level);
  return <Navigate to={`/exams?${params}`} replace />;
};
export default ExamTake;
