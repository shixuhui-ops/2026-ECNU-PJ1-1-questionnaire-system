const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

const router = express.Router();

function createToken(user) {
    return jwt.sign(
        {
            userId: user._id.toString(),
            username: user.username
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "7d"
        }
    );
}

router.post("/register", async (req, res) => {
    try {
        const username = String(req.body.username || "").trim();
        const password = String(req.body.password || "");

        if (username.length < 3 || username.length > 30) {
            return res.status(400).json({
                success: false,
                message: "用户名长度必须为3到30个字符"
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "密码长度不能少于6位"
            });
        }

        const exists = await User.exists({ username });

        if (exists) {
            return res.status(409).json({
                success: false,
                message: "用户名已存在"
            });
        }

        const user = new User({ username, passwordHash: "temporary" });
        await user.setPassword(password);
        await user.save();

        res.status(201).json({
            success: true,
            message: "注册成功",
            data: {
                user: {
                    id: user._id,
                    username: user.username
                },
                token: createToken(user)
            }
        });
    } catch (error) {
        if (error && error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "用户名已存在"
            });
        }

        res.status(500).json({
            success: false,
            message: "注册失败"
        });
    }
});

router.post("/login", async (req, res) => {
    try {
        const username = String(req.body.username || "").trim();
        const password = String(req.body.password || "");

        const user = await User.findOne({ username });

        if (!user || !(await user.verifyPassword(password))) {
            return res.status(401).json({
                success: false,
                message: "用户名或密码错误"
            });
        }

        res.json({
            success: true,
            message: "登录成功",
            data: {
                user: {
                    id: user._id,
                    username: user.username
                },
                token: createToken(user)
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "登录失败"
        });
    }
});

module.exports = router;