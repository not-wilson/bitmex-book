// Obejct to store and update BitMEX data.
class BitmexBook {
    constructor(options = {}) {
        // Build the options menu.
        const vars = Object.keys(options)

        // Default length of tables that will require trimming.
        if(!vars['trim']) options.trim = { quote: 10000, chat: 1000, trade: 1000000 }

        // Look-up keys for tables.
        const book  = {}
        const keys  = {}

        // Find the index of a specific piece of data in the book.
        const findTableIndex = (table, data) => {
            // Find the index to update. Pass -2 back if the table has no keys to look for.
            return !keys[table] ? -2 : book[table].findIndex(item => {

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

        // Initialize the book with any wanted data (used for echo server)
        this.init = (ibook, ikeys) => {
            // let is for the weak. Real men use const *all* the time.
            Object.keys(ibook).forEach(key => book[key] = ibook[key])
            Object.keys(ikeys).forEach(key => keys[key] = ikeys[key])            
        }

        // BitMEX Socket Operations.
        this.partial = reply => {
            // Store keys.
            if(!keys[reply.table]) keys[reply.table] = reply.keys

            // Add the table and data to the book.
            if(!book[reply.table]) book[reply.table] = []

            // If there's data to add, insert it.
            if(reply.data && reply.data.length) this.insert(reply)
        }

        this.insert = reply => {
            if(book[reply.table]) {
                for(let i = 0; i < reply.data.length; i++) {
                    // Bind stream id to data.
                    reply.data[i]._sid = reply.stream   // Reply.stream is added via bitmex-socket, does not exist on the object elsewhere.

                    // Add data to the book.
                    book[reply.table].push(reply.data[i])

                    // Remove first element every iteration the length is over max size.
                    const btable = getBaseTable(reply.table) // tradeBin1 into trade etc.
                    if(options.trim[btable] && (book[reply.table].length > options.trim[btable])) book[reply.table].shift()
                }
            }
        }

        this.update = reply => {
            for(let i = 0; i < reply.data.length; i++) {
                const data  = reply.data[i]
                const index = findTableIndex(reply.table, data)

                // Table doens't have any keys to find data for. Update the first row and move along. (connected table accepts this compromise.)
                if(index === -2) {
                    if(book[reply.table].length) book[reply.table][0] = data
                    else book[reply.table].push(data)
                }

                // Update row data.
                else if(index >= 0) Object.keys(data).forEach(key => {
                    if(reply.table === "order" && data.leavesQty <= 0) book[reply.table].splice(index, 1) // Remove cancelled/empty orders.
                    else book[reply.table][index][key] = data[key]
                })

                else {} // thorw new Error("Don' fucked up.")
            }
        }

        this.delete = reply => {
            for(let i = 0; i < reply.data.length; i++) {
                const index = findTableIndex(reply.table, reply.data[i])
                book[reply.table].splice(index, 1)
            }
        }

        // Functions to access data within the book.
        this.all    = (k = false) => k ? keys : book    // Get full book data.

        // Fetch data from the book. filter is identical to a function passed to array.filter()
        this.fetch  = (table, rows = 0, filter) => { 
            const data = filter ? book[table].filter(filter) : book[table]
            return (rows ? data.slice((data.length - rows) > 0 ? data.length - rows : data.length) : data)
        }

        // Flush data from the book.
        this.flush = sid => {
            // Remove all data from a specific stream ID from the book.
            Object.keys(book).forEach(table => book[table] = book[table].filter(item => item._sid !== sid))
        }
    }
}

module.exports = BitmexBook