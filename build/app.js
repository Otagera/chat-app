"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sids = exports.io = void 0;
var express_1 = __importDefault(require("express"));
var http_errors_1 = __importDefault(require("http-errors"));
var path_1 = __importDefault(require("path"));
var cookie_parser_1 = __importDefault(require("cookie-parser"));
var morgan_1 = __importDefault(require("morgan"));
var dotenv_1 = __importDefault(require("dotenv"));
var http = __importStar(require("http"));
var socketio = __importStar(require("socket.io"));
dotenv_1.default.config();
var app = express_1.default();
/**
 * Create HTTP server.
 */
var server = http.createServer(app);
exports.io = new socketio.Server();
exports.io.attach(server);
// view engine setup
app.set('views', path_1.default.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(morgan_1.default('dev'));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: false }));
app.use(cookie_parser_1.default());
app.use(express_1.default.static(path_1.default.join(__dirname, 'public')));
app.use(function (req, res, next) {
    res.statusJson = function (statusCode, data) {
        var obj = __assign(__assign({}, data), { statusCode: statusCode });
        res.status(statusCode).json(obj);
        return;
    };
    next();
});
var AppRouter_1 = require("./AppRouter");
app.use(AppRouter_1.AppRouter.getInstance());
require("./models/db");
require("./controllers/RootController");
require("./controllers/APIController");
require("./controllers/AuthController");
// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(http_errors_1.default(404));
});
// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    // render the error page
    res.status(err.status || 500);
    res.render('error');
});
//map having my sockets id maps to the names of users involved in that conversation.
exports.sids = new Map();
//io related issues
exports.io.on('connection', function (socket) {
    var onlineStatus;
    console.log('connection', socket.id);
    socket.emit('status', { id: socket.id });
    socket.on('registerId', function (info) {
        //with this operation, it deletes every other instance of conversaion between this two persons,
        //its don so that the map doesnt get crowded if the user keeps creating different instances (tabs, devices)
        //but of course i could try to change it and allow 2 instance only, so it doesnt get crowded.
        exports.sids.forEach(function (usernames, id) {
            if (usernames.receiver === info.usernames.receiver && usernames.sender === info.usernames.sender) {
                exports.sids.delete(id);
            }
        });
        exports.sids.set(info.socketId, info.usernames);
        onlineStatus = {
            username: info.usernames.sender,
            online: true
        };
        exports.io.emit('online', onlineStatus);
    });
    socket.on('disconnect', function () {
        console.log('Disconnect', socket.id);
        var usernames = exports.sids.get(socket.id);
        if (usernames) {
            onlineStatus = {
                username: usernames.sender,
                online: false
            };
            exports.io.emit('online', onlineStatus);
        }
        exports.sids.delete(socket.id);
    });
});
/*
  //io
  export const sids = new Map<string, string>();
  io.on('connection', (socket: socketio.Socket)=>{
    let onlineStatus: SendOnline;
    console.log('connection', socket.id);
    socket.emit('status', { id: socket.id });

    socket.on('registerId', (info: SendInfo)=>{
      sids.set(info.username, info.id);
      onlineStatus = {
        username: info.username,
        online: true
      };
      console.log(sids);
      io.emit('online', onlineStatus);
    });

    socket.on('disconnect', ()=>{
      console.log('Disconnect', socket.id);
      sids.forEach((value: string, key: string)=>{
        console.log(value, key);
        if(value === socket.id){
          onlineStatus = {
            username: key,
            online: false
          };
          io.emit('online', onlineStatus);
        }
      });
    });
  });
 */
/**
 * Module dependencies.
 */
var debug = require('debug')('chatapp:server');
/**
 * Get port from environment and store in Express.
 */
var port = normalizePort(process.env.PORT || '3000');
app.set('port', port);
/**
 * Listen on provided port, on all network interfaces.
 */
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);
/**
 * Normalize a port into a number, string, or false.
 */
function normalizePort(val) {
    var port = parseInt(val, 10);
    if (isNaN(port)) {
        // named pipe
        return val;
    }
    if (port >= 0) {
        // port number
        return port;
    }
    return false;
}
/**
 * Event listener for HTTP server "error" event.
 */
function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }
    var bind = typeof port === 'string'
        ? 'Pipe ' + port
        : 'Port ' + port;
    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
}
/**
 * Event listener for HTTP server "listening" event.
 */
function onListening() {
    var addr = server.address();
    var bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : (addr) ? 'port ' + addr.port : '';
    debug('Listening on ' + bind);
    console.log("=============");
    console.log("=============");
    console.log("App is listening from port: " + port);
}
//# sourceMappingURL=app.js.map