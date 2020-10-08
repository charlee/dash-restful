export type HttpParams = Record<
  string,
  number | string | Array<number | string> | undefined | null
>;

export type ApiRequestFormBodyValue =
  | string
  | number
  | { file: Blob; filename: string };

export type ApiRequestFormBody = {
  [key: string]: ApiRequestFormBodyValue;
};

export type ApiRequestConfig = {
  params?: HttpParams;

  /**
   * JSON body
   */
  body?: Record<string, unknown>;

  /**
   * Form body, used for posting `form-data/multipart`.
   */
  formBody?: ApiRequestFormBody;

  /**
   * Set to `true` to post body with `form-data/multipart` mimetype.
   * Otherwise, will post body as `application/json`.
   */
  form?: boolean;
};

/**
 * Convert params object to query string.
 * @param params params object
 */
export const urlparams = (params: HttpParams) => {
  const concatedParams = Object.keys(params).reduce<Record<string, string>>(
    (acc, k) => {
      const v = params[k];
      // skip empty params
      if (v === null || v === '' || typeof v === 'undefined') {
        return acc;
      }

      // join array param value with ','
      const vs = Array.isArray(v) ? v.map((p) => String(p)) : [String(v)];

      return { ...acc, [k]: vs.join(',') };
    },
    {}
  );

  return Object.keys(concatedParams)
    .map((k) => {
      const v = concatedParams[k];
      return `${encodeURIComponent(k)}=${encodeURIComponent(v)}`;
    })
    .join('&');
};

class DashAPI {
  constructor(private baseUrl: string = '/api') {
    // trim trailing slash
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  }

  getUrl(path: string, params?: HttpParams) {
    const qs = params ? urlparams(params) : undefined;
    return `${this.baseUrl}/${path}` + (qs ? `?${qs}` : '');
  }

  async request<T>(path: string, method: string, config?: ApiRequestConfig) {
    const headers: HeadersInit = {};
    const options: RequestInit = {
      method,
      mode: 'cors',
      credentials: 'include',
    };

    if (config?.body) {
      // Handle JSON post body
      headers['Content-Type'] = 'application/json';
      options['body'] = JSON.stringify(config.body);
    } else if (config?.formBody) {
      // Handle FormData post body
      const formData = new FormData();
      const { formBody } = config;

      Object.keys(formBody).forEach((key) => {
        const value = formBody[key];
        if (typeof value === 'object') {
          // handle file upload
          formData.append(key, value.file, value.filename);
        } else {
          formData.append(key, String(value));
        }
      });
      options['body'] = formData;
    }

    options['headers'] = headers;

    const response = await fetch(this.getUrl(path, config?.params), options);

    if (response.status === 204) {
      return;
    } else if (response.status >= 200 && response.status <= 299) {
      return response.json() as Promise<T>;
    } else {
      return Promise.reject(response);
    }
  }

  get<T>(path: string, params?: HttpParams) {
    return this.request<T>(path, 'GET', { params }) as Promise<T>;
  }

  post<T>(path: string, body: Record<string, unknown>, params?: HttpParams) {
    return this.request<T>(path, 'POST', { params, body }) as Promise<T>;
  }

  put<T>(path: string, body: Record<string, unknown>, params?: HttpParams) {
    return this.request<T>(path, 'PUT', { params, body }) as Promise<T>;
  }

  patch<T>(path: string, body: Record<string, unknown>, params?: HttpParams) {
    return this.request<T>(path, 'PATCH', { params, body }) as Promise<T>;
  }

  delete<T>(path: string, params?: HttpParams) {
    return this.request<T>(path, 'DELETE', { params }) as Promise<void>;
  }

  postForm<T>(path: string, formBody: ApiRequestFormBody, params?: HttpParams) {
    return this.request<T>(path, 'POST', { params, formBody }) as Promise<T>;
  }
}

export default DashAPI;