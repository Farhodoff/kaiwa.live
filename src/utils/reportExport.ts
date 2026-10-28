/**
 * reportExport.ts
 * High-resolution canvas PNG image generator and popup-safe PDF printing for speaking session reports.
 */

import { SessionAnalysisReport } from './ai';
import { escapeHtml } from './escapeHtml';

/**
 * Renders a high-resolution 1200x630 (retina scaled) social share card on an HTML5 canvas.
 */
export function generateReportShareCard(
  report: SessionAnalysisReport,
  personaTitle: string,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const width = 1200;
  const height = 630;
  const dpr = 2; // high resolution retina scale

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.scale(dpr, dpr);

  // 1. Background Gradient
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, '#090d16');
  bgGrad.addColorStop(0.5, '#111827');
  bgGrad.addColorStop(1, '#1e1b4b');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Decorative Ambient Circles
  ctx.fillStyle = 'rgba(99, 102, 241, 0.08)';
  ctx.beginPath();
  ctx.arc(100, 100, 260, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(236, 72, 153, 0.06)';
  ctx.beginPath();
  ctx.arc(width - 120, height - 100, 240, 0, Math.PI * 2);
  ctx.fill();

  // 2. Header Branding
  ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#818cf8';
  ctx.fillText('🌸 KAIWA.LIVE', 60, 75);

  ctx.font = '16px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = '#9ca3af';
  ctx.fillText('AI Speaking Coach — Suhbat Tahlili & Sertifikat', 320, 75);

  // Border separator
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(60, 100);
  ctx.lineTo(width - 60, 100);
  ctx.stroke();

  // 3. Score Card Box
  const cardGrad = ctx.createLinearGradient(60, 130, 440, 560);
  cardGrad.addColorStop(0, 'rgba(79, 70, 229, 0.3)');
  cardGrad.addColorStop(1, 'rgba(147, 51, 234, 0.2)');
  ctx.fillStyle = cardGrad;
  ctx.roundRect(60, 130, 360, 440, 24);
  ctx.fill();
  ctx.strokeStyle = 'rgba(129, 140, 248, 0.3)';
  ctx.stroke();

  // Score text inside card
  ctx.fillStyle = '#a5b4fc';
  ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText('UMUMIY NATIJA', 90, 180);

  const overallScore = (report.overall_score || report.fluency_score || 7.0).toFixed(1);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 68px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText(overallScore, 90, 260);

  ctx.font = '24px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('/ 9.0', 210, 250);

  // Level Badge
  const levelText = report.user_level_jp || report.user_level_eng || 'CEFR B2 (IELTS 6.5)';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.roundRect(90, 290, 300, 48, 12);
  ctx.fill();

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText(levelText, 110, 322);

  // Scenario
  ctx.fillStyle = '#94a3b8';
  ctx.font = '14px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText('Ssenariy / Suhbatdoshi:', 90, 380);

  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText(personaTitle.slice(0, 25), 90, 410);

  // Date
  ctx.fillStyle = '#64748b';
  ctx.font = '13px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText(`Sana: ${new Date().toLocaleDateString('uz-UZ')}`, 90, 520);

  // 4. Right Side: 4 Skills Breakdown
  const skills = [
    { label: 'Fluency (Erkinlik)', score: report.fluency_score || 7.0, color: '#3b82f6' },
    { label: "Lexical (Lug'at boyligi)", score: report.lexical_score || 7.0, color: '#10b981' },
    { label: 'Grammar (Grammatika)', score: report.grammar_score || 7.0, color: '#8b5cf6' },
    {
      label: 'Pronunciation (Talaffuz)',
      score: report.pronunciation_score || 7.0,
      color: '#f59e0b',
    },
  ];

  let startY = 160;
  skills.forEach((skill) => {
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText(skill.label, 470, startY);

    ctx.fillStyle = skill.color;
    ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText(`${skill.score.toFixed(1)} / 9.0`, width - 130, startY);

    // Progress bar bg
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.roundRect(470, startY + 12, 670, 10, 5);
    ctx.fill();

    // Progress bar fill
    const progressWidth = Math.min(670, Math.max(20, (skill.score / 9.0) * 670));
    ctx.fillStyle = skill.color;
    ctx.roundRect(470, startY + 12, progressWidth, 10, 5);
    ctx.fill();

    startY += 65;
  });

  // 5. Strengths & Feedback Summary box
  ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.roundRect(470, 420, 670, 150, 16);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.stroke();

  ctx.fillStyle = '#a5b4fc';
  ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText('💡 AI COACH XULOSASI', 495, 455);

  ctx.fillStyle = '#cbd5e1';
  ctx.font = '14px -apple-system, BlinkMacSystemFont, sans-serif';
  const feedbackSnippet =
    (report.overall_feedback || 'Suhbat muvaffaqiyatli yakunlandi.').slice(0, 140) + '...';
  ctx.fillText(feedbackSnippet, 495, 490, 620);

  ctx.fillStyle = '#10b981';
  ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, sans-serif';
  const strength =
    report.strengths && report.strengths[0]
      ? `✅ Kuchli tomon: ${report.strengths[0].slice(0, 75)}`
      : "✅ Faol so'zlashuv";
  ctx.fillText(strength, 495, 535);

  return canvas;
}

