import DashAPI, { urlparams } from './DashApi';

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

describe('DashAPI', () => {});
