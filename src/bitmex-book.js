// Object Symbols.
const s = { tables: Symbol('tables'), keys: Symbol('keys'), opts: Symbol('opts'), sockets: Symbol('sockets') }

// Create a store for event listeners so they can be toggled on/off per socket per book.
const events = {}

class BitmexBook {
    constructor(socket = null, opts = {}) {
        // Add default variables.
        this[s.tables]  = {}
        this[s.keys]    = {}
        this[s.opts]    = {}
        this[s.sockets] = []

        // Configure default options.
        check_opts(this, opts)

        // Add the socket.
        if(socket) this.listen(socket)
    }

    // Get the value of an option.
    opt(o) { return this[s.opts][o] || false }

    // Get data from the book.
    fetch(rows = 0, table, filter) {
        // Check table exists before attempting to manipulate it.
        if(!this[s.tables][table]) return []

        const target    = !filter ? this[s.tables][table] : this[s.tables][table].filter(filter)
        const size      = (target.length - rows - 1) < 1 ? 0 : target.length - rows - 1
        return target.slice(!rows ? 0 : size)
    }

    // Listen for book updates from a socket.
    listen(...sockets) {
        sockets.forEach(socket => {
            // Add trackable eventListeners to keep the value of this local.
            if(!events[socket.id]) events[socket.id] = { 
                partial:    (table, data, reply) => partial(this, table, data, reply, socket), 
                insert:     (table, data, reply) => insert(this, table, data, reply, socket), 
                update:     (table, data, reply) => update(this, table, data, reply, socket), 
                delete:     (table, data, reply) => deletee(this, table, data, reply, socket) 
            }

            // Add event listeners for the important stuff.
            socket.on('partial',  events[socket.id].partial) // Not my preferred method, but you know, removeListener.
            socket.on('insert',   events[socket.id].insert)
            socket.on('update',   events[socket.id].update)
            socket.on('delete',   events[socket.id].delete)
            
            // Keep reference to the socket.
            this[s.sockets].push(socket)
        })
    }

    // Stop listening for events from some sockets.
    stop(...sockets) {
        // Loop supplied sockets.
        sockets.forEach(socket => {
            // Turn off the event listeners we added in listen().
            socket.off('partial', events[socket.id].partial)
            socket.off('insert',  events[socket.id].insert)
            socket.off('update',  events[socket.id].update)
            socket.off('delete',  events[socket.id].delete)

            // Remove deactivated socket data from the book, it'll be too outdated shortly.
            Object.keys(this[s.tables]).forEach(table => {
                // Select all data this socket has contributed.
                const wants = this.fetch(0, table, filter => filter._sid === socket.id)

                // Delete all data this socket has contributed.
                deletee(this, table, wants, null, socket)
            })

            // Remove them from refernce list.
            this[s.sockets].splice(this[s.sockets].findIndex(sock => sock.id === socket.id), 1)
        })
    }
}

// Set default configuration against supplied options.
function check_opts(book, opts = {}) {
    // Get a list of supplied options.
    const vars = Object.keys(opts)

    // Keep memory free, limit the size of the chat table.
    if(!vars.includes('chat_size')) opts.chat_size = 1000

    // Limit the size of the trade table.
    if(!vars.includes('trade_size')) opts.trade_size = 1000000

    // Limit the size of the quote table.
    if(!vars.includes('quote_size')) opts.quote_size = 1000

    // Limit the size of the liquidation table.
    if(!vars.includes('liquidation_size')) opts.liquidation_size = 10000

    // Don't clear liquidations out of the liquidation table.
    if(!vars.includes('keep_liquidations')) opts.keep_liquidations = false

    // Clear empty positions.
    if(!vars.includes('keep_positions')) opts.keep_positions = true

    // Add the options to the object.
    book[s.opts] = opts
}

// Add a new table into the book.
function partial(book, table, data = [], reply, bitmex) {
    // Create the table if it doesn't exist.
    if(!book[s.tables][table]) book[s.tables][table] = []

    // Add the table keys to the keys store.
    if(!book[s.keys][table]) book[s.keys][table] = reply.keys || []

    // Insert data into the book.
    if(data && data.length) insert(book, table, data, reply, bitmex)
}

// Insert data into the book.
function insert(book, table, data = [], reply, bitmex) {

    // Loop through all data objects.
    for(let i = 0; i < data.length; i++) {
        // Don't add an empty position to the book.
        if(table === "position" && data[i].currentQty <= 0 && !book.opt('keep_positions')) continue

        // Add socket ID to data for easier tracking.
        data[i]._sid = bitmex.id

        // If we want to keep liquidation data on the books, add a timestamp field to save a fucking lot of headache.
        if(table === "liquidation" && book.opt('keep_liquidations')) data[i].timestamp = new Date

        // Add data-row to
        book[s.tables][table].push(data[i])

        // Make sure the book tables are kept to spec.
        trim(book, table)
    }
}

// Trim data inside the book.
function trim(book, table) {
     // Keep memory in check.
     let trim = null
     if(table.includes('trade')) trim = "trade"
     if(table.includes('quote')) trim = "quote"
     if(table.includes('chat'))  trim = "chat"
     if(table.includes('liquidation')) trim = "liquidation"

     // Check if the table is larger than the wanted size.
     if(trim && book[s.tables][table].length > book.opt(`${trim}_size`)) book[s.tables][table].shift()
}

// Update a table in the book.
function update(book, table, data = [], reply, bitmex) {
    // We only want inserts if we're keeping the data.
    if(book.opt('keep_liquidations') && table === "liquidation") return 

    // Loop and update data.ff
    for(let i = 0; i < data.length; i++) {
        const item = data[i]
        const index = find(book, table, item)

        // Connected table doesn't send data with its partial or an insert event. Only updates for some reason..
        if(index < 0) insert(book, table, [item])

        // Update a row in the book.
        else {
            // Remove empty orders from the book.
            if(item.leavesQty <= 0) book[s.tables][table].splice(index, 1)

            // Remove closed positions from the book.
            else if(!book.opt('keep_position') && (item.currentQty <= 0)) book[s.tables][table].splice(index, 1)

            // Update entry in book.
            else if(book[s.tables][table][index]) Object.keys(item).forEach(key => book[s.tables][table][index][key] = item[key])
        }
    }
}

// Delete table data from the book.
function deletee(book, table, data = [], reply, bitmex) {
    // We only want inserts if we're keeping the data.
    if(book.opt('keep_liquidations') && table === "liquidation") return 

    // Loop and delete data.
    for(let i = 0; i < data.length; i++) {
        // Find the index for the data.
        const index = find(book, table, data[i])

        // Remove data from the table.
        if(index) book[s.tables][table].splice(index, 1)
    }
}

// Find a piece of data within the book.
function find(book, table, data) {
    return !book[s.keys][table] ? 0 : book[s.tables][table].findIndex(item => {
        // Check the keys match.
        for(let i = 0; i < book[s.keys][table].length; i++) {
            const key = book[s.keys][table][i]
            if(item[key] !== data[key]) return false
        }

        // Data is a match.
        return true
    })
}

// Export the object.
module.exports = BitmexBook