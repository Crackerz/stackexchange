var cluster = require('cluster')
process.on('message',decodeXML)

function decodeXML(msg) {
    try { //make sure a single error doesn't bring down the system!
        console.log(cluster.worker.id + " received message: ", msg.map.length)
        if(typeof msg === "undefined" || typeof msg.map === "undefined") {
            //master sent us bad data.
            process.send({})
            return
        }
        process.send(getTimestamps(msg.map))
    } catch (e) {
        console.log(e)
        //tell master we did bad
        process.send({})
    }
}

/**
 * This function parses an entire XML chunk and grabs the timestamps from
 * each element, compiling the occurence of each and returning the counts
 * as a key-value map.
 */
function getTimestamps(xml) {
    var xml2js = require('xml2js')
    timestamps = {} //this will be our map
    xml.forEach(function(val) {
        xml2js.parseString(val,function(error,val) {
            //For each parsed XML entity, we will grab its timestamp
            time = parseRow(val)
            if(time === null) {
                return
            }
            //We then take the retrieved timestamp and add it to the map
            if(typeof timestamps[time] === "undefined") {
                timestamps[time] = 1
            } else {
                timestamps[time]++
            } //end if-else
        }) //end xml2js.parseString
    }) //end xml.forEach
    return timestamps
}

function parseRow(entity) {
    //XML Specific parsing. Just checks to make sure things exist and scrubs
    //the data to get what we need.
    if( entity !== null &&
        typeof entity !== "undefined" &&
        typeof entity.row !== "undefined" &&
        typeof entity.row.$ !== "undefined" &&
        typeof entity.row.$.CreationDate !== "undefined") {
        split = entity.row.$.CreationDate.split("T") //lets only grab the time
        if(split.length > 1) {
            return split[1].split(".")[0]
        } //end if
    } //end if
    return null
}
