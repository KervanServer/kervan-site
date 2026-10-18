"use client";
import { ArrowDownToLine, ArrowUpRight, Box, Code2 } from "lucide-react";
import { useId, useState } from "react";
import { REPO, VERSION } from "@/lib/site";
import { CodeBlock } from "./code-block";

const methods = [
  {
    name: "Binary",
    icon: ArrowDownToLine,
    title: "Download. Configure. Connect.",
    description:
      "Download and extract the archive for your operating system. No Go toolchain or external runtime needed.",
    code: "# In the directory containing the extracted binary\n./kervan init\n\n# Create your first admin (choose your own strong password)\n./kervan admin create --username admin --password 'Choose-a-unique-password!'\n\n# Validate configuration, then start\n./kervan check\n./kervan",
    note: "Windows: use .\\kervan.exe in place of ./kervan.",
  },
  {
    name: "Docker",
    icon: Box,
    title: "A container. The complete server.",
    description:
      "Start the published image with persistent storage and bootstrap an admin on first boot. Set KERVAN_ADMIN_PASSWORD in your shell first.",
    code: "docker run --name kervan \\\n  -p 2121:2121 -p 2222:2222 -p 8080:8080 \\\n  -p 50000-50100:50000-50100 \\\n  -e KERVAN_ADMIN_PASSWORD \\\n  -v kervan-data:/var/lib/kervan/data \\\n  ghcr.io/kervanserver/kervan:0.9.0",
    note: "For remote passive FTP, configure ftp.passive_ip to your Docker host’s reachable IP.",
  },
  {
    name: "From source",
    icon: Code2,
    title: "Build it. Make it yours.",
    description:
      "Build the embedded WebUI and the Go binary from the official repository. Requires Go 1.26.1+ and Node.js for the WebUI build.",
    code: "git clone https://github.com/KervanServer/kervan.git\ncd kervan\n\n# Build and embed the WebUI\ngo run ./scripts\n\n# Build the server\ngo build -o kervan ./cmd/kervan\n./kervan init",
    note: "The repository pins Go 1.26.9. Follow the binary setup steps to create an admin before starting.",
  },
] as const;
export function Quickstart() {
  const [selected, setSelected] = useState(0);
  const id = useId();
  const method = methods[selected];
  return (
    <div className="quickstart-layout">
      <div className="quickstart-copy">
        <div
          className="mode-tabs"
          role="tablist"
          aria-label="Installation method"
        >
          {methods.map((m, i) => (
            <button
              type="button"
              role="tab"
              key={m.name}
              id={`${id}-tab-${i}`}
              aria-controls={`${id}-panel`}
              aria-selected={selected === i}
              tabIndex={selected === i ? 0 : -1}
              onClick={() => setSelected(i)}
              onKeyDown={(e) => {
                const next =
                  e.key === "ArrowRight"
                    ? (i + 1) % 3
                    : e.key === "ArrowLeft"
                      ? (i + 2) % 3
                      : e.key === "Home"
                        ? 0
                        : e.key === "End"
                          ? 2
                          : null;
                if (next === null) return;
                e.preventDefault();
                setSelected(next);
                document.getElementById(`${id}-tab-${next}`)?.focus();
              }}
            >
              <m.icon size={16} />
              {m.name}
            </button>
          ))}
        </div>
        <h3>{method.title}</h3>
        <p>{method.description}</p>
        <div className="download-links">
          <a href={`${REPO}/releases/tag/${VERSION}`}>
            Download {VERSION}
            <ArrowUpRight size={16} />
          </a>
          <span>Linux · macOS · Windows</span>
        </div>
        <div className="setup-checklist">
          <span>
            <i>1</i> Get the binary
          </span>
          <span>
            <i>2</i> Create an admin
          </span>
          <span>
            <i>3</i> Start transferring
          </span>
        </div>
      </div>
      <div
        role="tabpanel"
        id={`${id}-panel`}
        aria-labelledby={`${id}-tab-${selected}`}
      >
        <CodeBlock
          code={method.code}
          title={selected === 1 ? "docker" : "terminal"}
        />
        <p className="code-note">{method.note}</p>
      </div>
    </div>
  );
}
