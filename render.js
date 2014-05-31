var fs = require('fs')
fs.readFile('hours.json',bindData)

var margin = {top: 20, right: 30, bottom: 30, left: 40},
    width  = 800-margin.right-margin.left,
    height = 600-margin.top-margin.bottom

var output = document.getElementById("output")

var domain = [],
    range = []

var min, max = 0

function bindData(err, json) {

  var data = JSON.parse(json)

  Object.keys(data).forEach(function(key) {
    domain.push(key)
    range.push(data[key])
  })


      min = d3.min(range) - 30000000,
      max = d3.max(range) + 70000000

      chart = d3.select(".chart")
                .attr("width",margin.left+width+margin.right)
                .attr("height",margin.top+height+margin.bottom)

      barWidth = width / domain.length,

      bar = chart.selectAll("g")
              .data(domain)
            .enter().append("g")
              .attr("transform", function(d,i) {
                return "translate("+(margin.left+((i*barWidth)+1))+","+margin.top+")"
              })

  bar.append("rect")
    .attr("y", function(d) {
      this.addEventListener("mouseover",setOutput(d,data[d]))
      this.addEventListener("mouseout",clearOutput)
      return height - getHeight(data[d])
    })
    .attr("height", function(d) {
      return getHeight(data[d])
    })
    .attr("width", barWidth-2)
    .attr("rx","20")
    .attr("ry","20")
}

function getHeight(value) {
  scale = height / (max - min)
  return (value-min) * scale
}

function setOutput(time, value) {
  return function(event) {
    document.getElementById("output").textContent = "There were "+addComma(value)+" posts at "+time+":00"
  }
}

function clearOutput() {
  document.getElementById("output").textContent = ""
}

function addComma(val) {
    while (/(\d+)(\d{3})/.test(val.toString())){
      val = val.toString().replace(/(\d+)(\d{3})/, '$1'+','+'$2');
    }
    return val;
}
