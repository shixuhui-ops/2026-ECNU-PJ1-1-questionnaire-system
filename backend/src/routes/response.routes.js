const express = require("express");
const Survey = require("../models/survey.model");
const Response = require("../models/response.model");
const requireAuth = require("../middleware/auth.middleware");

const router = express.Router();

function compareAnswer(answer, operator, expectedValue) {
    if (operator === "contains") {
        return Array.isArray(answer) && answer.includes(expectedValue);
    }

    const left = Number(answer);
    const right = Number(expectedValue);

    if (["greaterThan", "lessThan", "greaterOrEqual", "lessOrEqual"].includes(operator)) {
        if (Number.isNaN(left) || Number.isNaN(right)) return false;
        if (operator === "greaterThan") return left > right;
        if (operator === "lessThan") return left < right;
        if (operator === "greaterOrEqual") return left >= right;
        return left <= right;
    }

    return String(answer) === String(expectedValue);
}

function validateAnswer(question, value) {
    if (value === undefined || value === null || value === "") {
        return question.required ? "必答题不能为空" : null;
    }

    if (question.type === "single") {
        const valid = question.options.some((option) => option.value === value);
        return valid ? null : "单选答案无效";
    }

    if (question.type === "multiple") {
        if (!Array.isArray(value)) return "多选答案必须是数组";

        const validValues = question.options.map((option) => option.value);
        if (value.some((item) => !validValues.includes(item))) {
            return "多选答案包含无效选项";
        }

        const { minSelections, maxSelections, exactSelections } = question.validation || {};

        if (exactSelections !== undefined && value.length !== exactSelections) {
            return `必须选择${exactSelections}个选项`;
        }

        if (minSelections !== undefined && value.length < minSelections) {
            return `至少选择${minSelections}个选项`;
        }

        if (maxSelections !== undefined && value.length > maxSelections) {
            return `最多选择${maxSelections}个选项`;
        }

        return null;
    }

    if (question.type === "text") {
        if (typeof value !== "string") return "文本答案必须是字符串";

        const { minLength, maxLength } = question.validation || {};

        if (minLength !== undefined && value.length < minLength) {
            return `文本长度不能少于${minLength}`;
        }

        if (maxLength !== undefined && value.length > maxLength) {
            return `文本长度不能超过${maxLength}`;
        }

        return null;
    }

    if (question.type === "number") {
        const numberValue = Number(value);
        if (Number.isNaN(numberValue)) return "答案必须是数字";

        const { minValue, maxValue, integerOnly } = question.validation || {};

        if (integerOnly && !Number.isInteger(numberValue)) {
            return "答案必须是整数";
        }

        if (minValue !== undefined && numberValue < minValue) {
            return `数字不能小于${minValue}`;
        }

        if (maxValue !== undefined && numberValue > maxValue) {
            return `数字不能大于${maxValue}`;
        }

        return null;
    }

    return "题目类型无效";
}

router.post("/:accessCode", async (req, res) => {
    try {
        const survey = await Survey.findOne({
            accessCode: req.params.accessCode,
            status: "published"
        });

        if (!survey) {
            return res.status(404).json({
                success: false,
                message: "问卷不存在或未发布"
            });
        }

        if (survey.deadline && new Date() > survey.deadline) {
            return res.status(400).json({
                success: false,
                message: "问卷已超过截止时间"
            });
        }

        const authorization = req.headers.authorization || "";
        let respondentId = null;

        if (authorization.startsWith("Bearer ")) {
            try {
                const jwt = require("jsonwebtoken");
                const payload = jwt.verify(
                    authorization.slice(7),
                    process.env.JWT_SECRET
                );
                respondentId = payload.userId;
            } catch (error) {
                respondentId = null;
            }
        }

        if (!respondentId && !survey.allowAnonymous) {
            return res.status(401).json({
                success: false,
                message: "该问卷要求登录后填写"
            });
        }

        const submittedAnswers = Array.isArray(req.body.answers)
            ? req.body.answers
            : [];

        const answerMap = new Map(
            submittedAnswers.map((answer) => [
                String(answer.questionId),
                answer.value
            ])
        );

        const normalizedAnswers = [];
        const questionMap = new Map(
            survey.questions.map((question) => [String(question._id), question])
        );

        const orderedQuestions = [...survey.questions].sort(
            (a, b) => a.order - b.order
        );

        const reachableQuestionIds = new Set();
        let currentQuestion = orderedQuestions[0] || null;

        while (currentQuestion) {
            const currentId = String(currentQuestion._id);

            if (reachableQuestionIds.has(currentId)) {
                break;
            }

            reachableQuestionIds.add(currentId);

            const currentAnswer = answerMap.get(currentId);
            const jumpRule = survey.jumpRules.find((rule) => {
                if (String(rule.sourceQuestionId) !== currentId) {
                    return false;
                }

                return compareAnswer(
                    currentAnswer,
                    rule.operator,
                    rule.expectedValue
                );
            });

            if (jumpRule) {
                currentQuestion =
                    questionMap.get(String(jumpRule.targetQuestionId)) || null;
                continue;
            }

            const currentIndex = orderedQuestions.findIndex(
                (question) => String(question._id) === currentId
            );

            currentQuestion = orderedQuestions[currentIndex + 1] || null;
        }

        for (const question of orderedQuestions) {
            const questionId = String(question._id);

            if (!reachableQuestionIds.has(questionId)) {
                continue;
            }

            const value = answerMap.get(questionId);

            if (value === undefined) {
                if (question.required) {
                    return res.status(400).json({
                        success: false,
                        message: `题目“${question.title}”为必答题`
                    });
                }

                continue;
            }

            const validationError = validateAnswer(question, value);

            if (validationError) {
                return res.status(400).json({
                    success: false,
                    message: `题目“${question.title}”：${validationError}`
                });
            }

            normalizedAnswers.push({
                questionId: question._id,
                value
            });
        }

        const response = await Response.create({
            surveyId: survey._id,
            respondentId,
            anonymous: !respondentId,
            answers: normalizedAnswers
        });

        res.status(201).json({
            success: true,
            message: "问卷提交成功",
            data: {
                responseId: response._id,
                submittedAt: response.submittedAt
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "提交问卷失败"
        });
    }
});

module.exports = router;