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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var cryptr_1 = __importDefault(require("cryptr"));
var index_1 = require("./decorators/index");
var app_1 = require("../app");
var mongoose_1 = __importDefault(require("mongoose"));
var app_2 = require("../app");
var Message = mongoose_1.default.model('Message');
var UserModel = mongoose_1.default.model('User');
var cryptr = new cryptr_1.default(process.env.CRYPTR_KEY);
var APIController = /** @class */ (function () {
    function APIController() {
    }
    APIController.prototype.getAllMessages = function (req, res) {
        var _this = this;
        var options = {
            page: 1,
            limit: 10,
            sort: { timeSent: 1 },
        };
        Message.paginate({}, options, function (err, result) {
            console.log(result);
        });
        var msgRedisKey = "messages";
        try {
            app_1.redisClient.get(msgRedisKey, function (err, messages) { return __awaiter(_this, void 0, void 0, function () {
                var data;
                return __generator(this, function (_a) {
                    if (err)
                        throw err;
                    if (messages) {
                        data = { source: 'cache', messages: JSON.parse(messages) };
                        return [2 /*return*/, res.statusJson(200, { data: data })];
                    }
                    else {
                        Message.find({}, 'message timeSent sender receiver', { lean: true })
                            .exec()
                            .then(function (messages) {
                            if (!messages) {
                                return res.statusJson(404, { data: { message: 'Empty' } });
                            }
                            for (var i = 0; i < messages.length; i++) {
                                messages[i].message = cryptr.decrypt(messages[i].message);
                            }
                            app_1.redisClient.setex(msgRedisKey, 3600, JSON.stringify(messages));
                            var data = { source: 'db', messages: messages };
                            return res.statusJson(200, { data: data });
                        }).catch(function (err) {
                            var data = { message: err.messgae };
                            if (err) {
                                return res.statusJson(500, { data: data });
                            }
                        });
                    }
                    return [2 /*return*/];
                });
            }); });
        }
        catch (err) {
            var data = { message: err.messgae };
            if (err) {
                return res.statusJson(500, { data: data });
            }
        }
    };
    APIController.prototype.getSenderReceiverMessage = function (req, res) {
        var _this = this;
        var _a = req.params, sender = _a.sender, receiver = _a.receiver;
        var msgRedisKey = "msgs-sender:" + sender + "-receiver:" + receiver;
        var findMesage = function () {
            Message.find({ $and: [{ 'sender': { $in: [sender, receiver] } }, { 'receiver': { $in: [sender, receiver] } }] })
                .exec()
                .then(function (messages) { return __awaiter(_this, void 0, void 0, function () {
                var i, _a, _b, err_1, data_1, data;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            if (!messages) {
                                return [2 /*return*/, res.statusJson(404, { data: { message: 'Empty' } })];
                            }
                            i = 0;
                            _c.label = 1;
                        case 1:
                            if (!(i < messages.length)) return [3 /*break*/, 7];
                            if (!(!messages[i].read && messages[i].receiver === sender)) return [3 /*break*/, 5];
                            _c.label = 2;
                        case 2:
                            _c.trys.push([2, 4, , 5]);
                            messages[i].read = true;
                            _a = messages;
                            _b = i;
                            return [4 /*yield*/, messages[i].save()];
                        case 3:
                            _a[_b] = _c.sent();
                            return [3 /*break*/, 5];
                        case 4:
                            err_1 = _c.sent();
                            data_1 = { err: err_1 };
                            if (err_1) {
                                return [2 /*return*/, res.statusJson(500, { data: data_1 })];
                            }
                            return [3 /*break*/, 5];
                        case 5:
                            messages[i].message = cryptr.decrypt(messages[i].message);
                            _c.label = 6;
                        case 6:
                            i++;
                            return [3 /*break*/, 1];
                        case 7:
                            app_1.redisClient.setex(msgRedisKey, 3600, JSON.stringify(messages));
                            data = { source: 'db', messages: messages };
                            return [2 /*return*/, res.statusJson(200, { data: data })];
                    }
                });
            }); }).catch(function (err) {
                var data = { message: err.messgae };
                if (err) {
                    return res.statusJson(500, { data: data });
                }
            });
        };
        try {
            app_1.redisClient.get(msgRedisKey, function (err, messages) { return __awaiter(_this, void 0, void 0, function () {
                var data;
                return __generator(this, function (_a) {
                    if (err)
                        throw err;
                    if (messages) {
                        data = { source: 'cache', messages: JSON.parse(messages) };
                        return [2 /*return*/, res.statusJson(200, { data: data })];
                    }
                    else {
                        findMesage();
                    }
                    return [2 /*return*/];
                });
            }); });
        }
        catch (err) {
            var data = { message: err.messgae };
            if (err) {
                return res.statusJson(500, { data: data });
            }
        }
    };
    APIController.prototype.sendMessage = function (req, res) {
        var _this = this;
        var _a = req.body, msg = _a.msg, sender = _a.sender, receiver = _a.receiver;
        var receiverInChatroom = function () {
            var inChatroom = false;
            app_2.sids.forEach(function (usernames, id) {
                if (usernames.receiver === sender && usernames.sender === receiver) {
                    inChatroom = true;
                }
            });
            return inChatroom;
        };
        var message = {
            message: cryptr.encrypt(msg),
            sender: sender,
            receiver: receiver,
            read: receiverInChatroom()
        };
        var chainIO = function (_a) {
            var localIO = _a.localIO, socketsToSendTo = _a.socketsToSendTo;
            app_2.sids.forEach(function (usernames, id) {
                if ((usernames.receiver === receiver && usernames.sender === sender) || (usernames.receiver === sender && usernames.sender === receiver)) {
                    socketsToSendTo = true;
                    //chain rooms based on the users id
                    localIO = localIO.to(id);
                }
            });
            app_2.onlines.forEach(function (onlineInfo, id) {
                if ((onlineInfo.username === receiver) || (onlineInfo.username === sender)) {
                    socketsToSendTo = true;
                    //chain rooms based on the users id
                    localIO = localIO.to(id);
                }
            });
            return { localIO: localIO, socketsToSendTo: socketsToSendTo };
        };
        var emitter = function (_a, dataToSend) {
            var localIO = _a.localIO, socketsToSendTo = _a.socketsToSendTo;
            if (socketsToSendTo) {
                localIO.emit('send-msg', dataToSend);
            }
        };
        var findUserUpdateConversation = function () {
            UserModel.find({ 'username': { $in: [sender, receiver] } })
                .exec()
                .then(function (users) { return __awaiter(_this, void 0, void 0, function () {
                var _loop_1, i, state_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (users.length < 1) {
                                return [2 /*return*/, res.statusJson(401, { data: { message: 'Not found' } })];
                            }
                            _loop_1 = function (i) {
                                var localWithWho_1, localConvos, receiverConvo, senderConvo, convoExist, j, _a, _b, err_2, data;
                                return __generator(this, function (_c) {
                                    switch (_c.label) {
                                        case 0:
                                            _c.trys.push([0, 2, , 3]);
                                            localWithWho_1 = (users[i].username === sender) ? receiver : sender;
                                            localConvos = users[i].conversations;
                                            receiverConvo = { withWho: localWithWho_1, unreadMsgs: 1 };
                                            senderConvo = { withWho: localWithWho_1, unreadMsgs: 0 };
                                            if (localConvos.length < 1) {
                                                if (users[i].username === receiver) {
                                                    localConvos.push(receiverConvo);
                                                }
                                                else {
                                                    localConvos.push(senderConvo);
                                                }
                                            }
                                            else {
                                                convoExist = localConvos.some(function (convo) {
                                                    return convo.withWho === localWithWho_1;
                                                });
                                                if (!convoExist) {
                                                    if (users[i].username === receiver) {
                                                        localConvos.push(receiverConvo);
                                                    }
                                                    else {
                                                        localConvos.push(senderConvo);
                                                    }
                                                }
                                                else {
                                                    for (j = 0; j < localConvos.length; j++) {
                                                        if (localConvos[j].withWho === localWithWho_1 && users[i].username === receiver) {
                                                            localConvos[j].unreadMsgs += 1;
                                                        }
                                                    }
                                                }
                                            }
                                            users[i].conversations = localConvos;
                                            _a = users;
                                            _b = i;
                                            return [4 /*yield*/, users[i].save()];
                                        case 1:
                                            _a[_b] = _c.sent();
                                            return [3 /*break*/, 3];
                                        case 2:
                                            err_2 = _c.sent();
                                            data = { err: err_2 };
                                            if (err_2) {
                                                return [2 /*return*/, { value: res.statusJson(500, { data: data }) }];
                                            }
                                            return [3 /*break*/, 3];
                                        case 3: return [2 /*return*/];
                                    }
                                });
                            };
                            i = 0;
                            _a.label = 1;
                        case 1:
                            if (!(i < users.length)) return [3 /*break*/, 4];
                            return [5 /*yield**/, _loop_1(i)];
                        case 2:
                            state_1 = _a.sent();
                            if (typeof state_1 === "object")
                                return [2 /*return*/, state_1.value];
                            _a.label = 3;
                        case 3:
                            i++;
                            return [3 /*break*/, 1];
                        case 4: return [2 /*return*/];
                    }
                });
            }); })
                .catch(function (err) {
                throw new Error(err);
            });
        };
        var deleteCache = function () {
            var msgRedisKeySR = "msgs-sender:" + sender + "-receiver:" + receiver;
            var msgRedisKeyRS = "msgs-sender:" + receiver + "-receiver:" + sender;
            var msgRedisKeyRRecent = "lstActiveConvo-username:" + sender;
            var msgRedisKeySRecent = "lstActiveConvo-username:" + receiver;
            try {
                app_1.redisClient.get(msgRedisKeySR, function (err, messages) { return __awaiter(_this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        if (err || messages) {
                            app_1.redisClient.del(msgRedisKeySR);
                        }
                        return [2 /*return*/];
                    });
                }); });
                app_1.redisClient.get(msgRedisKeyRS, function (err, messages) { return __awaiter(_this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        if (err || messages) {
                            app_1.redisClient.del(msgRedisKeyRS);
                        }
                        return [2 /*return*/];
                    });
                }); });
                app_1.redisClient.get(msgRedisKeyRRecent, function (err, messages) { return __awaiter(_this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        if (err || messages) {
                            app_1.redisClient.del(msgRedisKeyRRecent);
                        }
                        return [2 /*return*/];
                    });
                }); });
                app_1.redisClient.get(msgRedisKeySRecent, function (err, messages) { return __awaiter(_this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        if (err || messages) {
                            app_1.redisClient.del(msgRedisKeySRecent);
                        }
                        return [2 /*return*/];
                    });
                }); });
            }
            catch (err) { }
        };
        Message.create(message).then(function (newMsg) {
            //emit only to the sender and the receiver so they both
            //can register it on their respoective screens.
            deleteCache();
            emitter(chainIO({
                localIO: app_1.io,
                socketsToSendTo: false
            }), {
                message: cryptr.decrypt(newMsg['message']),
                timeSent: newMsg['timeSent'],
                sender: newMsg['sender'],
                receiver: newMsg['receiver'],
                _id: newMsg['_id'],
            });
            findUserUpdateConversation();
            var data = { success: true };
            return res.statusJson(200, { data: data });
        }).catch(function (err) {
            var data = { err: err, success: false };
            return res.statusJson(500, { data: data });
        });
    };
    APIController.prototype.getLastMessagesOfConversations = function (req, res) {
        var _this = this;
        var username = req.params.username;
        var msgRedisKey = "lstActiveConvo-username:" + username;
        try {
            app_1.redisClient.get(msgRedisKey, function (err, messages) { return __awaiter(_this, void 0, void 0, function () {
                var data;
                var _this = this;
                return __generator(this, function (_a) {
                    if (err)
                        throw err;
                    data = {
                        source: '',
                        messages: []
                    };
                    if (JSON.parse(messages)) {
                        data.source = 'cache';
                        data.messages = JSON.parse(messages);
                        return [2 /*return*/, res.statusJson(200, { data: data })];
                    }
                    else {
                        UserModel.findOne({ 'username': username })
                            .exec()
                            .then(function (user) {
                            var promises = [];
                            user.conversations.forEach(function (convo) {
                                promises.push(new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
                                    var msg, err_3;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0:
                                                _a.trys.push([0, 2, , 3]);
                                                return [4 /*yield*/, Message.findOne({ $and: [{ 'sender': { $in: [username, convo.withWho] } }, { 'receiver': { $in: [username, convo.withWho] } }] }).sort({ timeSent: -1 })];
                                            case 1:
                                                msg = _a.sent();
                                                msg.message = cryptr.decrypt(msg.message);
                                                resolve(msg);
                                                return [3 /*break*/, 3];
                                            case 2:
                                                err_3 = _a.sent();
                                                reject(err_3);
                                                console.log(err_3);
                                                return [3 /*break*/, 3];
                                            case 3: return [2 /*return*/];
                                        }
                                    });
                                }); }));
                            });
                            Promise.all(promises).then(function (msg) {
                                data.source = 'db';
                                data.messages = msg;
                                app_1.redisClient.setex(msgRedisKey, 3600, JSON.stringify(msg));
                                return res.statusJson(200, { data: data });
                            });
                        })
                            .catch(function (err) {
                            var data = { message: err.messgae };
                            if (err) {
                                return res.statusJson(500, { data: data });
                            }
                        });
                    }
                    return [2 /*return*/];
                });
            }); });
        }
        catch (err) {
            var data = { message: err.messgae };
            if (err) {
                return res.statusJson(500, { data: data });
            }
        }
    };
    APIController.prototype.getUserActiveConversations = function (req, res) {
        var username = req.params.username;
        UserModel.findOne({ 'username': username })
            .exec()
            .then(function (user) {
            if (!user) {
                return res.statusJson(203, { data: { message: 'No user!' } });
            }
            var data = {
                conversations: user.conversations
            };
            return res.statusJson(200, { data: data });
        }).catch(function (err) {
            var data = { err: err };
            if (err) {
                return res.statusJson(500, { data: data });
            }
        });
    };
    APIController.prototype.clearUserUnreadMsgs = function (req, res) {
        var _this = this;
        var _a = req.body, sender = _a.sender, receiver = _a.receiver;
        var chainIO = function (_a) {
            var localIO = _a.localIO, socketsToSendTo = _a.socketsToSendTo;
            app_2.sids.forEach(function (usernames, id) {
                if ((usernames.receiver === receiver && usernames.sender === sender) || (usernames.receiver === sender && usernames.sender === receiver)) {
                    socketsToSendTo = true;
                    //chain rooms based on the users id
                    localIO = localIO.to(id);
                }
            });
            app_2.onlines.forEach(function (onlineInfo, id) {
                if ((onlineInfo.username === receiver) || (onlineInfo.username === sender)) {
                    socketsToSendTo = true;
                    //chain rooms based on the users id
                    localIO = localIO.to(id);
                }
            });
            return { localIO: localIO, socketsToSendTo: socketsToSendTo };
        };
        var emitter = function (_a, cleared) {
            var localIO = _a.localIO, socketsToSendTo = _a.socketsToSendTo;
            if (socketsToSendTo) {
                localIO.emit('unread-cleared', { cleared: cleared });
            }
        };
        var deleteCache = function () {
            var msgRedisKeyRRecent = "lstActiveConvo-username:" + sender;
            var msgRedisKeySRecent = "lstActiveConvo-username:" + receiver;
            try {
                app_1.redisClient.get(msgRedisKeyRRecent, function (err, messages) { return __awaiter(_this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        if (err || messages) {
                            app_1.redisClient.del(msgRedisKeyRRecent);
                        }
                        return [2 /*return*/];
                    });
                }); });
                app_1.redisClient.get(msgRedisKeySRecent, function (err, messages) { return __awaiter(_this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        if (err || messages) {
                            app_1.redisClient.del(msgRedisKeySRecent);
                        }
                        return [2 /*return*/];
                    });
                }); });
            }
            catch (err) { }
        };
        UserModel.findOne({ username: sender })
            .exec()
            .then(function (user) { return __awaiter(_this, void 0, void 0, function () {
            var i, result, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!user) {
                            return [2 /*return*/, res.statusJson(401, { data: { success: false, message: 'Not found' } })];
                        }
                        for (i = 0; i < user.conversations.length; i++) {
                            if (user.conversations[i].withWho === receiver) {
                                user.conversations[i].unreadMsgs = 0;
                            }
                        }
                        return [4 /*yield*/, user.save()];
                    case 1:
                        result = _a.sent();
                        data = { success: false };
                        if (result) {
                            data.success = true;
                        }
                        emitter(chainIO({
                            localIO: app_1.io,
                            socketsToSendTo: false
                        }), data.success);
                        deleteCache();
                        return [2 /*return*/, res.statusJson(200, { data: data })];
                }
            });
        }); }).catch(function (err) {
            var data = { err: err, success: false };
            return res.statusJson(500, { data: data });
        });
    };
    APIController.prototype.deleteMessage = function (req, res) {
        var messageId = req.params.messageId;
        Message.findByIdAndRemove(messageId, {}, function (err, msgDeleted) {
            var data = { msgDeleted: msgDeleted, success: true };
            if (err) {
                var data_2 = { err: err, success: false };
                return res.statusJson(500, { data: data_2 });
            }
            //console.log(msgDeleted);
            //i changed the structure of this map thats why im getting error
            var localIO = app_1.io;
            var socketsToSendTo = false;
            app_2.sids.forEach(function (usernames, id) {
                if ((usernames.receiver === msgDeleted.receiver && usernames.sender === msgDeleted.sender) || (usernames.receiver === msgDeleted.sender && usernames.sender === msgDeleted.receiver)) {
                    socketsToSendTo = true;
                    //chain rooms based on the users id
                    localIO = localIO.to(id);
                }
            });
            if (socketsToSendTo) {
                //emit only to the sender and the receiver so they both
                //can register it on their respoective screens.
                localIO.emit('delete-msg', data);
            }
            return res.statusJson(200, { data: data });
        });
    };
    APIController.prototype.deleteMessages = function (req, res) {
        Message.deleteMany().exec().then(function (info) {
            var data = { info: info, success: true };
            return res.statusJson(200, { data: data });
        }).catch(function (err) {
            var data = { err: err, success: false };
            return res.statusJson(500, { data: data });
        });
    };
    APIController.prototype.resetMessages = function (req, res) { };
    APIController.prototype.resetUsersConversations = function (req, res) {
        var _this = this;
        UserModel.find()
            .exec()
            .then(function (users) { return __awaiter(_this, void 0, void 0, function () {
            var i, _a, _b, err_4, data;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (users.length < 1) {
                            return [2 /*return*/, res.statusJson(401, { data: { message: 'Not found' } })];
                        }
                        i = 0;
                        _c.label = 1;
                    case 1:
                        if (!(i < users.length)) return [3 /*break*/, 6];
                        _c.label = 2;
                    case 2:
                        _c.trys.push([2, 4, , 5]);
                        users[i].conversations = [];
                        _a = users;
                        _b = i;
                        return [4 /*yield*/, users[i].save()];
                    case 3:
                        _a[_b] = _c.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        err_4 = _c.sent();
                        data = { err: err_4 };
                        if (err_4) {
                            return [2 /*return*/, res.statusJson(500, { data: data })];
                        }
                        return [3 /*break*/, 5];
                    case 5:
                        i++;
                        return [3 /*break*/, 1];
                    case 6: return [2 /*return*/, res.statusJson(200, { data: { message: 'Done' } })];
                }
            });
        }); })
            .catch(function (err) {
            throw new Error(err);
        });
    };
    __decorate([
        index_1.get('/messages/all'),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object, Object]),
        __metadata("design:returntype", void 0)
    ], APIController.prototype, "getAllMessages", null);
    __decorate([
        index_1.get('/messages/all/:sender/:receiver'),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object, Object]),
        __metadata("design:returntype", void 0)
    ], APIController.prototype, "getSenderReceiverMessage", null);
    __decorate([
        index_1.post('/message'),
        index_1.bodyValidator('msg', 'sender', 'receiver'),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object, Object]),
        __metadata("design:returntype", void 0)
    ], APIController.prototype, "sendMessage", null);
    __decorate([
        index_1.get('/messages/recent/:username'),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object, Object]),
        __metadata("design:returntype", void 0)
    ], APIController.prototype, "getLastMessagesOfConversations", null);
    __decorate([
        index_1.get('/active-conversations/:username'),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object, Object]),
        __metadata("design:returntype", void 0)
    ], APIController.prototype, "getUserActiveConversations", null);
    __decorate([
        index_1.post('/user/clear-unread'),
        index_1.bodyValidator('sender', 'receiver'),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object, Object]),
        __metadata("design:returntype", void 0)
    ], APIController.prototype, "clearUserUnreadMsgs", null);
    __decorate([
        index_1.del('/message/:messageId'),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object, Object]),
        __metadata("design:returntype", void 0)
    ], APIController.prototype, "deleteMessage", null);
    __decorate([
        index_1.del('/messages'),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object, Object]),
        __metadata("design:returntype", void 0)
    ], APIController.prototype, "deleteMessages", null);
    __decorate([
        index_1.get('/messages/reset'),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object, Object]),
        __metadata("design:returntype", void 0)
    ], APIController.prototype, "resetMessages", null);
    __decorate([
        index_1.get('/users/conversations/reset'),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object, Object]),
        __metadata("design:returntype", void 0)
    ], APIController.prototype, "resetUsersConversations", null);
    APIController = __decorate([
        index_1.controller('/api')
    ], APIController);
    return APIController;
}());
//# sourceMappingURL=APIController.js.map