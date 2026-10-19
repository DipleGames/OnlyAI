// Timing controls contact angle; the pitch lane determines where the ball meets the bat.
export function hitResult(timingError, contactOffset) {
  const timing = Math.max(0, 1 - Math.abs(timingError) / 0.2);
  const contact = Math.max(0, 1 - Math.abs(contactOffset) / 54);
  if (timing === 0 || contact === 0) return { distance: 0, timing, contact, grade: '헛스윙!' };
  const distance = Math.round(155 * timing ** 1.2 * (0.3 + 0.7 * contact));
  return { distance, timing, contact, grade: distance >= 125 ? '완벽한 한 방!' : distance >= 85 ? '좋은 타격!' : '맞았어요!' };
}
