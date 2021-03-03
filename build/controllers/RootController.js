"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
var index_1 = require("./decorators/index");
var RootController = /** @class */ (function () {
    function RootController() {
    }
    RootController.prototype.getRootPage = function (req, res) {
        res.render('index', { title: 'Chat App' });
    };
    RootController.prototype.getChatRoomsPage = function (req, res) {
        res.render('chatroom', { title: 'Chat App' });
    };
    RootController.prototype.getChatRoomPage = function (req, res) {
        res.render('chatroom', { title: 'Chat App' });
    };
    RootController.prototype.getLoginPage = function (req, res) {
        res.render('login', { title: 'Chat App' });
    };
    RootController.prototype.getSignupPage = function (req, res) {
        res.render('signup', { title: 'Chat App' });
    };
    __decorate([
        index_1.get('/'),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object, Object]),
        __metadata("design:returntype", void 0)
    ], RootController.prototype, "getRootPage", null);
    __decorate([
        index_1.get('/chatrooms'),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object, Object]),
        __metadata("design:returntype", void 0)
    ], RootController.prototype, "getChatRoomsPage", null);
    __decorate([
        index_1.get('/chatroom/:receiver'),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object, Object]),
        __metadata("design:returntype", void 0)
    ], RootController.prototype, "getChatRoomPage", null);
    __decorate([
        index_1.get('/auth/login'),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object, Object]),
        __metadata("design:returntype", void 0)
    ], RootController.prototype, "getLoginPage", null);
    __decorate([
        index_1.get('/auth/signup'),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object, Object]),
        __metadata("design:returntype", void 0)
    ], RootController.prototype, "getSignupPage", null);
    RootController = __decorate([
        index_1.controller('')
    ], RootController);
    return RootController;
}());
//# sourceMappingURL=RootController.js.map