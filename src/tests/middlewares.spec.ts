import { RequestData } from '../lib/DashApi';
import { CorsMiddleware } from '../lib/middlewares';

describe('CorsMiddleware', () => {
  test('should modify the options with mode and credentials', () => {
    const requestData: RequestData = {
      path: '/api',
      options: {
        headers: {},
      },
    };

    const modifiedRequestData = CorsMiddleware(requestData);
    expect(modifiedRequestData).toMatchObject({
      options: {
        mode: 'cors',
        credentials: 'include',
      },
    });
  });
});
