import fetchMocks from 'jest-fetch-mock';

import DashAPI, { urlparams } from '../lib/DashApi';

describe('urlparams', () => {
  test('it should construct the correct querystring', () => {
    const params = {
      a: 1,
      b: '2',
      c: [3, 4, 5],
      d: ['a', 'b', 'c'],
      e: null,
      f: undefined,
      g: '',
      'h+i': 'h+i',
    };

    const qs = urlparams(params);
    expect(qs).toEqual('a=1&b=2&c=3%2C4%2C5&d=a%2Cb%2Cc&h%2Bi=h%2Bi');
  });
});

describe('DashAPI', () => {
  let api: DashAPI;
  beforeEach(() => {
    fetchMocks.resetMocks();
    api = new DashAPI('https://server');
  });

  test('baseUrl is correctly trimmed', () => {
    expect(new DashAPI('https://server1/').getUrl('')).toEqual(
      'https://server1/'
    );
  });

  test('getUrl should return correct url for empty params', () => {
    const url = api.getUrl('');
    expect(url).toEqual('https://server/');
  });

  test('getUrl should return correct url for request with params', () => {
    const url = api.getUrl('path', { a: 1, b: '2' });
    expect(url).toEqual('https://server/path?a=1&b=2');
  });

  describe('request', () => {
    const response = { res: 'res' };
    const request = { req: 'req' };
    const params = { params: 'params' };
    const jsonHeaders = { 'Content-Type': 'application/json' };

    const handler = jest.fn();
    beforeEach(() => {
      fetchMocks.mockResponseOnce(JSON.stringify(response));
      handler.mockReset();
    });

    // Test the headers and options code of the `request` method
    test('request should send HTTP GET request', () => {
      api
        .request<typeof response>('path', 'GET', { params })
        .then(handler)
        .then(() => {
          expect(handler).toHaveBeenCalledWith(response);
        });

      expect(fetchMocks).toHaveBeenCalledWith(
        'https://server/path?params=params',
        {
          method: 'GET',
          mode: 'cors',
          headers: {},
          credentials: 'include',
        }
      );
    });

    // Test the headers and options code of the `request` method
    test('request should send HTTP POST request', () => {
      api
        .request<typeof response>('path', 'POST', { body: request })
        .then(handler)
        .then(() => {
          expect(handler).toHaveBeenCalledWith(response);
        });

      expect(fetchMocks).toHaveBeenCalledWith('https://server/path', {
        method: 'POST',
        headers: jsonHeaders,
        mode: 'cors',
        credentials: 'include',
        body: JSON.stringify(request),
      });
    });

    // Test the short-cut methods: GET
    test('.get() should send HTTP GET request', () => {
      api
        .get<typeof response>('path')
        .then(handler)
        .then(() => {
          expect(handler).toHaveBeenCalledWith(response);
        });

      expect(fetchMocks.mock.calls[0][1]).toMatchObject({
        method: 'GET',
        headers: {},
      });
    });

    // Test the short-cut methods: POST
    test('.post() should send HTTP POST request', () => {
      const request = { b: 2 };
      api
        .post<typeof response>('path', request)
        .then(handler)
        .then(() => {
          expect(handler).toHaveBeenCalledWith(response);
        });

      expect(fetchMocks.mock.calls[0][1]).toMatchObject({
        method: 'POST',
        headers: jsonHeaders,
        body: JSON.stringify(request),
      });
    });

    // Test the short-cut methods: PUT
    test('.post() should send HTTP PUT request', () => {
      const request = { b: 2 };
      api
        .put<typeof response>('path', request)
        .then(handler)
        .then(() => {
          expect(handler).toHaveBeenCalledWith(response);
        });

      expect(fetchMocks.mock.calls[0][1]).toMatchObject({
        method: 'PUT',
        headers: jsonHeaders,
        body: JSON.stringify(request),
      });
    });

    // Test the short-cut methods: PATCH
    test('.post() should send HTTP PATCH request', () => {
      const request = { b: 2 };
      api
        .patch<typeof response>('path', request)
        .then(handler)
        .then(() => {
          expect(handler).toHaveBeenCalledWith(response);
        });

      expect(fetchMocks.mock.calls[0][1]).toMatchObject({
        method: 'PATCH',
        headers: jsonHeaders,
        body: JSON.stringify(request),
      });
    });

    // Test the short-cut methods: DELETE
    test('.get() should send HTTP DELETE request', () => {
      api
        .delete<typeof response>('path')
        .then(handler)
        .then(() => {
          expect(handler).toHaveBeenCalledWith(response);
        });

      expect(fetchMocks.mock.calls[0][1]).toMatchObject({
        method: 'DELETE',
        headers: {},
      });
    });
  });
});
