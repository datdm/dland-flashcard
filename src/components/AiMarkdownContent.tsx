"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface AiMarkdownContentProps {
  content: string;
  isUser?: boolean;
}

/**
 * Chuẩn hóa chuỗi Markdown từ AI để đảm bảo bảng (table), danh sách và tiêu đề
 * luôn được parse chính xác kể cả khi AI xuất thiếu dòng trống hoặc gộp dòng bảng.
 */
function normalizeAiMarkdown(raw: string): string {
  if (!raw) return "";

  let text = raw.replace(/\r\n/g, "\n");

  // Nếu các hàng của bảng Markdown bị nối liền trên cùng 1 dòng kiểu: "| A | B | | :--- | :--- | | 1 | 2 |"
  // thì tách "| |" thành xuống dòng "|\n|"
  text = text.replace(/\|\s*\|\s*(?=[:\-]+|\s*[^|\n]+\|)/g, (match) => {
    // Chỉ tách khi đang ở trong cấu trúc bảng (có dấu :--- hoặc nhiều cột)
    return "|\n|";
  });

  // Đảm bảo trước dòng đầu tiên của bảng Markdown có dòng trống nếu liền trước là văn bản thường
  const lines = text.split("\n");
  const normalizedLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    const nextTrimmed = i + 1 < lines.length ? lines[i + 1].trim() : "";

    const isTableRow = trimmed.startsWith("|") && trimmed.endsWith("|") && trimmed.length > 2;
    const isNextTableDivider =
      nextTrimmed.startsWith("|") &&
      nextTrimmed.includes("---") &&
      nextTrimmed.endsWith("|");

    // Nếu dòng hiện tại là header của bảng và dòng trước đó không rỗng & không phải dòng bảng -> thêm dòng trống
    if (
      isTableRow &&
      isNextTableDivider &&
      normalizedLines.length > 0 &&
      normalizedLines[normalizedLines.length - 1].trim() !== "" &&
      !normalizedLines[normalizedLines.length - 1].trim().startsWith("|")
    ) {
      normalizedLines.push("");
    }

    normalizedLines.push(line);
  }

  return normalizedLines.join("\n");
}

export default function AiMarkdownContent({ content, isUser = false }: AiMarkdownContentProps) {
  const formatted = isUser ? content : normalizeAiMarkdown(content);

  if (isUser) {
    return (
      <div className="text-white text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words">
        {formatted}
      </div>
    );
  }

  return (
    <div className="ai-markdown text-gray-800 text-xs sm:text-sm leading-relaxed space-y-2 break-words">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-base sm:text-lg font-extrabold text-indigo-950 mt-3 mb-1.5 pb-1 border-b border-indigo-100 first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-sm sm:text-base font-extrabold text-indigo-900 mt-3 mb-1.5 pb-1 border-b border-indigo-100/80 first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xs sm:text-sm font-extrabold text-indigo-900 mt-2.5 mb-1 first:mt-0">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-xs sm:text-sm font-bold text-gray-900 mt-2 mb-1 first:mt-0">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="my-1.5 leading-relaxed text-gray-800 first:mt-0 last:mb-0">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="my-2 pl-4 space-y-1.5 list-disc marker:text-indigo-500">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="my-2 pl-4 space-y-1.5 list-decimal marker:text-indigo-600 marker:font-bold">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed text-gray-800 pl-0.5">{children}</li>
          ),
          strong: ({ children }) => (
            <strong className="font-bold text-gray-950">{children}</strong>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-2.5 pl-3.5 pr-3 py-2 border-l-4 border-indigo-400 bg-indigo-50/60 rounded-r-xl text-gray-700 text-xs sm:text-[13px] leading-relaxed">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-3 border-gray-200" />,
          table: ({ children }) => (
            <div className="my-3 w-full overflow-x-auto rounded-xl border border-indigo-100/90 shadow-2xs bg-white">
              <table className="w-full border-collapse text-left text-xs sm:text-[13px]">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-gradient-to-r from-indigo-50/90 via-purple-50/70 to-indigo-50/90 text-indigo-950 border-b border-indigo-100">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-gray-100">{children}</tbody>
          ),
          tr: ({ children }) => (
            <tr className="even:bg-slate-50/60 hover:bg-indigo-50/30 transition-colors">
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 font-extrabold text-[11px] sm:text-xs text-indigo-950 tracking-wide whitespace-nowrap">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 text-gray-700 align-top leading-relaxed">
              {children}
            </td>
          ),
          code: ({ className, children, ...props }) => {
            const isBlock = Boolean(className && className.includes("language-"));
            if (isBlock) {
              return (
                <code
                  className="block bg-slate-900 text-slate-100 rounded-xl p-3 my-2 text-xs font-mono overflow-x-auto leading-relaxed"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <code
                className="px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-mono text-[0.9em] font-semibold border border-indigo-100/80"
                {...props}
              >
                {children}
              </code>
            );
          },
          pre: ({ children }) => <pre className="my-2 overflow-x-auto">{children}</pre>,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 font-semibold underline hover:text-indigo-800"
            >
              {children}
            </a>
          ),
        }}
      >
        {formatted}
      </ReactMarkdown>
    </div>
  );
}
