var width  = 800,
    height = 600

var output = document.getElementById("output")

var data = {
 "1": 174339121,
 "2": 173033227,
 "3": 173649591,
 "4": 175559092,
 "5": 183994192,
 "6": 192698311,
 "7": 187331892,
 "8": 178150435,
 "9": 173550995,
 "10": 170502994,
 "11": 172590309,
 "12": 160091739,
 "13": 134866023,
 "14": 124997600,
 "15": 122940888,
 "16": 125072959,
 "17": 129486640,
 "18": 132598314,
 "19": 126990716,
 "20": 126942640,
 "21": 127345076,
 "22": 147048110,
 "23": 153165887,
 "24": 165490049
}

var domain = [],
    range = []

Object.keys(data).forEach(function(key) {
  domain.push(key)
  range.push(data[key])
})

var min = d3.min(range) - 30000000,
    max = d3.max(range) + 70000000,

    chart = d3.select(".chart")
              .attr("width",width)
              .attr("height",height),

    barWidth = width / domain.length,

    bar = chart.selectAll("g")
            .data(domain)
          .enter().append("g")
            .attr("transform", function(d,i) {
              return "translate("+((i*barWidth)+1)+",40)"
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
