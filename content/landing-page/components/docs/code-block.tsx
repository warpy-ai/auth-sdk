"use client";

import { useState, useEffect } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createHighlighter, type Highlighter } from "shiki";

interface CodeBlockProps {
  children: string;
  language?: string;
  filename?: string;
  showLineNumbers?: boolean;
}

let highlighterInstance: Highlighter | null = null;

export function CodeBlock({
  children,
  language = "typescript",
  filename,
  showLineNumbers = false,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [highlightedCode, setHighlightedCode] = useState<string>("");

  useEffect(() => {
    const highlightCode = async () => {
      try {
        // Initialize highlighter once
        if (!highlighterInstance) {
          highlighterInstance = await createHighlighter({
            themes: ["github-dark", "github-light"],
            langs: [
              "typescript",
              "javascript",
              "bash",
              "json",
              "jsx",
              "tsx",
              "css",
              "html",
              "markdown",
            ],
          });
        }

        const code = children.trim();
        const html = highlighterInstance.codeToHtml(code, {
          lang: language,
          themes: {
            light: "github-light",
            dark: "github-dark",
          },
          defaultColor: false,
        });

        setHighlightedCode(html);
      } catch (error) {
        console.error("Error highlighting code:", error);
        // Fallback to plain code
        setHighlightedCode(`<pre><code>${children}</code></pre>`);
      }
    };

    highlightCode();
  }, [children, language]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(children.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-6 not-prose">
      {filename && (
        <div className="px-4 py-2 bg-muted/50 border border-border rounded-t-lg text-sm font-mono text-muted-foreground">
          {filename}
        </div>
      )}
      <div className="relative">
        <div
          className={`overflow-x-auto ${
            filename ? "rounded-b-lg" : "rounded-lg"
          } border border-border bg-[#0d1117] dark:bg-[#0d1117]`}
          style={{
            fontSize: "0.875rem",
            lineHeight: "1.7",
          }}
        >
          {highlightedCode ? (
            <div
              dangerouslySetInnerHTML={{ __html: highlightedCode }}
              className="[&>pre]:!bg-transparent [&>pre]:!p-4 [&>pre]:!m-0 [&_code]:!bg-transparent [&_code]:!p-0 [&_code]:font-mono"
            />
          ) : (
            <pre className="p-4 m-0">
              <code className={`language-${language} font-mono`}>
                {children}
              </code>
            </pre>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-muted/80 hover:bg-muted"
          onClick={handleCopy}
          title={copied ? "Copied!" : "Copy code"}
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
