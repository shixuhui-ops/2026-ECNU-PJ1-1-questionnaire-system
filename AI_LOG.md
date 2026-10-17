# AI 编程使用日志

## 一、AI 使用概述

本项目主要使用 ChatGPT / Codex 辅助完成需求分析、MongoDB 数据建模、Express 后端开发、测试编写、问题排查和项目文档整理。

AI 主要承担以下辅助工作：

- 分析项目需求
- 设计 MongoDB 集合和字段
- 生成 Express 路由和中间件结构
- 设计题目校验逻辑
- 设计条件跳转逻辑
- 编写 API 自动化测试
- 分析测试失败原因
- 提供边界情况和安全问题检查建议
- 协助整理项目报告和 README

AI 生成的代码没有直接作为最终结果使用，所有代码都经过人工检查、修改、运行和测试。

---

## 二、AI 工具和使用方式

- 主要工具：ChatGPT / Codex
- 使用方式：对话式需求分析、代码生成、代码审查和错误排查
- 编程语言：JavaScript
- 后端框架：Express
- 数据库：MongoDB
- 数据库框架：Mongoose
- 测试方式：Node.js API 自动化测试和手工接口测试

---

## 三、详细使用记录

### 记录 1：项目结构设计

- 工具：ChatGPT
- 任务：根据 MongoDB 在线问卷系统需求设计 Node.js 项目目录结构
- 提示词：

```text
请根据 MongoDB 在线问卷系统需求设计 Node.js 项目目录结构，
系统需要支持用户注册登录、问卷创建、题目管理、条件跳转、
问卷提交和统计功能。
```

- AI 输出内容：

AI 建议按照后端、前端、模型、路由、中间件和测试目录进行组织，并将用户、问卷、回答分别建模。

- 采用内容：

```text
backend/src/models
backend/src/routes
backend/src/middleware
backend/tests
frontend
```

- 人工修改：

  - 根据课程要求增加前端目录
  - 增加 MongoDB 本地数据目录
  - 增加 API 文档、测试用例和项目报告文件
  - 根据实际文件结构调整启动方式

- 使用结果：采用并经过人工调整。

---

### 记录 2：用户模型设计

- 工具：ChatGPT
- 任务：设计支持注册和登录的 MongoDB 用户模型
- 提示词：

```text
请设计一个支持注册和登录的 MongoDB 用户模型，
需要保存用户名、密码和注册时间，并考虑用户名唯一性和密码安全。
```

- AI 输出内容：

AI 建议使用 `username`、密码哈希字段和时间戳，并使用唯一索引保证用户名唯一。

- 最终实现：

```js
username
passwordHash
createdAt
updatedAt
```

- 人工修改：

  - 使用 `bcryptjs` 保存密码哈希
  - 设置用户名长度为 3 到 30 个字符
  - 增加唯一索引
  - 不向客户端返回密码哈希
  - 增加重复用户名处理

- 使用结果：采用并经过人工修改。

---

### 记录 3：JWT 登录认证

- 工具：ChatGPT
- 任务：设计 Express JWT 登录认证中间件
- 提示词：

```text
请为 Express 项目设计 JWT 登录认证中间件。
要求支持 Bearer Token，验证 Token 后查询用户，
无效 Token 和过期 Token 返回 401。
```

- AI 输出内容：

AI 提供了 JWT 签发、Bearer Token 解析、Token 验证和用户查询的基本实现。

- 人工修改：

  - 增加用户是否存在的检查
  - 统一返回 401 状态码
  - 在注册和登录接口中返回 Token
  - 为问卷管理和统计接口增加权限保护
  - 修复无效提交 Token 被当成匿名用户的问题

- 使用结果：采用并经过测试。

---

### 记录 4：MongoDB 问卷 Schema 设计

- 工具：ChatGPT
- 任务：设计问卷、题目和跳转规则的数据结构
- 提示词：

```text
请设计一个基于 MongoDB 的问卷系统 Schema，
支持单选题、多选题、文本题、数字题和条件跳转。
题目和跳转规则是否适合嵌入问卷文档，请说明原因。
```

- AI 输出内容：

AI 建议使用三个集合：

```text
users
surveys
responses
```

其中题目和跳转规则嵌入 `surveys` 文档，回答记录单独存储。

- 人工设计和修改：

  - `users` 保存用户账号信息
  - `surveys` 保存问卷、题目和跳转规则
  - `responses` 保存每次提交
  - 题目使用嵌入式结构
  - 回答使用引用问卷的方式保存
  - 对 `ownerId`、`accessCode`、`surveyId` 和提交时间建立索引

- 使用结果：采用。

---

### 记录 5：题目类型和校验设计

- 工具：ChatGPT
- 任务：设计四种题型的统一校验逻辑
- 提示词：

