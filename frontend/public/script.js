let map = L.map("map").setView([51.505, -0.09], 13);

// L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
//   attribution:
//     '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
// }).addTo(map);
L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  {
    attribution: "Tiles &copy; Esri",
  }
).addTo(map);
let vehicleDistanceChartData = {};
let vehicleDistanceChart;

google.charts.load("current", { packages: ["corechart"] });
google.charts.setOnLoadCallback(initializeChart);

function initializeChart() {
  vehicleDistanceChart = new google.visualization.LineChart(
    document.getElementById("vehicleDistanceChart")
  );
  drawChart([]);
}

// function drawChart(data) {
//   let dataTable = new google.visualization.DataTable();
//   dataTable.addColumn("datetime", "Time");
//   dataTable.addColumn("number", "Distance");
//   dataTable.addRows(data);

//   let options = {
//     title: "Vehicle Distance Over Time",
//     curveType: "function",
//     legend: { position: "bottom" },
//     hAxis: { title: "Time" },
//     vAxis: { title: "Distance" },
//   };

//   vehicleDistanceChart.draw(dataTable, options);
// }

// function updateVehicleDistanceChart(vehicle) {
//   let currentTime = new Date();

//   if (!vehicleDistanceChartData[vehicle.id]) {
//     vehicleDistanceChartData[vehicle.id] = [];
//   }

//   vehicleDistanceChartData[vehicle.id].push([currentTime, vehicle.distance]);

//   drawChart(vehicleDistanceChartData[vehicle.id]);
// }

function drawChart(data) {
  if (data.length === 0) {
    return; // Return early if data is empty
  }
  let dataTable = new google.visualization.DataTable();

  dataTable.addColumn("datetime", "Time");

  // Find unique vehicle IDs
  let vehicleIds = [...new Set(data.map((item) => item[2]))]; // Changed item[0] to item[2] to get vehicleId

  // Add a data column for each vehicle
  vehicleIds.forEach((vehicleId) => {
    dataTable.addColumn("number", `Vehicle ${vehicleId}`);
  });

  // Group data by time
  let groupedData = data.reduce((acc, [time, distance, vehicleId]) => {
    if (!acc[time]) {
      acc[time] = { time, distances: {} };
    }
    acc[time].distances[vehicleId] = distance;
    return acc;
  }, {});

  // Convert grouped data to rows
  let rows = Object.values(groupedData).map(({ time, distances }) => {
    let row = [new Date(time)]; // Convert string time to Date object
    vehicleIds.forEach((vehicleId) => {
      row.push(distances[vehicleId] || null); // Ensure a value (even if null) is pushed for every vehicle
    });
    return row;
  });

  dataTable.addRows(rows);

  let options = {
    title: "Vehicle Distance Over Time",
    curveType: "function",
    legend: { position: "bottom" },
    hAxis: { title: "Time" },
    vAxis: { title: "Distance" },
  };

  vehicleDistanceChart.draw(dataTable, options);
}

function updateVehicleDistanceChart(vehicle) {
  let currentTime = new Date();

  if (!vehicleDistanceChartData[vehicle.id]) {
    vehicleDistanceChartData[vehicle.id] = [];
  }

  vehicleDistanceChartData[vehicle.id].push([
    currentTime.toISOString(),
    vehicle.distance,
    vehicle.id,
  ]); // Added vehicle.id to the data

  // Collect data from all vehicles
  let allVehicleData = [];
  for (let vehicleId in vehicleDistanceChartData) {
    allVehicleData.push(...vehicleDistanceChartData[vehicleId]);
  }

  drawChart(allVehicleData);
}

document.addEventListener("DOMContentLoaded", (event) => {
  let socket = io.connect("https://mini-vehicle-tracking-system.onrender.com");

  socket.on("vehicleUpdated", (data) => {
    updateVehicleData(data);
  });

  fetch("https://mini-vehicle-tracking-system.onrender.com/vehicles")
    .then((response) => response.json())
    .then((data) => {
      data.forEach((vehicle) => {
        addVehicleToMap(vehicle);
        addVehicleToList(vehicle);

        // updateTable(data);
      });
    })
    .catch((error) => {
      console.error("Error fetching vehicles:", error);
    });

  document
    .getElementById("filter-moving")
    .addEventListener("change", updateFilters);
  document
    .getElementById("filter-idle")
    .addEventListener("change", updateFilters);
});

let vehicleMarkers = {};
let vehicleListItems = {};

