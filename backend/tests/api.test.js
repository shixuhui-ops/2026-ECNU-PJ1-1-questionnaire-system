const assert = require("node:assert/strict");

const baseUrl = "http://localhost:3000/api";
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

    const textQuestion = await request(`/surveys/${surveyId}/questions`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
            type: "text",
            title: "自我介绍",
            required: false,
            validation: {
                minLength: 2,
                maxLength: 100
            }
        })
    });

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
    console.log("所有自动化测试通过");
}

run().catch((error) => {
    console.error("自动化测试失败：", error.message);
    process.exit(1);
});