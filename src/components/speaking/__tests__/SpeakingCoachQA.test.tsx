import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CoachControlBar } from '../CoachControlBar';
import { CoachChatArea } from '../CoachChatArea';

vi.mock('../../../context/LanguageContext', () => ({
  useLanguage: () => ({ language: 'uz' }),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('../../../context/StudyPlannerContext', () => ({
  useStudyData: () => ({
    flashcards: [],
    user: { id: 'u1', email: 'test@example.com' },
  }),
}));

describe('Speaking Coach QA Verification: Push-to-Talk & Clean UI', () => {
  it('QA-2.1: CoachControlBar does NOT contain any hands-free toggle or auto-mic switches', () => {
    render(
      <CoachControlBar
        isLiveSession={true}
        isSpeaking={false}
        isThinking={false}
        isListening={false}
        isMuted={false}
        setIsMuted={() => {}}
        sessionSeconds={120}
        chatHistoryLength={2}
        toggleSession={() => {}}
        onClearHistory={() => {}}
        formatTimer={() => `02:00`}
      />,
    );

    // Verify hands-free toggles are completely absent
    expect(screen.queryByText(/hands-free/i)).toBeNull();
    expect(screen.queryByText(/✋/i)).toBeNull();
    expect(screen.queryByText(/avtomatik/i)).toBeNull();

    // Verify clean push-to-talk button is present
    expect(screen.getByTitle(/Gapirish \(Mikrofonni faollashtirish\)/i)).toBeDefined();
    expect(screen.getByText('GAPIRISH')).toBeDefined();
  });

  it('QA-2.2: CoachChatArea does NOT render conversation hint suggestion popups', () => {
    render(
      <CoachChatArea
        chatHistory={[
          {
            role: 'assistant',
            content: 'こんにちは！お元気ですか？',
            timestamp: new Date().toISOString(),
          },
        ]}
        isLiveSession={true}
        currentPersona={{
          name: 'Yuki Sensei',
          icon: () => null,
          color: '#3b82f6',
          desc: 'Tutor',
          emoji: '👩‍🏫',
        }}
        currentTranscript=""
        isListening={false}
        isThinking={false}
        copiedIndex={null}
        chatContainerRef={{ current: null }}
        handleTranslateMessage={() => {}}
        copyToClipboard={() => {}}
        speakText={() => {}}
        setChatHistory={() => {}}
      />,
    );

    // Verify unwanted hints/suggestion box is completely absent
    expect(screen.queryByText(/namunalar/i)).toBeNull();
    expect(screen.queryByText(/Nima deb javob bersam bo'ladi/i)).toBeNull();
  });

  it('QA-2.3: Push-to-Talk button fires onForceStartListening or barge-in when clicked', () => {
    const handleForceStart = vi.fn();
    const handleSetMuted = vi.fn();

    render(
      <CoachControlBar
        isLiveSession={true}
        isSpeaking={false}
        isThinking={false}
        isListening={false}
        isMuted={true}
        setIsMuted={handleSetMuted}
        sessionSeconds={10}
        chatHistoryLength={1}
        toggleSession={() => {}}
        onClearHistory={() => {}}
        formatTimer={() => `00:10`}
        onForceStartListening={handleForceStart}
      />,
    );

    const micBtn = screen.getByTitle(/Mikrofonni yoqish/i);
    fireEvent.click(micBtn);

    expect(handleSetMuted).toHaveBeenCalledWith(false);
    expect(handleForceStart).toHaveBeenCalledTimes(1);
  });

  it('QA-2.4: CoachChatArea renders recommended vocabulary items sequentially with prominent Uzbek translation', () => {
    const mockAddVocab = vi.fn().mockResolvedValue(true);

    render(
      <CoachChatArea
        chatHistory={[
          {
            role: 'assistant',
            content: '映画について話しましょう！',
            vocabulary: [
              {
                word: '字幕',
                reading: 'じまく',
                meaning: 'Subtitr (Subtitles)',
                example: '映画の字幕を見る',
              },
              {
                word: '感動的',
                reading: 'かんどうてき',
                meaning: "Ta'sirli, hayajonli (Emotional / Moving)",
                example: '感動的なストーリー',
              },
            ],
            timestamp: new Date().toISOString(),
          },
        ]}
        isLiveSession={true}
        currentPersona={{
          name: 'Yuki Sensei',
          icon: () => null,
          color: '#3b82f6',
          desc: 'Tutor',
          emoji: '👩‍🏫',
        }}
        currentTranscript=""
        isListening={false}
        isThinking={false}
        copiedIndex={null}
        chatContainerRef={{ current: null }}
        handleTranslateMessage={() => {}}
        copyToClipboard={() => {}}
        speakText={() => {}}
        setChatHistory={() => {}}
        onAddVocabulary={mockAddVocab}
      />,
    );

    // Sequence indices 1 and 2
    expect(screen.getByText('1')).toBeDefined();
    expect(screen.getByText('2')).toBeDefined();

    // Vocabulary words
    expect(screen.getByText('字幕')).toBeDefined();
    expect(screen.getByText('感動的')).toBeDefined();

    // Prominent Uzbek translations
    expect(screen.getByText('Subtitr')).toBeDefined();
    expect(screen.getByText("Ta'sirli, hayajonli")).toBeDefined();

    // Uzbek labels
    const uzbekLabels = screen.getAllByText(/🇺🇿 O'zbekcha:/i);
    expect(uzbekLabels.length).toBe(2);

    // Batch add button
    expect(screen.getByText(/Hammasini saqlash \(2\)/i)).toBeDefined();
  });

  it('QA-2.5: CoachChatArea batch saves all vocabulary items when "Hammasini saqlash" button is clicked', async () => {
    const mockAddVocab = vi.fn().mockResolvedValue(true);

    render(
      <CoachChatArea
        chatHistory={[
          {
            role: 'assistant',
            content: 'カフェで注文しましょう！',
            vocabulary: [
              {
                word: '注文',
                reading: 'ちゅうもん',
                meaning: 'Buyurtma (Order)',
              },
              {
                word: '持ち帰り',
                reading: 'もちかえり',
                meaning: 'Olib ketish (Takeout)',
              },
            ],
            timestamp: new Date().toISOString(),
          },
        ]}
        isLiveSession={true}
        currentPersona={{
          name: 'Yuki Sensei',
          icon: () => null,
          color: '#3b82f6',
          desc: 'Tutor',
          emoji: '👩‍🏫',
        }}
        currentTranscript=""
        isListening={false}
        isThinking={false}
        copiedIndex={null}
        chatContainerRef={{ current: null }}
        handleTranslateMessage={() => {}}
        copyToClipboard={() => {}}
        speakText={() => {}}
        setChatHistory={() => {}}
        onAddVocabulary={mockAddVocab}
      />,
    );

    const batchSaveBtn = screen.getByText(/Hammasini saqlash \(2\)/i);
    fireEvent.click(batchSaveBtn);

    await waitFor(() => {
      expect(mockAddVocab).toHaveBeenCalledTimes(2);
    });
  });
});
