// Keep private to prevent accidental corruption of data.
const books = {}
const keys  = {}

// Find the index of a specific piece of data in the book.
const findTableIndex = (id, table, data) => {
    const book = books[id]

    // Find the index to update. Pass 0 back if the table has no keys to look for.
    return !keys[table] ? 0 : book[table].findIndex(item => {

        // Check data against keys for this table.
        for(let i = 0; i < keys[table].length; i++) {
            const key = keys[table][i]
            if(item[key] !== data[key]) return false
        }

        // Return whether the result passed or not.
        return true
    })
}

// Convert tradeBin1d into trade etc.
const getBaseTable = table => {
    for(let i = 0; i < table.length; i++) if(table.charCodeAt(i) < 97 || table.charCodeAt(i) > 122) return table.substring(0, i)
    return table
}

class BitmexBook {
    constructor(options = {}) {
        // Build the options menu.
        const vars = Object.keys(options)

        // Default length of tables that will require trimming.
        if(!vars.includes('trim')) options.trim = { quote: 10000, chat: 1000, trade: 1000000 }

        // Bind options.
        this.options = options
        
        // Generate a random ID for data storage in globals to prevent multiple books from corrupting each-other.
        this.id = Math.random().toString(36).substring(2)
        
        // Add this book to the global books object.
        books[this.id] = {}
    }

    // ***************** Handle BitMEX API Messages ***************** //
    partial(reply) {
        const book = books[this.id]

        // Store keys.
        if(!keys[reply.table]) keys[reply.table] = reply.keys

        // Add the table and data to the book.
        if(!book[reply.table]) book[reply.table] = []

        // If there's data to add, insert it.
        if(reply.data && reply.data.length) this.insert(reply)
    }

    insert(reply) {
        const book = books[this.id]

        if(book[reply.table]) {
            for(let i = 0; i < reply.data.length; i++) {
                // Bind stream id to data.
                reply.data[i]._sid = reply.stream   // Reply.stream is added via bitmex-socket, does not exist on the BitMEX API at this level. Does one level up.

                // Add data to the book.
                book[reply.table].push(reply.data[i])

                // Remove first element every iteration the length is over max size.
                const btable = getBaseTable(reply.table) // tradeBin1 into trade etc.
                if(this.options.trim[btable] && (book[reply.table].length > this.options.trim[btable])) book[reply.table].shift()
            }
        }
    }

    update(reply) {
        const book = books[this.id]

        for(let i = 0; i < reply.data.length; i++) {
            const data  = reply.data[i]
            const index = findTableIndex(this.id, reply.table, data)

            if(index >= 0) Object.keys(data).forEach(key => {
                if(reply.table === "order" && data.leavesQty <= 0) book[reply.table].splice(index, 1)   // Remove cancelled/empty orders.
                else if(book[reply.table][index]) book[reply.table][index][key] = data[key]             // Update the data row.
                else {
                    data._sid = reply.stream // Data didn't go in via insert(), attach stream ID to it.
                    book[reply.table].push(data)                                                       // Data doesn't exist, add it.
                }
            })

            else {} // thorw new Error("Don' fucked up.")
        }
    }

    delete(reply) {
        const book = books[this.id]
        for(let i = 0; i < reply.data.length; i++) {
            const index = findTableIndex(this.id, reply.table, reply.data[i])
            book[reply.table].splice(index, 1)
        }
    }

    // ***************** Make it Friendly ***************** //
    // Get all data from the book.
    all() { return { keys, book: books[this.id] } }

    // Initiate a book with data from an already filled book.
    initial(data) { 
        books[this.id] = data.book
        Object.keys(keys).forEach(key => keys[key] = data.keys[key])
    }

    // Fetch all or the last x data from the book via table.
    fetch(table, rows = 0, filter = null) {
        const book      = books[this.id]
        const target    = !filter ? book[table] : book[table].filter(filter)
        const size      = (target.length - rows - 1) < 0 ? 0 : target.length - rows - 1
        return target.slice(!rows ? 0 : size)
    }

    // Clear data from a book based on a stream ID (set in insert - stream id provided by @notwilson/bitmex-socket library).
    flush(sid) {
        const book = books[this.id]
        Object.keys(book).forEach(key => book[key] = book[key].filter(item => { for(let i = 0; i < item.length; i++) return item[i]._sid !== sid } ))
    }
}

module.exports = BitmexBook