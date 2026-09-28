import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { logger } from "../utils/logger";

/**
 * Shipping API Client with retry + exponential backoff.
 *
 * Rules:
 * - Retries on 5xx and ECONNABORTED / ETIMEDOUT (transient failures).
 * - Does NOT retry on 4xx (bad request, auth failure, rate limit — these are permanent).
 * - 3 retries max, exponential backoff: 1s → 2s → 4s.
 * - Default timeout: 15 000ms per request.
 */

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;
const DEFAULT_TIMEOUT = 15000;

function isRetryable(error: any): boolean {
  // Network / timeout errors
  if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT" || error.code === "ECONNRESET") {
    return true;
  }
  // 5xx server errors
  if (error.response && error.response.status >= 500) {
    return true;
  }
  return false;
}

async function requestWithRetry<T = any>(config: AxiosRequestConfig): Promise<AxiosResponse<T>> {
  const finalConfig: AxiosRequestConfig = {
    timeout: DEFAULT_TIMEOUT,
    ...config,
  };

  let lastError: any;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await axios(finalConfig);
    } catch (error: any) {
      lastError = error;

      if (attempt < MAX_RETRIES && isRetryable(error)) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt); // 1s, 2s, 4s
        logger.warn(
          `[ShippingApiClient] Request to ${finalConfig.url} failed (attempt ${attempt + 1}/${MAX_RETRIES + 1}). ` +
          `Retrying in ${delay}ms. Error: ${error.message}`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        // 4xx or max retries exhausted — throw immediately
        break;
      }
    }
  }

  throw lastError;
}

/**
 * Drop-in replacement for `axios.get()` with retry.
 */
export async function shippingGet<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
  return requestWithRetry<T>({ ...config, method: "GET", url });
}

/**
 * Drop-in replacement for `axios.post()` with retry.
 */
export async function shippingPost<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
  return requestWithRetry<T>({ ...config, method: "POST", url, data });
}

/**
 * Drop-in replacement for `axios.put()` with retry.
 */
export async function shippingPut<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
  return requestWithRetry<T>({ ...config, method: "PUT", url, data });
}
