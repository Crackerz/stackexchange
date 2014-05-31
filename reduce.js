var fs = require('fs')

fs.readFile('output.json', handleData);

var hours = {}

function handleData(err,data) {
    if (err) {
        console.log("Could not load output.js: "+err)
        return
    }
    var timestamps = JSON.parse(data)
    Object.keys(timestamps).forEach(consolidateTime)
    fs.writeFile('hours.json',JSON.stringify(hours,null," "))
}

function consolidateTime(timestamp,count) {
    var hms = timestamp.split(":")
    hour = parseInt(hms[0])
    minute = parseInt(hms[1])
    if(minute>30) {
        hour === 23 ? hour = 0 : hour+=1
    }
    hours[hour] = hours[hour] === undefined  ? count : hours[hour]+count
}
