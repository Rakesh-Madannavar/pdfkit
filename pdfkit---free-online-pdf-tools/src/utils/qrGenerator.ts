import QRCode from 'qrcode';

export interface QrOptions {
  text: string;
  width?: number;
  darkColor?: string;
  lightColor?: string;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}

export async function generateQrCode(options: QrOptions): Promise<{ dataUrl: string; svgString: string }> {
  const {
    text,
    width = 300,
    darkColor = '#000000',
    lightColor = '#ffffff',
    errorCorrectionLevel = 'M',
  } = options;

  const dataUrl = await QRCode.toDataURL(text, {
    width,
    margin: 2,
    color: {
      dark: darkColor,
      light: lightColor,
    },
    errorCorrectionLevel,
  });

  const svgString = await QRCode.toString(text, {
    type: 'svg',
    width,
    margin: 2,
    color: {
      dark: darkColor,
      light: lightColor,
    },
    errorCorrectionLevel,
  });

  return { dataUrl, svgString };
}
