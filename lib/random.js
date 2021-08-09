"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateKey = void 0;
const nanoid_1 = require("nanoid");
// Used as large number to make sure keys are generated in descending order
const maxDateNowValue = 8.64e15; // Fun fact: This will only work until the year 275760
/**
 * Generate a unique key in ascending or descending sequential order
 *
 * In ascending mode it will use the Unix timestamp directly
 * and in descending order the maxDateNowValue (8.64e15) - Unix timestamp
 * to make sure key is sequential. Key will be timestamp in hex plus a 5 char random id.
 *
 * Note: Because of the timestamp in ms, key is only sequential until a certain point i.e two keys generated in the same ms.
 */
const generateKey = (ascending) => {
    const timestamp = ascending ? Date.now() : maxDateNowValue - Date.now();
    return `${timestamp.toString(16)}${nanoid_1.nanoid(5)}`;
};
exports.generateKey = generateKey;
