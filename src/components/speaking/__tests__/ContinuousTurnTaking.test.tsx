import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CoachControlBar } from '../CoachControlBar';

describe('Continuous Turn-Taking Queue & Hands-Free Conversational Flow Tests', () => {
  it('displays "Coach gapirmoqda" and TO\'XTATISH (barge-in) when AI is speaking', () => {
    const handleBargeIn = vi.fn();

    render(
      <CoachControlBar
        isLiveSession={true}
        isSpeaking={true}
        isThinking={false}
        isListening={false}
        isMuted={false}
        setIsMuted={() => {}}
        sessionSeconds={12}
        chatHistoryLength={2}
        toggleSession={() => {}}
        onClearHistory={() => {}}
        formatTimer={(s) => `00:${s}`}
        onBargeIn={handleBargeIn}
      />,
    );

    expect(screen.getByText(/AI Gapirmoqda/i)).toBeInTheDocument();
    expect(screen.getAllByText(/TO'XTATISH/i).length).toBeGreaterThanOrEqual(1);

    const bargeBtn = screen.getByTitle(/AI ni to'xtatish va gapirish/i);
    fireEvent.click(bargeBtn);
    expect(handleBargeIn).toHaveBeenCalledTimes(1);
  });

  it('displays "Sizning navbatingiz... Gapiring" and ESHITYAPMAN when mic is listening', () => {
    render(
      <CoachControlBar
        isLiveSession={true}
        isSpeaking={false}
        isThinking={false}
        isListening={true}
        isMuted={false}
        setIsMuted={() => {}}
        sessionSeconds={18}
        chatHistoryLength={2}
        toggleSession={() => {}}
        onClearHistory={() => {}}
        formatTimer={(s) => `00:${s}`}
      />,
    );

    expect(screen.getByText(/Sizning navbatingiz... Gapiring/i)).toBeInTheDocument();
    expect(screen.getByText(/ESHITYAPMAN/i)).toBeInTheDocument();
  });

  it('displays "Coach javob o\'ylamoqda..." and O\'YLANMOQDA when AI is thinking', () => {
    render(
      <CoachControlBar
        isLiveSession={true}
        isSpeaking={false}
        isThinking={true}
        isListening={false}
        isMuted={false}
        setIsMuted={() => {}}
        sessionSeconds={25}
        chatHistoryLength={3}
        toggleSession={() => {}}
        onClearHistory={() => {}}
        formatTimer={(s) => `00:${s}`}
      />,
    );

    expect(screen.getByText(/Coach javob o'ylamoqda/i)).toBeInTheDocument();
    expect(screen.getByText(/O'YLANMOQDA/i)).toBeInTheDocument();
  });

  it('displays BOSHLASH button prior to live session initiation', () => {
    const handleToggleSession = vi.fn();

    render(
      <CoachControlBar
        isLiveSession={false}
        isSpeaking={false}
        isThinking={false}
        isListening={false}
        isMuted={false}
        setIsMuted={() => {}}
        sessionSeconds={0}
        chatHistoryLength={0}
        toggleSession={handleToggleSession}
        onClearHistory={() => {}}
        formatTimer={(s) => `00:${s}`}
      />,
    );

    const startBtn = screen.getByText(/BOSHLASH/i);
    expect(startBtn).toBeInTheDocument();
    fireEvent.click(startBtn);
    expect(handleToggleSession).toHaveBeenCalledTimes(1);
  });
});
