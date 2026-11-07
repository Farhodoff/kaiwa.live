/** A gateway rejection must not trigger another paid request through fallback providers. */
export class AIServiceError extends Error {
  constructor(public readonly status: number) {
    super(
      status === 401 || status === 402 || status === 503
        ? 'AI suhbat xizmati hozir ishlamayapti. Xizmat sozlamasi yoki hisobini tekshirish kerak. Suhbat saqlanib turibdi.'
        : status === 403
          ? 'AI so‘rovlari limiti tugagan. Suhbat pauzada; keyinroq qayta urinib ko‘ring.'
          : status === 413
            ? 'Suhbat so‘rovi juda katta. Qisqaroq xabar yuboring yoki yangi suhbat boshlang.'
            : status === 429
              ? 'AI so‘rovlar tezligi chegarasiga yetildi. Biroz kutib, qayta urinib ko‘ring.'
              : 'AI javobini olib bo‘lmadi. Suhbat saqlanib turibdi; qayta urinib ko‘ring.',
    );
    this.name = 'AIServiceError';
  }
}
export function isBlockedAIRequest(error: unknown): boolean {
  return (
    error instanceof AIServiceError && [400, 401, 402, 403, 413, 429, 503].includes(error.status)
  );
}
