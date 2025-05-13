// server.js
const express = require("express");
const bodyParser = require("body-parser");
const sequelize = require("./config/db");
const authRoutes = require("./routes/auth");
const authMiddleware = require("./middleware/authMiddleware");

// Routes
const userRoutes = require("./routes/user");
const bookingRoutes = require("./routes/booking");
const scheduleRoutes = require("./routes/schedule");
const complaintRoutes = require("./routes/complaint");
const adminRoutes = require("./routes/admin");

const app = express();
app.use(bodyParser.json());

// Use routes
app.use("/api/auth", authRoutes);
app.use("/api/users", authMiddleware, userRoutes);
app.use("/api/bookings", authMiddleware, bookingRoutes);
app.use("/api/schedules", authMiddleware, scheduleRoutes);
app.use("/api/complaints", authMiddleware, complaintRoutes);
app.use("/api/admins", authMiddleware, adminRoutes);

sequelize.sync({ alter: true }).then(() => {
  console.log("Database synced");
  app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
  });
});

// config/db.js
const { Sequelize } = require("sequelize");
const sequelize = new Sequelize("kbbs_db", "username", "password", {
  host: "localhost",
  dialect: "postgres",
});
module.exports = sequelize;

// models/index.js
const User = require("./User");
const Booking = require("./Booking");
const Schedule = require("./Schedule");
const Seat = require("./Seat");
const Bus = require("./Bus");
const Driver = require("./Driver");
const Complaint = require("./Complaint");
const Admin = require("./Admin");
const Route = require("./Route");

// Associations
User.hasMany(Booking, { foreignKey: "User_ID" });
Booking.belongsTo(User, { foreignKey: "User_ID" });

Schedule.hasMany(Booking, { foreignKey: "ScheduleID" });
Booking.belongsTo(Schedule, { foreignKey: "ScheduleID" });

Bus.hasMany(Schedule, { foreignKey: "Bus_ID" });
Schedule.belongsTo(Bus, { foreignKey: "Bus_ID" });

Route.hasMany(Schedule, { foreignKey: "RouteID" });
Schedule.belongsTo(Route, { foreignKey: "RouteID" });

Bus.belongsTo(Driver, { foreignKey: "Driver_ID" });

Schedule.hasMany(Seat, { foreignKey: "Bus_ID" });

Booking.belongsToMany(Seat, { through: "Booking_Seat" });
Seat.belongsToMany(Booking, { through: "Booking_Seat" });

User.hasMany(Complaint, { foreignKey: "User_ID" });
Complaint.belongsTo(User, { foreignKey: "User_ID" });

Complaint.belongsTo(Booking, { foreignKey: "Booking_ID" });
Complaint.belongsTo(Admin, { foreignKey: "Admin_ID" });

module.exports = {
  User,
  Booking,
  Schedule,
  Seat,
  Bus,
  Driver,
  Complaint,
  Admin,
  Route,
};