```text
请实现问卷系统中单选题、多选题、文本题和数字题的答案校验。
要求支持必答、选项合法性、多选数量、文本长度、数字范围和整数校验。
```

- AI 输出内容：

AI 建议实现统一的 `validateAnswer(question, value)` 函数，根据题目类型执行不同校验。

- 人工修改：

  - 增加必答题判断
  - 增加单选题选项合法性检查
  - 增加多选题最少、最多和固定选择数量检查
  - 增加多选题重复选项检查
  - 增加文本最小和最大长度检查
  - 增加数字最小值、最大值和整数检查
  - 增加空白文本检查，防止使用空格绕过必答校验

- 使用结果：采用并通过自动化测试。

---

### 记录 6：条件跳转逻辑

- 工具：ChatGPT
- 任务：设计动态条件跳转逻辑
- 提示词：

```text
请设计问卷条件跳转逻辑。
支持单选题等于、多选题包含、数字题大于或小于等条件，
跳转规则需要保存在数据库中，不能写死在程序里。
```

- AI 输出内容：

AI 建议将跳转规则保存为：

```text
sourceQuestionId
operator
expectedValue
targetQuestionId
```

并根据当前答案计算下一道题。

- 人工修改：

  - 将跳转规则保存到 `surveys.jumpRules`
  - 增加单选、 多选和数字比较
  - 增加题目 ID 存在性校验
  - 增加题型和运算符匹配校验
  - 禁止跳转到当前题目
  - 禁止重复添加相同规则
  - 提交时只校验实际可达路径上的题目

- 使用结果：采用并通过跳转测试。

---

### 记录 7：统计接口

- 工具：ChatGPT
- 任务：设计问卷统计接口
- 提示词：

```text
请实现 MongoDB 问卷统计接口。
单选题统计每个选项数量，多选题统计每个选项被选择次数，
文本题返回所有内容，数字题返回平均值和全部数字。
统计接口只能由问卷创建者访问。
```

- AI 输出内容：

AI 建议先查询问卷，再查询对应回答，按照题目类型计算统计结果。

- 人工修改：

  - 增加问卷所有者权限校验
  - 单选题返回各选项数量
  - 多选题按数组元素统计
  - 文本题返回全部文本内容
  - 数字题过滤非法数字并计算平均值
  - 返回总回答数量
  - 增加越权访问测试

- 使用结果：采用并通过统计测试。

---

### 记录 8：API 自动化测试

- 工具：ChatGPT
- 任务：编写问卷系统主流程测试
- 提示词：

```text
请为问卷系统编写 Node.js API 自动化测试，
覆盖注册、登录、创建问卷、添加题目、配置跳转、
发布、公开访问、提交和统计。
```

- AI 输出内容：

AI 生成了基于 `fetch` 的接口测试流程。

- 人工修改：

  - 增加请求头 `Content-Type: application/json`
  - 增加 Bearer Token
  - 增加跳转测试
  - 增加重复注册测试
  - 增加无效答案测试
  - 增加非法题目范围测试
  - 增加无效 Token 测试
  - 增加重复选项和重复跳转规则测试

- 使用结果：主流程测试通过。

---

### 记录 9：测试请求头问题排查

- 工具：ChatGPT
- 任务：排查自动化测试请求体为空的问题
- 问题现象：

创建问卷接口提示标题为空，但测试代码已经传入标题。

- 提示词：

```text
Express API 测试中请求体为空，
请分析 fetch 请求配置和 Content-Type 可能存在的问题。
```

- AI 分析：

可能原因是多个 `fetch` 配置对象合并时，后面的 `headers` 覆盖了前面的 JSON 请求头。

- 人工修改：

  - 调整 `fetch` 配置顺序
  - 确保 `Content-Type: application/json`
  - 确保请求体使用 `JSON.stringify`
  - 重新运行测试

- 验证结果：

```text
所有自动化测试通过
```

---

### 记录 10：跳过题目时的必答校验问题

- 工具：ChatGPT
- 任务：修复跳转后被跳过的必答题仍然阻塞提交的问题
- 问题现象：

题目被跳转规则跳过后，提交接口仍然校验该题，导致无法提交。

- 提示词：

```text
问卷存在条件跳转时，如何只校验实际到达路径上的必答题，
同时保留其他题目的数据完整性？
```

- AI 分析：

提交时需要先根据答案计算可达题目集合，再只校验可达题目。

- 人工修改：

  - 增加 `reachableQuestionIds`
  - 从第一题开始计算实际路径
  - 只校验可达题目
  - 防止跳转循环导致死循环

- 验证结果：

跳转测试和提交测试通过。

---

### 记录 11：自动化测试一键启动

- 工具：ChatGPT / Codex
- 用户需求：

```text
补充测试一键启动全部依赖。
```

- 实现内容：

