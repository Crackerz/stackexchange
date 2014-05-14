/*******************************************************************************
 * Global config
 ******************************************************************************/

/**
 * chunkSize is the size (in single XML entries) to parse from our file at
 * a time before sending them off to a worker. Playing with this value can help
 * performance.
 */
var chunkSize = 50000

/**
 * totalEntries is the estimated number of entries in the file. This is used to
 * calculate the progress as a percentage when outputting progress to stdout
 */
var totalEntries = 18058662

/**
 * The total number of workers that should be spawned. Recommended to start one
 * worker per cpu core, letting one worker share cpu time with the master thread
 * as the master thread does very little work.
 */
var threads = require('os').cpus().length

/*******************************************************************************
 * Global Storage
 ******************************************************************************/

/**
 * workerQueue keeps track of workers waiting on stuff to do
 */
var workerQueue = []

/**
 * An object that we will use as a map. It will map the string representation of
 * a timestamp to the number of XML entries that claim to have been created at
 * that time in the document we are parsing.
 */
var timestampMap = {}

/**
 * readComplete indicates whether or not the file has finished being read off of
 * the HDD. This, in partnership with the number of nodes waiting for work, is
 * used to indicated whether or not we should write timestampMap to the HDD when
 * a worker completes its work.
 */
var readComplete = false

//Used for forking children
var cluster = require('cluster')

/*******************************************************************************
 * Function Definitions
 ******************************************************************************/

/**
 * Lets create workers and add them to our queue!
 */
function initWorkers() {
    //We only create as many workers as we have threads on the architecture that
    //way they are not competing for resources
    for(var i = 0; i < threads; i++) {
        workerQueue.push(cluster.fork()) //Once forked, add it to the queue
    }
}

function loadFile(fileName) {
    var fileStream = require('fs').createReadStream(fileName)
    var fileBuffer = ""
    //We store our XML entities in this array until we get enough to constitue
    //a "chunk" at which point we send it off to the onData event.
    var entityQueue = []
    var progress = 0 //keeps track of how many XML entities have been processed

    fileStream.on('data',function(data) {
        fileBuffer += data
        //Each of our XML entities are seperated by a '\n' character
        temp = fileBuffer.split('\n')
        //The last XML entity may not be completely read from disk yet, so we
        //will add it back to the fileBuffer for next time
        fileBuffer = temp.pop()
        entityQueue = entityQueue.concat(temp) //Throw all new entities on the queue

        //We now check to see if the queue is large enough to constitue a
        //"chunk", if not our work is done.
        if(entityQueue.length < chunkSize) { return }
        progress += entityQueue.length
        console.log((progress/totalEntries)*100 + "%")
        startWorker(entityQueue,function(msg) {
            fileStream.resume()
            reduceResponse(msg)
        })
        entityQueue = []
        //If we are out of workers to process information, pause the
        //fileStream until more become available
        if(workerQueue.length === 0) {
            fileStream.pause()
        }
    }) //end fileStream.on

    fileStream.on('end', function() {
        startWorker(entityQueue.concat(fileBuffer.split('\n')),function(msg) {
            reduceResponse(msg)
            readComplete = true
        })
    })
}

function startWorker(data,callback) {
    worker = workerQueue.pop()
    console.log("Sending "+data.length+" to "+worker.id)
    //The worker is responsible for cleaning itself up and adding itself back to
    //the workerQueue. We assume each worker will only respond once for each
    //chunk of data we send it.
    worker.on('message', workerComplete(worker,callback))
    worker.send({
        map: data
    })
}

function workerComplete(worker,callback) {
    return function(msg) {
        worker.removeAllListeners() //prevent memory leaks
        console.log("Woker "+worker.id+" complete!")
        workerQueue.push(worker)
        callback.call(null,msg)
        //Check to see if we have completed reading the file and if every worker
        //has completed its work. If so, dump the results to disk.
        if(readComplete && workerQueue.length == threads) {
            console.log("Writing result to disk")
            outputToDisk()
            killWorkers()
        }
    }
}

/**
 * Iterate through each of the returned key-value pairs and condense them down
 * into our timestampMap object
 */
function reduceResponse(msg) {
    if(typeof msg === "undefined") { return }
    Object.keys(msg).forEach(function(timestamp) {
        if(typeof timestampMap[timestamp] === "undefined") {
            timestampMap[timestamp] = msg[timestamp]
        } else {
            timestampMap[timestamp] += msg[timestamp]
        }
    })
}

/**
 * Lets take our timestampMap and dump it to the HDD for later consumption!
 */
function outputToDisk() {
    var fs = require('fs')
    fs.writeFile("output.json",JSON.stringify(timestampMap,null," "),function() {
        console.log("Job Complete!") 
    })
}

/**
 * Use this function to kill all workers that are not currently doing work.
 */
function killWorkers() {
    workerQueue.forEach(function(worker) {
        worker.kill()
    })
}

/*******************************************************************************
 * Start the program
 ******************************************************************************/
 (function() {
    cluster.setupMaster({
        exec : "worker.js"
    })
    initWorkers()
    loadFile("data/posts.xml")
 }).call()
