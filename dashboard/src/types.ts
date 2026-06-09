declare global {
  interface Window {
    __POLL_INTERVAL__?: number;
  }
}

export interface EmailRecord {
  message_id: string;
  sender: string;
  subject: string;
  body_text: string;
  received_at: string | null;
  processed_at: string | null;
  status: 'pending' | 'safe' | 'phishing' | 'security_violation';
  guardrail_safe: boolean | null;
  guardrail_reason: string | null;
  classification: string | null;
  confidence: number | null;
}

export interface StatsResponse {
  total: number;
  safe: number;
  phishing: number;
  security_violation: number;
}

export interface EmailListResponse {
  emails: EmailRecord[];
  total: number;
  page: number;
  page_size: number;
}

export interface ImapSettings {
  host: string;
  port: number;
  user: string;
  password: string;
  mailbox: string;
}
