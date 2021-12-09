"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Schema = exports.Base = void 0;
/* eslint-disable valid-jsdoc */
const dotenv_1 = __importDefault(require("dotenv"));
const Base_1 = require("./Base");
Object.defineProperty(exports, "Base", { enumerable: true, get: function () { return Base_1.Base; } });
const Schema_1 = require("./Schema");
Object.defineProperty(exports, "Schema", { enumerable: true, get: function () { return Schema_1.Schema; } });
dotenv_1.default.config();
