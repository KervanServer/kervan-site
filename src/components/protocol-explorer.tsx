"use client";
import {
  ArrowRight,
  FileLock2,
  FolderSync,
  KeyRound,
  LockKeyhole,
  Terminal,
} from "lucide-react";
import Link from "next/link";
import { useId, useState } from "react";
import { CodeBlock } from "./code-block";

const protocols = [
  {
    name: "FTP",
    label: "The familiar workhorse.",
    icon: FolderSync,
    description:
      "Keep existing workflows moving. Active and passive data channels, resumable transfers and machine-readable listings, with the same users and files as every other protocol.",
    tags: ["RFC 959 + extensions", "Active & passive", "Resume support"],
    port: "2121",
    code: "# List files with your existing FTP client\ncurl --user alice ftp://localhost:2121/\n\n# Upload a file\ncurl --user alice -T report.csv ftp://localhost:2121/",
    note: "FTP is unencrypted. Use FTPS or SFTP for sensitive data.",
  },
  {
    name: "FTPS",
    label: "Your FTP workflow. With TLS.",
    icon: FileLock2,
    description:
      "Add transport encryption without changing the way your teams work. Choose explicit TLS on the FTP listener, an implicit listener, or both. Client-certificate verification is configurable.",
    tags: ["RFC 4217", "TLS 1.2 / 1.3", "Optional client certificates"],
    port: "2121 / 990",
    code: "# Explicit TLS; provide a trusted certificate on the server\ncurl --ssl-reqd --user alice ftp://localhost:2121/\n\n# Implicit TLS, when enabled\ncurl --user alice ftps://localhost:990/",
    note: "Disabled by default. Enable FTPS and configure a certificate and key.",
  },
  {
    name: "SFTP",
    label: "An SSH connection. A shared foundation.",
    icon: KeyRound,
    description:
      "Connect with the tools you already trust. Password or SSH public-key authentication, an automatically generated Ed25519 host key, and the same filesystem policy behind every transfer.",
    tags: ["SFTP v3", "OpenSSH extensions", "SSH public keys"],
    port: "2222",
    code: "# Open an interactive SFTP session\nsftp -P 2222 alice@localhost\n\n# Inside the SFTP client\nsftp> put report.csv\nsftp> ls",
    note: "File transfers only. Kervan does not provide an interactive SSH shell.",
  },
  {
    name: "SCP",
    label: "One command. Files delivered.",
    icon: Terminal,
    description:
      "Keep your shell scripts simple. Legacy SCP supports upload, download, recursive copies and time preservation over the shared SSH listener. Modern OpenSSH scp can also connect using SFTP.",
    tags: ["OpenSSH compatible", "Recursive copies", "Shared SSH listener"],
    port: "2222",
    code: "# Modern OpenSSH scp uses SFTP by default\nscp -P 2222 report.csv alice@localhost:/\n\n# Explicitly use the legacy SCP protocol\nscp -O -P 2222 -r ./reports alice@localhost:/",
    note: "SCP shares the SFTP listener. There is no separate SCP port.",
  },
] as const;
export function ProtocolExplorer() {
  const [selected, setSelected] = useState(2);
  const id = useId();
  const active = protocols[selected];
  const Icon = active.icon;
  return (
    <div className="protocol-explorer">
      <div
        className="protocol-tabs"
        role="tablist"
        aria-label="Explore protocols"
      >
        {protocols.map((protocol, i) => (
          <button
            type="button"
            role="tab"
            key={protocol.name}
            aria-selected={selected === i}
            id={`${id}-tab-${i}`}
            aria-controls={`${id}-panel-${i}`}
            tabIndex={selected === i ? 0 : -1}
            onClick={() => setSelected(i)}
            onKeyDown={(e) => {
              let next = i;
              if (e.key === "ArrowRight") next = (i + 1) % 4;
              else if (e.key === "ArrowLeft") next = (i + 3) % 4;
              else if (e.key === "Home") next = 0;
              else if (e.key === "End") next = 3;
              else return;
              e.preventDefault();
              setSelected(next);
              document.getElementById(`${id}-tab-${next}`)?.focus();
            }}
          >
            <protocol.icon size={19} />
            <span>{protocol.name}</span>
            <span className="protocol-index">0{i + 1}</span>
          </button>
        ))}
      </div>
      <div
        className="protocol-panel"
        role="tabpanel"
        id={`${id}-panel-${selected}`}
        aria-labelledby={`${id}-tab-${selected}`}
      >
        <div className="protocol-description">
          <div className="protocol-heading">
            <Icon size={25} />
            <span>
              DEFAULT PORT <strong>:{active.port}</strong>
            </span>
          </div>
          <h3>{active.label}</h3>
          <p>{active.description}</p>
          <div className="tag-list">
            {active.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
          <Link className="text-link" href="/docs/protocols/">
            Read the protocol guide <ArrowRight size={16} />
          </Link>
        </div>
        <div>
          <CodeBlock
            title={`${active.name.toLowerCase()}-session`}
            code={active.code}
          />
          <p className="code-note">
            <LockKeyhole size={14} />
            {active.note}
          </p>
        </div>
      </div>
    </div>
  );
}
