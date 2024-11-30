// Define the graph structure with nodes and their connections and weights
const ucsGraph = { 
  Entrance: { Dairy: 2, Fruits: 4, Vegetables: 3 },
  Dairy: { Bakery: 1, Snacks: 5 },
  Fruits: { Vegetables: 1, Frozen: 7 },
  Vegetables: { Meat: 2 },
  Bakery: { Meat: 3, Beverages: 2 },
  Snacks: { Beverages: 3 },
  Frozen: { Meat: 4 },
  Meat: { Beverages: 1 },
  Beverages: {}
};

// Function to perform Uniform Cost Search to find the shortest path visiting all goals
function uniformCostSearchForAll(graph, start, goals) {
  const visited = new Set(); // Track visited nodes with their states
  const queue = [{ node: start, cost: 0, path: [start], visitedGoals: new Set() }]; // Priority queue for UCS
  let shortestResult = null;

  while (queue.length > 0) {
    queue.sort((a, b) => a.cost - b.cost); // Sort queue by cost (lowest cost first)
    const { node, cost, path, visitedGoals } = queue.shift(); // Dequeue the node with the lowest cost

    if (visited.has(node + Array.from(visitedGoals).join(","))) continue; // Skip already visited states
    visited.add(node + Array.from(visitedGoals).join(",")); // Mark this state as visited

    const updatedGoals = new Set(visitedGoals); // Clone the set of visited goals
    if (goals.includes(node)) {
      updatedGoals.add(node); // Mark the goal as visited if it's the current node
    }

    if (updatedGoals.size === goals.length) { // Check if all goals are visited
      shortestResult = { cost, path }; // Update the shortest path result
      break;
    }

    // Add neighbors to the queue
    for (const neighbor in graph[node]) {
      if (!visited.has(neighbor + Array.from(updatedGoals).join(","))) {
        queue.push({
          node: neighbor,
          cost: cost + graph[node][neighbor], // Update cost
          path: [...path, neighbor], // Extend the path
          visitedGoals: updatedGoals // Carry updated goals
        });
      }
    }
  }

  return shortestResult; // Return the shortest path result
}

// Event listener for form submission to trigger pathfinding
document.getElementById("shopping-form").addEventListener("submit", (event) => {
  event.preventDefault(); // Prevent default form submission

  // Get selected items from the form checkboxes
  const selectedItems = Array.from(
    document.querySelectorAll('input[type="checkbox"]:checked')
  ).map(checkbox => checkbox.value);

  if (selectedItems.length === 0) {
    // Display warning if no items are selected
    document.getElementById("result").innerHTML = `
      <div class="alert alert-warning" role="alert">
        Please select at least one item.
      </div>`;
    return;
  }

  // Perform UCS to find the shortest path
  const result = uniformCostSearchForAll(ucsGraph, "Entrance", selectedItems);

  if (!result) {
    // Display error if no path could be found
    document.getElementById("result").innerHTML = `
      <div class="alert alert-danger" role="alert">
        No route could be found to achieve the selected items.
      </div>`;
    return;
  }

  // Highlight the shortest path with visited goals in bold green
  const highlightedPath = result.path
    .map(node =>
      selectedItems.includes(node)
        ? `<strong class="text-success">${node}</strong>` // Highlight visited goals
        : node
    )
    .join(" → ");

  // Display the result with the shortest path and total cost
  const output = `
    <div class="card">
      <div class="card-header">Shortest Path</div>
      <div class="card-body">
        <p><strong>Path:</strong> ${highlightedPath}</p>
        <p><strong>Total Cost:</strong> ${result.cost}</p>
      </div>
    </div>`;
  document.getElementById("result").innerHTML = output;

  highlightVisitedLinks(result.path); // Highlight the path in the D3 graph
});

// Function to highlight visited links in the D3 graph
function highlightVisitedLinks(path) {
  d3.selectAll(".link").classed("visited", false); // Reset all link highlights
  for (let i = 0; i < path.length - 1; i++) {
    d3.selectAll(".link")
      .filter(d => d.source.id === path[i] && d.target.id === path[i + 1]) // Match path segments
      .classed("visited", true); // Highlight the link
  }
}