function updateVehicleData(vehicle) {
  // Find the vehicle marker and list item and update them with the new data
  let marker = vehicleMarkers[vehicle.id];
  let listItem = vehicleListItems[vehicle.id];

  if (marker) {
    marker.setLatLng(vehicle.coordinates);
    marker.bindPopup(
      `Vehicle ID: ${vehicle.id}<br>Status: ${vehicle.status}<br>Distance: ${vehicle.distance}`
    );
    marker.vehicleData = vehicle;
  }

  if (listItem) {
    listItem.innerHTML = `Vehicle ID: ${vehicle.id} <span>Status: ${vehicle.status}</span> <span>Distance: ${vehicle.distance} km</span>`;
    listItem.vehicleData = vehicle;
  }
  updateVehicleDistanceChart(vehicle);

  // Also, update the table here with the latest data
  fetch("https://mini-vehicle-tracking-system.onrender.com/vehicles")
    .then((response) => response.json())
    .then((data) => {
      const filterMovingCheckbox = document.getElementById("filter-moving");
      const filterIdleCheckbox = document.getElementById("filter-idle");

      // Check the checkboxes based on some condition (you can customize this)
      if (
        filterMovingCheckbox.checked === true ||
        filterIdleCheckbox.checked === true
      ) {
        applyFilters();
      } else {
        updateTable(data);
      }
    })
    .catch((error) => {
      console.error("Error fetching vehicles:", error);
    });
}

function addVehicleToMap(vehicle) {
  let marker = L.marker(vehicle.coordinates).addTo(map);
  marker.vehicleData = vehicle;
  
  marker.bindTooltip(`Vehicle ID: ${vehicle.id}`, { permanent: true, direction: 'top' }).openTooltip();
  
  marker.bindPopup(
    `Vehicle ID: ${vehicle.id}<br>Status: ${vehicle.status}<br>Distance: ${vehicle.distance}`
  );
  vehicleMarkers[vehicle.id] = marker;
}
// Assuming data is an array of objects with properties: vehicleID, status, and distance
function updateTable(data) {
  const tbody = document.querySelector("#vehicle-list tbody");
  tbody.innerHTML = ""; // Clear the existing rows

  data.forEach((item) => {
    const row = document.createElement("tr");

    const cell1 = document.createElement("td");
    cell1.style.width = "30%"; // Apply styles to the new td elements
    cell1.textContent = item.id; // Changed vehicleID to id

    const cell2 = document.createElement("td");
    cell2.style.width = "40%"; // Apply styles to the new td elements
    cell2.textContent = item.status;

    const cell3 = document.createElement("td");
    cell3.style.width = "30%"; // Apply styles to the new td elements
    cell3.textContent = item.distance; // Removed km as it is now appended in list item

    row.appendChild(cell1);
    row.appendChild(cell2);
    row.appendChild(cell3);

    tbody.appendChild(row);
  });
}
// function addVehicleToList(vehicle) {
//   let vehicleList = document.getElementById("vehicle-list");
//   let vehicleItem = document.createElement("div");
//   vehicleItem.className = "vehicle-item";
//   vehicleItem.vehicleData = vehicle;
//   vehicleItem.innerHTML = `Vehicle ID: ${vehicle.id} <span>Status: ${vehicle.status}</span> <span>Distance: ${vehicle.distance}</span>`;
//   vehicleList.appendChild(vehicleItem);
//   vehicleListItems[vehicle.id] = vehicleItem;
// }
function addVehicleToList(vehicle) {
  let vehicleList = document.querySelector("#vehicle-list tbody");
  let vehicleItem = document.createElement("tr");
  vehicleItem.vehicleData = vehicle;

  let vehicleIdCell = document.createElement("td");
  vehicleIdCell.textContent = vehicle.id;

  let vehicleStatusCell = document.createElement("td");
  vehicleStatusCell.textContent = vehicle.status;

  let vehicleDistanceCell = document.createElement("td");
  vehicleDistanceCell.textContent = vehicle.distance + " km";

  vehicleItem.appendChild(vehicleIdCell);
  vehicleItem.appendChild(vehicleStatusCell);
  vehicleItem.appendChild(vehicleDistanceCell);

  vehicleList.appendChild(vehicleItem);
  vehicleListItems[vehicle.id] = vehicleItem;
}

function applyFilters() {
  let showMoving = document.getElementById("filter-moving").checked;
  let showIdle = document.getElementById("filter-idle").checked;

  // for (let id in vehicleMarkers) {
  //   let vehicle = vehicleMarkers[id].vehicleData;
  //   let shouldShow =
  //     (showMoving && vehicle.status === "moving") ||
  //     (showIdle && vehicle.status === "idle");

  //   if (shouldShow) {
  //     vehicleMarkers[id].addTo(map);
  //     vehicleListItems[id].style.display = "";
  //   } else {
  //     vehicleMarkers[id].remove();
  //     vehicleListItems[id].style.display = "none";
  //   }
  // }

  let tableRows = document.querySelectorAll("#vehicle-list tbody tr");
  tableRows.forEach((row) => {
    let status = row.children[1].textContent.toLowerCase();
    let shouldShow =
      (showMoving && status === "moving") || (showIdle && status === "idle");

    if (shouldShow) {
      row.style.display = "";
    } else {
      row.style.display = "none";
    }
  });
}

function updateFilters() {
  applyFilters();
}
