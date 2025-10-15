export class NextRequest {
  url: string;
  method: string;
  headers: Headers;
  private _body: any;
  constructor(input: string, init?: { method?: string; headers?: Record<string, string> }) {
    this.url = input;
    this.method = init?.method ?? "GET";
    this.headers = new Headers(init?.headers);
    this._body = undefined;
  }
  async json() { return this._body; }
  async text() { return typeof this._body === "string" ? this._body : JSON.stringify(this._body ?? ""); }
}

export class NextResponse {
  static json(body: unknown, init?: { status?: number; headers?: HeadersInit }) {
    return {
      ok: (init?.status ?? 200) >= 200 && (init?.status ?? 200) < 300,
      status: init?.status ?? 200,
      headers: new Headers(init?.headers),
      json: async () => body,
    } as Response;
  }
}

export type { NextRequest as default };


