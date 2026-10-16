const express = require("express");
const Survey = require("../models/survey.model");
const Response = require("../models/response.model");
const requireAuth = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/:surveyId", requireAuth, async (req, res) => {
    try {
        const survey = await Survey.findById(req.params.surveyId);

        if (!survey || survey.ownerId.toString() !== req.user._id.toString()) {
            return res.status(404).json({
                success: false,
                message: "问卷不存在"
            });
        }

        const responses = await Response.find({ surveyId: survey._id }).lean();

        const statistics = survey.questions.map((question) => {
            const questionAnswers = responses
                .flatMap((response) => response.answers)
                .filter(
                    (answer) => answer.questionId.toString() === question._id.toString()
                )
                .map((answer) => answer.value);

            if (question.type === "single") {
                const counts = {};

                for (const option of question.options) {
                    counts[option.value] = {
                        label: option.label,
                        count: questionAnswers.filter(
                            (answer) => answer === option.value
                        ).length
                    };
                }

                return {
                    questionId: question._id,
                    title: question.title,
                    type: question.type,
                    totalAnswers: questionAnswers.length,
                    options: counts
                };
            }

            if (question.type === "multiple") {
                const counts = {};

                for (const option of question.options) {
                    counts[option.value] = {
                        label: option.label,
                        count: questionAnswers.filter(
                            (answer) => Array.isArray(answer) && answer.includes(option.value)
                        ).length
                    };
                }

                return {
                    questionId: question._id,
                    title: question.title,
                    type: question.type,
                    totalAnswers: questionAnswers.length,
                    options: counts
                };
            }

            if (question.type === "number") {
                const numbers = questionAnswers
                    .map(Number)
                    .filter((value) => !Number.isNaN(value));

                return {
                    questionId: question._id,
                    title: question.title,
                    type: question.type,
                    totalAnswers: numbers.length,
                    average:
                        numbers.length > 0
                            ? numbers.reduce((sum, value) => sum + value, 0) / numbers.length
                            : null,
                    values: numbers
                };
            }

            return {
                questionId: question._id,
                title: question.title,
                type: question.type,
                totalAnswers: questionAnswers.length,
                values: questionAnswers
            };
        });

        res.json({
            success: true,
            data: {
                surveyId: survey._id,
                title: survey.title,
                totalResponses: responses.length,
                statistics
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "获取统计结果失败"
        });
    }
});

module.exports = router;