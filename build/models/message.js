"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose_1 = __importDefault(require("mongoose"));
var Schema = mongoose_1.default.Schema;
mongoose_1.default.set('useCreateIndex', true);
var msgSchema = new Schema({
    sender: { type: String, required: true },
    message: { type: String, required: true }
});
mongoose_1.default.model('Message', msgSchema);
