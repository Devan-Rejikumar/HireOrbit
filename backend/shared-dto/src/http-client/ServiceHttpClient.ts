/**
 * Service HTTP Client
 * Reusable typed HTTP client wrapper for service-to-service communication
 * Supports retry logic, timeout handling, error handling, and logging
 */

export interface HttpClientConfig {
  baseUrl: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  defaultHeaders?: Record<string, string>;
  logger?: Logger;
}

export interface Logger {
  debug: (message: string, meta?: unknown) => void;
  info: (message: string, meta?: unknown) => void;
  warn: (message: string, meta?: unknown) => void;
  error: (message: string, meta?: unknown) => void;
}

export interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
  retries?: number;
  signal?: AbortSignal;
}

export class HttpClientError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly response?: unknown,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = 'HttpClientError';
    Object.setPrototypeOf(this, HttpClientError.prototype);
  }
}

export class ServiceHttpClient {
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly retries: number;
  private readonly retryDelay: number;
  private readonly defaultHeaders: Record<string, string>;
  private readonly logger?: Logger;

  constructor(config: HttpClientConfig) {
    this.baseUrl = config.baseUrl.endsWith('/') 
      ? config.baseUrl.slice(0, -1) 
      : config.baseUrl;
    this.timeout = config.timeout ?? 5000;
    this.retries = config.retries ?? 3;
    this.retryDelay = config.retryDelay ?? 1000;
    this.defaultHeaders = config.defaultHeaders ?? {};
    this.logger = config.logger;
  }

  /**
   * Make a GET request
   */
  async get<T>(path: string, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<T> {
    return this.request<T>(path, { ...config, method: 'GET' });
  }

  /**
   * Make a POST request
   */
  async post<T>(path: string, body?: unknown, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<T> {
    return this.request<T>(path, { ...config, method: 'POST', body });
  }

  /**
   * Make a PUT request
   */
  async put<T>(path: string, body?: unknown, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<T> {
    return this.request<T>(path, { ...config, method: 'PUT', body });
  }

  /**
   * Make a DELETE request
   */
  async delete<T>(path: string, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<T> {
    return this.request<T>(path, { ...config, method: 'DELETE' });
  }

  /**
   * Make a PATCH request
   */
  async patch<T>(path: string, body?: unknown, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<T> {
    return this.request<T>(path, { ...config, method: 'PATCH', body });
  }

  /**
   * Core request method with retry logic
   */
  private async request<T>(path: string, config: RequestConfig): Promise<T> {
    const url = path.startsWith('http') ? path : `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    const method = config.method ?? 'GET';
    const timeout = config.timeout ?? this.timeout;
    const maxRetries = config.retries ?? this.retries;

    const headers = {
      'Content-Type': 'application/json',
      ...this.defaultHeaders,
      ...config.headers,
    };

    let lastError: HttpClientError | Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      // Combine signal if provided
      if (config.signal) {
        config.signal.addEventListener('abort', () => controller.abort());
      }

      try {
        this.logger?.debug(`[ServiceHttpClient] ${method} ${url}`, { 
          attempt: attempt + 1, 
          maxRetries: maxRetries + 1 
        });

        const fetchConfig: RequestInit = {
          method,
          headers,
          signal: controller.signal,
        };

        if (config.body && method !== 'GET' && method !== 'DELETE') {
          fetchConfig.body = JSON.stringify(config.body);
        }

        const response = await fetch(url, fetchConfig);
        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          let errorData: unknown;
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = errorText;
          }

          const error = new HttpClientError(
            `HTTP ${response.status}: ${response.statusText}`,
            response.status,
            errorData
          );

          // Don't retry on client errors (4xx) except for specific cases
          if (response.status >= 400 && response.status < 500) {
            // Retry on 408 (Request Timeout) and 429 (Too Many Requests)
            if (response.status === 408 || response.status === 429) {
              if (attempt < maxRetries) {
                const delay = this.calculateRetryDelay(attempt);
                this.logger?.warn(
                  `[ServiceHttpClient] Retrying after ${delay}ms for ${method} ${url}`,
                  { status: response.status, attempt: attempt + 1 }
                );
                await this.sleep(delay);
                continue;
              }
            }
            throw error;
          }

          // Retry on server errors (5xx) and network errors
          if (attempt < maxRetries) {
            const delay = this.calculateRetryDelay(attempt);
            this.logger?.warn(
              `[ServiceHttpClient] Retrying after ${delay}ms for ${method} ${url}`,
              { status: response.status, attempt: attempt + 1 }
            );
            await this.sleep(delay);
            continue;
          }

          throw error;
        }

        const responseText = await response.text();
        if (!responseText) {
          return {} as T;
        }

        const data = JSON.parse(responseText) as T;
        this.logger?.debug(`[ServiceHttpClient] ${method} ${url} succeeded`, { 
          status: response.status 
        });
        return data;

      } catch (error: unknown) {
        clearTimeout(timeoutId);

        const err = error as { name?: string; message?: string };
        
        if (err.name === 'AbortError') {
          const timeoutError = new HttpClientError(
            `Request timeout after ${timeout}ms`,
            undefined,
            undefined,
            error
          );
          
          if (attempt < maxRetries) {
            const delay = this.calculateRetryDelay(attempt);
            this.logger?.warn(
              `[ServiceHttpClient] Retrying after timeout for ${method} ${url}`,
              { delay, attempt: attempt + 1 }
            );
            lastError = timeoutError;
            await this.sleep(delay);
            continue;
          }
          
          lastError = timeoutError;
        } else if (error instanceof HttpClientError) {
          lastError = error;
          // Error already handled above
          break;
        } else {
          const httpError = new HttpClientError(
            err.message ?? 'Unknown error occurred',
            undefined,
            undefined,
            error
          );
          
          if (attempt < maxRetries) {
            const delay = this.calculateRetryDelay(attempt);
            this.logger?.warn(
              `[ServiceHttpClient] Retrying after error for ${method} ${url}`,
              { error: err.message, delay, attempt: attempt + 1 }
            );
            lastError = httpError;
            await this.sleep(delay);
            continue;
          }
          
          lastError = httpError;
        }
      }
    }

    // All retries exhausted
    this.logger?.error(
      `[ServiceHttpClient] All retries exhausted for ${method} ${url}`,
      { error: lastError }
    );
    throw lastError ?? new HttpClientError('Request failed after all retries');
  }

  /**
   * Calculate exponential backoff delay
   */
  private calculateRetryDelay(attempt: number): number {
    return this.retryDelay * Math.pow(2, attempt);
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}



