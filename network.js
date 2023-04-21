document.addEventListener("DOMContentLoaded", async function (event) {
    const width = screen.width * 1.2;
    const height = screen.availHeight;
    const data = await d3.json("publication_network_pueid.json");
    let svg = d3.select('body').append("svg").attr("viewBox", `0 0 ${width} ${height}`)
    const rootSvgGroup = svg.append("g")
        .attr("transform", "translate(0, 50)")

    const nodeAngle = {};
    d3.map(data.links, (d) => {
        if (nodeAngle.hasOwnProperty(d.source)) {
            nodeAngle[d.source]++
        }
        else {
            nodeAngle[d.source] = 0;
        }
        if (nodeAngle.hasOwnProperty(d.target)) {
            nodeAngle[d.target]++
        }
        else {
            nodeAngle[d.target] = 0
        }
    })

    const scale_radius = d3.scaleLinear()
        .domain(d3.extent(Object.values(nodeAngle)))
        .range([3, 12])

    const color = d3.scaleSequential()
        .domain([1995, 2020])
        .interpolator(d3.interpolateViridis)


    const link_elements = rootSvgGroup.append("g")
        .attr('transform', `translate(${width / 2},${height / 2})`)
        .selectAll(".line")
        .data(data.links)
        .enter()
        .append("line")

    const treatPublishersClass = (Publisher) => {
        let temp = Publisher.toString().split(' ').join('');
        temp = temp.split(".").join('');
        temp = temp.split(",").join('');
        temp = temp.split("/").join('');
        return "gr" + temp
    }
    const tooltip = d3.select("body")
        .append("div")
        .style("position", "absolute")
        .style("z-index", "10")
        .style("visibility", "hidden")
        .style("padding", "3px 6px")
        .style("color", "white")
        .style("background", "rgba(60, 60, 60, 0.56)")
        .text("");

    const nodeEles = rootSvgGroup.append("g")
        .attr('transform', `translate(${width / 2},${height / 2})`)
        .selectAll(".circle")
        .data(data.nodes)
        .enter()
        .append('g')
        .attr("class", function (d) {
            return treatPublishersClass(d.Publisher)
        })
        .on("mouseenter", function (d, data) {
            tooltip.text(data.Title).style('top', `${d.y}px`).style('left', `${d.x}px`);
            tooltip.style("visibility", "visible");
            nodeEles.classed("inactive", true)
            const selected_class = d3.select(this)
                .attr("class").split(" ")[0];
            d3.selectAll("." + selected_class)
                .classed("inactive", false)

        })
        .on("mouseleave", (d, data) => {
            tooltip.style("visibility", "none");
            d3.selectAll(".inactive").classed("inactive", false)
        });

    nodeEles.append("circle")
        .attr("r", (d, i) => {
            if (nodeAngle[d.id] !== undefined) {
                return scale_radius(nodeAngle[d.id])
            }
            else {
                return scale_radius(0)
            }

        })
        .attr("fill", function (d, i) {
            return color(d.Year)
        })


    d3.forceSimulation(data.nodes)
        .force("collide",
            d3.forceCollide().radius(function (d, i) {
                return scale_radius(nodeAngle[d.id]) * 1.2
            }))
        .force("x", d3.forceX())
        .force("y", d3.forceY())
        .force("charge", d3.forceManyBody())
        .force("link", d3.forceLink(data.links)
            .id(function (d) {
                return d.id
            })
        )
        .on("tick", function () {
            nodeEles
                .attr('transform', (d) => `translate(${d.x},${d.y})`)
            link_elements
                .attr("x1", function (d) { return d.source.x })
                .attr("x2", function (d) { return d.target.x })
                .attr("y1", function (d) { return d.source.y })
                .attr("y2", function (d) { return d.target.y })

        });


    svg.call(d3.zoom()
        .extent([[0, 0], [width, height]])
        .scaleExtent([1, 8])
        .on("zoom", ({ transform }) => {
            rootSvgGroup.attr("transform", transform);
        }));

});

