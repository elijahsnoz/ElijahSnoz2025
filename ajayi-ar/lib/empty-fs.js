// Stub for Node's "fs" module in the browser bundle. mind-ar's prebuilt
// dist file statically references require("fs") inside a tfjs Node-only
// IOHandler that is guarded by a runtime IS_NODE check and never actually
// runs in the browser — this stub only needs to exist so Turbopack's
// client build can resolve the import; its readFileSync is never called.
module.exports = {
  readFileSync() {
    throw new Error("fs.readFileSync is not available in the browser");
  },
};
