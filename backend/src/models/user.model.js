const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            minlength: 3,
            maxlength: 30
        },
        passwordHash: {
            type: String,
            required: true
        }
    },
    {
        timestamps: true,
        collection: "users"
    }
);

userSchema.methods.setPassword = async function (password) {
    this.passwordHash = await bcrypt.hash(password, 12);
};

userSchema.methods.verifyPassword = function (password) {
    return bcrypt.compare(password, this.passwordHash);
};

module.exports = mongoose.model("User", userSchema);