/* eslint-disable @typescript-eslint/no-require-imports */
// Test-only shim, loaded via `execArgv` in vitest.config.mts.
// jsdom 31 pulls in undici 8, which calls zlib.createZstdDecompress.bind(...) at load time;
// Node < 22.15 lacks it, so jsdom workers crash. The stub is never called by the tests.
// Remove when local Node >= 22.15 (jsdom 31 needs zlib zstd).
const zlib = require("node:zlib");
if (typeof zlib.createZstdDecompress !== "function") {
  zlib.createZstdDecompress = function createZstdDecompress() {
    throw new Error("zstd is not supported in this Node version");
  };
}
