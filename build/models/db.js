"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose_1 = __importDefault(require("mongoose"));
var uri = '';
if (process.env.NODE_ENV === 'production' && process.env.MONGODB_URI) {
    uri = process.env.MONGODB_URI;
}
else if (process.env.MONGODB_URI) {
    uri = process.env.MONGODB_URI;
}
if (uri) {
    mongoose_1.default.connect(uri, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true });
}
mongoose_1.default.connection.on('connected', function () {
    console.log("======================");
    console.log("======================");
    console.log("Mongoose connected to " + uri);
    console.log("======================");
    console.log("======================");
});
mongoose_1.default.connection.on('error', function (err) {
    console.log("Mongoose connection error: " + err);
});
mongoose_1.default.connection.on('disconnected', function () {
    console.log('Mongoose disconnected');
});
var shutdown = function (msg, callback) {
    mongoose_1.default.connection.close(function () {
        console.log("Mongoose disconnected through " + msg);
        callback();
    });
};
process.once('SIGUSR2', function () {
    shutdown('nodemon restart', function () {
        process.kill(process.pid, 'SIGUSR2');
    });
});
process.on('SIGINT', function () {
    shutdown('app termination', function () {
        process.exit(0);
    });
});
process.on('SIGTERM', function () {
    shutdown('Heroku app shutdown', function () {
        process.exit(0);
    });
});
require("./message.model");
require("./user.model");
//# sourceMappingURL=db.js.map