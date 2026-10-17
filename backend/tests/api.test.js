const assert = require("node:assert/strict");

const baseUrl = process.env.API_BASE_URL || "http://127.0.0.1:3000/api";
const username = `tester_${Date.now()}`;
const password = "123456";

async function request(path, options = {}) {
    const response = await fetch(`${baseUrl}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        }
    });

    const body = await response.json();

    if (!response.ok) {
        throw new Error(`${response.status}: ${JSON.stringify(body)}`);
    }

    return body;
}

async function run() {
    const register = await request("/auth/register", {
        method: "POST",
        body: JSON.stringify({ username, password })
    });

    assert.equal(register.success, true);
    const token = register.data.token;
    const authHeaders = {
        Authorization: `Bearer ${token}`
    };

    const created = await request("/surveys", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
            title: "自动化测试问卷",
            description: "API测试",
            allowAnonymous: true
        })
    });

    const surveyId = created.data._id;
    let invalidAnonymousTypeFailed = false;

    try {
        await request("/surveys", {
            method: "POST",
            headers: authHeaders,
            body: JSON.stringify({
                title: "非法匿名配置测试",
                allowAnonymous: "false"
            })
        });
    } catch (error) {
        invalidAnonymousTypeFailed = true;
    }

    assert.equal(invalidAnonymousTypeFailed, true);
    let invalidDeadlineFailed = false;

    try {
        await request("/surveys", {
            method: "POST",
            headers: authHeaders,
            body: JSON.stringify({
                title: "非法截止时间测试",
                description: "测试日期格式校验",
                deadline: "not-a-valid-date"
            })
        });
    } catch (error) {
        invalidDeadlineFailed = true;
    }

    assert.equal(invalidDeadlineFailed, true);
    const singleQuestion = await request(`/surveys/${surveyId}/questions`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
            type: "single",
            title: "选择一个选项",
            required: true,
            options: [
                { label: "A", value: "A" },
                { label: "B", value: "B" }
            ]
        })
    });

    const numberQuestion = await request(`/surveys/${surveyId}/questions`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
            type: "number",
            title: "输入年龄",
            required: true,
            validation: {
                minValue: 0,
                maxValue: 120,
                integerOnly: true
            }
        })
    });

    await request(`/surveys/${surveyId}/questions`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
            type: "multiple",
            title: "喜欢的水果",
            required: false,
            options: [
                { label: "苹果", value: "apple" },
                { label: "香蕉", value: "banana" },
                { label: "西瓜", value: "watermelon" }
            ],
            validation: {
                minSelections: 1,
                maxSelections: 2
            }
        })
    });
    let duplicateOptionValueFailed = false;

    try {
        await request(`/surveys/${surveyId}/questions`, {
            method: "POST",
            headers: authHeaders,
            body: JSON.stringify({
                type: "multiple",
                title: "重复选项值测试",
                required: false,
                options: [
                    { label: "选项A", value: "same" },
                    { label: "选项B", value: "same" }
                ]
            })
        });
    } catch (error) {
        duplicateOptionValueFailed = true;
    }

    assert.equal(duplicateOptionValueFailed, true);
    let invalidRangeFailed = false;

    try {
        await request(`/surveys/${surveyId}/questions`, {
            method: "POST",
            headers: authHeaders,
            body: JSON.stringify({
                type: "number",
                title: "非法数字范围测试",
                required: false,
                validation: {
                    minValue: 100,
                    maxValue: 10
                }
            })
        });
    } catch (error) {
        invalidRangeFailed = true;
    }

    assert.equal(invalidRangeFailed, true);
    const textQuestion = await request(`/surveys/${surveyId}/questions`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
            type: "text",
            title: "自我介绍",
            required: true,
            validation: {
                minLength: 2,
                maxLength: 100
            }
        })
    });
    let invalidJumpRuleFailed = false;

    try {
        await request(`/surveys/${surveyId}/jump-rules`, {
            method: "POST",
            headers: authHeaders,
            body: JSON.stringify({
                sourceQuestionId: singleQuestion.data._id,
                targetQuestionId: numberQuestion.data._id,
                operator: "greaterThan",
                expectedValue: 1
            })
        });
    } catch (error) {
        invalidJumpRuleFailed = true;
    }

    assert.equal(invalidJumpRuleFailed, true);
    let selfJumpRuleFailed = false;

    try {
        await request(`/surveys/${surveyId}/jump-rules`, {
            method: "POST",
            headers: authHeaders,
            body: JSON.stringify({
                sourceQuestionId: singleQuestion.data._id,
                targetQuestionId: singleQuestion.data._id,
                operator: "equals",
                expectedValue: "A"
            })
        });
    } catch (error) {
        selfJumpRuleFailed = true;
    }

    assert.equal(selfJumpRuleFailed, true);
    await request(`/surveys/${surveyId}/jump-rules`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
            sourceQuestionId: singleQuestion.data._id,
            targetQuestionId: numberQuestion.data._id,
            operator: "equals",
            expectedValue: "A"
        })
    });
    let duplicateJumpRuleFailed = false;

    try {
        await request(`/surveys/${surveyId}/jump-rules`, {
            method: "POST",
            headers: authHeaders,
            body: JSON.stringify({
                sourceQuestionId: singleQuestion.data._id,
                targetQuestionId: numberQuestion.data._id,
                operator: "equals",
                expectedValue: "A"
            })
        });
    } catch (error) {
        duplicateJumpRuleFailed = true;
    }

    assert.equal(duplicateJumpRuleFailed, true);
    const published = await request(`/surveys/${surveyId}/publish`, {
        method: "POST",
        headers: authHeaders
    });

    const accessCode = published.data.survey.accessCode;

    const publicSurvey = await request(`/surveys/public/${accessCode}`);
    assert.equal(publicSurvey.data.title, "自动化测试问卷");

    const nextQuestion = await request(
        `/surveys/public/${accessCode}/next-question`,
        {
            method: "POST",
            body: JSON.stringify({
                currentQuestionId: singleQuestion.data._id,
                answers: [
                    {
                        questionId: singleQuestion.data._id,
                        value: "A"
                    }
                ]
            })
        }
    );

    assert.equal(String(nextQuestion.data.question._id), String(numberQuestion.data._id));

    await request(`/responses/${accessCode}`, {
        method: "POST",
        body: JSON.stringify({
            answers: [
                {
                    questionId: singleQuestion.data._id,
                    value: "A"
                },
                {
                    questionId: numberQuestion.data._id,
                    value: 20
                },
                {
                    questionId: textQuestion.data._id,
                    value: "这是一段测试自我介绍"
                }
            ]
        })
    });

    const stats = await request(`/stats/${surveyId}`, {
        headers: authHeaders
    });

    assert.equal(stats.data.totalResponses, 1);

    let duplicateRegisterFailed = false;

    try {
        await request("/auth/register", {
            method: "POST",
            body: JSON.stringify({ username, password })
        });
    } catch (error) {
        duplicateRegisterFailed = true;
    }

    assert.equal(duplicateRegisterFailed, true);

    let invalidAnswerFailed = false;

    try {
        await request(`/responses/${accessCode}`, {
            method: "POST",
            body: JSON.stringify({
                answers: [
                    {
                        questionId: singleQuestion.data._id,
                        value: "INVALID_OPTION"
                    },
                    {
                        questionId: numberQuestion.data._id,
                        value: 20
                    }
                ]
            })
        });
    } catch (error) {
        invalidAnswerFailed = true;
    }

    assert.equal(invalidAnswerFailed, true);
    const multipleQuestionId = published.data.survey.questions.find(
        (question) => question.type === "multiple"
    )._id;

    let duplicateOptionFailed = false;

    try {
        await request(`/responses/${accessCode}`, {
            method: "POST",
            body: JSON.stringify({
                answers: [
                    {
                        questionId: singleQuestion.data._id,
                        value: "A"
                    },
                    {
                        questionId: numberQuestion.data._id,
                        value: 20
                    },
                    {
                        questionId: multipleQuestionId,
                        value: ["apple", "apple"]
                    }
                ]
            })
        });
    } catch (error) {
        duplicateOptionFailed = true;
    }

    assert.equal(duplicateOptionFailed, true);
    let whitespaceTextFailed = false;

    try {
        await request(`/responses/${accessCode}`, {
            method: "POST",
            body: JSON.stringify({
                answers: [
                    {
                        questionId: singleQuestion.data._id,
                        value: "A"
                    },
                    {
                        questionId: numberQuestion.data._id,
                        value: 20
                    },
                    {
                        questionId: textQuestion.data._id,
                        value: "   "
                    }
                ]
            })
        });
    } catch (error) {
        whitespaceTextFailed = true;
    }

    assert.equal(whitespaceTextFailed, true);
    let invalidTokenFailed = false;

    try {
        await request(`/responses/${accessCode}`, {
            method: "POST",
            headers: {
                Authorization: "Bearer invalid-token"
            },
            body: JSON.stringify({
                answers: [
                    {
                        questionId: singleQuestion.data._id,
                        value: "A"
                    },
                    {
                        questionId: numberQuestion.data._id,
                        value: 20
                    },
                    {
                        questionId: textQuestion.data._id,
                        value: "有效文本答案"
                    }
                ]
            })
        });
    } catch (error) {
        invalidTokenFailed = true;
    }

    assert.equal(invalidTokenFailed, true);
    console.log("所有自动化测试通过");
}

run().catch((error) => {
    console.error("自动化测试失败：", error.message);
    process.exit(1);
});