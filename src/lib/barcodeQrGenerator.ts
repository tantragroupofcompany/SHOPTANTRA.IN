const code39Patterns: Record<string, string> = {
  '0': '101001101101',
  '1': '110100101011',
  '2': '101100101011',
  '3': '110110010101',
  '4': '101001101011',
  '5': '110100110101',
  '6': '101100110101',
  '7': '101001011011',
  '8': '110100101101',
  '9': '101100101101',
  'A': '110101001011',
  'B': '101101001011',
  'C': '110110100101',
  'D': '101011001011',
  'E': '110101100101',
  'F': '101101100101',
  'G': '101010011011',
  'H': '110101001101',
  'I': '101101001101',
  'J': '101011001101',
  'K': '110101010011',
  'L': '101101010011',
  'M': '110110101001',
  'N': '101011010011',
  'O': '110101101001',
  'P': '101101101001',
  'Q': '101010110011',
  'R': '110101011001',
  'S': '101101011001',
  'T': '101011011001',
  'U': '110010101011',
  'V': '100110101011',
  'W': '110011010101',
  'X': '100101101011',
  'Y': '110010110101',
  'Z': '100110110101',
  '-': '100101011011',
  '.': '110010101101',
  ' ': '100110101101',
  '*': '100101101101',
  '$': '100100100101',
  '/': '100100101001',
  '+': '100101001001',
  '%': '101001001001',
};

/**
 * Generates a Code 39 Barcode SVG as a string.
 */
export function generateBarcodeSVG(text: string): string {
  const sanitized = text.toUpperCase().replace(/[^0-9A-Z\-.\s$/+%%*]/g, '');
  const barcodeText = `*${sanitized}*`;
  
  let binaryString = '';
  for (let i = 0; i < barcodeText.length; i++) {
    const char = barcodeText[i];
    const pattern = code39Patterns[char];
    if (pattern) {
      binaryString += pattern + '0'; // Add a narrow gap between characters
    }
  }

  const height = 50;
  const barWidth = 2;
  const width = binaryString.length * barWidth;

  let paths = '';
  let currentX = 0;

  for (let i = 0; i < binaryString.length; i++) {
    if (binaryString[i] === '1') {
      paths += `<rect x="${currentX}" y="0" width="${barWidth}" height="${height}" fill="black" />`;
    }
    currentX += barWidth;
  }

  return `
    <svg width="100%" height="100%" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <g>
        ${paths}
      </g>
    </svg>
  `;
}

/**
 * Generates a QR Code image URL.
 */
export function getQRCodeUrl(data: string, size: number = 150): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}`;
}
