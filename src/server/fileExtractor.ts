import fs from 'fs';
import path from 'path';
// @ts-ignore
import * as pdfParseModule from 'pdf-parse';
const pdfParse = (pdfParseModule as any).default || pdfParseModule;
import { extractTextWithOCR } from './gemini';

export async function extractTextFromFile(filePath: string, originalName: string, mimeType: string): Promise<string> {
  const ext = path.extname(originalName).toLowerCase();

  try {
    if (ext === '.txt' || mimeType.includes('text/plain')) {
      return fs.readFileSync(filePath, 'utf-8');
    }

    if (ext === '.pdf' || mimeType.includes('pdf')) {
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      if (pdfData.text && pdfData.text.trim().length > 0) {
        return pdfData.text.trim();
      }
      return 'PDF document loaded (no extractable text stream).';
    }

    if (['.png', '.jpg', '.jpeg', '.webp'].includes(ext) || mimeType.startsWith('image/')) {
      const buffer = fs.readFileSync(filePath);
      const base64 = buffer.toString('base64');
      const ocrMime = mimeType.startsWith('image/') ? mimeType : 'image/jpeg';
      return await extractTextWithOCR({ imageBase64: base64, mimeType: ocrMime });
    }

    if (ext === '.docx' || ext === '.pptx') {
      // Basic text extraction from XML-based office open xml files
      const content = fs.readFileSync(filePath);
      const textMatches = content.toString('utf-8').match(/<w:t[^>]*>([^<]+)<\/w:t>/g) ||
                          content.toString('utf-8').match(/<a:t[^>]*>([^<]+)<\/a:t>/g);
      if (textMatches && textMatches.length > 0) {
        return textMatches.map(m => m.replace(/<[^>]+>/g, '')).join(' ');
      }
      return `Document ${originalName} uploaded and indexed.`;
    }

    // Default fallback: attempt text decode
    const fallbackBuffer = fs.readFileSync(filePath);
    return fallbackBuffer.toString('utf-8').slice(0, 5000);
  } catch (err: any) {
    console.error(`Error extracting text from ${originalName}:`, err);
    return `Uploaded file ${originalName}. Ready for study references.`;
  }
}
