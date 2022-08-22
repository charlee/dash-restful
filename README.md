# dash-restful

A JavaScript restful client using fetch interface.

## Install

```
npm i dash-restful
```

or

```
yarn add dash-restful
```

## Usage

The simplest way is to create an API object and use it to access the endpoints:

```typescript
import DashApi from 'dash-restful';

type Book = {
  id: number;
  name: string;
  author: string;
};

// Create an api instance and use the low level API
const api = DashApi('https://api.example.com/');

api
  .post<Book>('/books/', {
    data: {
      name: 'War and Peace',
      author: 'Leo Tolstoy',
    },
  })
  .then((book) => {
    console.log(book);
  });

// or use async call
const book: Book = await api.get<Book>('/books/1');
console.log(book); // type: Book
```

A more recommended approach is to use the high-level, REST-aware "resource" API:

```typescript
// create a high-level, REST-aware resource
const bookResource = api.createResource<Book>('books');
bookResource
  .create({
    name: 'War and Peace',
    author: 'Leo Tolstoy',
  })
  .then((book: Book) => {
    console.log(book);
  });

const book2 = await bookResource.retrieve(1);
console.log(book2);
```
