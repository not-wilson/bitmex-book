# Object Breakdown
## I really like my Symbol()s.
```javascript
book.opt(option)                    // Get the value of an option.
book.fetch(rows, table, filter)     // Fetch data from the book. Filter is Array.filter() 
book.listen(...sockets)             // Sockets can only authenticate on one account, add more sockets to have more accounts.
book.stop()                         // Stop listening on a socket / Drop all that sockets recorded data (it gets outdated very quickly).
```
- Pass a 0 rows value for *all* rows. filter is passed straight to `book[table].filter(filter)` *basically*.
- Items retrived via `fetch()` will always be an array.
- Options passed on creation are the options retrieved by `opt(s)`. Cannot be set after object creation (no explicit reason for this, just, doing this for free, you know?)

# Options
## There's like 3 and the defaults are fine.
```javascript
const opts = {
    chat_size:  1000,       // Trim the chat table if subscribed at this many rows.
    quote_size: 1000,       // ^
    trade_size: 1000000     // ^^ <- I do a lot of work with averages.
}
```
There's not a whole lot to the options of this object. orderBook tables are decidedly not trimmed because it's generally better to have all that kind of data in real time.

# Working Example
## Ok so it's not a *good* working example, but it *does* work.
```Javascript
const BitmexSocket = require('../bitmex-socket')

// Create a new book and socket object.
const socket    = new BitmexSocket(null, { autoconn: true, limited: true }) // See *bitmex-socket* for info.
const book      = new BitmexBook

// Add a reference to the socket in the book so it can track its events.
book.listen(socket)

// Socket referenced in book, modify socket to see changes reflected.
socket.authenticate('key', 'secret')
socket.subscribe('position', 'order', 'margin', 'wallet', 'trade', 'quote')

// Read the data the partial sent us after it's been processed by the BitmexBook object.
socket.on('partial', table => { console.log(`${table} has an opening size of ${book.fetch(0, table).length} rows.`) })
```