新增：

```text
backend/tests/run-all-tests.js
```

脚本功能：

- 启动 MongoDB
- 启动 Node.js 后端
- 等待 `/api/health` 返回成功
- 执行 `tests/api.test.js`
- 测试结束后清理本次启动的进程
- 将测试 API 地址设置为 `127.0.0.1`

- `package.json` 增加：

```json
"test:all": "node tests/run-all-tests.js"
```

- 验证命令：

```powershell
Set-Location .\backend
npm run test:all
```

- 验证结果：

```text
所有自动化测试通过
```

---

### 记录 12：跨平台 MongoDB 配置

- 工具：ChatGPT / Codex
- 用户需求：

```text
补充跨平台测试支持。
```

- 原始实现问题：

测试脚本直接写死：

```js
startProcess("mongod", [...]);
```

- 修改内容：

```js
const mongodCommand = process.env.MONGOD_BIN || "mongod";
startProcess(mongodCommand, [...]);
```

- Windows 使用方式：

```powershell
$env:MONGOD_BIN="D:\MongoDB\bin\mongod.exe"
npm run test:all
```

- Linux 使用方式：

```bash
export MONGOD_BIN=/usr/bin/mongod
npm run test:all
```

- macOS 使用方式：

```bash
export MONGOD_BIN=/opt/homebrew/bin/mongod
npm run test:all
```

- 人工修改：

  - 使用 Node.js `path` 处理目录路径
  - 使用 `process.execPath` 启动当前 Node.js
  - 使用环境变量配置 MongoDB 路径
  - 在 README 中增加 Windows、Linux 和 macOS 说明

- 验证结果：

Windows 环境下执行：

```powershell
npm run test:all
```

结果：

```text
所有自动化测试通过
```

---

### 记录 13：多选题重复选项校验

- 工具：ChatGPT / Codex
- 任务：修复重复多选答案
- 问题：

提交：

```json
{
  "value": ["apple", "apple"]
}
```

不应被视为两个有效选择。

- 修改内容：

```js
if (new Set(value).size !== value.length) {
    return "多选答案不能包含重复选项";
}
```

- 测试内容：

增加重复多选答案测试。

- 验证结果：

重复选项提交被正确拒绝，自动化测试通过。

---

### 记录 14：题目选项值校验

- 工具：ChatGPT / Codex
- 任务：避免不同选项使用相同 value
- 修改内容：

```js
const optionValues = question.options.map((item) =>
    String(item.value || "").trim()
);

if (optionValues.some((value) => !value)) {
    return "选项值不能为空";
}

if (new Set(optionValues).size !== optionValues.length) {
    return "选项值不能重复";
}
```

- 测试内容：

尝试创建两个 `value` 相同的选项。

- 验证结果：

重复选项值被拒绝，自动化测试通过。

---

### 记录 15：题目限制关系校验

- 工具：ChatGPT / Codex
- 任务：防止创建互相矛盾的校验配置
- 修改内容：

增加以下检查：

- 多选题最少数量不能大于最多数量
- 固定数量不能小于最少数量
- 固定数量不能大于最多数量
- 文本最小长度不能大于最大长度
- 数字最小值不能大于最大值

- 测试内容：

创建非法数字范围：

```json
{
  "minValue": 100,
  "maxValue": 10
}
```

- 验证结果：

非法范围被拒绝，自动化测试通过。

---

### 记录 16：跳转规则安全校验

- 工具：ChatGPT / Codex
- 任务：防止无效跳转规则影响问卷流程
- 修改内容：

增加以下校验：

- `contains` 只允许用于多选题
- 数值比较只允许用于数字题
- 源题目和目标题目必须存在
- 禁止跳转到自身
- 禁止添加重复规则

- 验证结果：

非法跳转规则、自跳转规则和重复规则均被拒绝。

---

### 记录 17：无效 JWT 处理

- 工具：ChatGPT / Codex
- 问题：

匿名问卷携带错误 Token 时，旧逻辑会把请求降级为匿名提交。

- 修改前逻辑：

```js
catch (error) {
    respondentId = null;
}
```

- 修改后逻辑：

```js
catch (error) {
    return res.status(401).json({
        success: false,
        message: "登录凭证无效或已过期"
    });
}
```

- 验证结果：

无效 Token 提交被拒绝，自动化测试通过。

---

### 记录 18：截止时间校验

- 工具：ChatGPT / Codex
- 任务：完善问卷截止时间行为
- 修改内容：

在以下位置增加截止时间校验：

- 创建问卷
- 修改问卷
- 发布问卷
- 获取下一题
- 提交问卷

- 额外校验：

```js
if (Number.isNaN(deadline.getTime())) {
    return res.status(400).json({
        success: false,
        message: "截止时间格式无效"
    });
}
```

