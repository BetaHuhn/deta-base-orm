/**
 * Generate a unique key in ascending or descending sequential order
 *
 * In ascending mode it will use the Unix timestamp directly
 * and in descending order the maxDateNowValue (8.64e15) - Unix timestamp
 * to make sure key is sequential. Key will be timestamp in hex plus a 5 char random id.
 *
 * Note: Because of the timestamp in ms, key is only sequential until a certain point i.e two keys generated in the same ms.
 */
export declare const generateKey: (ascending: boolean) => string;
