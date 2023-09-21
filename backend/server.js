const express = require("express");
const cors = require("cors");
const http = require("http");
const path = require("path");
const fs = require("fs");
const { Server } = require("socket.io");

const app = express();
app.use(cors());

app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend/public")));
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"],
  },
});

let vehicleData = [
  { id: 1, status: "moving", coordinates: [23.8103, 90.4125], distance: 0 },
  { id: 2, status: "idle", coordinates: [23.8103, 90.4125], distance: 0 },
  { id: 3, status: "idle", coordinates: [23.8103, 90.4125], distance: 0 },
  { id: 4, status: "idle", coordinates: [23.8103, 90.4125], distance: 0 },
  { id: 5, status: "idle", coordinates: [23.8103, 90.4125], distance: 0 },
];

io.on("connection", (socket) => {
  console.log("a user connected");
  socket.on("updateVehicle", (data) => {
    let vehicle = vehicleData.find((v) => v.id === data.id);
    if (vehicle) {
      vehicle.status = data.status;
      vehicle.coordinates = data.coordinates;
      vehicle.distance = data.distance;

      // Broadcast the update to all clients
      io.emit("vehicleUpdated", vehicle);
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

app.get("/vehicles", (req, res) => {
  res.json(vehicleData);
});

app.get("/socket.io/socket.io.js", (req, res) => {
  res.sendFile(
    path.resolve(
      __dirname,
      "node_modules/socket.io/client-dist/socket.io.min.js"
    )
  );
});

app.post("/update-vehicle", (req, res) => {
  let { id, status, coordinates, distance } = req.body;

  let vehicle = vehicleData.find((v) => v.id === id);
  if (vehicle) {
    vehicle.status = status;
    vehicle.coordinates = coordinates;
    vehicle.distance = distance;

    res.json({ message: "Vehicle data updated successfully", vehicle });
  } else {
    res.status(404).json({ message: "Vehicle not found" });
  }
});

const PORT = 3000;

server.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
});

function calculateDistance(coord1, coord2) {
  function toRad(value) {
    return (value * Math.PI) / 180;
  }

  var lat1 = coord1[0];
  var lon1 = coord1[1];
  var lat2 = coord2[0];
  var lon2 = coord2[1];

  var R = 6371; // Radius of Earth in kilometers
  var dLat = toRad(lat2 - lat1);
  var dLon = toRad(lon2 - lon1);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c;
  
  return d;
}



function simulateUpdates() {
  setInterval(() => {
    vehicleData.forEach((vehicle) => {
      // Save previous coordinates
      let prevCoordinates = [...vehicle.coordinates];

      // Generate small random changes in latitude and longitude
      const latitudeChange = (Math.random() * 0.01 - 0.005) / 2;
      const longitudeChange = (Math.random() * 0.01 - 0.005) / 2;

      // Calculate the potential new coordinates
      const newLatitude = vehicle.coordinates[0] + latitudeChange;
      const newLongitude = vehicle.coordinates[1] + longitudeChange;

      // Check if the potential new coordinates exceed 40 km
      const distance = calculateDistance(prevCoordinates, [newLatitude, newLongitude]);

      if (distance <= 40) {
        // Update the coordinates
        vehicle.coordinates[0] = newLatitude;
        vehicle.coordinates[1] = newLongitude;

        // Randomly update the status
        vehicle.status = Math.random() > 0.5 ? "moving" : "idle";

        // Calculate the distance using the Haversine formula and add to the total distance
        vehicle.distance += distance;

        // Emit the updated vehicle data
        io.emit("vehicleUpdated", vehicle);
      }
      // If the potential new coordinates exceed 40 km, do nothing
    });
  }, 3000); // Change interval as needed
}

simulateUpdates()