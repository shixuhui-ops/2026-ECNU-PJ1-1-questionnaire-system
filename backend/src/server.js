require("dotenv").config();

const mongoose = require("mongoose");
const app = require("./app");

const port = Number(process.env.PORT || 3000);
const mongoUri = process.env.MONGODB_URI;
const jwtSecret = process.env.JWT_SECRET;

async function startServer() {
    if (!mongoUri) {
        throw new Error("缺少 MONGODB_URI 配置");
    }

    if (!jwtSecret || jwtSecret.trim().length < 16) {
        throw new Error("JWT_SECRET 必须配置且长度不能少于16个字符");
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