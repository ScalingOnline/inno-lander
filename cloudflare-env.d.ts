declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    RESEARCHER_GATE_SECRET?: string;
    INNO_WOO_BRIDGE_SECRET?: string;
    OMNISEND_API_KEY?: string;
    BUCKET?: R2Bucket;
  }
}
