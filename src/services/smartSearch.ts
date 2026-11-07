import { Customer, JobCard, JobStatus } from '../types';

export interface SmartSearchResult {
  id: string; // Unique result key (e.g., job.jobId or cust-id)
  type: 'job' | 'customer';
  customerId: string;
  customerName: string;
  customerPhone: string;
  altPhone?: string;
  address?: string;
  
  // Job / Device specific (if applicable)
  jobId?: string;
  company?: string;
  model?: string;
  imei1?: string;
  imei2?: string;
  color?: string;
  fault?: string;
  status?: JobStatus;
  estimatedCost?: number;
  advancePaid?: number;
  balance?: number;
  receivingDate?: string;
  deliveryDate?: string;
  technician?: string;
  rawJob?: JobCard;
  
  // Match metadata for UI indicators
  matchReason: 'name' | 'phone' | 'imei' | 'model' | 'jobId' | 'general';
  matchDetail?: string;
}

/**
 * Normalizes phone numbers or IMEIs by stripping non-digit characters.
 */
export function cleanDigits(input?: string): string {
  if (!input) return '';
  return input.replace(/\D/g, '');
}

/**
 * Searches across all jobs and customers with high-speed partial matching on:
 * 1. Customer Name (prefix or partial substring, starting from 2 chars)
 * 2. Customer Phone (prefix or partial digits, starting from 2 digits e.g. "03", "030", "0300")
 * 3. IMEI 1 & IMEI 2 (prefix, middle, or last digits, starting from 2 digits)
 * 4. Model or Company (e.g. "sam", "a12", "infinix")
 * 5. Job ID (e.g. "1001", "MMR")
 * 
 * Returns each device as a separate item so multiple phones of one customer are clearly visible.
 */