// D3 graph data and visualization setup
const d3Graph = {
  nodes: [
    { id: "Entrance" },
    { id: "Dairy" },
    { id: "Fruits" },
    { id: "Vegetables" },
    { id: "Bakery" },
    { id: "Snacks" },
    { id: "Frozen" },
    { id: "Meat" },
    { id: "Beverages" }
  ],
  links: [
    { source: "Entrance", target: "Dairy", weight: 2 },
    { source: "Entrance", target: "Fruits", weight: 4 },
    { source: "Entrance", target: "Vegetables", weight: 3 },
    { source: "Dairy", target: "Bakery", weight: 1 },
    { source: "Dairy", target: "Snacks", weight: 5 },
    { source: "Fruits", target: "Vegetables", weight: 1 },
    { source: "Fruits", target: "Frozen", weight: 7 },
    { source: "Vegetables", target: "Meat", weight: 2 },
    { source: "Bakery", target: "Meat", weight: 3 },
    { source: "Bakery", target: "Beverages", weight: 2 },
    { source: "Snacks", target: "Beverages", weight: 3 },
    { source: "Frozen", target: "Meat", weight: 4 },
    { source: "Meat", target: "Beverages", weight: 1 }
  ]
};

const width = 800;
const height = 600;

// Set up D3 SVG canvas
const svg = d3.select("svg");

svg.append("defs").append("marker")
  .attr("id", "arrowhead")
  .attr("viewBox", "0 -5 10 10")
  .attr("refX", 15)
  .attr("refY", 0)
  .attr("markerWidth", 10)
  .attr("markerHeight", 10)
  .attr("orient", "auto")
  .append("path")
  .attr("d", "M0,-5L10,0L0,5")
  .attr("fill", "#4b4b4b"); // Default arrow color

// Configure D3 forces for graph layout
const simulation = d3.forceSimulation(d3Graph.nodes)
  .force("link", d3.forceLink(d3Graph.links).id(d => d.id).distance(100))
  .force("charge", d3.forceManyBody().strength(-500))
  .force("center", d3.forceCenter(width / 2, height / 2));

// Add links to the SVG canvas
const link = svg.append("g")
  .selectAll(".link")
  .data(d3Graph.links)
  .enter()
  .append("line")
  .attr("class", "link")
  .attr("marker-end", "url(#arrowhead)");

// Add nodes to the SVG canvas
const node = svg.append("g")
  .selectAll(".node")
  .data(d3Graph.nodes)
  .enter()
  .append("g")
  .attr("class", "node")
  .call(d3.drag()
    .on("start", dragStarted)
    .on("drag", dragged)
    .on("end", dragEnded));

node.append("circle")
  .attr("r", 20)
  .attr("fill", "lightblue");

node.append("text")
  .attr("dy", -30)
  .text(d => d.id);

// Add weight labels to edges
const edgeLabels = svg.append("g")
  .selectAll(".label")
  .data(d3Graph.links)
  .enter()
  .append("text")
  .attr("class", "label")
  .text(d => d.weight);

// Update positions on simulation tick
simulation.on("tick", () => {
  link.attr("x1", d => d.source.x)
    .attr("y1", d => d.source.y)
    .attr("x2", d => d.target.x)
    .attr("y2", d => d.target.y);

  node.attr("transform", d => `translate(${d.x},${d.y})`);

  edgeLabels.attr("x", d => (d.source.x + d.target.x) / 2)
    .attr("y", d => (d.source.y + d.target.y) / 2);
});

// Drag event handlers for nodes
function dragStarted(event, d) {
  if (!event.active) simulation.alphaTarget(0.3).restart();
  d.fx = d.x;
  d.fy = d.y;
}

function dragged(event, d) {
  d.fx = event.x;
  d.fy = event.y;
}

function dragEnded(event, d) {
  if (!event.active) simulation.alphaTarget(0);
  d.fx = null;
  d.fy = null;
}
