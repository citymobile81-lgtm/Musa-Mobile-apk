import { JobCard, ShopSettings } from '../types';
import { DEFAULT_CUSTOMER_RECEIPT_NOTES } from './db';
import QRCode from 'qrcode';

export interface ReceiptImageOptions {
  job: JobCard;
  settings: ShopSettings;
}

/**
 * Generates an ultra-crisp, highly professional and compact WhatsApp Receipt Image Card (PNG).
 * 
 * Features:
 * - Dynamic height auto-expansion so long custom notes never get truncated.
 * - Single-instance customer name (eliminates duplicate English/Urdu double names).
 * - Clear, readable tabular card layout with high-contrast text and metallic gold accents.
 * - Dedicated "CUSTOMER RECEIPT NOTES / رسید کی خصوصی ہدایات" section with auto-wrapping.
 * - Beautiful closing gratitude & dedication message:
 *   "آپ کے اعتماد اور تعاون کا بے حد شکریہ!
 *    موسی موبائل ریپیئرنگ سنٹر میں تشریف لانے کا شکریہ۔ ہم ہمیشہ آپ کی بہترین خدمت، معیاری کام اور اطمینان کے لیے کوشاں ہیں۔
 *    آپ کا اعتماد، ہماری پہچان!"
 */
export async function generateReceiptImageCard({ job, settings }: ReceiptImageOptions): Promise<{ dataUrl: string; blob: Blob; fileName: string }> {
  // Base fixed dimensions
  const width = 850;

  // Extracted data values
  const totalBill = job.cost ?? job.estimatedCost ?? 0;
  const advance = job.advancePaid || 0;
  const balance = job.balance ?? (totalBill - advance);
  const receiptNo = job.jobId || job.jobCardNumber || 'N/A';
  const customerName = job.customerName || 'معزز کسٹمر';
  const customerPhone = job.customerPhone || 'N/A';
  const company = job.company || '';
  const model = job.model || '';
  const deviceModel = `${company} ${model}`.trim() || job.phoneModel || 'Smartphone';
  const imei = job.imei1 || job.imei2 || '';
  const color = job.color || 'Standard';
  const fault = job.fault || job.issue || 'چیکنگ و مرمت (Inspection & Repair)';
  const accessories = job.accessories || 'صرف موبائل (Only Phone)';
  const receivingDate = job.receivingDate || job.createdAt || job.date || new Date().toISOString().split('T')[0];
  const status = job.status || 'Received';

  // Customer Receipt Notes
  const receiptNotes = (settings.customerReceiptNotes || DEFAULT_CUSTOMER_RECEIPT_NOTES).trim();

  // Create temporary measuring canvas to calculate exact text lines and dynamic canvas height
  const measureCanvas = document.createElement('canvas');
  const measureCtx = measureCanvas.getContext('2d');
  if (!measureCtx) {
    throw new Error('Canvas 2D context not available');
  }

  // Pre-calculate wrapped lines for the custom notes section
  const notesContentWidth = width - 110;
  measureCtx.font = '500 15px "Noto Nastaliq Urdu", "Jameel Noori Nastaleeq", "Segoe UI", sans-serif';
  const noteLines = wrapTextLines(measureCtx, receiptNotes, notesContentWidth);
  const noteLineHeight = 32;
  const notesBoxPadding = 50;
  const calculatedNotesBoxHeight = Math.max(140, noteLines.length * noteLineHeight + notesBoxPadding);

  // Pre-calculate wrapped lines for thank you message
  const thankYouText1 = 'آپ کے اعتماد اور تعاون کا بے حد شکریہ!';
  const thankYouText2 = 'موسی موبائل ریپیئرنگ سنٹر میں تشریف لانے کا شکریہ۔ ہم ہمیشہ آپ کی بہترین خدمت، معیاری کام اور اطمینان کے لیے کوشاں ہیں۔';
  const thankYouText3 = 'آپ کا اعتماد، ہماری پہچان!';
  measureCtx.font = '500 14px "Noto Nastaliq Urdu", "Segoe UI", sans-serif';
  const thankYouLines2 = wrapTextLines(measureCtx, thankYouText2, width - 120);

  // Compute total canvas height dynamically
  const headerHeight = 220; // Logo + Shop Name + Subtitle
  const jobMetaBarHeight = 52;
  const gridSectionHeight = (imei ? 10 : 9) * 40 + 20; // 9 or 10 rows
  const billSectionHeight = 160;
  const contactsSectionHeight = 130;
  const thankYouSectionHeight = 110 + (thankYouLines2.length - 1) * 26;
  const verticalSpacers = 150; // combined margins between panels

  const totalCalculatedHeight = 
    headerHeight + 
    jobMetaBarHeight + 
    gridSectionHeight + 
    billSectionHeight + 
    calculatedNotesBoxHeight + 
    contactsSectionHeight + 
    thankYouSectionHeight + 
    verticalSpacers;

  // Real canvas with calculated height
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = Math.round(totalCalculatedHeight);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context not available');
  }

  // Generate QR Code data URL for instant authenticity check
  const qrVerificationData = JSON.stringify({
    shop: 'MUSA MOBILE REPAIRING CENTER',
    receiptNo,
    customer: customerName,
    phone: customerPhone,
    device: deviceModel,
    imei: imei || 'N/A',
    total: totalBill,
    advance,
    balance,
    date: receivingDate,
    contacts: ['03006861765', '03216861765']
  });

  let qrImg: HTMLImageElement | null = null;
  try {
    const qrDataUrl = await QRCode.toDataURL(qrVerificationData, {
      width: 140,
      margin: 1,
      color: {
        dark: '#020713',
        light: '#ffffff',
      },
    });
    qrImg = await loadImage(qrDataUrl);
  } catch (err) {
    console.error('Failed to generate receipt QR code for canvas', err);
  }

  // Shop Logo image
  let logoImg: HTMLImageElement | null = null;
  try {
    const logoUrl = settings.customLogoUrl || '/official-logo.svg';
    logoImg = await loadImage(logoUrl);
  } catch (err) {
    console.warn('Could not load custom logo, using procedural emblem', err);
  }

  // ================= 1. BACKGROUND & PREMIUM GOLDEN BORDER =================
  const bgGrad = ctx.createLinearGradient(0, 0, width, canvas.height);
  bgGrad.addColorStop(0, '#040d21');
  bgGrad.addColorStop(0.3, '#071838');
  bgGrad.addColorStop(0.7, '#030e24');
  bgGrad.addColorStop(1, '#01050f');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, canvas.height);

  // Outer border with rich gold gradient
  ctx.save();
  const goldStroke = ctx.createLinearGradient(0, 0, width, canvas.height);
  goldStroke.addColorStop(0, '#fff5b8');
  goldStroke.addColorStop(0.25, '#d4af37');
  goldStroke.addColorStop(0.5, '#aa841e');
  goldStroke.addColorStop(0.75, '#d4af37');
  goldStroke.addColorStop(1, '#ffd700');

  ctx.strokeStyle = goldStroke;
  ctx.lineWidth = 6;
  roundRect(ctx, 14, 14, width - 28, canvas.height - 28, 22);
  ctx.stroke();

  // Subtle inner dotted frame
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.35)';
  ctx.lineWidth = 1.2;
  ctx.setLineDash([6, 6]);
  roundRect(ctx, 24, 24, width - 48, canvas.height - 48, 16);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // ================= 2. HEADER: LOGO & SHOP NAME =================
  let currentY = 45;

  const logoCenterX = width / 2;
  const logoSize = 82;
  if (logoImg) {
    try {
      ctx.drawImage(logoImg, logoCenterX - logoSize / 2, currentY, logoSize, logoSize);
    } catch {
      drawProceduralShield(ctx, logoCenterX, currentY + logoSize / 2, 38);
    }
  } else {
    drawProceduralShield(ctx, logoCenterX, currentY + logoSize / 2, 38);
  }

  currentY += logoSize + 12;

  // Shop Name English
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '900 28px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif';
  const textGold = ctx.createLinearGradient(120, currentY, width - 120, currentY);
  textGold.addColorStop(0, '#ffeaa7');
  textGold.addColorStop(0.5, '#ffd700');
  textGold.addColorStop(1, '#d4af37');
  ctx.fillStyle = textGold;
  ctx.fillText('MUSA MOBILE REPAIRING CENTER', width / 2, currentY);

  currentY += 30;
  // Urdu Shop Name
  ctx.font = 'bold 24px "Noto Nastaliq Urdu", "Jameel Noori Nastaleeq", serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('موسیٰ موبائل ریپیئرنگ سنٹر', width / 2, currentY);

  currentY += 24;
  // Sub-badge
  ctx.font = '700 13px system-ui, sans-serif';
  ctx.fillStyle = '#38bdf8';
  ctx.fillText('★ OFFICIAL CUSTOMER REPAIR RECEIPT CARD ★', width / 2, currentY);

  currentY += 24;

  // ================= 3. RECEIPT NUMBER & DATE BAR =================
  const ribbonX = 40;
  const ribbonWidth = width - 80;
  const ribbonH = 46;

  const ribbonGrad = ctx.createLinearGradient(ribbonX, currentY, ribbonX + ribbonWidth, currentY);
  ribbonGrad.addColorStop(0, '#0052a3');
  ribbonGrad.addColorStop(0.5, '#0353a4');
  ribbonGrad.addColorStop(1, '#0466c8');
  ctx.fillStyle = ribbonGrad;
  roundRect(ctx, ribbonX, currentY, ribbonWidth, ribbonH, 12);
  ctx.fill();
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 1.5;
  roundRect(ctx, ribbonX, currentY, ribbonWidth, ribbonH, 12);
  ctx.stroke();

  // Left: Receipt No
  ctx.textAlign = 'left';
  ctx.font = '800 16px "Plus Jakarta Sans", monospace';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`رسید نمبر: #${receiptNo}`, ribbonX + 20, currentY + ribbonH / 2);

  // Right: Date
  ctx.textAlign = 'right';
  ctx.font = '700 14px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillStyle = '#fef08a';
  ctx.fillText(`تاریخ: ${receivingDate}`, ribbonX + ribbonWidth - 20, currentY + ribbonH / 2);

  currentY += ribbonH + 16;

  // ================= 4. COMPACT & CLEAN CUSTOMER & DEVICE DETAILS =================
  // Strictly clean rows: customer name displayed ONCE with no double English/Urdu repetition.
  const infoRows: Array<{ labelUrdu: string; value: string; isBold?: boolean; valColor?: string }> = [
    { labelUrdu: 'کسٹمر کا نام:', value: customerName, isBold: true, valColor: '#ffffff' },
    { labelUrdu: 'موبائل کمپنی و ماڈل:', value: deviceModel, isBold: true, valColor: '#ffd700' },
  ];

  if (imei && imei.trim() !== '' && imei.toUpperCase() !== 'N/A') {
    infoRows.push({ labelUrdu: 'موبائل کا IMEI نمبر:', value: imei, valColor: '#93c5fd' });
  }

  infoRows.push(
    { labelUrdu: 'موبائل کا رنگ:', value: color, valColor: '#f1f5f9' },
    { labelUrdu: 'موبائل میں خرابی:', value: fault, isBold: true, valColor: '#fca5a5' },
    { labelUrdu: 'جمع شدہ اشیاء (Accessories):', value: accessories, valColor: '#fef08a' },
    { labelUrdu: 'موبائل کی موجودہ حالت (Status):', value: translateStatusToUrdu(status), isBold: true, valColor: '#4ade80' }
  );

  const panelX = 40;
  const panelWidth = width - 80;
  const rowHeight = 38;
  const panelHeight = infoRows.length * rowHeight + 16;

  ctx.fillStyle = 'rgba(10, 25, 47, 0.88)';
  roundRect(ctx, panelX, currentY, panelWidth, panelHeight, 14);
  ctx.fill();
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
  ctx.lineWidth = 1.2;
  roundRect(ctx, panelX, currentY, panelWidth, panelHeight, 14);
  ctx.stroke();

  infoRows.forEach((row, idx) => {
    const rowY = currentY + 8 + idx * rowHeight;
    if (idx % 2 === 1) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.025)';
      ctx.fillRect(panelX + 4, rowY, panelWidth - 8, rowHeight);
    }
    const midY = rowY + rowHeight / 2;

    // Right-to-left layout: Right side has the label, Left side has the clean value
    ctx.textAlign = 'right';
    ctx.font = 'bold 15px "Noto Nastaliq Urdu", serif';
    ctx.fillStyle = '#d4af37';
    ctx.fillText(row.labelUrdu, panelX + panelWidth - 18, midY - 1);

    ctx.textAlign = 'left';
    ctx.font = row.isBold
      ? '800 15px "Plus Jakarta Sans", system-ui, sans-serif'
      : '600 14px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillStyle = row.valColor || '#ffffff';
    const truncatedVal = truncateText(ctx, row.value, 460);
    ctx.fillText(truncatedVal, panelX + 18, midY);

    if (idx < infoRows.length - 1) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(panelX + 14, rowY + rowHeight);
      ctx.lineTo(panelX + panelWidth - 14, rowY + rowHeight);
      ctx.stroke();
    }
  });

  currentY += panelHeight + 16;

  // ================= 5. BILLING (REPAIR COST, ADVANCE, REMAINING) & QR CODE =================
  const billH = 145;
  ctx.fillStyle = 'rgba(4, 20, 48, 0.95)';
  roundRect(ctx, panelX, currentY, panelWidth, billH, 14);
  ctx.fill();
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 1.8;
  roundRect(ctx, panelX, currentY, panelWidth, billH, 14);
  ctx.stroke();

  // QR Code on Left
  const qrBoxSize = 115;
  const qrX = panelX + 16;
  const qrY = currentY + (billH - qrBoxSize) / 2;
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, qrX, qrY, qrBoxSize, qrBoxSize, 10);
  ctx.fill();

  if (qrImg) {
    ctx.drawImage(qrImg, qrX + 6, qrY + 6, qrBoxSize - 12, qrBoxSize - 12);
  }

  // Amounts Table on Right
  const billRightX = panelX + qrBoxSize + 30;
  const billRightW = panelWidth - qrBoxSize - 46;

  // Row 1: مرمت کی کل رقم
  let bY = currentY + 28;
  ctx.textAlign = 'left';
  ctx.font = '700 15px "Noto Nastaliq Urdu", sans-serif';
  ctx.fillStyle = '#e2e8f0';
  ctx.fillText('مرمت کی کل رقم:', billRightX, bY);
  ctx.textAlign = 'right';
  ctx.font = '800 17px monospace';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`PKR ${totalBill.toLocaleString()}`, billRightX + billRightW, bY);

  // Row 2: ایڈوانس رقم
  bY += 34;
  ctx.textAlign = 'left';
  ctx.font = '700 15px "Noto Nastaliq Urdu", sans-serif';
  ctx.fillStyle = '#4ade80';
  ctx.fillText('ایڈوانس رقم:', billRightX, bY);
  ctx.textAlign = 'right';
  ctx.font = '800 17px monospace';
  ctx.fillStyle = '#4ade80';
  ctx.fillText(`- PKR ${advance.toLocaleString()}`, billRightX + billRightW, bY);

  // Row 3: بقایا رقم Highlight Box
  bY += 24;
  const balanceBoxH = 42;
  ctx.fillStyle = '#b91c1c';
  roundRect(ctx, billRightX - 4, bY, billRightW + 8, balanceBoxH, 8);
  ctx.fill();
  ctx.strokeStyle = '#fca5a5';
  ctx.lineWidth = 1.2;
  roundRect(ctx, billRightX - 4, bY, billRightW + 8, balanceBoxH, 8);
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.font = '800 15px "Noto Nastaliq Urdu", sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('بقایا رقم (Remaining):', billRightX + 10, bY + balanceBoxH / 2);

  ctx.textAlign = 'right';
  ctx.font = '900 19px monospace';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`PKR ${balance.toLocaleString()}`, billRightX + billRightW - 8, bY + balanceBoxH / 2);

  currentY += billH + 16;

  // ================= 6. CUSTOMER RECEIPT NOTES (رسید کی خصوصی ہدایات) =================
  // Separate, elegant, dedicated section for custom notes that automatically stretches
  ctx.fillStyle = 'rgba(6, 17, 39, 0.92)';
  roundRect(ctx, panelX, currentY, panelWidth, calculatedNotesBoxHeight, 14);
  ctx.fill();
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.5)';
  ctx.lineWidth = 1.5;
  roundRect(ctx, panelX, currentY, panelWidth, calculatedNotesBoxHeight, 14);
  ctx.stroke();

  // Notes Title Badge
  const badgeW = 340;
  const badgeH = 28;
  const badgeX = (width - badgeW) / 2;
  ctx.fillStyle = '#0f294d';
  roundRect(ctx, badgeX, currentY - 14, badgeW, badgeH, 7);
  ctx.fill();
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 1.2;
  roundRect(ctx, badgeX, currentY - 14, badgeW, badgeH, 7);
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.font = 'bold 13px "Noto Nastaliq Urdu", system-ui, sans-serif';
  ctx.fillStyle = '#ffd700';
  ctx.fillText('CUSTOMER RECEIPT NOTES / رسید کی خصوصی ہدایات', width / 2, currentY);

  // Render Urdu text lines right-to-left
  ctx.textAlign = 'right';
  ctx.font = '500 15px "Noto Nastaliq Urdu", "Jameel Noori Nastaleeq", "Segoe UI", sans-serif';
  ctx.fillStyle = '#f1f5f9';

  let noteLineY = currentY + 32;
  for (const line of noteLines) {
    if (line.trim().startsWith('اہم ہدایات') || line.trim().startsWith('نوٹ:')) {
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 16px "Noto Nastaliq Urdu", serif';
    } else {
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '500 15px "Noto Nastaliq Urdu", "Jameel Noori Nastaleeq", "Segoe UI", sans-serif';
    }
    ctx.fillText(line, panelX + panelWidth - 20, noteLineY);
    noteLineY += noteLineHeight;
  }

  currentY += calculatedNotesBoxHeight + 16;

  // ================= 7. AUTHORIZED CONTACTS & SHOP ADDRESS =================
  const contactsH = 115;
  ctx.fillStyle = 'rgba(2, 10, 26, 0.9)';
  roundRect(ctx, panelX, currentY, panelWidth, contactsH, 14);
  ctx.fill();
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.3)';
  ctx.lineWidth = 1;
  roundRect(ctx, panelX, currentY, panelWidth, contactsH, 14);
  ctx.stroke();

  let cY = currentY + 24;
  ctx.textAlign = 'center';
  ctx.font = 'bold 14px "Noto Nastaliq Urdu", serif';
  ctx.fillStyle = '#ffd700';
  ctx.fillText('شاپ ایڈریس: واٹر پلانٹ نزد قبا آپٹیکل، مظفرگڑھ سٹی', width / 2, cY);

  cY += 28;
  ctx.font = '700 14px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillStyle = '#38bdf8';
  ctx.fillText('میاں محمد محسن قریشی (پروپرائیٹر): 03006861765', width / 2, cY);

  cY += 24;
  ctx.font = '700 14px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillStyle = '#4ade80';
  ctx.fillText('میاں اظہر قریشی (چیف لیب انجینئر): 03216861765', width / 2, cY);

  currentY += contactsH + 18;

  // ================= 8. CLOSING THANKS & DEDICATION =================
  // Exactly as requested:
  // "آپ کے اعتماد اور تعاون کا بے حد شکریہ!
  //  موسی موبائل ریپیئرنگ سنٹر میں تشریف لانے کا شکریہ۔ ہم ہمیشہ آپ کی بہترین خدمت، معیاری کام اور اطمینان کے لیے کوشاں ہیں۔
  //  آپ کا اعتماد، ہماری پہچان!"
  ctx.textAlign = 'center';

  // Heading: آپ کے اعتماد اور تعاون کا بے حد شکریہ!
  ctx.font = 'bold 20px "Noto Nastaliq Urdu", "Jameel Noori Nastaleeq", serif';
  ctx.fillStyle = '#ffd700';
  ctx.fillText(thankYouText1, width / 2, currentY);

  currentY += 28;
  ctx.font = '500 14px "Noto Nastaliq Urdu", "Jameel Noori Nastaleeq", serif';
  ctx.fillStyle = '#cbd5e1';
  for (const tLine of thankYouLines2) {
    ctx.fillText(tLine, width / 2, currentY);
    currentY += 24;
  }

  currentY += 4;
  // Slogan: آپ کا اعتماد، ہماری پہچان!
  ctx.font = 'bold 18px "Noto Nastaliq Urdu", serif';
  ctx.fillStyle = '#38bdf8';
  ctx.fillText(thankYouText3, width / 2, currentY);

  // Return canvas as blob and Data URL
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to generate receipt image blob'));
          return;
        }
        const dataUrl = canvas.toDataURL('image/png');
        const fileName = `Musa_Receipt_${receiptNo}_${customerPhone}.png`;
        resolve({ dataUrl, blob, fileName });
      },
      'image/png',
      1.0
    );
  });
}

