const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

async function requireAuth(req, res, next) {
    try {
        const authorization = req.headers.authorization || "";
        const [scheme, token] = authorization.split(" ");

        if (scheme !== "Bearer" || !token) {
            return res.status(401).json({
                success: false,
                message: "请先登录"
            });
        }

        const payload = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(payload.userId).select("_id username");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "登录用户不存在"
            });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "登录凭证无效或已过期"
        });
    }
}

module.exports = requireAuth;