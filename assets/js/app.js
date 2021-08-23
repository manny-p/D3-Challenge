// noinspection ES6ConvertVarToLetConst
// Define SVG area
let svgWidth = 960
let svgHeight = 500

let margin = {
    top: 60,
    right: 60,
    bottom: 120,
    left: 150
}

let chartWidth = svgWidth - margin.left - margin.right
let chartHeight = svgHeight - margin.top - margin.bottom

let svg = d3.select('#scatter')
    .append('svg')
    .classed('chart', true)
    .attr('width', svgWidth)
    .attr('height', svgHeight)

let chartGroup = svg.append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`)


let acsData = null, chosenXAxis = 'poverty', chosenYAxis = 'obesity', xAxisLabels = ['poverty', 'age', 'income'],
    yAxisLabels = ['obesity', 'smokes', 'healthcare'], labelsTitle = {
        'poverty': 'In Poverty (%)',
        'age': 'Age (Median)',
        'income': 'Household Income (Median)',
        'obesity': 'Obese (%)',
        'smokes': 'Smokes (%)',
        'healthcare': 'Lacks Healthcare (%)'
    }, axisPadding = 20
const scale = (acsData, chosenAxis, xy) => {
    let axisRange = (xy === 'x') ? [0, chartWidth] : [chartHeight, 0]

    return d3.scaleLinear()
        .domain([d3.min(acsData, d => d[chosenAxis]) * 0.8,
            d3.max(acsData, d => d[chosenAxis]) * 1.2
        ])
        .range(axisRange)
}, renderAxis = (newScale, Axis, xy) => {
    let posAxis = (xy === 'x') ? d3.axisBottom(newScale) : d3.axisLeft(newScale)

    Axis.transition()
        .duration(1000)
        .call(posAxis)

    return Axis
}, renderCircles = (elemEnter, newScale, chosenAxis, xy) => {

    elemEnter.selectAll('circle')
        .transition()
        .duration(1000)
        .attr(`c${xy}`, d => newScale(d[chosenAxis]))

    elemEnter.selectAll('text')
        .transition()
        .duration(1000)
        .attr(`d${xy}`, d => newScale(d[chosenAxis]))

    return elemEnter
}, updateToolTip = (chosenXAxis, chosenYAxis, elemEnter) => {

    let tool_tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-8, 0])
        .html(d => `${d.state} <br>${chosenXAxis}: ${d[chosenXAxis]} <br>${chosenYAxis}: ${d[chosenYAxis]}`)

    svg.call(tool_tip)

    elemEnter.classed('active inactive', true)
        .on('mouseover', tool_tip.show)
        .on('mouseout', tool_tip.hide)

    return elemEnter
}, updateChart = function () {

    let value = d3.select(this).attr('value')

    let xy = xAxisLabels.includes(value) ? 'x' : 'y'

    let elemEnter = d3.selectAll('#elemEnter')

    let axis = (xy === 'x') ? d3.select('#xAxis') : d3.select('#yAxis')

    let chosenAxis = (xy === 'x') ? chosenXAxis : chosenYAxis

    if (value !== chosenAxis) {

        if (xy === 'x') {
            chosenXAxis = value
        } else {
            chosenYAxis = value
        }

        chosenAxis = (xy === 'x') ? chosenXAxis : chosenYAxis

        linearScale = scale(acsData, chosenAxis, xy)

        axis = renderAxis(linearScale, axis, xy)

        elemEnter = renderCircles(elemEnter, linearScale, chosenAxis, xy)

        elemEnter = updateToolTip(chosenXAxis, chosenYAxis, elemEnter)

        axisLabels = (xy === 'x') ? xAxisLabels : yAxisLabels
        axisLabels.forEach(label => {
            if (label === value) {

                d3.select(`[value=${label}]`).classed('active', true)
                d3.select(`[value=${label}]`).classed('inactive', false)

                d3.select(`[value=${xy + label}]`).classed('invisible', true)
            } else {

                d3.select(`[value=${label}]`).classed('active', false)
                d3.select(`[value=${label}]`).classed('inactive', true)

                d3.select(`[value=${xy + label}]`).classed('invisible', false)
            }
        })
    }

}

const updateLabelsTip = (xy, labelEnter) => {

    xy = (xy === 'x') ? 'y' : 'x'

    let tool_tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-10, 0])
        .html(d => `Move ${d} to ${xy}-axis`)

    svg.call(tool_tip)

    labelEnter.classed('active inactive', true)
        .on('mouseenter', tool_tip.show)
        .on('mouseleave', tool_tip.hide)
        .on('mousedown', tool_tip.hide)

    return labelEnter
};

const updateLabelsRect = (xy, xPos, labelsRect) => {

    let squareSize = 12

    let chosenAxis = (xy === 'x') ? chosenXAxis : chosenYAxis

    let enterlabelsRect = null

    enterlabelsRect = labelsRect.enter()
        .append('rect')
        .merge(labelsRect)
        .attr('x', xPos)
        .attr('y', (d, i) => (i + 1) * axisPadding - squareSize)
        .attr('width', squareSize)
        .attr('height', squareSize)
        .classed('stateRect', true)
        .classed('invisible', d => (d === chosenAxis))
        .attr('value', d => xy + d)
        .on('click', updateLabel)


    return enterlabelsRect
};


const updateLabels = (xy, xPos, labelsText) => {

    let chosenAxis = (xy === 'x') ? chosenXAxis : chosenYAxis


    labelsText.enter()
        .append('text')

    let enterlabelsText = labelsText.enter()
        .append('text')
        .merge(labelsText)
        .attr('x', xPos)
        .attr('y', (d, i) => (i + 1) * axisPadding)
        .attr('value', d => d)
        .classed('active', d => (d === chosenAxis))
        .classed('inactive', d => (d !== chosenAxis))
        .text(d => labelsTitle[d])
        .on('click', updateChart)
};


function updateLabel() {

    let moveLabel = d3.select(this).attr('value')
    let previousAxis = moveLabel.slice(0, 1)
    let chosenLabel = moveLabel.slice(1)


    if (previousAxis === 'x') {

        xAxisLabels = xAxisLabels.filter(e => e !== chosenLabel)

        yAxisLabels.push(chosenLabel)
    } else {

        yAxisLabels = yAxisLabels.filter(e => e !== chosenLabel)

        xAxisLabels.push(chosenLabel)
    }


    let xLabels = d3.select('#xLabels')

    let xLabelsRect = xLabels.selectAll('rect')
        .data(xAxisLabels)

    xEnterLabelsRect = updateLabelsRect('x', -120, xLabelsRect)

    updateLabelsTip('x', xEnterLabelsRect)

    xLabelsRect.exit().remove()

    let xLabelsText = xLabels.selectAll('text')
        .data(xAxisLabels)

    updateLabels('x', 0, xLabelsText)

    xLabelsText.exit().remove()

    let yLabels = d3.select('#yLabels')

    let yLabelsRect = yLabels.selectAll('rect')
        .data(yAxisLabels)

    let yEnterLabelsRec = updateLabelsRect('y', -45, yLabelsRect)

    updateLabelsTip('y', yEnterLabelsRec)

    yLabelsRect.exit().remove()// append the text for the x-axis labels
    let yLabelsText = yLabels.selectAll('text')
        .data(yAxisLabels)

    updateLabels('y', margin.top, yLabelsText)
    yLabelsText.exit().remove()
}


const init = () => {

    var r = 10

    var xLinearScale = scale(acsData, chosenXAxis, 'x')
    var yLinearScale = scale(acsData, chosenYAxis, 'y')


    var bottomAxis = d3.axisBottom(xLinearScale)
    var leftAxis = d3.axisLeft(yLinearScale)


    var xAxis = chartGroup.append('g')
        .classed('axis', true)
        .attr('transform', `translate(0, ${chartHeight})`)
        .attr('id', 'xAxis')
        .call(bottomAxis)


    var yAxis = chartGroup.append('g')
        .classed('axis', true)
        .attr('id', 'yAxis')
        .call(leftAxis)


    var elem = chartGroup.selectAll('g circle')
        .data(acsData)


    var elemEnter = elem.enter()
        .append('g')
        .attr('id', 'elemEnter')


    elemEnter.append('circle')
        .attr('cx', d => xLinearScale(d[chosenXAxis]))
        .attr('cy', d => yLinearScale(d[chosenYAxis]))
        .attr('r', r)
        .classed('stateCircle', true)


    elemEnter.append('text')
        .attr('dx', d => xLinearScale(d[chosenXAxis]))
        .attr('dy', d => yLinearScale(d[chosenYAxis]))
        .classed('stateText', true)
        .attr('font-size', parseInt(r * 0.8))
        .text(d => d.abbr)


    var xLabels = chartGroup.append('g')
        .attr('transform', `translate(${chartWidth / 2}, ${chartHeight + 20})`)
        .classed('atext', true)
        .attr('id', 'xLabels')

    var xLabelsRect = xLabels.selectAll('rect')
        .data(xAxisLabels)
    var enterXLabelsRect = xLabelsRect.enter()
        .append('rect')
        .attr('x', -120)
        .attr('y', (d, i) => (i + 1) * axisPadding - 12)
        .attr('width', 12)
        .attr('height', 12)
        .classed('stateRect', true)
        .classed('invisible', d => (d === chosenXAxis))
        .attr('value', d => 'x' + d)
        .on('click', updateLabel)

    updateLabelsTip('x', enterXLabelsRect)

    xLabels.selectAll('text')
        .data(xAxisLabels)
        .enter()
        .append('text')
        .attr('x', 0)
        .attr('y', (d, i) => (i + 1) * axisPadding)
        .attr('value', d => d)
        .classed('active', d => (d === chosenXAxis))
        .classed('inactive', d => (d !== chosenXAxis))
        .text(d => labelsTitle[d])
        .on('click', updateChart)


    var yLabels = chartGroup.append('g')
        .attr('transform', `rotate(-90 ${(margin.left / 2)} ${(chartHeight / 2) + 60})`)
        .classed('atext', true)
        .attr('id', 'yLabels')

    var yLabelsRect = yLabels.selectAll('rect')
        .data(yAxisLabels)
    var enterYLabelsRect = yLabelsRect.enter()
        .append('rect')
        .attr('x', -45)
        .attr('y', (d, i) => (i + 1) * axisPadding - 12)
        .attr('width', 12)
        .attr('height', 12)
        .classed('stateRect', true)
        .classed('invisible', d => (d === chosenYAxis))
        .attr('value', d => 'y' + d)
        .on('click', updateLabel)

    updateLabelsTip('y', enterYLabelsRect)

    yLabels.selectAll('text')
        .data(yAxisLabels)
        .enter()
        .append('text')
        .attr('x', margin.top)
        .attr('y', (d, i) => (i + 1) * axisPadding)
        .attr('value', d => d)
        .classed('active', d => (d === chosenYAxis))
        .classed('inactive', d => (d !== chosenYAxis))
        .text(d => labelsTitle[d])
        .on('click', updateChart)


    var elemEnter = updateToolTip(chosenXAxis, chosenYAxis, elemEnter)
}


d3.csv('/assets/data/data.csv').then((data, error) => {

    if (error) throw error

    data.forEach(d => {
        d.poverty = +d.poverty
        d.age = +d.age
        d.income = +d.income
        d.obesity = +d.obesity
        d.healthcare = +d.healthcare
        d.smokes = +d.smokes
    })


    acsData = data

    init()
})