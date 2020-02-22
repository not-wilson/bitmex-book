# bitmex-book
Process and store BitMEX socket API data.

# Usage
```javascript
const book = new BitmexBook({ trim: { trade: 1000, chat: 1000, quote: 1000 }})
```

`trim` option isn't required and will be populated by default if omitted. It's the maximum size of any of the three specified tables. I've found the default seems to work fine. 10,000 quote, 1,000 chat and 1,000,000 trades isn't all that compromising on memory.

To use, simply connect to the BitMEX API function, parse the message output and send the action to the relevant function.

```javascript
// Your socket handling code here.
const book = new BitmexBook
socket.on('message', data => {
    data = JSON.parse(data)
    // Extract useful data. data[1] is the global socket id.
    const type      = data[0]
    const stream    = data[2]
    const reply     = data[3]

    // Bind the stream ID to the reply so the library can track data easier.
    reply._sid = stream

    // Forward the data to the relevant function.
    switch(reply.action) {
        case 'partial': book.partial(reply);    break
        case 'insert':  book.insert(reply);     break
        case 'update':  book.update(reply);     break
        case 'delete':  book.delete(reply);     break
        default: throw new Error(`Unknown action '${reply.action}', API code outdated.`)
    }
})
```

To access the data, a `fetch(table, rows = 0, filter = null)` function has been included. `filter` operates exactly like `array.filter()`.

```javascript
// ** All socket and book handling code. **
// Fetch all XBTUSD trades from the book.
const trades = book.fetch('trades', 0, item => item.symbol === "XBTUSD")

// Fetch the last 10 trades from Bitmex.
const trades10 = book.fetch('trades', 10)

// Filter all trades for the last 10 XBTUSD.
const xbtusdTrades10 = book.fetch('trades', 10, item => item.symbol === "XBTUSD")
```

If you like my work, please let me know:
notwilson@protonmail.com
Find me in the BitMEX trollbox as notwilson

A jesture of notice or a token of appreciation:  
ETH: 0xd9979f482da58b4432d0f52eb456f7dd1f4897e6  
BTC: 1HzR3Vyu231E8SsGLUbNYSb92bn6MGLEaV  
LTC: LTBHggmnrMACoB3JAH8rMy9r8hGxum7ZSw  
XRP: rBgnUKAEiFhCRLPoYNPPe3JUWayRjP6Ayg (destination tag: 536785858)