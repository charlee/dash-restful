import { Middleware } from './DashApi';

export const CorsMiddleware: Middleware = (requestData) => ({
  ...requestData,
  options: {
    ...requestData.options,
    mode: 'cors',
    credentials: 'include',
  },
});
