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
    const response = { a: 1 };
    const handler = jest.fn();
    beforeEach(() => {
      fetchMocks.mockResponseOnce(JSON.stringify(response));
    });

    test('request should send HTTP GET request', () => {
      api.request<typeof response>('path', 'GET').then(handler);

      expect(fetchMocks).toHaveBeenCalledWith('https://server/path', {
        method: 'GET',
        mode: 'cors',
        headers: {},
        credentials: 'include',
      });

      expect(handler).toHaveBeenCalledWith(response);
    });

    test('request should send HTTP POST request', () => {
      api
        .request<typeof response>('path', 'POST', { body: { a: 1 } })
        .then(handler);

      expect(fetchMocks).toHaveBeenCalledWith('https://server/path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        mode: 'cors',
        credentials: 'include',
        body: JSON.stringify({ a: 1 }),
      });

      expect(handler).toHaveBeenCalledWith(response);
    });
  });
});
