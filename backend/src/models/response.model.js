const mongoose = require("mongoose");

const answerSchema = new mongoose.Schema(
    {
        questionId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        value: {
            type: mongoose.Schema.Types.Mixed,
            required: true
        }
    },
    { _id: false }
);

const responseSchema = new mongoose.Schema(
    {
        surveyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Survey",
            required: true,
            index: true
        },
        respondentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
            index: true
        },
        anonymous: {
            type: Boolean,
            default: false
        },
        answers: {
            type: [answerSchema],
            default: []
        },
        submittedAt: {
            type: Date,
            default: Date.now,
            index: true
        }
    },
    {
        timestamps: true,
        collection: "responses"
    }
);

module.exports = mongoose.model("Response", responseSchema);