const path = require("node:path");
const { spawn } = require("node:child_process");

const backendDir = path.resolve(__dirname, "..");
const dbPath = path.join(backendDir, "data", "db");

const children = [];

function startProcess(command, args, options = {}) {
    const child = spawn(command, args, {
        cwd: backendDir,
        stdio: "inherit",
        ...options
    });

    children.push(child);
    return child;
}

async function waitForHealth(url, timeoutMs = 30000) {
    const start = Date.now();

    while (Date.now() - start < timeoutMs) {
        try {
            const response = await fetch(url);

            if (response.ok) {
                return;
            }
        } catch (error) {
            // Service is still starting.
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    throw new Error("后端服务启动超时");
}

function cleanup() {
    for (const child of children) {
        if (!child.killed && child.exitCode === null) {
            child.kill();
        }
    }
}

async function main() {
    process.on("SIGINT", () => {
        cleanup();
        process.exit(130);
    });

    process.on("SIGTERM", () => {
        cleanup();
        process.exit(143);
    });

    const mongodCommand = process.env.MONGOD_BIN || "mongod";

    startProcess(mongodCommand, [
        "--dbpath",
        dbPath,
        "--port",
        "27017",
        "--bind_ip",
        "127.0.0.1",
        "--quiet"
    ]);

    startProcess(process.execPath, ["src/server.js"]);

    try {
        await waitForHealth("http://127.0.0.1:3000/api/health");

        const test = spawn(process.execPath, ["tests/api.test.js"], {
            cwd: backendDir,
            stdio: "inherit",
            env: {
                ...process.env,
                API_BASE_URL: "http://127.0.0.1:3000/api"
            }
        });

        const exitCode = await new Promise((resolve, reject) => {
            test.on("error", reject);
            test.on("exit", (code) => resolve(code ?? 1));
        });

        process.exitCode = exitCode;
    } finally {
        cleanup();
    }
}

main().catch((error) => {
    console.error(`一键测试失败：${error.message}`);
    cleanup();
    process.exitCode = 1;
});