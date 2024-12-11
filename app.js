var express = require("express");
const expressWs = require("express-ws");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var cors = require("cors");
var app = express();
expressWs(app);

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
var authRouter = require("./routes/auth");
var productRouter = require("./routes/product");
var salesRouter = require("./routes/sales");
var expenseRouter = require("./routes/expense");
var ntRouter = require("./routes/notification");
var storeRouter = require("./routes/web/index");

const allowOrigin = [
  "http://localhost:9150",
  "http://localhost:9000",
  "http://localhost:3000",
  "https://f-store-demo.netlify.app",
];

// custom cors
app.use((req, res, next) => {

  const origin = req.headers.origin ;

  if (origin && allowOrigin.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }
  res.setHeader("Access-Control-Allow-Credentials", true);

  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Handle OPTIONS request
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

app.use(logger("dev"));

app.use(express.json());

app.use(express.urlencoded({ extended: false }));

app.use(cookieParser());

app.use("/api/assets", express.static(path.join(__dirname, "public")));

const { Users } = require("./models");

const wsClient = new Map();

const adminWsClient = new Map();

app.ws("/api/ws", async (ws, req) => {
  console.log("connected for one client");

  const token = req.cookies.authKey; // Access the token

  const user = await Users.findOne({ where: { auth_key: token } });

  if (!user) {
    ws.close(1008, "Authentication token required"); // 1008: Policy Violation
    return;
  }

  if (user.admin) {
    if (adminWsClient.has(token)) {
      adminWsClient.get(token).close();
      adminWsClient.delete(token);
    }

    adminWsClient.set(token, ws);
  }

  if (wsClient.has(token)) {
    wsClient.get(token).close();
    wsClient.delete(token);
  }

  wsClient.set(token, ws);

  // Handle WebSocket close event
  ws.on("close", () => {
    console.log(`Client with token ${token} disconnected`);
    wsClient.delete(token); // Clean up
  });

  // Optional: Handle WebSocket error event
  ws.on("error", (err) => {
    console.error(`WebSocket error for token ${token}:`, err);
    wsClient.delete(token);
  });
});

app.use((req, res, next) => {
  req.wsClients = wsClient;
  req.adminWsClients = adminWsClient;
  next();
});

app.use("/", indexRouter);

app.use("/api/users", usersRouter);

app.use("/api/auth/", authRouter);

app.use("/api/products/", productRouter);

app.use("/api/sales", salesRouter);

app.use("/api/expenses", expenseRouter);

app.use("/api/notification", ntRouter);

app.use("/api/store/", storeRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  res.sendStatus(404);
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.send(err.message);
});

app.listen(3000, () => {});
module.exports = app;
