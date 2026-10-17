# 基于 MongoDB 的在线问卷系统

这是一个基于 MongoDB、Node.js 和 Express 开发的在线问卷系统，支持用户注册登录、问卷创建、题目配置、条件跳转、问卷填写和统计分析。

## 一、项目功能

### 用户功能

- 用户注册
- 用户登录
- JWT 身份认证
- bcrypt 密码哈希
- 只能查看和管理自己创建的问卷

### 问卷功能

- 创建问卷
- 修改问卷标题、说明和截止时间
- 设置是否允许匿名填写
- 发布问卷
- 关闭问卷
- 生成问卷访问码
- 查看个人问卷列表

### 题目类型

- 单选题
- 多选题
- 文本填空题
- 数字填空题

### 校验功能

- 必答题校验
- 单选题选项校验
- 多选题最少、最多和固定选项数量校验
- 多选题重复选项校验
- 文本最小和最大长度校验
- 数字最小值和最大值校验
- 整数校验
- 选项值重复校验
- 无效配置校验

### 条件跳转

支持根据回答结果跳转到指定题目：

- 单选题等于判断
- 多选题包含判断
- 数字题大小比较
- 大于、小于、大于等于、小于等于
- 禁止跳转到当前题目
- 禁止重复添加相同跳转规则
- 跳转规则按照问卷数据动态配置

### 统计功能

问卷创建者可以查看：

- 总回答数量
- 单选题各选项数量
- 多选题各选项选择次数
- 文本题全部回答内容
- 数字题平均值和全部数字

## 二、技术栈

- Node.js
- Express
- MongoDB
- Mongoose
- JWT
- bcryptjs
- HTML
- CSS
- JavaScript

## 三、项目结构

```text
.
├── backend
│   ├── src
│   │   ├── middleware
│   │   ├── models
│   │   ├── routes
│   │   ├── app.js
│   │   └── server.js
│   ├── tests
│   │   ├── api.test.js
│   │   └── run-all-tests.js
│   ├── data
│   │   └── db
│   ├── .env.example
│   ├── package.json
│   └── package-lock.json
├── frontend
│   ├── index.html
│   ├── manage.html
│   ├── fill.html
│   └── stats.html
├── API.md
├── TEST_CASES.md
├── PROJECT_REPORT.md
└── AI_LOG.md
```

## 四、数据库设计

系统使用三个 MongoDB 集合。

### users

保存用户信息：

- `_id`
- `username`
- `passwordHash`
- `createdAt`
- `updatedAt`

### surveys

保存问卷信息：

- `ownerId`
- `title`
- `description`
- `accessCode`
- `allowAnonymous`
- `status`
- `deadline`
- `questions`
- `jumpRules`

题目和跳转规则嵌入问卷文档，因为它们只属于对应问卷，读取问卷时可以一次获取完整结构。

### responses

保存问卷提交记录：

- `surveyId`
- `respondentId`
- `anonymous`
- `answers`
- `submittedAt`

回答记录单独存储，便于多人提交和统计查询。

## 五、环境配置

进入后端目录：

```powershell
Set-Location .\backend
```

复制环境变量模板：

```powershell
Copy-Item .env.example .env
```

`.env` 示例：

```env
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/questionnaire_system
JWT_SECRET=please_replace_with_a_secure_secret
```

## 六、启动系统

### Windows

#### 1. 启动 MongoDB

在项目根目录打开 PowerShell：

```powershell
mongod --dbpath .\backend\data\db
```

如果 `mongod` 不在 PATH 中：

```powershell
& "D:\MongoDB\bin\mongod.exe" --dbpath .\backend\data\db
```

保持该窗口运行。

#### 2. 启动后端

打开新的 PowerShell：

```powershell
Set-Location .\backend
node src/server.js
```

后端默认地址：

```text
http://127.0.0.1:3000
```

健康检查接口：

```text
GET /api/health
```

#### 3. 启动前端

打开第三个 PowerShell：

```powershell
Set-Location .\frontend
python -m http.server 5500
```

浏览器访问：

```text
http://localhost:5500
```

### Linux/macOS

启动 MongoDB：

```bash
mongod --dbpath ./backend/data/db
```

启动后端：

```bash
cd backend
node src/server.js
```

启动前端：

```bash
cd frontend
python3 -m http.server 5500
```

浏览器访问：

```text
http://localhost:5500
```

## 七、一键自动化测试

推荐使用以下命令：

### Windows PowerShell

如果 `mongod` 已加入 PATH：

```powershell
Set-Location .\backend
npm run test:all
```

如果 MongoDB 不在 PATH 中：

```powershell
Set-Location .\backend
$env:MONGOD_BIN="D:\MongoDB\bin\mongod.exe"
npm run test:all
```

### Linux/macOS

如果 `mongod` 已加入 PATH：

```bash
cd backend
npm run test:all
```

如果 MongoDB 不在 PATH 中：

```bash
cd backend
export MONGOD_BIN=/usr/bin/mongod
npm run test:all
```

macOS 使用 Homebrew 安装 MongoDB 时：

```bash
cd backend
export MONGOD_BIN=/opt/homebrew/bin/mongod
npm run test:all
```

`npm run test:all` 会自动：

1. 启动 MongoDB
2. 启动后端服务
3. 等待健康检查通过
4. 执行 API 自动化测试
5. 输出测试结果
6. 清理本次启动的进程

成功时会输出：

```text
所有自动化测试通过
```

如果 MongoDB 和后端已经手动启动，也可以执行：

```powershell
npm test
```

## 八、测试覆盖范围

自动化测试覆盖：

- 用户注册
- 重复注册
- 错误登录
- 创建问卷
- 添加单选题
- 添加多选题
- 添加文本题
- 添加数字题
- 选项数量校验
- 重复选项校验
- 文本长度校验
- 数字范围校验
- 条件跳转
- 非法跳转规则
- 自身跳转规则
- 重复跳转规则
- 匿名提交
- 非匿名提交
- 无效 Token
- 截止时间校验
- 关闭问卷
- 统计结果
- 越权访问统计

测试用例详情见：

- `TEST_CASES.md`
- `backend/tests/api.test.js`

## 九、API 文档

完整 API 说明见：

```text
API.md
```

主要接口包括：

```text
POST /api/auth/register
POST /api/auth/login

POST /api/surveys
GET  /api/surveys/mine
GET  /api/surveys/:id
PATCH /api/surveys/:id
POST /api/surveys/:id/questions
POST /api/surveys/:id/jump-rules
POST /api/surveys/:id/publish
POST /api/surveys/:id/close

GET  /api/surveys/public/:accessCode
POST /api/surveys/public/:accessCode/next-question

POST /api/responses/:accessCode
GET  /api/stats/:surveyId
```

需要身份认证的接口使用：

```http
Authorization: Bearer <JWT_TOKEN>
```

## 十、项目文档

项目报告：

```text
PROJECT_REPORT.md
```

Word 版本：

```text
PROJECT_REPORT.docx
```

AI 使用日志：

```text
AI_LOG.md
```

项目测试用例：

```text
TEST_CASES.md
```

## 十一、注意事项

- MongoDB 必须正常运行后，后端才能连接数据库。
- `npm run test:all` 会自动启动测试所需的 MongoDB 和后端服务。
- 不要在多个终端重复启动同一个 MongoDB 实例。
- 生产环境应修改 `.env` 中的 `JWT_SECRET`。
- 不要将 `.env` 文件提交到公开代码仓库。
- 如果系统找不到 `mongod`，请通过 `MONGOD_BIN` 指定其完整路径。