/**
 * Text wrapping utility for multi-line notes in canvas
 */
function wrapTextLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const resultLines: string[] = [];
  const paragraphs = text.split('\n');

  for (const paragraph of paragraphs) {
    if (!paragraph.trim()) {
      resultLines.push('');
      continue;
    }

    const words = paragraph.split(' ');
    let currentLine = words[0] || '';

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const testLine = currentLine + ' ' + word;
      const testWidth = ctx.measureText(testLine).width;

      if (testWidth <= maxWidth) {
        currentLine = testLine;
      } else {
        resultLines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) {
      resultLines.push(currentLine);
    }
  }

  return resultLines;
}

/**
 * Translate internal status strings to clear Urdu description
 */
function translateStatusToUrdu(status: string): string {
  switch (status) {
    case 'Received':
      return 'وصول شدہ (Received)';
    case 'Under Inspection':
      return 'زیرِ معائنہ و چیکنگ (Under Inspection)';
    case 'Waiting for Parts':
      return 'سامان / پارٹس کا انتظار (Waiting for Parts)';
    case 'Under Repair':
      return 'مرمت جاری ہے (Under Repair)';
    case 'Ready for Delivery':
      return 'تیار ہے، وصول کر لیں (Ready for Delivery)';
    case 'Delivered':
      return 'کسٹمر کو دے دیا گیا (Delivered)';
    case 'Cancelled':
      return 'منسوخ (Cancelled)';
    case 'Unrepairable':
      return 'ناقابلِ مرمت (Unrepairable)';
    default:
      return status;
  }
}

/**
 * Truncate text with ellipsis if it exceeds max width
 */
function truncateText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) {
    return text;
  }
  let truncated = text;
  while (truncated.length > 3 && ctx.measureText(truncated + '...').width > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + '...';
}

/**
 * Draw rounded rectangle path
 */
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/**
 * Helper to load an image element
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

/**
 * Procedural shield fallback
 */
function drawProceduralShield(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = '#0052a3';
  ctx.fill();
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '900 24px system-ui';
  ctx.fillStyle = '#ffd700';
  ctx.fillText('M', x, y);
  ctx.restore();
}
