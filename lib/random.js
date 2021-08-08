"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateId = exports.generateKey = void 0;
const nanoid_1 = require("nanoid");
// Used as large number to make sure keys are generated in descending order
const maxDateNowValue = 8.64e15; // Fun fact: This will only work until the year 275760
const generateKey = (descending) => {
    const id = nanoid_1.nanoid(10);
    const timestamp = descending ? maxDateNowValue - Date.now() : Date.now();
    return `${timestamp}-${id}`;
};
exports.generateKey = generateKey;
const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
exports.generateId = nanoid_1.customAlphabet(alphabet, 16);
