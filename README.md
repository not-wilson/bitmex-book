# bitmex-book
Very simple little device to store and retrive bitmex websocket data.

## Crypto related begging.
If you like my work, please let me know:  
notwilson@protonmail.com  
Find me in the BitMEX trollbox as notwilson

A jesture of notice or a token of appreciation:  
- ETH: 0xd9979f482da58b4432d0f52eb456f7dd1f4897e6  
- BTC: 1HzR3Vyu231E8SsGLUbNYSb92bn6MGLEaV  
- LTC: LTBHggmnrMACoB3JAH8rMy9r8hGxum7ZSw  
- XRP: rBgnUKAEiFhCRLPoYNPPe3JUWayRjP6Ayg (destination tag: 536785858)

## Changelog
- 2.2.2
    - Added `keep_positions` option, default `true`. BitMEX will store the last closed position for a symbol and supply it as a position. If you don't want an empty position in your book, set `keep_positions: false` in your options and only active positions will be monitored.
- 2.2.1
    - Added `keep_liquidations` along with `liquidation_size` options to keep liquidation data from deleting shortly after received.
    - Bug Fix: Liquidations weren't accessable in the book.
- 2.2.0
    - Updated to work with bitmex-socket ^3.0.0
    - Changed config settings, object now accepts a single object with the options `chat_size`, `trade_size` and `quote_size` to limit the size of these tables. `{ chat_size: 1000, quote_size: 1000, trade_size: 1000000 }` is the default setting.
    - Now allows for multiple sockets. Add a socket on creation `new BitmexBook(socket, options)` or add them after creation `book.listen(socket1, socket2)`
    - Bug Fix: Table trimming was a mess. Refactored it. Decidedly works now.
    - Bug Fix: Empty orders weren't being cleared from the order table.
    - Added DOCS.md 
- 2.1.1
    - Bug Fix: Unsubscribing from a channel won't drop the whole table. eg `unsubscribe('trade:XBTUSD')` no longer drops the full trade table.
    - Bug Fix: fetch() now checks the table exists before attempting to filter it.
- 2.1.0
    - Bug Fix: updates() were reading from the data array object, not the item within the array.
    - Book.fetch() now consistently returns an array.
    - Added getter for Book.stream. `book.stream` can now be used to get the `BitmexStream` object created by the `BitmexSocket` object on `new_stream()`.
- 2.0.0
    - Complete rewrite.
    - Added this changelog.