# bitmex-book
Process and store BitMEX socket API data.

# Usage
```javascript

// Use this library with https://npmjs.org/package/bitmex-socket
const BitmexSocket  = require('bitmex-socket')
const BitmexBook    = require('bitmex-book')

// Create a socket connection.
const socket = new BitmexSocket

// Create  stream with the socket.
const stream = socket.new_stream()

// Create a new book object with the stream.
const book = new BitmexBook(stream)

// Subscribe to data to populate the book.
stream.subscribe('trade', 'liquidation', 'orderBookL2')

// Wait 1 minute (let the list populate a little) then console log the last up to 300 trades.
setTimeout(() => console.log(book.fetch(300, 'trade', filter => filter.symbol === "XBTUSD")), 60000)

// If you unsubscribe from a table, the book will delete it's records.
//stream.unsubscribe('orderBookL2') // All data will be lost.
//stream.subscribe('orderBookL2') // Start receiving real-time data for this table again.
```

## Changelog
- 2.0.1
    - Added getter for Book.stream. `book.stream` can now be used to get the `BitmexStream` object created by the `BitmexSocket` object on `new_stream()`.
- 2.0.0
    - Complete rewrite.
    - Added this changelog.

If you like my work, please let me know:  
notwilson@protonmail.com  
Find me in the BitMEX trollbox as notwilson

A jesture of notice or a token of appreciation:  
- ETH: 0xd9979f482da58b4432d0f52eb456f7dd1f4897e6  
- BTC: 1HzR3Vyu231E8SsGLUbNYSb92bn6MGLEaV  
- LTC: LTBHggmnrMACoB3JAH8rMy9r8hGxum7ZSw  
- XRP: rBgnUKAEiFhCRLPoYNPPe3JUWayRjP6Ayg (destination tag: 536785858)