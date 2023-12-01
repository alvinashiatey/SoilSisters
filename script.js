import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

fetch(
    "https://script.google.com/macros/s/AKfycbwuEHUBJW6UEcUWloFbZ6f-uRgsbYCtmAdlsN3sUYHmHFl9cHngU6R_ZWMNnqn0Igh5Kw/exec"
)
    .then((response) => {
        if (!response.ok) {
            throw new Error("Network response was not ok " + response.statusText);
        }
        return response.json();
    })
    .then((res) => {
        const { data } = res;
        const outputs = data.filter((obj) => {
            return obj.name === "Outputs";
        });
        // data.splice(data.indexOf(outputs[0]), 1);
        const newRes = {
            name: "Soil Sisters",
            children: data,
        };
        const width = window.innerWidth, height = window.innerHeight;

        function convertDriveLinkToDirectLink(driveLink) {
            const fileId = driveLink.match(/[-\w]{25,}/);
            return fileId
                ? `https://drive.google.com/uc?export=view&id=${fileId[0]}`
                : "";
        }

        function handleOutputDisplay(inputName) {
            const outputObjects = outputs[0].children.filter(output => {
                const keys = Object.keys(output);
                const regex = new RegExp(`Ingredient \\d+ Name`);
                const ingredientKeys = keys.filter(key => regex.test(key));
                return ingredientKeys.some(key => output[key] === inputName);
            });
            console.log(outputObjects);
            const outputContainer = document.getElementById("output");
        //     make new chart here with outputObjects
            const newRoot = d3.hierarchy({ children: outputObjects });
            const newDescendants = newRoot.descendants();

            const newSvg = d3.create("svg")
                .attr("width", width)
                .attr("height", height)
                .style("font", "10px sans-serif");

            const newG = newSvg.append("g");

            const newZoom = d3.zoom()
                .on("zoom", (event) => {
                    newG.attr("transform", event.transform);
                })
                .filter(event => {
                    return event.type !== "wheel";
                });

            svg.call(newZoom);


        }


        function handleDetailsDisplay(data, container) {
            const keys = Object.keys(data);
            const ignoreKeys = ["image", "No."];
            container.innerHTML = "";
            keys.forEach(key => {
                if (!ignoreKeys.includes(key)) {
                    if (data[key].trim() === "") return;
                    const div = document.createElement("div");
                    const slug = key.toLowerCase().replace(/\s/g, "-");
                    div.classList.add(slug);
                    div.classList.add("content");
                    const title = document.createElement("p");
                    title.classList.add("title");
                    title.textContent = key;
                    div.append(title);
                    const value = document.createElement("p");
                    value.classList.add("value");
                    value.textContent = data[key];
                    div.append(value);
                    container.append(div);
                }
            });


        }

        const root = d3.hierarchy({ children: data });
        const descendants = root.descendants();

        // Creates the SVG container.
        const svg = d3.create("svg")
            .attr("width", width)
            .attr("height", height)
            .style("font", "10px sans-serif");

        const g = svg.append("g");

        const zoom = d3.zoom()
            .on("zoom", (event) => {
                g.attr("transform", event.transform);
            })
            .filter(event => {
                return event.type !== "wheel";
            });


        svg.call(zoom);

        svg.append("defs")
            .append("clipPath")
            .attr("id", "circle-clip")
            .append("circle")
            .attr("r", 25);

        const simulation = d3.forceSimulation(descendants)
            .force("charge", d3.forceManyBody().strength(-50))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collision", d3.forceCollide().radius(30))
            .on("tick", () => {
                nodeGroups.attr("transform", d => `translate(${d.x},${d.y})`);
            });

        const links = svg.append("g")
            .attr("fill", "none")
            .attr("stroke", "#555")
            .attr("stroke-opacity", 0.4)
            .attr("stroke-width", 1.5)
            .selectAll("path")
            .data(root.links())
            .join("path")
            .attr("d", d => `M${d.source.x},${d.source.y}L${d.target.x},${d.target.y}`)
            .attr("visibility", "hidden");


        const nodeGroups = g.selectAll("g.node")
            .data(descendants)
            .join("g")
            .attr("class", "node");

        nodeGroups.append("circle")
            .attr("r", 25)
            .attr("fill", d => d.children ? "#fff" : "#fefefe");

        nodeGroups.each(function (d) {
            const node = d3.select(this);
            if (d.data.image && d.data.image.trim() !== "") {
                const img = node.append("image")
                    .attr("xlink:href", d => convertDriveLinkToDirectLink(d.data.image))
                    .attr("width", 70)
                    .attr("height", 70)
                    .attr("clip-path", "url(#circle-clip)");

                img.on("load", function() {
                    const imgWidth = this.getBBox().width;
                    const imgHeight = this.getBBox().height;

                    const scale = Math.max(50 / imgWidth, 50 / imgHeight);

                    img.attr("x", -25 - (imgWidth * scale - 50) / 2)
                        .attr("y", -25 - (imgHeight * scale - 50) / 2)
                        .attr("width", imgWidth * scale)
                        .attr("height", imgHeight * scale);
                });
            }
        });

        nodeGroups.append("text")
            .attr("dy", ".35em")
            .attr("x", d => d.children ? -30 : 30)
            .style("text-anchor", d => d.children ? "end" : "start")
            .text(d => d.data.name)
            .on("click", function(event, d) {
                const detailsDiv = document.getElementById("details");
                handleDetailsDisplay(d.data, detailsDiv.querySelector(".contents"));
                detailsDiv.style.display = "block";
                handleOutputDisplay(d.data.name)
            });

        const closeButton = document.getElementById("close");
        closeButton.addEventListener("click", function() {
            const detailsDiv = document.getElementById("details");
            detailsDiv.style.display = "none";
        });

        const container = document.getElementById("container");
        container.append(svg.node());
    })
    .catch((error) => {
        console.error("There has been a problem with your fetch operation:", error);
    });
