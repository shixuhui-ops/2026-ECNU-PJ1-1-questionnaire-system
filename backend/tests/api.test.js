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
        const error = new Error(
            `${response.status}: ${JSON.stringify(body)}`
        );

        error.status = response.status;
        error.body = body;

        throw error;
    }

    return body;
}

async function run() {
    const register = await request("/auth/register", {
        method: "POST",
        body: JSON.stringify({ username, password })
    });

    assert.equal(register.success, true);
    assert.equal(register.data.user.username, username);
    assert.ok(register.data.token);

    let wrongLoginFailed = false;

    try {
        await request("/auth/login", {
            method: "POST",
            body: JSON.stringify({
                username,
                password: "wrong-password"
            })
        });
    } catch (error) {
        assert.equal(error.status, 401);
        assert.equal(error.body.success, false);
        assert.equal(error.body.message, "用户名或密码错误");
        wrongLoginFailed = true;
    }

    assert.equal(wrongLoginFailed, true);

    const login = await request("/auth/login", {
        method: "POST",
        body: JSON.stringify({
            username,
            password
        })
    });

    assert.equal(login.success, true);
    assert.equal(login.data.user.username, username);
    assert.ok(login.data.token);

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
                maxSelections: 2,
                exactSelections: null
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
    let selectionCountOverOptionsFailed = false;

    try {
        await request(`/surveys/${surveyId}/questions`, {
            method: "POST",
            headers: authHeaders,
            body: JSON.stringify({
                type: "multiple",
                title: "选择数量超过选项总数",
                required: true,
                options: [
                    {
                        label: "选项A",
                        value: "A"
                    },
                    {
                        label: "选项B",
                        value: "B"
                    }
                ],
                validation: {
                    exactSelections: 3
                }
            })
        });
    } catch (error) {
        selectionCountOverOptionsFailed = true;
    }

    assert.equal(selectionCountOverOptionsFailed, true);

    let fractionalSelectionCountFailed = false;

    try {
        await request(`/surveys/${surveyId}/questions`, {
            method: "POST",
            headers: authHeaders,
            body: JSON.stringify({
                type: "multiple",
                title: "小数选择数量测试",
                required: true,
                options: [
                    {
                        label: "选项A",
                        value: "A"
                    },
                    {
                        label: "选项B",
                        value: "B"
                    }
                ],
                validation: {
                    minSelections: 1.5
                }
            })
        });
    } catch (error) {
        fractionalSelectionCountFailed = true;
    }

    assert.equal(fractionalSelectionCountFailed, true);
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
    let backwardJumpRuleFailed = false;

    try {
        await request(`/surveys/${surveyId}/jump-rules`, {
            method: "POST",
            headers: authHeaders,
            body: JSON.stringify({
                sourceQuestionId: numberQuestion.data._id,
                targetQuestionId: singleQuestion.data._id,
                operator: "equals",
                expectedValue: 20
            })
        });
    } catch (error) {
        backwardJumpRuleFailed = true;
    }

    assert.equal(backwardJumpRuleFailed, true);
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
    const multipleQuestionId = published.data.survey.questions.find(
        (question) => question.type === "multiple"
    )._id;
    let publishedJumpRuleFailed = false;

    try {
        await request(`/surveys/${surveyId}/jump-rules`, {
            method: "POST",
            headers: authHeaders,
            body: JSON.stringify({
                sourceQuestionId: singleQuestion.data._id,
                targetQuestionId: numberQuestion.data._id,
                operator: "equals",
                expectedValue: "B"
            })
        });
    } catch (error) {
        publishedJumpRuleFailed = true;
    }

    assert.equal(publishedJumpRuleFailed, true);
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

    assert.equal(
        String(nextQuestion.data.question._id),
        String(numberQuestion.data._id)
    );

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
                    value: 21
                },
                {
                    questionId: multipleQuestionId,
                    value: []
                },
                {
                    questionId: textQuestion.data._id,
                    value: "第二份有效文本答案"
                }
            ]
        })
    });

    const statsAfterOptionalEmpty = await request(`/stats/${surveyId}`, {
        headers: authHeaders
    });

    const multipleStatistics = statsAfterOptionalEmpty.data.statistics.find(
        (item) => String(item.questionId) === String(multipleQuestionId)
    );

    assert.ok(multipleStatistics);
    assert.equal(multipleStatistics.totalAnswers, 0);
    assert.equal(statsAfterOptionalEmpty.data.totalResponses, 2);
    const otherUsername = `other_${Date.now()}`;

    const otherRegister = await request("/auth/register", {
        method: "POST",
        body: JSON.stringify({
            username: otherUsername,
            password
        })
    });

    const otherAuthHeaders = {
        Authorization: `Bearer ${otherRegister.data.token}`
    };

    let unauthorizedStatsFailed = false;

    try {
        await request(`/stats/${surveyId}`, {
            headers: otherAuthHeaders
        });
    } catch (error) {
        assert.equal(error.status, 404);
        assert.equal(error.body.success, false);
        assert.equal(error.body.message, "问卷不存在");
        unauthorizedStatsFailed = true;
    }

    assert.equal(unauthorizedStatsFailed, true);
    const privateSurvey = await request("/surveys", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
            title: "非匿名提交测试问卷",
            description: "测试未登录用户不能提交",
            allowAnonymous: false,
            allowMultipleSubmissions: false
        })
    });

    const privateSurveyId = privateSurvey.data._id;

    const privateQuestion = await request(
        `/surveys/${privateSurveyId}/questions`,
        {
            method: "POST",
            headers: authHeaders,
            body: JSON.stringify({
                type: "single",
                title: "非匿名测试题目",
                required: true,
                options: [
                    { label: "允许", value: "yes" },
                    { label: "不允许", value: "no" }
                ]
            })
        }
    );

    const privatePublished = await request(
        `/surveys/${privateSurveyId}/publish`,
        {
            method: "POST",
            headers: authHeaders
        }
    );

    const privateAccessCode = privatePublished.data.survey.accessCode;

    let anonymousPrivateSubmitFailed = false;

    try {
        await request(`/responses/${privateAccessCode}`, {
            method: "POST",
            body: JSON.stringify({
                answers: [
                    {
                        questionId: privateQuestion.data._id,
                        value: "yes"
                    }
                ]
            })
        });
    } catch (error) {
        assert.equal(error.status, 401);
        assert.equal(error.body.success, false);
        assert.equal(
            error.body.message,
            "该问卷要求登录后填写"
        );
        anonymousPrivateSubmitFailed = true;
    }

    assert.equal(anonymousPrivateSubmitFailed, true);
    const authenticatedPrivateSubmit = await request(
        `/responses/${privateAccessCode}`,
        {
            method: "POST",
            headers: authHeaders,
            body: JSON.stringify({
                answers: [
                    {
                        questionId: privateQuestion.data._id,
                        value: "yes"
                    }
                ]
            })
        }
    );

    assert.equal(authenticatedPrivateSubmit.success, true);

    let duplicatePrivateSubmitFailed = false;

    try {
        await request(`/responses/${privateAccessCode}`, {
            method: "POST",
            headers: authHeaders,
            body: JSON.stringify({
                answers: [
                    {
                        questionId: privateQuestion.data._id,
                        value: "yes"
                    }
                ]
            })
        });
    } catch (error) {
        assert.equal(error.status, 409);
        assert.equal(error.body.success, false);
        assert.equal(
            error.body.message,
            "你已经提交过该问卷，不能重复提交"
        );
        duplicatePrivateSubmitFailed = true;
    }

    assert.equal(duplicatePrivateSubmitFailed, true);

    await request(`/surveys/${privateSurveyId}/close`, {
        method: "POST",
        headers: authHeaders
    });

    let closedSurveySubmitFailed = false;

    try {
        await request(`/responses/${privateAccessCode}`, {
            method: "POST",
            headers: authHeaders,
            body: JSON.stringify({
                answers: [
                    {
                        questionId: privateQuestion.data._id,
                        value: "yes"
                    }
                ]
            })
        });
    } catch (error) {
        closedSurveySubmitFailed = true;
    }

    assert.equal(closedSurveySubmitFailed, true);
    let closedSurveyRepublishFailed = false;

    try {
        await request(`/surveys/${privateSurveyId}/publish`, {
            method: "POST",
            headers: authHeaders
        });
    } catch (error) {
        closedSurveyRepublishFailed = true;
    }

    assert.equal(closedSurveyRepublishFailed, true);
    const deadlineSurvey = await request("/surveys", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
            title: "截止时间测试问卷",
            description: "测试问卷过期后不能提交",
            allowAnonymous: true
        })
    });

    const deadlineSurveyId = deadlineSurvey.data._id;

    const deadlineQuestion = await request(
        `/surveys/${deadlineSurveyId}/questions`,
        {
            method: "POST",
            headers: authHeaders,
            body: JSON.stringify({
                type: "text",
                title: "截止时间测试题目",
                required: true,
                validation: {
                    minLength: 1,
                    maxLength: 100
                }
            })
        }
    );

    const deadlinePublished = await request(
        `/surveys/${deadlineSurveyId}/publish`,
        {
            method: "POST",
            headers: authHeaders
        }
    );

    const deadlineAccessCode = deadlinePublished.data.survey.accessCode;

    await request(`/surveys/${deadlineSurveyId}`, {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({
            deadline: new Date(Date.now() - 60 * 1000).toISOString()
        })
    });

    let expiredSurveySubmitFailed = false;

    try {
        await request(`/responses/${deadlineAccessCode}`, {
            method: "POST",
            body: JSON.stringify({
                answers: [
                    {
                        questionId: deadlineQuestion.data._id,
                        value: "过期测试答案"
                    }
                ]
            })
        });
    } catch (error) {
        expiredSurveySubmitFailed = true;
    }

    assert.equal(expiredSurveySubmitFailed, true);
    const skipSurvey = await request("/surveys", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
            title: "跳过必答题测试问卷",
            description: "测试条件跳转后的必答校验",
            allowAnonymous: true
        })
    });

    const skipSurveyId = skipSurvey.data._id;

    const skipSourceQuestion = await request(
        `/surveys/${skipSurveyId}/questions`,
        {
            method: "POST",
            headers: authHeaders,
            body: JSON.stringify({
                type: "single",
                title: "是否跳过下一题",
                required: true,
                options: [
                    { label: "跳过", value: "skip" },
                    { label: "不跳过", value: "keep" }
                ]
            })
        }
    );

    const skippedRequiredQuestion = await request(
        `/surveys/${skipSurveyId}/questions`,
        {
            method: "POST",
            headers: authHeaders,
            body: JSON.stringify({
                type: "text",
                title: "被跳过的必答题",
                required: true,
                validation: {
                    minLength: 1,
                    maxLength: 100
                }
            })
        }
    );

    const skipTargetQuestion = await request(
        `/surveys/${skipSurveyId}/questions`,
        {
            method: "POST",
            headers: authHeaders,
            body: JSON.stringify({
                type: "text",
                title: "跳转后的题目",
                required: true,
                validation: {
                    minLength: 1,
                    maxLength: 100
                }
            })
        }
    );

    await request(`/surveys/${skipSurveyId}/jump-rules`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
            sourceQuestionId: skipSourceQuestion.data._id,
            targetQuestionId: skipTargetQuestion.data._id,
            operator: "equals",
            expectedValue: "skip"
        })
    });

    const skipPublished = await request(
        `/surveys/${skipSurveyId}/publish`,
        {
            method: "POST",
            headers: authHeaders
        }
    );

    const skipAccessCode = skipPublished.data.survey.accessCode;

    const skipResponse = await request(`/responses/${skipAccessCode}`, {
        method: "POST",
        body: JSON.stringify({
            answers: [
                {
                    questionId: skipSourceQuestion.data._id,
                    value: "skip"
                },
                {
                    questionId: skipTargetQuestion.data._id,
                    value: "这是跳转后的答案"
                }
            ]
        })
    });

    assert.equal(skipResponse.success, true);
    const requiredMultipleSurvey = await request("/surveys", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
            title: "必答多选题测试问卷",
            description: "测试必答多选题不能提交空数组",
            allowAnonymous: true
        })
    });

    const requiredMultipleSurveyId = requiredMultipleSurvey.data._id;

    const requiredMultipleQuestion = await request(
        `/surveys/${requiredMultipleSurveyId}/questions`,
        {
            method: "POST",
            headers: authHeaders,
            body: JSON.stringify({
                type: "multiple",
                title: "请选择至少一个选项",
                required: true,
                options: [
                    {
                        label: "选项A",
                        value: "A"
                    },
                    {
                        label: "选项B",
                        value: "B"
                    }
                ],
                validation: {
                    exactSelections: 2
                }
            })
        }
    );

    const requiredMultiplePublished = await request(
        `/surveys/${requiredMultipleSurveyId}/publish`,
        {
            method: "POST",
            headers: authHeaders
        }
    );

    const requiredMultipleAccessCode =
        requiredMultiplePublished.data.survey.accessCode;

    let requiredMultipleEmptyFailed = false;

    try {
        await request(`/responses/${requiredMultipleAccessCode}`, {
            method: "POST",
            body: JSON.stringify({
                answers: [
                    {
                        questionId: requiredMultipleQuestion.data._id,
                        value: []
                    }
                ]
            })
        });
    } catch (error) {
        requiredMultipleEmptyFailed = true;
    }

    assert.equal(requiredMultipleEmptyFailed, true);
    let requiredMultipleExactFailed = false;

    try {
        await request(`/responses/${requiredMultipleAccessCode}`, {
            method: "POST",
            body: JSON.stringify({
                answers: [
                    {
                        questionId: requiredMultipleQuestion.data._id,
                        value: ["A"]
                    }
                ]
            })
        });
    } catch (error) {
        requiredMultipleExactFailed = true;
    }

    assert.equal(requiredMultipleExactFailed, true);

    const requiredMultipleExactSuccess = await request(
        `/responses/${requiredMultipleAccessCode}`,
        {
            method: "POST",
            body: JSON.stringify({
                answers: [
                    {
                        questionId: requiredMultipleQuestion.data._id,
                        value: ["A", "B"]
                    }
                ]
            })
        }
    );

    assert.equal(requiredMultipleExactSuccess.success, true);
    let duplicateRegisterFailed = false;

    try {
        await request("/auth/register", {
            method: "POST",
            body: JSON.stringify({ username, password })
        });
    } catch (error) {
        assert.equal(error.status, 409);
        assert.equal(error.body.success, false);
        assert.equal(error.body.message, "用户名已存在");
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
    let unknownQuestionFailed = false;

    try {
        await request(`/responses/${accessCode}`, {
            method: "POST",
            body: JSON.stringify({
                answers: [
                    {
                        questionId: "000000000000000000000000",
                        value: "unknown"
                    }
                ]
            })
        });
    } catch (error) {
        unknownQuestionFailed = true;
    }

    assert.equal(unknownQuestionFailed, true);

    let duplicateSubmittedAnswerFailed = false;

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
                        questionId: singleQuestion.data._id,
                        value: "B"
                    },
                    {
                        questionId: numberQuestion.data._id,
                        value: 20
                    },
                    {
                        questionId: textQuestion.data._id,
                        value: "有效文本"
                    }
                ]
            })
        });
    } catch (error) {
        duplicateSubmittedAnswerFailed = true;
    }

    assert.equal(duplicateSubmittedAnswerFailed, true);

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
    let multipleMaxSelectionFailed = false;

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
                        value: ["apple", "banana", "watermelon"]
                    }
                ]
            })
        });
    } catch (error) {
        multipleMaxSelectionFailed = true;
    }

    assert.equal(multipleMaxSelectionFailed, true);

    let multipleMinSelectionFailed = false;

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
                        value: []
                    }
                ]
            })
        });
    } catch (error) {
        multipleMinSelectionFailed = true;
    }

    assert.equal(multipleMinSelectionFailed, true);
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
    let textMinLengthFailed = false;

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
                        value: "x"
                    }
                ]
            })
        });
    } catch (error) {
        textMinLengthFailed = true;
    }

    assert.equal(textMinLengthFailed, true);

    let textMaxLengthFailed = false;

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
                        value: "x".repeat(101)
                    }
                ]
            })
        });
    } catch (error) {
        textMaxLengthFailed = true;
    }

    assert.equal(textMaxLengthFailed, true);
    let numberMinValueFailed = false;

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
                        value: -1
                    },
                    {
                        questionId: textQuestion.data._id,
                        value: "有效文本"
                    }
                ]
            })
        });
    } catch (error) {
        numberMinValueFailed = true;
    }

    assert.equal(numberMinValueFailed, true);

    let numberMaxValueFailed = false;

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
                        value: 121
                    },
                    {
                        questionId: textQuestion.data._id,
                        value: "有效文本"
                    }
                ]
            })
        });
    } catch (error) {
        numberMaxValueFailed = true;
    }

    assert.equal(numberMaxValueFailed, true);

    let numberIntegerFailed = false;

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
                        value: 20.5
                    },
                    {
                        questionId: textQuestion.data._id,
                        value: "有效文本"
                    }
                ]
            })
        });
    } catch (error) {
        numberIntegerFailed = true;
    }

    assert.equal(numberIntegerFailed, true);
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
        assert.equal(error.status, 401);
        assert.equal(error.body.success, false);
        assert.equal(
            error.body.message,
            "登录凭证无效或已过期"
        );
        invalidTokenFailed = true;
    }

    assert.equal(invalidTokenFailed, true);

    console.log("所有自动化测试通过");
}

run().catch((error) => {
    console.error("自动化测试失败：", error.message);
    process.exit(1);
});