import fetchMocks from 'jest-fetch-mock';

import DashAPI, { ApiConfig, DashResource, urlParams } from '../lib/DashApi';

type Book = {
  id: number;
  name: string;
};

describe('urlParams', () => {
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

    const qs = urlParams(params);
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
    test('.request() should send HTTP GET request', (done) => {
      api
        .request<typeof response>('path', 'GET', { params })
        .then(handler)
        .then(() => {
          expect(handler).toHaveBeenCalledWith(response);
          done();
        });

      expect(fetchMocks).toHaveBeenCalledWith(
        'https://server/path?params=params',
        {
          method: 'GET',
          headers: {},
        }
      );
    });

    // Test the headers and options code of the `request` method
    test('.request() should send HTTP POST request', (done) => {
      api
        .request<typeof response>('path', 'POST', { body: request })
        .then(handler)
        .then(() => {
          expect(handler).toHaveBeenCalledWith(response);
          done();
        });

      expect(fetchMocks).toHaveBeenCalledWith('https://server/path', {
        method: 'POST',
        headers: jsonHeaders,
        body: JSON.stringify(request),
      });
    });

    // Test middlewares
    test('.request() should call middlewares', () => {
      api.addMiddleware((data) => ({
        ...data,
        options: {
          ...data.options,
          headers: {
            ...data.options.headers,
            'X-Test': 'a',
            'X-CSRFToken': 'abcdefg',
          },
        },
      }));

      // add 2nd middleware to test overwrite
      api.addMiddleware((data) => ({
        ...data,
        options: {
          ...data.options,
          headers: {
            ...data.options.headers,
            'X-Test': 'b',
          },
        },
      }));

      api.request<typeof response>('path', 'POST', { body: request });
      expect(fetchMocks).toHaveBeenCalledWith('https://server/path', {
        method: 'POST',
        headers: {
          ...jsonHeaders,
          'X-Test': 'b',
          'X-CSRFToken': 'abcdefg',
        },
        body: JSON.stringify(request),
      });
    });

    // Test the short-cut methods: GET
    test('.get() should send HTTP GET request', (done) => {
      api
        .get<typeof response>('path')
        .then(handler)
        .then(() => {
          expect(handler).toHaveBeenCalledWith(response);
          done();
        });

      expect(fetchMocks.mock.calls[0][1]).toMatchObject({
        method: 'GET',
        headers: {},
      });
    });

    // Test the short-cut methods: POST
    test('.post() should send HTTP POST request', (done) => {
      const request = { b: 2 };
      api
        .post<typeof response>('path', request)
        .then(handler)
        .then(() => {
          expect(handler).toHaveBeenCalledWith(response);
          done();
        });

      expect(fetchMocks.mock.calls[0][1]).toMatchObject({
        method: 'POST',
        headers: jsonHeaders,
        body: JSON.stringify(request),
      });
    });

    // Test the short-cut methods: PUT
    test('.post() should send HTTP PUT request', (done) => {
      const request = { b: 2 };
      api
        .put<typeof response>('path', request)
        .then(handler)
        .then(() => {
          expect(handler).toHaveBeenCalledWith(response);
          done();
        });

      expect(fetchMocks.mock.calls[0][1]).toMatchObject({
        method: 'PUT',
        headers: jsonHeaders,
        body: JSON.stringify(request),
      });
    });

    // Test the short-cut methods: PATCH
    test('.patch() should send HTTP PATCH request', (done) => {
      const request = { b: 2 };
      api
        .patch<typeof response>('path', request)
        .then(handler)
        .then(() => {
          expect(handler).toHaveBeenCalledWith(response);
          done();
        });

      expect(fetchMocks.mock.calls[0][1]).toMatchObject({
        method: 'PATCH',
        headers: jsonHeaders,
        body: JSON.stringify(request),
      });
    });

    // Test the short-cut methods: DELETE
    test('.delete() should send HTTP DELETE request', (done) => {
      api
        .delete<typeof response>('path')
        .then(handler)
        .then(() => {
          expect(handler).toHaveBeenCalledWith(response);
          done();
        });

      expect(fetchMocks.mock.calls[0][1]).toMatchObject({
        method: 'DELETE',
        headers: {},
      });
    });

    test('.postForm() should send formData correctly', (done) => {
      api
        .postForm<typeof response>('path', {
          name: 'nameValue',
          file: {
            file: new Blob(['test'], { type: 'text/plain' }), // in practical this should be a blob
            filename: 'filenameValue',
          },
        })
        .then(handler)
        .then(() => {
          expect(handler).toHaveBeenCalledWith(response);
          done();
        });

      const args = fetchMocks.mock.calls[0];
      expect(args[1]).toMatchObject({
        method: 'POST',
      });

      const fd = (args[1]?.body as unknown) as FormData;
      expect(fd).toBeInstanceOf(FormData);
      expect(fd.get('name')).toEqual('nameValue');

      const file = fd.get('file') as File;
      expect(file).toBeInstanceOf(File);
      expect(file.name).toEqual('filenameValue');
      expect(file.size).toEqual(4);
    });

    // Test the createResource method
    test('.createResource() should create a resource', () => {
      const r = api.createResource('book');
      r.list(params);
      expect(fetchMocks.mock.calls[0][0]).toEqual(
        'https://server/book/?params=params'
      );
    });

    // Test the createCustomResource method
    test('.createCustomResource() should create a custom resource', () => {
      const mockFn = jest.fn();
      // Defile a custom resource
      class TestResource extends DashResource<Book> {
        constructor(protected api: DashAPI) {
          super(api, 'book');
        }

        test = mockFn;
      }

      const testResource = api.createCustomResource(TestResource);
      testResource.test();
      expect(mockFn).toHaveBeenCalled();

      testResource.list();
      expect(fetchMocks.mock.calls[0][0]).toEqual('https://server/book/');
    });
  });
});

