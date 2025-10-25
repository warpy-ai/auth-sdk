import axios, { AxiosError } from "axios";
import type {
  WarpyConfig,
  WarpyShieldRequest,
  WarpyShieldResponse,
} from "./types";

export class WarpyError extends Error {
  status?: number;
  code?: string;
  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.name = "WarpyError";
    this.status = status;
    this.code = code;
  }
}

export class WarpyClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;

  constructor(config: WarpyConfig) {
    if (!config.apiKey) {
      throw new WarpyError("Warpy API key is required", 401, "NO_API_KEY");
    }
    this.apiKey = config.apiKey;
    this.baseUrl = (
      config.baseUrl || "https://platform.warpy.co/api/v1"
    ).replace(/\/$/, "");
    this.timeoutMs = config.timeoutMs ?? 5000;
    this.maxRetries = Math.max(0, config.maxRetries ?? 3);
  }

  async call<T = unknown>(
    req: WarpyShieldRequest
  ): Promise<WarpyShieldResponse<T>> {
    let attempt = 0;
    let lastErr: unknown;
    const url = `${this.baseUrl}/mcp/shield`;

    while (attempt <= this.maxRetries) {
      try {
        const res = await axios.post<WarpyShieldResponse<T>>(url, req, {
          timeout: this.timeoutMs,
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
        });
        return res.data;
      } catch (err) {
        lastErr = err;
        const ax = err as AxiosError;
        const status = ax.response?.status;
        const shouldRetry =
          ax.code === "ECONNABORTED" ||
          status === 429 ||
          (status !== undefined && status >= 500);

        if (!shouldRetry || attempt === this.maxRetries) {
          const message = ax.response?.data
            ? (ax.response.data as any).error || ax.message
            : ax.message;
          throw new WarpyError(message, status, ax.code);
        }

        // Exponential backoff with jitter
        const backoffMs =
          Math.min(1000 * Math.pow(2, attempt), 8000) + Math.random() * 250;
        await new Promise((r) => setTimeout(r, backoffMs));
        attempt += 1;
      }
    }

    throw new WarpyError(`Warpy request failed: ${String(lastErr)}`);
  }
}
