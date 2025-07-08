/**
 * Executes the function "greet".
 * @param name - parameter
 * @returns string
 */
function greet(name: string) {
  return `Hello, ${name}`;
}

const add = /**
 * Processes the function "add".
 * @param a - parameter
 * @param b - parameter
 * @returns number
 */
(a: number, b: number) => a + b;
