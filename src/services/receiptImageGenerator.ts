import { JobCard, ShopSettings } from '../types';
import QRCode from 'qrcode';

export interface ReceiptImageOptions {
  job: JobCard;
  settings: ShopSettings;
}

/**
 * Generates a high-resolution, ultra-crisp WhatsApp Receipt Image Card (PNG)
 * designed with metallic gold and royal deep navy gradients, verified QR code,
 * full job details, financial breakdown, authorized contacts, and shop branding.
 */
export async function generateReceiptImageCard({ job, settings }: ReceiptImageOptions): Promise<{ dataUrl: string; blob: Blob; fileName: string }> {
  const canvas = document.createElement('canvas');
  // 900x1400 px gives crisp, sharp typography on WhatsApp on all smartphone screens
  const width = 900;
  const height = 1450;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context not available');
  }

  // Helper values
  const totalBill = job.cost ?? job.estimatedCost ?? 0;
  const advance = job.advancePaid || 0;
  const balance = job.balance ?? (totalBill - advance);
  const jobId = job.jobId || job.jobCardNumber || 'N/A';
  const customerName = job.customerName || 'Customer';
  const customerPhone = job.customerPhone || 'N/A';
  const company = job.company || '';
  const model = job.model || '';
  const deviceName = `${company} ${model}`.trim() || job.phoneModel || 'Smartphone';
  const imei = job.imei1 || job.imei2 || 'N/A';
  const color = job.color || 'Standard';
  const fault = job.fault || job.issue || 'Inspection & Repair';
  const accessories = job.accessories || 'None';
  const receivingDate = job.receivingDate || job.createdAt || job.date || new Date().toISOString().split('T')[0];
  const deliveryDate = job.deliveryDate || 'Within 24 Hours (جلد از جلد)';
  const status = job.status || 'Received';

  // Generate QR Code data URL
  const qrVerificationData = JSON.stringify({
    shop: 'MUSA MOBILE REPAIRING CENTER',
    jobId,
    customer: customerName,
    phone: customerPhone,
    device: deviceName,
    imei,
    total: totalBill,
    advance,
    balance,
    receivingDate,
    contacts: ['03006861765', '03216861765']
  });

  let qrImg: HTMLImageElement | null = null;
  try {
    const qrDataUrl = await QRCode.toDataURL(qrVerificationData, {
      width: 170,
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

  // Try loading shop logo
  let logoImg: HTMLImageElement | null = null;
  try {
    const logoUrl = settings.customLogoUrl || '/official-logo.svg';
    logoImg = await loadImage(logoUrl);
  } catch (err) {
    console.warn('Could not load custom logo, using procedural emblem', err);
  }

  // ================= 1. BACKGROUND =================
  // Deep royal midnight gradient
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, '#040d21');
  bgGrad.addColorStop(0.35, '#071838');
  bgGrad.addColorStop(0.75, '#020b1e');
  bgGrad.addColorStop(1, '#01050f');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Outer Decorative Metallic Gold Border
  ctx.save();
  const goldStroke = ctx.createLinearGradient(0, 0, width, height);
  goldStroke.addColorStop(0, '#fff5b8');
  goldStroke.addColorStop(0.25, '#d4af37');
  goldStroke.addColorStop(0.5, '#aa841e');
  goldStroke.addColorStop(0.75, '#d4af37');
  goldStroke.addColorStop(1, '#ffd700');

  ctx.strokeStyle = goldStroke;
  ctx.lineWidth = 8;
  roundRect(ctx, 16, 16, width - 32, height - 32, 28);
  ctx.stroke();

  // Subtle inner dotted frame
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([8, 8]);
  roundRect(ctx, 28, 28, width - 56, height - 56, 20);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // ================= 2. HEADER: SHOP TITLE & EMBLEM =================
  let currentY = 55;

  // Draw Logo or Procedural Shield
  const logoCenterX = width / 2;
  const logoSize = 100;
  if (logoImg) {
    try {
      ctx.drawImage(logoImg, logoCenterX - logoSize / 2, currentY, logoSize, logoSize);
    } catch {
      drawProceduralShield(ctx, logoCenterX, currentY + logoSize / 2, 45);
    }
  } else {
    drawProceduralShield(ctx, logoCenterX, currentY + logoSize / 2, 45);
  }

  currentY += logoSize + 15;

  // Shop Name English
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '900 32px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif';
  const textGold = ctx.createLinearGradient(100, currentY, width - 100, currentY);
  textGold.addColorStop(0, '#ffeaa7');
  textGold.addColorStop(0.5, '#ffd700');
  textGold.addColorStop(1, '#d4af37');
  ctx.fillStyle = textGold;
  ctx.fillText('MUSA MOBILE REPAIRING CENTER', width / 2, currentY);

  currentY += 36;
  // Sub-badge: Repairing & Mobile Parts Center
  ctx.font = '700 15px system-ui, sans-serif';
  ctx.fillStyle = '#38bdf8';
  ctx.fillText('★ REPAIRING & MOBILE PARTS CENTER ★ 20 YEARS TRUSTED LAB ★', width / 2, currentY);

  currentY += 30;
  // Shop Name Urdu
  ctx.font = 'bold 26px "Noto Nastaliq Urdu", "Jameel Noori Nastaleeq", "Urdu Typesetting", serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('موسیٰ موبائل ریپیئرنگ سنٹر', width / 2, currentY);

  currentY += 30;
  // Job Token Ribbon Bar
  const ribbonWidth = width - 100;
  const ribbonX = 50;
  const ribbonHeight = 52;
  const ribbonGrad = ctx.createLinearGradient(ribbonX, currentY, ribbonX + ribbonWidth, currentY);
  ribbonGrad.addColorStop(0, '#0052a3');
  ribbonGrad.addColorStop(0.5, '#0353a4');
  ribbonGrad.addColorStop(1, '#0466c8');
  ctx.fillStyle = ribbonGrad;
  roundRect(ctx, ribbonX, currentY, ribbonWidth, ribbonHeight, 14);
  ctx.fill();
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 2;
  roundRect(ctx, ribbonX, currentY, ribbonWidth, ribbonHeight, 14);
  ctx.stroke();

  // Job No & Status in Ribbon
  ctx.textAlign = 'left';
  ctx.font = '800 18px "Plus Jakarta Sans", monospace';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`JOB NO: #${jobId}`, ribbonX + 24, currentY + ribbonHeight / 2);

  ctx.textAlign = 'right';
  ctx.font = '700 15px system-ui, sans-serif';
  ctx.fillStyle = '#fef08a';
  ctx.fillText(`STATUS: ${status.toUpperCase()}`, ribbonX + ribbonWidth - 24, currentY + ribbonHeight / 2);

  currentY += ribbonHeight + 25;

  // ================= 3. CUSTOMER & DEVICE INFO PANEL =================
  const panelX = 50;
  const panelWidth = width - 100;
  const panelHeight = 440;

  // Panel Background
  ctx.fillStyle = 'rgba(10, 25, 47, 0.85)';
  roundRect(ctx, panelX, currentY, panelWidth, panelHeight, 18);
  ctx.fill();
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
  ctx.lineWidth = 1.5;
  roundRect(ctx, panelX, currentY, panelWidth, panelHeight, 18);
  ctx.stroke();

  // Grid rows for data
  const rows: Array<{ labelEn: string; labelUrdu: string; val: string; valColor?: string; isBold?: boolean }> = [
    { labelEn: 'Customer Name', labelUrdu: 'کسٹمر نام', val: customerName, isBold: true, valColor: '#ffffff' },
    { labelEn: 'Customer Mobile', labelUrdu: 'کسٹمر نمبر', val: customerPhone, isBold: true, valColor: '#38bdf8' },
    { labelEn: 'Mobile Company', labelUrdu: 'موبائل کمپنی', val: company || 'All Brands', valColor: '#f1f5f9' },
    { labelEn: 'Mobile Model', labelUrdu: 'موبائل ماڈل', val: model || deviceName, isBold: true, valColor: '#ffd700' },
    { labelEn: 'IMEI Number', labelUrdu: 'آئی ایم ای آئی', val: imei, valColor: '#94a3b8' },
    { labelEn: 'Mobile Color', labelUrdu: 'موبائل کا رنگ', val: color, valColor: '#f1f5f9' },
    { labelEn: 'Fault / Problem', labelUrdu: 'فالٹ / خرابی', val: fault, isBold: true, valColor: '#f87171' },
    { labelEn: 'Received Accessories', labelUrdu: 'موصولہ سامان', val: accessories, valColor: '#fef08a' },
    { labelEn: 'Receiving Date', labelUrdu: 'وصولی کی تاریخ', val: receivingDate, valColor: '#e2e8f0' },
    { labelEn: 'Expected Delivery', labelUrdu: 'واپسی کی تاریخ', val: deliveryDate, isBold: true, valColor: '#4ade80' },
  ];

  const rowHeight = panelHeight / rows.length;
  rows.forEach((r, idx) => {
    const rowY = currentY + idx * rowHeight;
    // alternating subtle background row
    if (idx % 2 === 1) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.025)';
      ctx.fillRect(panelX + 4, rowY, panelWidth - 8, rowHeight);
    }
    const midY = rowY + rowHeight / 2;

    // Left: English & Urdu Label
    ctx.textAlign = 'left';
    ctx.font = '600 14px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(r.labelEn, panelX + 20, midY - 2);

    ctx.textAlign = 'left';
    ctx.font = 'bold 12px "Noto Nastaliq Urdu", serif';
    ctx.fillStyle = 'rgba(212, 175, 55, 0.85)';
    ctx.fillText(`(${r.labelUrdu})`, panelX + 180, midY - 1);

    // Right: Value
    ctx.textAlign = 'right';
    ctx.font = r.isBold
      ? '800 15px "Plus Jakarta Sans", system-ui, sans-serif'
      : '600 14px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillStyle = r.valColor || '#ffffff';

    // Ellipsize long values if needed
    const maxValWidth = 420;
    const truncatedVal = truncateText(ctx, r.val, maxValWidth);
    ctx.fillText(truncatedVal, panelX + panelWidth - 20, midY);

    // Divider line except last
    if (idx < rows.length - 1) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(panelX + 15, rowY + rowHeight);
      ctx.lineTo(panelX + panelWidth - 15, rowY + rowHeight);
      ctx.stroke();
    }
  });

  currentY += panelHeight + 20;

  // ================= 4. BILLING & QR CODE CARD =================
  const billPanelHeight = 175;
  // Background card
  ctx.fillStyle = 'rgba(4, 20, 48, 0.95)';
  roundRect(ctx, panelX, currentY, panelWidth, billPanelHeight, 18);
  ctx.fill();
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 2;
  roundRect(ctx, panelX, currentY, panelWidth, billPanelHeight, 18);
  ctx.stroke();

  // QR Code on Left
  const qrBoxSize = 135;
  const qrX = panelX + 20;
  const qrY = currentY + (billPanelHeight - qrBoxSize) / 2;
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, qrX, qrY, qrBoxSize, qrBoxSize, 12);
  ctx.fill();

  if (qrImg) {
    ctx.drawImage(qrImg, qrX + 8, qrY + 8, qrBoxSize - 16, qrBoxSize - 16);
  }
  // QR Scan label
  ctx.textAlign = 'center';
  ctx.font = '800 9px monospace';
  ctx.fillStyle = '#0f172a';
  ctx.fillText('SCAN VERIFY', qrX + qrBoxSize / 2, qrY + qrBoxSize - 4);

  // Billing Amounts on Right
  const billRightX = panelX + qrBoxSize + 40;
  const billWidth = panelWidth - qrBoxSize - 60;

  // Row 1: Total Estimate
  let billY = currentY + 35;
  ctx.textAlign = 'left';
  ctx.font = '700 15px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#e2e8f0';
  ctx.fillText('Total Charges / کل رقم:', billRightX, billY);
  ctx.textAlign = 'right';
  ctx.font = '800 18px monospace';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`PKR ${totalBill.toLocaleString()}`, billRightX + billWidth, billY);

  // Row 2: Advance Paid
  billY += 38;
  ctx.textAlign = 'left';
  ctx.font = '700 15px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#4ade80';
  ctx.fillText('Advance Paid / پیشگی رقم:', billRightX, billY);
  ctx.textAlign = 'right';
  ctx.font = '800 18px monospace';
  ctx.fillStyle = '#4ade80';
  ctx.fillText(`- PKR ${advance.toLocaleString()}`, billRightX + billWidth, billY);

  // Row 3: Remaining Balance Highlight Box
  billY += 26;
  const balanceBoxH = 46;
  ctx.fillStyle = '#dc2626';
  roundRect(ctx, billRightX - 6, billY, billWidth + 12, balanceBoxH, 10);
  ctx.fill();
  ctx.strokeStyle = '#fca5a5';
  ctx.lineWidth = 1.5;
  roundRect(ctx, billRightX - 6, billY, billWidth + 12, balanceBoxH, 10);
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.font = '800 15px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('Remaining Balance / بقایا:', billRightX + 10, billY + balanceBoxH / 2);

  ctx.textAlign = 'right';
  ctx.font = '900 20px monospace';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`PKR ${balance.toLocaleString()}`, billRightX + billWidth - 10, billY + balanceBoxH / 2);

  currentY += billPanelHeight + 20;

  // ================= 5. AUTHORIZED CONTACTS & SHOP ADDRESS =================
  const footerX = panelX;
  const footerWidth = panelWidth;
  const footerHeight = 175;

  ctx.fillStyle = 'rgba(2, 11, 30, 0.9)';
  roundRect(ctx, footerX, currentY, footerWidth, footerHeight, 16);
  ctx.fill();
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.3)';
  ctx.lineWidth = 1;
  roundRect(ctx, footerX, currentY, footerWidth, footerHeight, 16);
  ctx.stroke();

  let contactY = currentY + 30;

  // Contact Persons Box
  ctx.textAlign = 'center';
  ctx.font = 'bold 16px "Noto Nastaliq Urdu", serif';
  ctx.fillStyle = '#ffd700';
  ctx.fillText('رابطہ نمبرز و شاپ معلومات', width / 2, contactY);

  contactY += 34;
  ctx.font = '700 15px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillStyle = '#38bdf8';
  ctx.fillText('میاں محمد محسن قریشی (پروپرائیٹر): 03006861765', width / 2, contactY);

  contactY += 28;
  ctx.font = '700 15px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillStyle = '#4ade80';
  ctx.fillText('میاں اظہر قریشی (چیف لیب انجینئر): 03216861765', width / 2, contactY);

  contactY += 32;
  ctx.font = 'bold 15px "Noto Nastaliq Urdu", serif';
  ctx.fillStyle = '#e2e8f0';
  ctx.fillText('شاپ ایڈریس: واٹر پلانٹ نزد قبا آپٹیکل، مظفرگڑھ سٹی', width / 2, contactY);

  currentY += footerHeight + 25;

  // ================= 6. FINAL BOTTOM THANKS BANNER =================
  ctx.textAlign = 'center';
  ctx.font = 'bold 22px "Noto Nastaliq Urdu", "Jameel Noori Nastaleeq", serif';
  ctx.fillStyle = '#ffd700';
  ctx.fillText('"آپ کے اعتماد کا شکریہ، موسیٰ موبائل ریپیئرنگ سنٹر"', width / 2, currentY);

  // Return canvas as blob and Data URL
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to generate receipt image blob'));
          return;
        }
        const dataUrl = canvas.toDataURL('image/png');
        const fileName = `Musa_Receipt_${jobId}_${customerPhone}.png`;
        resolve({ dataUrl, blob, fileName });
      },
      'image/png',
      1.0
    );
  });
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
 * Fallback procedural shield in gold
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
