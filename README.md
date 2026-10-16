# 基于 MongoDB 的问卷系统

## 1. 项目启动

### 启动 MongoDB

    New-Item -ItemType Directory -Force .\backend\data\db
    mongod --dbpath .\backend\data\db

### 启动后端

    Set-Location .\backend
    node src/server.js

后端地址：

    http://localhost:3000

### 启动前端

    Set-Location .\frontend
    python -m http.server 5500

前端地址：

    http://localhost:5500

### 问卷管理页面

登录后访问：

    http://localhost:5500/manage.html

该页面支持：

- 添加单选题
- 添加多选题
- 添加文本题
- 添加数字题
- 设置题目校验
- 配置条件跳转
- 发布问卷

## 2. 数据库设计

系统使用 MongoDB，包含以下集合：

- `users`：用户账号、密码哈希和注册时间
- `surveys`：问卷基本信息、题目、跳转规则和发布状态
- `responses`：每次问卷提交记录和回答内容

问卷与用户通过 `ownerId` 关联，回答记录与问卷通过 `surveyId` 关联。题目和跳转规则嵌入问卷文档，适合 MongoDB 文档结构及问卷数据的整体读取。

## 3. 主要 API

### 用户

- `POST /api/auth/register`
- `POST /api/auth/login`

### 问卷管理

- `POST /api/surveys`
- `GET /api/surveys/mine`
- `GET /api/surveys/:id`
- `PATCH /api/surveys/:id`
- `POST /api/surveys/:id/questions`
- `POST /api/surveys/:id/jump-rules`
- `POST /api/surveys/:id/publish`
- `POST /api/surveys/:id/close`

### 填写问卷

- `GET /api/surveys/public/:accessCode`
- `POST /api/surveys/public/:accessCode/next-question`
- `POST /api/responses/:accessCode`

### 统计

- `GET /api/stats/:surveyId`

## 4. 校验设计

- 用户名长度为 3 到 30 个字符
- 密码长度不少于 6 位
- 单选题答案必须属于题目选项
- 多选题支持最少、最多和固定选择数量
- 文本题支持最小和最大长度
- 数字题支持最小值、最大值和整数限制
- 必答题必须提交答案
- 问卷截止后不可填写

## 5. 跳转设计

跳转规则存储在问卷的 `jumpRules` 数组中，每条规则包含：

- 来源题目
- 比较运算符
- 预期答案
- 目标题目

填写端调用下一题接口，根据当前答案计算下一道题，规则不写死在程序中。

## 6. 测试

执行：

    Set-Location .\backend
    npm test

测试内容包括：

- 用户注册
- 创建问卷
- 添加单选题
- 添加数字题
- 添加跳转规则
- 发布问卷
- 获取公开问卷
- 跳转计算
- 提交问卷
- 统计结果

## 7. AI 使用记录

开发过程中使用 AI 辅助完成：

- MongoDB 集合和文档结构设计
- Express 路由设计
- JWT 登录认证
- 题目校验逻辑
- 条件跳转逻辑
- 统计接口和自动化测试

AI 生成代码后进行了人工修改，包括：

- 调整字段命名
- 增加权限校验
- 增加匿名填写判断
- 增加题目类型和答案校验
- 修正测试请求头和异常处理
- 增加 MongoDB 连接配置

AI 不能替代人工验证，最终通过自动化测试确认注册、创建、发布、跳转、提交和统计流程可运行。

## 8. AI 使用日志

完整的 AI 使用过程记录见：

    AI_LOG.md

## 9. 测试用例文档

完整测试步骤、输入、预期输出和实际结果见：

    TEST_CASES.md