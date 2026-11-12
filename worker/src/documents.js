// R2 bucket routing and upload validation by binary magic bytes.
export function bucketNameForDocumentCategory(category) {
  const normalized = String(category || '').trim().toLowerCase();
  if (/\bkyc\b|\bidentity\b|\bghana card\b|\bproof of funds\b/.test(normalized)) return 'surge-kyc-documents';
  if (/land search|search report/.test(normalized)) return 'surge-land-searches';
  if (/valuation|valuer/.test(normalized)) return 'surge-valuation-reports';
  if (/legal|instrument|court|enforcement|judgment/.test(normalized)) return 'surge-legal-instruments';
  if (/title|deed|certificate|site plan/.test(normalized)) return 'surge-title-documents';
  return 'surge-documents';
}

export function extensionForMime(mimeType) {
  const normalized = String(mimeType || '').split(';')[0].trim().toLowerCase();
  return ({
    'application/pdf': 'pdf',
    'application/x-pdf': 'pdf',
    'application/acrobat': 'pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/msword': 'doc',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/pjpeg': 'jpg',
    'image/jfif': 'jpg',
    'image/png': 'png',
    'image/x-png': 'png',
    'image/webp': 'webp',
    'image/x-webp': 'webp',
    'image/heic': 'heic',
    'image/heif': 'heif'
  })[normalized] || null;
}

export async function isValidFile(file, imageOnly = false) {
  if (!file || typeof file.arrayBuffer !== 'function') return false;
  let mimeType = String(file.type || '').split(';')[0].trim().toLowerCase();
  const name = String(file.name || '').toLowerCase();

  // Normalize common MIME aliases
  if (mimeType === 'image/jpg' || mimeType === 'image/pjpeg' || mimeType === 'image/jfif' || mimeType === 'image/x-citrix-jpeg') {
    mimeType = 'image/jpeg';
  } else if (mimeType === 'image/x-png') {
    mimeType = 'image/png';
  } else if (mimeType === 'image/x-webp') {
    mimeType = 'image/webp';
  } else if (mimeType === 'application/x-pdf' || mimeType === 'application/acrobat') {
    mimeType = 'application/pdf';
  }

  // Read magic bytes for binary inspection
  let bytes = new Uint8Array(0);
  try {
    bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  } catch (e) {
    bytes = new Uint8Array(0);
  }
  const startsWith = (...values) => values.length <= bytes.length && values.every((value, index) => bytes[index] === value);

  const isJpeg = bytes.length >= 2 && bytes[0] === 0xFF && bytes[1] === 0xD8;
  const isPng = startsWith(0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A);
  const isPdf = startsWith(0x25, 0x50, 0x44, 0x46);
  const isWebp = bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
    String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
  const isDoc = startsWith(0x50, 0x4B, 0x03, 0x04) || startsWith(0xD0, 0xCF, 0x11, 0xE0);

  // Binary magic bytes take highest priority to overcome broken browser MIME types
  if (isJpeg) mimeType = 'image/jpeg';
  else if (isPng) mimeType = 'image/png';
  else if (isWebp) mimeType = 'image/webp';
  else if (isPdf && !imageOnly) mimeType = 'application/pdf';
  else if (isDoc && !imageOnly) mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

  // Fallback: check file extension if MIME header is empty or generic
  if (!mimeType || mimeType === 'application/octet-stream') {
    if (name.endsWith('.pdf')) mimeType = 'application/pdf';
    else if (name.endsWith('.docx')) mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    else if (name.endsWith('.doc')) mimeType = 'application/msword';
    else if (name.endsWith('.jpg') || name.endsWith('.jpeg')) mimeType = 'image/jpeg';
    else if (name.endsWith('.png')) mimeType = 'image/png';
    else if (name.endsWith('.webp')) mimeType = 'image/webp';
  }

  if (imageOnly) {
    return isJpeg || isPng || isWebp || (mimeType.startsWith('image/') && (name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png') || name.endsWith('.webp')));
  }

  const extension = extensionForMime(mimeType);
  return Boolean(extension) || isJpeg || isPng || isWebp || isPdf || isDoc;
}

export function bucketForStoredDocument(env, name) {
  const bindings = {
    'surge-documents': env.DOCUMENTS_BUCKET,
    'surge-title-documents': env.TITLE_DOCUMENTS_BUCKET,
    'surge-land-searches': env.LAND_SEARCHES_BUCKET,
    'surge-valuation-reports': env.VALUATION_REPORTS_BUCKET,
    'surge-legal-instruments': env.LEGAL_INSTRUMENTS_BUCKET,
    'surge-kyc-documents': env.KYC_DOCUMENTS_BUCKET
  };
  return bindings[name] || null;
}
