// Object Symbols.
const s = { tables: Symbol('tables'), keys: Symbol('keys'), stream: Symbol('stream'), opts: Symbol('opts') }

// Book to handle BitMEX events so I can just search for data.
class BitmexBook {
    constructor(stream, opts = {}) {
        // Get the config options.
        const vars = Object.keys(opts)
        
        // Set a default value for each trim option if it's not included.
        if(!vars.includes('trim')) opts.trim = { quote: 1000, chat: 1000, trade: 1000000 }
        else {
            if(!opts.trim.quote)   opts.trim.quote = 1000
            if(!opts.trim.chat)    opts.trim.chat = 1000
            if(!opts.trim.trade)   opts.trim.trade = 1000000
        }

        // Bind the socket & options.
        this[s.stream]  = stream
        this[s.opts]    = opts

        // Bind tables and keys.
        this[s.tables]  = {}
        this[s.keys]    = {}
        
        // Bind the socket events to update the object.
        stream.on('partial',    (table, data, row)  => partial(this, table, data, row))
        stream.on('insert',     (table, data)       => insert(this, table, data))
        stream.on('update',     (table, data)       => update(this, table, data))
        stream.on('delete',     (table, data)       => deletee(this, table, data))
        
        // Remove table data on unsubscribe event.
        stream.on('unsubscribe', table => remove_table(this, table))
    }

    // Object getters.
    get config()    { return this[s.opts] }
    get stream()    { return this[s.stream] }

    // Get data from the book.
    fetch(rows = 0, table, filter) {
        const target    = !filter ? this[s.tables][table] : this[s.tables][table].filter(filter)
        const size      = (target.length - rows - 1) < 1 ? 0 : target.length - rows - 1
        return target.slice(!rows ? 0 : size)
    }
}

// Export the object.
module.exports = BitmexBook

// Add a new table into the book.
function partial(book, table, data = [], reply) {
    // Create the table if it doesn't exist.
    if(!book[s.tables][table]) book[s.tables][table] = []

    // Add the table keys to the keys store.
    if(!book[s.keys][table]) book[s.keys][table] = reply.keys || []

    // Insert data into the book.
    if(data && data.length) insert(book, table, data)
}

// Insert data into the book.
function insert(book, table, data = []) {
    // Loop through all data objects.
    for(let i = 0; i < data.length; i++) {
        // Add data-row to
        book[s.tables][table].push(data[i])

        // Ensure sizing is maintained.
        const trim = base_table_name(table) // trade or quote
        if(book.config.trim[trim] && (book[s.tables][table].length > book.config.trim[trim])) book[s.tables][table].shift()
    }
}

// Update a table in the book.
function update(book, table, data = []) {
    for(let i = 0; i < data.length; i++) {
        const item = data[i]
        const index = find(book, table, item)

        // Connected table doesn't send an insert, only updates.
        if(index < 0) insert(book, table, [item])

        // Update a row in the book.
        else {
            // Remove empty orders from the book.
            if(item.leavesQty <= 0) deletee(book, table, [item])

            // Now that's some nested shit.
            else if(book[s.tables][table][index]) Object.keys(item).forEach(key => book[s.tables][table][index][key] = item[key])
        }
    }
}

// Delete table data from the book.
function deletee(book, table, data = []) {
    for(let i = 0; i < data.length; i++) {
        // Find the index for the data.
        const index = find(book, table, data[i])

        // Remove data from the table.
        if(index) book[s.tables][table].splice(index, 1)
    }
}

// Remove a table from the book.
function remove_table(book, table) { delete book[s.tables][table] }

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

// Convert tradeBin1d into trade etc. Only matters for trade* and quote*
function base_table_name(table) {
    for(let i = 0; i < table.length; i++) if(table.charCodeAt(i) < 97 || table.charCodeAt(i) > 122) return table.substring(0, i)
    return table
}