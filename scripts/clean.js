import { existsSync, lstatSync, readdirSync, rmdirSync, unlinkSync } from "node:fs";
import { join } from "node:path";

// Explicit traversal keeps cleanup reliable for Windows/MSYS paths.
function removePath(path) {
    if (!existsSync(path)) {
        return;
    }

    if (lstatSync(path).isDirectory()) {
        for (const entry of readdirSync(path)) {
            removePath(join(path, entry));
        }
        rmdirSync(path);
        return;
    }

    unlinkSync(path);
}

const targets = process.argv.slice(2);
const paths = targets.length > 0 ? targets : ["dist", "package.zip"];

for (const path of paths) {
    removePath(path);
}
