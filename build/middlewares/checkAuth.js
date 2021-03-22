"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatAuth = void 0;
var jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
var chatAuth = function (req, res, next) {
    try {
        //req.headers['x-access-token'] || req.headers.authorization;
        var t = req.headers['x-access-token'];
        var token = req.headers.authorization;
        if (token && token.startsWith('Bearer ')) {
            token = token.split(' ')[1];
        }
        var decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_KEY);
        //console.log(decoded);
        req.decoded = decoded;
        next();
    }
    catch (e) {
        console.log(e);
        return res.statusJson(401, { message: 'Auth failed' });
    }
};
exports.chatAuth = chatAuth;
//# sourceMappingURL=checkAuth.js.map