- 验证结果：

非法日期被拒绝，过期问卷不能正常填写。

---

### 记录 19：错误信息安全处理

- 工具：ChatGPT / Codex
- 问题：

问卷创建失败时，旧代码向客户端返回：

```js
detail: error.stack
```

这可能暴露服务器路径和内部实现。

- 修改内容：

删除错误堆栈返回，只返回通用错误信息：

```js
res.status(500).json({
    success: false,
    message: "创建问卷失败"
});
```

- 验证结果：

接口仍能正确返回错误状态，但不再泄露服务器堆栈。

---

### 记录 20：布尔字段校验

- 工具：ChatGPT / Codex
- 问题：

JavaScript 中：

```js
Boolean("false") === true
```

因此字符串 `"false"` 可能错误地开启匿名填写。

- 修改内容：

创建问卷时使用严格判断：

```js
allowAnonymous: body.allowAnonymous === true
```

并在修改问卷时验证：

```js
if (typeof req.body.allowAnonymous !== "boolean") {
    return res.status(400).json({
        success: false,
        message: "allowAnonymous 必须是布尔值"
    });
}
```

- 验证结果：

非法字符串配置被拒绝，自动化测试通过。

---

## 四、AI 生成代码的问题和人工修正

AI 生成代码不能直接保证满足项目要求，实际开发中发现并修正了以下问题：

### 1. 测试无法连接服务

AI 初始建议只执行：

```powershell
npm test
```

但测试脚本不会自动启动服务，因此会出现：

```text
fetch failed
```

人工处理：

- 检查 MongoDB 和 Node.js 服务状态
- 启动 MongoDB
- 启动后端
- 将测试地址改为 `127.0.0.1`
- 增加一键测试脚本

### 2. 跳转校验不完整

初始逻辑允许不匹配的题型使用跳转运算符。

人工处理：

- 增加题型和运算符校验
- 禁止自跳转
- 禁止重复跳转规则

### 3. 多选题允许重复答案

人工处理：

```js
new Set(value).size !== value.length
```

### 4. 无效 Token 被当作匿名用户

人工处理：

- 无效 Token 直接返回 401
- 不再自动降级为匿名提交

### 5. 错误信息暴露服务器堆栈

人工处理：

- 删除 `error.stack` 的响应字段
- 保留服务器端错误日志
- 对客户端返回通用错误信息

### 6. 字符串布尔值转换错误

人工处理：

- 严格判断 `allowAnonymous === true`
- 修改接口拒绝非布尔值

---

## 五、人工完成的主要工作

以下工作由人工完成或最终确认：

- 根据课程要求确定功能范围
- 决定使用 `users`、`surveys`、`responses` 三个集合
- 决定题目和跳转规则嵌入问卷文档
- 确定匿名填写、截止时间和关闭状态的业务规则
- 检查 AI 生成的代码
- 修复请求头和测试启动问题
- 修复跳转路径和必答题校验问题
- 增加安全性和边界条件校验
- 编写和补充自动化测试
- 运行完整测试并确认结果
- 编写 README、API 文档和项目报告

---

## 六、测试验证记录

### 原始 API 测试

执行：

```powershell
Set-Location .\backend
npm test
```

结果：

```text
所有自动化测试通过
```

### 一键测试

执行：

```powershell
Set-Location .\backend
npm run test:all
```

结果：

```text
所有自动化测试通过
```

### 覆盖的主要测试场景

- 注册和登录
- 重复注册
- 创建问卷
- 四种题型
- 必答校验
- 多选数量校验
- 重复选项校验
- 文本长度校验
- 数字范围校验
- 条件跳转
- 非法跳转规则
- 自跳转规则
- 重复跳转规则
- 匿名提交
- 非匿名提交
- 无效 Token
- 问卷截止时间
- 关闭问卷
- 统计结果
- 越权访问统计
- 非法日期
- 非法匿名配置

---

## 七、AI 使用评价

### AI 帮助较大的部分

- 快速搭建 Express 项目结构
- 设计 MongoDB 文档结构
- 生成基础路由和中间件
- 提供题目校验思路
- 提供统计接口思路
- 生成自动化测试初稿
- 分析测试失败原因
- 发现边界条件和安全风险

### AI 不足的部分

- 初始测试方案没有自动启动依赖
- 部分校验逻辑只覆盖正常情况
- 没有自动发现所有业务边界问题
- 部分生成代码需要结合实际项目重新组织
- AI 无法替代真实服务启动和接口验证
- AI 生成的中文错误信息和文档需要人工统一

### 最终结论

AI 主要用于提高开发效率和提供实现思路，最终系统设计、代码修改、错误排查、测试验证和文档整理均经过人工参与。

项目最终结果以实际运行效果和自动化测试结果为准，而不是以 AI 生成代码本身为准。