/**
 * Downloads the generated report canvas directly as a PNG file.
 */
export async function downloadReportAsPNG(
  report: SessionAnalysisReport,
  personaTitle: string,
): Promise<void> {
  const canvas = generateReportShareCard(report, personaTitle);
  const dataUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = `kaiwa-live-report-${Date.now()}.png`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Prints the report via a hidden iframe to prevent popup-blocker restrictions.
 */
export function printReportViaIframe(report: SessionAnalysisReport, personaTitle: string): void {
  const existingFrame = document.getElementById('print-report-frame');
  if (existingFrame) existingFrame.remove();

  const iframe = document.createElement('iframe');
  iframe.id = 'print-report-frame';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  const eT = escapeHtml(personaTitle);
  const reportHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Speaking Coach Tahlil Hisoboti - ${eT}</title>
      <style>
        @media print {
          @page { margin: 15mm; }
          body { font-family: system-ui, -apple-system, sans-serif; color: #111827; background: #fff; }
        }
        body { font-family: system-ui, -apple-system, sans-serif; padding: 24px; color: #111827; background: #fff; }
        h1 { color: #4f46e5; font-size: 24px; margin-bottom: 4px; }
        .subtitle { color: #6b7280; font-size: 14px; margin-bottom: 24px; }
        .score-card { background: #4f46e5; color: white; padding: 20px; border-radius: 12px; text-align: center; margin-bottom: 24px; }
        .score { font-size: 36px; font-weight: bold; }
        .section-title { font-size: 18px; font-weight: bold; margin-top: 24px; margin-bottom: 12px; color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 6px; }
        .box { background: #f9fafb; border: 1px solid #e5e7eb; padding: 14px; border-radius: 8px; margin-bottom: 12px; }
        .green { color: #059669; font-weight: bold; }
        .red { color: #dc2626; text-decoration: line-through; }
        .item-list { padding-left: 20px; }
        .item-list li { margin-bottom: 6px; }
      </style>
    </head>
    <body>
      <h1>🌸 kaiwa.live — Speaking Coach Tahlil Hisoboti</h1>
      <div class="subtitle">Ssenariy: <strong>${eT}</strong> | Sana: ${new Date().toLocaleDateString('uz-UZ')}</div>

      <div class="score-card">
        <div>Umumiy Band / Fluency Bali</div>
        <div class="score">${(report.overall_score || report.fluency_score || 7.0).toFixed(1)} / 9.0</div>
        <div style="font-size: 13px; opacity: 0.9;">${report.user_level_jp || report.user_level_eng || 'CEFR B2'}</div>
      </div>

      <div class="section-title">💡 Umumiy Xulosa</div>
      <div class="box">${escapeHtml(report.overall_feedback)}</div>

      <div class="section-title">✅ Kuchli Jihatlar</div>
      <ul class="item-list">
        ${(report.strengths || []).map((s) => `<li>${escapeHtml(s)}</li>`).join('')}
      </ul>

      <div class="section-title">🎯 Rivojlantirish Kerak Bo'lgan Jihatlar</div>
      <ul class="item-list">
        ${(report.areas_to_improve || []).map((a) => `<li>${escapeHtml(a)}</li>`).join('')}
      </ul>

      ${
        report.grammar_corrections && report.grammar_corrections.length > 0
          ? `
          <div class="section-title">📚 Grammatik Xatolar & Tuzatishlar</div>
          ${report.grammar_corrections
            .map(
              (g) => `
              <div class="box">
                <div><span class="red">❌ ${escapeHtml(g.original)}</span> ➔ <span class="green">✅ ${escapeHtml(g.corrected)}</span></div>
                <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">💡 ${escapeHtml(g.explanation)}</div>
              </div>
            `,
            )
            .join('')}
        `
          : ''
      }

      ${
        report.better_vocabulary && report.better_vocabulary.length > 0
          ? `
          <div class="section-title">✨ Tavsiya Etilgan Yuqori Darajali Lug'atlar</div>
          ${report.better_vocabulary
            .map(
              (v) => `
              <div class="box">
                <div>Oddiy: ${escapeHtml(v.original)} ➔ <strong style="color: #7c3aed;">✨ ${escapeHtml(v.suggested)}</strong></div>
                <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">${escapeHtml(v.context)}</div>
              </div>
            `,
            )
            .join('')}
        `
          : ''
      }
    </body>
    </html>
  `;

  const doc = iframe.contentWindow?.document || iframe.contentDocument;
  if (doc) {
    doc.open();
    doc.write(reportHtml);
    doc.close();
    iframe.contentWindow?.focus();
    setTimeout(() => {
      iframe.contentWindow?.print();
    }, 400);
  }
}
