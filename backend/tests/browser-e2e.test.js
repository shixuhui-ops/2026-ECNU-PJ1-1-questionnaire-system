const assert = require("node:assert/strict");
const { chromium } = require("playwright");

const frontendBaseUrl =
    process.env.FRONTEND_BASE_URL || "http://127.0.0.1:5500/frontend";

async function run() {
    const browser = await chromium.launch({
        headless: true
    });

    const context = await browser.newContext();
    const page = await context.newPage();

    const username = `br${Date.now().toString().slice(-8)}`;
    const password = "123456";
    const surveyTitle = `浏览器端到端测试问卷_${Date.now()}`;

    page.on("pageerror", (error) => {
        console.error("浏览器页面错误：", error.message);
    });

    page.on("console", (message) => {
        if (message.type() === "error") {
            console.error("浏览器控制台错误：", message.text());
        }
    });

    page.on("request", (request) => {
        if (
            request.method() === "POST" &&
            request.url().includes("/api/surveys")
        ) {
            console.log("问卷请求体：", request.postData());
        }
    });

    page.on("response", async (response) => {
        if (response.status() >= 400) {
            let responseBody = "";

            try {
                responseBody = await response.text();
            } catch (error) {
                responseBody = "<无法读取响应内容>";
            }

            console.error(
                "HTTP错误响应：",
                response.status(),
                response.request().method(),
                response.url(),
                responseBody
            );
        }
    });

    try {
        await page.goto(`${frontendBaseUrl}/index.html`, {
            waitUntil: "domcontentloaded"
        });

        await page.fill("#username", username);
        await page.fill("#password", password);
        await page.click("#registerButton");

        await page.waitForSelector("#dashboardSection:not(.hidden)", {
            state: "visible"
        });

        const titleInput = page.locator(
            "#dashboardSection input#surveyTitle"
        );
        const descriptionInput = page.locator(
            "#dashboardSection textarea#surveyDescription"
        );

        await titleInput.fill(surveyTitle);
        await descriptionInput.fill("浏览器端到端测试");

        await page.check("#dashboardSection #allowAnonymous");
        await page.check(
            "#dashboardSection #allowMultipleSubmissions"
        );

        await page.evaluate(
            ({ expectedTitle, expectedDescription }) => {
                const titleElement =
                    document.querySelector("#dashboardSection #surveyTitle");
                const descriptionElement = document.querySelector(
                    "#dashboardSection #surveyDescription"
                );

                titleElement.value = expectedTitle;
                descriptionElement.value = expectedDescription;

                titleElement.dispatchEvent(
                    new Event("input", { bubbles: true })
                );
                descriptionElement.dispatchEvent(
                    new Event("input", { bubbles: true })
                );
                titleElement.dispatchEvent(
                    new Event("change", { bubbles: true })
                );
                descriptionElement.dispatchEvent(
                    new Event("change", { bubbles: true })
                );
            },
            {
                expectedTitle: surveyTitle,
                expectedDescription: "浏览器端到端测试"
            }
        );

        assert.equal(await titleInput.inputValue(), surveyTitle);
        assert.equal(
            await descriptionInput.inputValue(),
            "浏览器端到端测试"
        );

        const duplicateIdState = await page.evaluate(() => ({
            surveyTitles: [...document.querySelectorAll("#surveyTitle")].map(
                (element) => ({
                    value: element.value,
                    visible: Boolean(
                        element.offsetWidth ||
                        element.offsetHeight ||
                        element.getClientRects().length
                    )
                })
            ),
            surveyDescriptions: [
                ...document.querySelectorAll("#surveyDescription")
            ].map((element) => ({
                value: element.value,
                visible: Boolean(
                    element.offsetWidth ||
                    element.offsetHeight ||
                    element.getClientRects().length
                )
            })),
            anonymousInputs: [
                ...document.querySelectorAll("#allowAnonymous")
            ].map((element) => ({
                checked: element.checked,
                visible: Boolean(
                    element.offsetWidth ||
                    element.offsetHeight ||
                    element.getClientRects().length
                )
            })),
            repeatInputs: [
                ...document.querySelectorAll("#allowMultipleSubmissions")
            ].map((element) => ({
                checked: element.checked,
                visible: Boolean(
                    element.offsetWidth ||
                    element.offsetHeight ||
                    element.getClientRects().length
                )
            }))
        }));

        console.log(
            "页面重复 ID 状态：",
            JSON.stringify(duplicateIdState, null, 2)
        );

        await page.evaluate(async () => {
            if (typeof createSurvey !== "function") {
                throw new Error("页面中找不到 createSurvey 函数");
            }

            await createSurvey();
        });

        await page.waitForTimeout(1000);

        await page.reload({
            waitUntil: "domcontentloaded"
        });

        await page.waitForSelector("#dashboardSection:not(.hidden)", {
            state: "visible",
            timeout: 30000
        });

        await page.waitForFunction(
            (expectedTitle) => {
                const surveyItems = [
                    ...document.querySelectorAll(".survey-item")
                ];

                return surveyItems.some((item) =>
                    item.textContent.includes(expectedTitle)
                );
            },
            surveyTitle,
            {
                timeout: 30000
            }
        );

        const surveyText = await page
            .locator(".survey-item")
            .first()
            .innerText();

        const surveyIdMatch = surveyText.match(
            /问卷ID：([a-f0-9]{24})/i
        );

        assert.ok(surveyIdMatch, "无法获取问卷 ID");

        const surveyId = surveyIdMatch[1];

        await page.goto(`${frontendBaseUrl}/manage.html`, {
            waitUntil: "domcontentloaded"
        });

        await page.fill("#surveyId", surveyId);
        await page.click("#loadButton");

        await page.waitForSelector("#questionList", {
            state: "attached"
        });

        await page.fill("#questionTitle", "浏览器测试单选题");
        await page.selectOption("#questionType", "single");
        await page.fill("#questionOptions", "选项A\n选项B");
        await page.check("#questionRequired");
        await page.click("#addQuestionButton");

        await page.waitForFunction(() =>
            document
                .querySelector("#questionList")
                ?.textContent.includes("浏览器测试单选题")
        );

        await page.click("#publishButton");

        await page.waitForFunction(() =>
            document
                .querySelector("#accessUrl")
                ?.textContent.includes("fill.html?code=")
        );

        const accessUrlText = await page
            .locator("#accessUrl")
            .innerText();

        const accessCodeMatch = accessUrlText.match(
            /code=([a-f0-9]+)/i
        );

        assert.ok(accessCodeMatch, "无法获取问卷访问码");

        const accessCode = accessCodeMatch[1];

        await page.goto(
            `${frontendBaseUrl}/fill.html?code=${accessCode}`,
            {
                waitUntil: "domcontentloaded"
            }
        );

        await page.waitForSelector("#questionContainer .question");
        await page.check('input[type="radio"][value="选项A"]');
        await page.click("#nextButton");

        try {
            await page.evaluate(() => {
                return new Promise((resolve, reject) => {
                    const deadline = Date.now() + 30000;

                    const trySubmit = () => {
                        const submitButton =
                            document.querySelector("#submitButton");

                        const available =
                            submitButton &&
                            !submitButton.classList.contains("hidden") &&
                            submitButton.offsetParent !== null &&
                            !submitButton.disabled;

                        if (available) {
                            submitButton.click();
                            resolve();
                            return;
                        }

                        if (Date.now() >= deadline) {
                            reject(
                                new Error(
                                    "提交按钮在 30 秒内未变为可用状态"
                                )
                            );
                            return;
                        }

                        setTimeout(trySubmit, 50);
                    };

                    trySubmit();
                });
            });
        } catch (error) {
            if (
                !error.message.includes(
                    "Execution context was destroyed"
                )
            ) {
                throw error;
            }
        }

        await page.waitForFunction(() =>
            document
                .querySelector("#message")
                ?.textContent.includes("问卷提交成功")
        );

        await page.goto(`${frontendBaseUrl}/stats.html`, {
            waitUntil: "domcontentloaded"
        });

        await page.fill("#surveyId", surveyId);
        await page.click("#loadButton");

        await page.waitForFunction(() =>
            document
                .querySelector("#statistics")
                ?.textContent.includes("总回答数：1")
        );

        assert.match(
            await page.locator("#statistics").innerText(),
            /浏览器测试单选题/
        );

        console.log("浏览器端到端流程测试通过");
    } finally {
        await context.close();
        await browser.close();
    }
}

run().catch((error) => {
    console.error(
        "浏览器端到端流程测试失败：",
        error.message
    );
    process.exit(1);
});