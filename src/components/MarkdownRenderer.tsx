import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  const [copiedCodeIndex, setCopiedCodeIndex] = useState<number | null>(null);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeIndex(index);
    setTimeout(() => setCopiedCodeIndex(null), 2000);
  };

  // Helper to parse inline styles: bold, italic, code
  const renderInline = (text: string): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    let key = 0;
    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      const token = match[0];
      if (token.startsWith('`') && token.endsWith('`')) {
        parts.push(
          <code
            key={key++}
            className="px-1.5 py-0.5 mx-0.5 rounded bg-[#EFF6FF] text-[#1D4ED8] font-mono text-xs border border-blue-200"
          >
            {token.slice(1, -1)}
          </code>
        );
      } else if (token.startsWith('**') && token.endsWith('**')) {
        parts.push(
          <strong key={key++} className="font-semibold text-[#0F172A]">
            {token.slice(2, -2)}
          </strong>
        );
      } else if (token.startsWith('*') && token.endsWith('*')) {
        parts.push(
          <em key={key++} className="italic text-[#334155]">
            {token.slice(1, -1)}
          </em>
        );
      }
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  const lines = content.split('\n');
  const renderedElements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBuffer: string[] = [];
  let codeLanguage = '';
  let codeBlockCounter = 0;

  let inTable = false;
  let tableRows: string[][] = [];
  let tableHeader: string[] = [];

  let inList: 'ul' | 'ol' | null = null;
  let listItems: string[] = [];

  const flushList = () => {
    if (!inList || listItems.length === 0) return;
    const ListTag = inList;
    const currentItems = [...listItems];
    const key = `list-${renderedElements.length}`;

    if (ListTag === 'ol') {
      renderedElements.push(
        <ol key={key} className="space-y-1.5 my-3 pl-6 list-decimal text-[#334155]">
          {currentItems.map((item, idx) => (
            <li key={idx} className="leading-relaxed pl-1 marker:text-[#2563EB] marker:font-semibold">
              {renderInline(item)}
            </li>
          ))}
        </ol>
      );
    } else {
      renderedElements.push(
        <ul key={key} className="space-y-1.5 my-3 pl-6 list-disc text-[#334155]">
          {currentItems.map((item, idx) => (
            <li key={idx} className="leading-relaxed pl-1 marker:text-[#2563EB]">
              {renderInline(item)}
            </li>
          ))}
        </ul>
      );
    }

    inList = null;
    listItems = [];
  };

  const flushTable = () => {
    if (!inTable) return;
    const key = `table-${renderedElements.length}`;
    renderedElements.push(
      <div key={key} className="my-4 overflow-x-auto rounded-xl border border-[#E2E8F0] shadow-sm">
        <table className="w-full text-left text-sm border-collapse">
          {tableHeader.length > 0 && (
            <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#0F172A]">
              <tr>
                {tableHeader.map((th, idx) => (
                  <th key={idx} className="px-4 py-2.5 font-bold text-xs uppercase tracking-wider text-[#475569]">
                    {renderInline(th.trim())}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody className="divide-y divide-[#E2E8F0] bg-[#FFFFFF]">
            {tableRows.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-[#F8FAFF] transition-colors">
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="px-4 py-2.5 text-[#334155]">
                    {renderInline(cell.trim())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
    inTable = false;
    tableHeader = [];
    tableRows = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Check code fence
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        flushList();
        flushTable();
        const codeText = codeBuffer.join('\n');
        const currentIndex = codeBlockCounter++;
        const lang = codeLanguage;
        renderedElements.push(
          <div key={`code-${currentIndex}`} className="my-3 rounded-xl overflow-hidden border border-[#E2E8F0] bg-[#F8FAFC] shadow-sm">
            <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#F1F5F9] border-b border-[#E2E8F0] text-xs text-[#475569] font-mono">
              <span className="font-medium text-[#2563EB]">{lang || 'code'}</span>
              <button
                type="button"
                onClick={() => copyToClipboard(codeText, currentIndex)}
                className="flex items-center gap-1 text-[#475569] hover:text-[#0F172A] transition-colors"
                title="Copy code"
              >
                {copiedCodeIndex === currentIndex ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                    <span className="text-[#16A34A] font-medium">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-3.5 text-xs sm:text-sm font-mono overflow-x-auto text-[#0F172A] bg-[#FFFFFF]">
              <code>{codeText}</code>
            </pre>
          </div>
        );
        inCodeBlock = false;
        codeBuffer = [];
        codeLanguage = '';
      } else {
        flushList();
        flushTable();
        inCodeBlock = true;
        codeLanguage = trimmed.slice(3).trim();
        codeBuffer = [];
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(rawLine);
      continue;
    }

    // Check table row
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      flushList();
      const cells = trimmed
        .slice(1, -1)
        .split('|')
        .map((c) => c.trim());

      const isSeparator = cells.every((c) => /^:?-+:?$/.test(c));
      if (isSeparator) {
        inTable = true;
        continue;
      }

      if (!inTable) {
        inTable = true;
        tableHeader = cells;
      } else {
        tableRows.push(cells);
      }
      continue;
    } else if (inTable) {
      flushTable();
    }

    // Numbered list
    const numMatch = trimmed.match(/^(\d+)[\.\)]\s+(.+)$/);
    if (numMatch) {
      if (inList !== 'ol') {
        flushList();
        inList = 'ol';
      }
      listItems.push(numMatch[2]);
      continue;
    }

    // Bullet list
    const bulletMatch = trimmed.match(/^[-*•]\s+(.+)$/);
    if (bulletMatch) {
      if (inList !== 'ul') {
        flushList();
        inList = 'ul';
      }
      listItems.push(bulletMatch[1]);
      continue;
    }

    flushList();

    if (!trimmed) {
      continue;
    }

    // Headings
    if (trimmed.startsWith('# ')) {
      renderedElements.push(
        <h1 key={`h1-${i}`} className="text-xl sm:text-2xl font-bold text-[#1D4ED8] mt-5 mb-2.5 tracking-tight border-b border-[#E2E8F0] pb-2">
          {renderInline(trimmed.slice(2))}
        </h1>
      );
      continue;
    }
    if (trimmed.startsWith('## ')) {
      renderedElements.push(
        <h2 key={`h2-${i}`} className="text-lg sm:text-xl font-bold text-[#1D4ED8] mt-4 mb-2 tracking-tight flex items-center gap-2">
          <span className="w-1.5 h-4 bg-[#2563EB] rounded-full inline-block" />
          {renderInline(trimmed.slice(3))}
        </h2>
      );
      continue;
    }
    if (trimmed.startsWith('### ')) {
      renderedElements.push(
        <h3 key={`h3-${i}`} className="text-base sm:text-lg font-bold text-[#0F172A] mt-3.5 mb-1.5">
          {renderInline(trimmed.slice(4))}
        </h3>
      );
      continue;
    }
    if (trimmed.startsWith('#### ')) {
      renderedElements.push(
        <h4 key={`h4-${i}`} className="text-sm sm:text-base font-semibold text-[#1E293B] mt-3 mb-1">
          {renderInline(trimmed.slice(5))}
        </h4>
      );
      continue;
    }

    // Blockquote
    if (trimmed.startsWith('>')) {
      const quoteText = trimmed.replace(/^>\s*/, '');
      renderedElements.push(
        <blockquote
          key={`quote-${i}`}
          className="border-l-4 border-[#2563EB] bg-[#EFF6FF] pl-4 py-2 my-2.5 text-[#1E293B] italic rounded-r-lg text-sm"
        >
          {renderInline(quoteText)}
        </blockquote>
      );
      continue;
    }

    // Horizontal rule
    if (trimmed === '---' || trimmed === '***') {
      renderedElements.push(<hr key={`hr-${i}`} className="my-4 border-[#E2E8F0]" />);
      continue;
    }

    // Standard paragraph
    renderedElements.push(
      <p key={`p-${i}`} className="my-2 leading-relaxed text-[#334155] text-sm sm:text-[15px]">
        {renderInline(trimmed)}
      </p>
    );
  }

  flushList();
  flushTable();

  return <div className={`markdown-content space-y-1 ${className}`}>{renderedElements}</div>;
};
