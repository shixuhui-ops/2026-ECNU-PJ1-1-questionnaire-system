require("dotenv").config();

const mongoose = require("mongoose");
const app = require("./app");

const port = Number(process.env.PORT || 3000);
const mongoUri = process.env.MONGODB_URI;

async function startServer() {
    if (!mongoUri) {
        throw new Error("缺少 MONGODB_URI 配置");
    }

    await mongoose.connect(mongoUri);

    app.listen(port, () => {
        console.log(`服务器已启动：http://localhost:${port}`);
    });
}

startServer().catch((error) => {
    console.error("服务器启动失败：", error.message);
    process.exit(1);
});