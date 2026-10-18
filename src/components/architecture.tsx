import {
  ArrowRight,
  Database,
  FileCheck2,
  FolderLock,
  HardDrive,
  KeyRound,
  Layers3,
  Radio,
  Server,
  ShieldCheck,
} from "lucide-react";
export function Architecture() {
  return (
    <div
      className="architecture-diagram"
      role="img"
      aria-label="FTP and FTPS listeners and the SSH listener for SFTP and SCP connect to the shared auth, virtual filesystem, and audit core. The VFS uses local disk, memory, or S3. Audit sends to JSONL, webhooks, or syslog. The WebUI and API expose management and metrics."
    >
      <div className="architecture-input">
        <span className="diagram-label">01 / CONNECT</span>
        <div className="listener">
          <FolderLock />
          <span>
            FTP <small>:2121</small>
          </span>
        </div>
        <div className="listener">
          <ShieldCheck />
          <span>
            FTPS <small>explicit / implicit</small>
          </span>
        </div>
        <div className="listener">
          <KeyRound />
          <span>
            SFTP + SCP <small>SSH · :2222</small>
          </span>
        </div>
        <span className="diagram-footnote">Your clients. Their protocols.</span>
      </div>
      <div className="diagram-connector">
        <ArrowRight />
      </div>
      <div className="architecture-core">
        <div className="core-heading">
          <span className="live-dot" />
          <span>KERVAN CORE</span>
          <small>ONE BINARY</small>
        </div>
        <div className="core-service">
          <KeyRound />
          <div>
            <strong>One identity</strong>
            <span>Shared auth · users · groups · policy</span>
          </div>
        </div>
        <div className="core-service">
          <Layers3 />
          <div>
            <strong>One filesystem</strong>
            <span>Per-user chroot · quotas · permissions</span>
          </div>
        </div>
        <div className="core-service">
          <FileCheck2 />
          <div>
            <strong>One audit trail</strong>
            <span>Sessions · transfers · structured events</span>
          </div>
        </div>
        <div className="core-management">
          <Server size={15} /> WebUI + REST API <span>·</span>
          <Radio size={15} /> /metrics
        </div>
      </div>
      <div className="diagram-connector">
        <ArrowRight />
      </div>
      <div className="architecture-output">
        <span className="diagram-label">02 / STORE & OBSERVE</span>
        <div className="storage-output">
          <HardDrive />
          <div>
            <strong>Storage backends</strong>
            <span>Local disk · Memory · S3</span>
          </div>
        </div>
        <div className="storage-output">
          <Database />
          <div>
            <strong>Audit outputs</strong>
            <span>JSONL · Webhook · Syslog</span>
          </div>
        </div>
        <span className="diagram-footnote">
          Same rules, across every connection.
        </span>
      </div>
    </div>
  );
}