describe('request error cases', () => {
  let api: DashAPI;
  beforeEach(() => {
    fetchMocks.mockReset();
  });

  // 204
  test('.request() should return nothing if server returned 204', (done) => {
    api = new DashAPI('https://server');
    fetchMocks.mockResponseOnce('', { status: 204 });
    api.request('path', 'POST', {}).then((res) => {
      expect(res).toBeUndefined();
      done();
    });
  });

  // other errors
  test('.request() should return nothing if server returned 204', (done) => {
    const error = { error: 'test_error' };
    api = new DashAPI('https://server');
    fetchMocks.mockResponseOnce(JSON.stringify(error), { status: 400 });
    api.request('path', 'POST', {}).catch((res) => {
      expect(res).toBeInstanceOf(Response);
      res.json().then((e: typeof error) => {
        expect(e).toEqual({ error: 'test_error' });
        done();
      });
    });
  });

  // error handler
  test('.request() should call error handler correctly if provided', (done) => {
    const config: ApiConfig = {
      errorHandler: (res: Response) => {
        const error = res.status === 400 ? 'Invalid data' : 'Unknown error';
        return Promise.reject(error);
      },
    };
    api = new DashAPI('https://server', config);
    const error = { error: 'test_error' };
    fetchMocks.mockResponseOnce(JSON.stringify(error), { status: 400 });
    api.request('path', 'POST', {}).catch((res: string) => {
      expect(typeof res).toEqual('string');
      expect(res).toEqual('Invalid data');
      done();
    });
  });
});

