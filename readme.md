# Mini Vehicle Tracking Dashboard

## Objective

The Mini Vehicle Tracking Dashboard is a simple web-based application designed to display real-time information about multiple vehicles. It allows users to visualize the positions and statuses of vehicles on a map. This README file provides an overview of the project, its requirements, and how to set it up.


## Getting Started

- To set up the backend dependencies, use the command `npm i`.

- To run the development server, use the command `npm run dev`.

- If you are running your server locally, access the project by visiting `localhost:3000` in your web browser.

**Note:** If you are running your server locally and want to test the project locally, make sure to change the URL from `https://mini-vehicle-tracking-system.onrender.com` to `http://localhost:3000` in the `index.html` and `script.js` files where the URL needs to be updated.




## Requirements

### Front-end

- HTML, CSS, and JavaScript are used to create the user interface.
- The application displays a map with vehicle markers.
- A list of vehicles and their current statuses (e.g., moving, idle) is presented.

### Back-end 

- The back-end is implemented in Node.js.
- It provides mock APIs for the front-end to update vehicle positions and statuses.

### Real-time Updates

- Real-time updates are achieved using socketio real-time technology.
- Vehicle markers and statuses on the map are updated dynamically.

### Filters

- Filters are implemented to allow users to view vehicles that meet specific conditions (e.g., moving, idle).

### graph

- A  eature includes a simple graph or chart that displays metrics like the distance covered by each vehicle over time.





