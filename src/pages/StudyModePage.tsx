import { Navigate, useLocation, useParams } from 'react-router-dom';

/** Keep existing bookmarks and plan links on the single flashcard study screen. */
export default function StudyModePage() {
  const { subjectId } = useParams<{ subjectId?: string }>();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  params.set('study', subjectId || params.get('deck') || 'all');
  params.delete('deck');
  return <Navigate to={`/flashcards?${params}`} state={location.state} replace />;
}