describe('DashResource', () => {
  const response: Book = { id: 1, name: 'book 1' };
  const request: Book = { id: 2, name: 'book 2' };
  const params = { params: 'params' };
  const handler = jest.fn();

  let api: DashAPI;
  let r: DashResource<Book>;

  beforeEach(() => {
    api = new DashAPI('https://server');
    r = api.createResource<Book>('book');
    handler.mockReset();
    fetchMocks.resetMocks();
    fetchMocks.mockResponseOnce(JSON.stringify(response));
  });

  test('.list() should call list API', (done) => {
    r.list(params)
      .then(handler)
      .then(() => {
        expect(handler).toHaveBeenCalledWith(response);
        done();
      });

    const args = fetchMocks.mock.calls[0];

    expect(args[0]).toEqual('https://server/book/?params=params');
    expect(args[1]).toMatchObject({ method: 'GET' });
  });

  test('.retrieve() should call retrieve API', (done) => {
    r.retrieve(1)
      .then(handler)
      .then(() => {
        expect(handler).toHaveBeenCalledWith(response);
        done();
      });

    const args = fetchMocks.mock.calls[0];
    expect(args[0]).toEqual('https://server/book/1/');
    expect(args[1]).toMatchObject({ method: 'GET' });
  });

  test('.create() should call create API', (done) => {
    r.create(request)
      .then(handler)
      .then(() => {
        expect(handler).toHaveBeenCalledWith(response);
        done();
      });

    const args = fetchMocks.mock.calls[0];
    expect(args[0]).toEqual('https://server/book/');
    expect(args[1]).toMatchObject({
      method: 'POST',
      body: JSON.stringify(request),
    });
  });

  test('.update() should call create API', (done) => {
    r.update(1, request)
      .then(handler)
      .then(() => {
        expect(handler).toHaveBeenCalledWith(response);
        done();
      });

    const args = fetchMocks.mock.calls[0];
    expect(args[0]).toEqual('https://server/book/1/');
    expect(args[1]).toMatchObject({
      method: 'PUT',
      body: JSON.stringify(request),
    });
  });

  test('.patch() should call create API', (done) => {
    r.patch(1, request)
      .then(handler)
      .then(() => {
        expect(handler).toHaveBeenCalledWith(response);
        done();
      });

    const args = fetchMocks.mock.calls[0];
    expect(args[0]).toEqual('https://server/book/1/');
    expect(args[1]).toMatchObject({
      method: 'PATCH',
      body: JSON.stringify(request),
    });
  });

  test('.delete() should call retrieve API', (done) => {
    r.delete(1)
      .then(handler)
      .then(() => {
        expect(handler).toHaveBeenCalledWith(response);
        done();
      });

    const args = fetchMocks.mock.calls[0];
    expect(args[0]).toEqual('https://server/book/1/');
    expect(args[1]).toMatchObject({ method: 'DELETE' });
  });

  test('.getAction() should call the list API with action name', (done) => {
    r.getAction('barcode', params)
      .then(handler)
      .then(() => {
        expect(handler).toHaveBeenCalledWith(response);
        done();
      });

    const args = fetchMocks.mock.calls[0];
    expect(args[0]).toEqual('https://server/book/barcode/?params=params');
    expect(args[1]).toMatchObject({ method: 'GET' });
  });

  test('.postAction() should call the list API with action name', (done) => {
    r.postAction('assign', request, params)
      .then(handler)
      .then(() => {
        expect(handler).toHaveBeenCalledWith(response);
        done();
      });

    const args = fetchMocks.mock.calls[0];
    expect(args[0]).toEqual('https://server/book/assign/?params=params');
    expect(args[1]).toMatchObject({
      method: 'POST',
      body: JSON.stringify(request),
    });
  });

  test('.getDetailAction() should call the detail API with action name', (done) => {
    r.getDetailAction('barcode', 1, params)
      .then(handler)
      .then(() => {
        expect(handler).toHaveBeenCalledWith(response);
        done();
      });

    const args = fetchMocks.mock.calls[0];
    expect(args[0]).toEqual('https://server/book/1/barcode/?params=params');
    expect(args[1]).toMatchObject({ method: 'GET' });
  });

  test('.postDetailAction() should call the detail API with action name', (done) => {
    r.postDetailAction('assign', 1, request, params)
      .then(handler)
      .then(() => {
        expect(handler).toHaveBeenCalledWith(response);
        done();
      });

    const args = fetchMocks.mock.calls[0];
    expect(args[0]).toEqual('https://server/book/1/assign/?params=params');
    expect(args[1]).toMatchObject({
      method: 'POST',
      body: JSON.stringify(request),
    });
  });

  test('.postForm() should send formData correctly', (done) => {
    r.postForm<Book>('path', {
      name: 'nameValue',
      file: {
        file: new Blob(['test'], { type: 'text/plain' }), // in practical this should be a blob
        filename: 'filenameValue',
      },
    })
      .then(handler)
      .then(() => {
        expect(handler).toHaveBeenCalledWith(response);
        done();
      });

    const args = fetchMocks.mock.calls[0];
    expect(args[1]).toMatchObject({
      method: 'POST',
    });

    const fd = (args[1]?.body as unknown) as FormData;
    expect(fd).toBeInstanceOf(FormData);
    expect(fd.get('name')).toEqual('nameValue');

    const file = fd.get('file') as File;
    expect(file).toBeInstanceOf(File);
    expect(file.name).toEqual('filenameValue');
    expect(file.size).toEqual(4);
  });
});