export function searchSmartCustomerRecords(
  query: string,
  customers: Customer[],
  jobs: JobCard[],
  statusFilter?: 'ALL' | 'PENDING' | 'COMPLETED' | 'DELIVERED'
): SmartSearchResult[] {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) {
    return [];
  }

  const qLower = trimmed.toLowerCase();
  const qDigits = cleanDigits(trimmed);

  const results: SmartSearchResult[] = [];
  const processedJobIds = new Set<string>();
  const customersWithJobs = new Set<string>();

  // Helper to test status category
  const matchesStatus = (status: JobStatus): boolean => {
    if (!statusFilter || statusFilter === 'ALL') return true;
    if (statusFilter === 'PENDING') {
      return (
        status === 'Received' ||
        status === 'Under Inspection' ||
        status === 'Waiting for Parts' ||
        status === 'Under Repair'
      );
    }
    if (statusFilter === 'COMPLETED') {
      return status === 'Ready for Delivery';
    }
    if (statusFilter === 'DELIVERED') {
      return status === 'Delivered';
    }
    return true;
  };

  // 1. Search across all Job Cards (each phone is its own rich record)
  for (const job of jobs) {
    if (!matchesStatus(job.status)) continue;

    const custName = (job.customerName || '').toLowerCase();
    const phone1Digits = cleanDigits(job.customerPhone);
    const phone2Digits = cleanDigits(job.altPhone);
    const imei1Digits = cleanDigits(job.imei1);
    const imei2Digits = cleanDigits(job.imei2);
    const modelStr = `${job.company || ''} ${job.model || ''}`.toLowerCase();
    const jobIdLower = (job.jobId || '').toLowerCase();
    const faultLower = (job.fault || '').toLowerCase();

    let matched = false;
    let matchReason: SmartSearchResult['matchReason'] = 'general';
    let matchDetail = '';

    // Check 1: Customer Name (starts with or includes)
    if (custName.includes(qLower)) {
      matched = true;
      matchReason = 'name';
      matchDetail = custName.startsWith(qLower) ? `نام شروع: "${trimmed}"` : `نام شامل: "${trimmed}"`;
    }

    // Check 2: Customer Phone Number (starts with 2, 3, 4 digits or contains)
    else if (qDigits.length >= 2 && (phone1Digits.includes(qDigits) || phone2Digits.includes(qDigits))) {
      matched = true;
      matchReason = 'phone';
      const isStart = phone1Digits.startsWith(qDigits) || phone2Digits.startsWith(qDigits);
      matchDetail = isStart ? `فون شروع: "${qDigits}"` : `فون شامل: "${qDigits}"`;
    }

    // Check 3: IMEI (prefix, middle, or suffix with 2, 3, 4+ digits)
    else if (qDigits.length >= 2 && (imei1Digits.includes(qDigits) || imei2Digits.includes(qDigits))) {
      matched = true;
      matchReason = 'imei';
      const isEnd = imei1Digits.endsWith(qDigits) || imei2Digits.endsWith(qDigits);
      const isStart = imei1Digits.startsWith(qDigits) || imei2Digits.startsWith(qDigits);
      if (isEnd) {
        matchDetail = `IMEI کے آخری ہندسے: "${qDigits}"`;
      } else if (isStart) {
        matchDetail = `IMEI کے ابتدائی ہندسے: "${qDigits}"`;
      } else {
        matchDetail = `IMEI کے درمیانی ہندسے: "${qDigits}"`;
      }
    }

    // Check 4: Mobile Model or Company
    else if (modelStr.includes(qLower)) {
      matched = true;
      matchReason = 'model';
      matchDetail = `ماڈل/کمپنی: "${trimmed}"`;
    }

    // Check 5: Job ID
    else if (jobIdLower.includes(qLower)) {
      matched = true;
      matchReason = 'jobId';
      matchDetail = `جاب کارڈ: "${trimmed}"`;
    }

    // Check 6: Fault complaint
    else if (faultLower.includes(qLower)) {
      matched = true;
      matchReason = 'general';
      matchDetail = `مرمت کا نقص: "${trimmed}"`;
    }

    if (matched) {
      processedJobIds.add(job.jobId);
      if (job.customerId) customersWithJobs.add(job.customerId);
      if (job.customerPhone) customersWithJobs.add(cleanDigits(job.customerPhone));

      results.push({
        id: `job-${job.jobId}`,
        type: 'job',
        jobId: job.jobId,
        customerId: job.customerId,
        customerName: job.customerName,
        customerPhone: job.customerPhone,
        altPhone: job.altPhone,
        company: job.company,
        model: job.model,
        imei1: job.imei1,
        imei2: job.imei2,
        color: job.color,
        fault: job.fault,
        status: job.status,
        estimatedCost: job.estimatedCost,
        advancePaid: job.advancePaid,
        balance: job.balance,
        receivingDate: job.receivingDate,
        deliveryDate: job.deliveryDate,
        technician: job.technician,
        rawJob: job,
        matchReason,
        matchDetail,
      });
    }
  }

  // 2. Also search across Customers who may not have a job yet or whose customer profile matched
  if (!statusFilter || statusFilter === 'ALL') {
    for (const cust of customers) {
      const custName = cust.name.toLowerCase();
      const phoneDigits = cleanDigits(cust.phone);
      const altDigits = cleanDigits(cust.altPhone);

      let matched = false;
      let matchReason: SmartSearchResult['matchReason'] = 'name';
      let matchDetail = '';

      if (custName.includes(qLower)) {
        matched = true;
        matchReason = 'name';
        matchDetail = custName.startsWith(qLower) ? `کسٹمر نام شروع: "${trimmed}"` : `کسٹمر نام شامل: "${trimmed}"`;
      } else if (qDigits.length >= 2 && (phoneDigits.includes(qDigits) || altDigits.includes(qDigits))) {
        matched = true;
        matchReason = 'phone';
        matchDetail = phoneDigits.startsWith(qDigits) ? `فون شروع: "${qDigits}"` : `فون شامل: "${qDigits}"`;
      }

      // If customer matched, check if we already showed all their jobs above.
      // If customer has no jobs in the system, show their customer profile as a result!
      const phoneClean = cleanDigits(cust.phone);
      const alreadyHasJobsShown = customersWithJobs.has(cust.id) || customersWithJobs.has(phoneClean);

      if (matched && !alreadyHasJobsShown) {
        results.push({
          id: `cust-${cust.id}`,
          type: 'customer',
          customerId: cust.id,
          customerName: cust.name,
          customerPhone: cust.phone,
          altPhone: cust.altPhone,
          address: cust.address,
          matchReason,
          matchDetail,
        });
      }
    }
  }

  // Sort results:
  // 1. Prefix matches first
  // 2. Exact 4-digit IMEI matches first if query is 4 digits
  // 3. Most recent jobs first
  return results.sort((a, b) => {
    // If query is exactly 4 digits and matches IMEI suffix, give highest priority
    if (qDigits.length === 4) {
      const aImeiEnd = a.imei1 && cleanDigits(a.imei1).endsWith(qDigits);
      const bImeiEnd = b.imei1 && cleanDigits(b.imei1).endsWith(qDigits);
      if (aImeiEnd && !bImeiEnd) return -1;
      if (!aImeiEnd && bImeiEnd) return 1;
    }

    // Name prefix matches first
    const aNameStart = a.customerName.toLowerCase().startsWith(qLower);
    const bNameStart = b.customerName.toLowerCase().startsWith(qLower);
    if (aNameStart && !bNameStart) return -1;
    if (!aNameStart && bNameStart) return 1;

    // Phone prefix matches next
    if (qDigits.length >= 2) {
      const aPhoneStart = cleanDigits(a.customerPhone).startsWith(qDigits);
      const bPhoneStart = cleanDigits(b.customerPhone).startsWith(qDigits);
      if (aPhoneStart && !bPhoneStart) return -1;
      if (!aPhoneStart && bPhoneStart) return 1;
    }

    return 0;
  });
}
