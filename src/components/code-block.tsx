import { Terminal } from "lucide-react";
import { CopyButton } from "./copy-button";
export function CodeBlock({
  code,
  title = "Terminal",
  language = "bash",
}: {
  code: string;
  title?: string;
  language?: string;
}) {
  return (
    <div className="code-block">
      <div className="code-toolbar">
        <span>
          <Terminal size={14} />
          {title}
        </span>
        <span className="code-language">{language}</span>
        <CopyButton text={code} />
      </div>
      {/* biome-ignore lint/a11y/noNoninteractiveTabindex: Scrollable code must be reachable by keyboard. */}
      <pre tabIndex={0}>
        <code>
          {code.split("\n").map((line, i) => (
            <span
              className={`code-line ${line.trim().startsWith("#") ? "syntax-comment" : ""}`}
              // biome-ignore lint/suspicious/noArrayIndexKey: Code lines are immutable display text, including duplicate blank lines.
              key={`${i}-${line}`}
            >
              {line || " "}
              {"\n"}
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}
