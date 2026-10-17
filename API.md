# API 接口文档

## 1. 基本信息

后端默认地址：

```text
http://localhost:3000
```

API 基础地址：

```text
http://localhost:3000/api
```

需要身份认证的接口使用：

```http
Authorization: Bearer <JWT_TOKEN>
```

请求 JSON 接口时需要设置：

```http
Content-Type: application/json
```

统一响应格式：

```json
{
  "success": true,
  "message": "操作成功",
  "data": {}
}
```

失败响应格式：

```json
{
  "success": false,
  "message": "错误原因"
}
```

---

## 2. 健康检查

### 检查服务状态

```http
GET /api/health
```

无需认证。

成功响应：

```json
{
  "success": true,
  "message": "问卷系统服务运行正常"
}
```

---

## 3. 用户认证接口

### 3.1 用户注册

```http
POST /api/auth/register
```

无需认证。

请求：

```json
{
  "username": "testuser",
  "password": "123456"
}
```

字段说明：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| `username` | String | 是 | 长度为 3 到 30 个字符 |
| `password` | String | 是 | 长度不能少于 6 个字符 |

成功响应：

```json
{
  "success": true,
  "message": "注册成功",
  "data": {
    "user": {
      "id": "用户ID",
      "username": "testuser"
    },
    "token": "JWT_TOKEN"
  }
}
```

状态码：

| 状态码 | 说明 |
|---:|---|
| `201` | 注册成功 |
| `400` | 用户名或密码格式不符合要求 |
| `409` | 用户名已存在 |
| `500` | 注册失败 |

---

### 3.2 用户登录

```http
POST /api/auth/login
```

无需认证。

请求：

```json
{
  "username": "testuser",
  "password": "123456"
}
```

成功响应：

```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "user": {
      "id": "用户ID",
      "username": "testuser"
    },
    "token": "JWT_TOKEN"
  }
}
```

状态码：

| 状态码 | 说明 |
|---:|---|
| `200` | 登录成功 |
| `401` | 用户名或密码错误 |
| `500` | 登录失败 |

---

## 4. 问卷管理接口

除公开接口外，以下接口都需要 JWT 认证。

### 4.1 创建问卷

```http
POST /api/surveys
```

请求：

```json
{
  "title": "学生信息调查问卷",
  "description": "用于收集学生基本信息",
  "allowAnonymous": true,
  "deadline": "2026-12-31T23:59:00.000Z"
}
```

字段说明：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| `title` | String | 是 | 问卷标题 |
| `description` | String | 否 | 问卷说明 |
| `allowAnonymous` | Boolean | 否 | 是否允许匿名填写，默认 `false` |
| `deadline` | Date | 否 | 截止时间，可以为空 |

创建成功后，问卷状态为 `draft`，系统自动生成唯一访问码。

成功响应：

```json
{
  "success": true,
  "data": {
    "_id": "问卷ID",
    "ownerId": "用户ID",
    "title": "学生信息调查问卷",
    "description": "用于收集学生基本信息",
    "accessCode": "2b5ddbf18f84",
    "allowAnonymous": true,
    "status": "draft",
    "deadline": null,
    "questions": [],
    "jumpRules": []
  }
}
```

状态码：

| 状态码 | 说明 |
|---:|---|
| `201` | 创建成功 |
| `400` | 标题、匿名配置或截止时间格式错误 |
| `401` | 未登录 |
| `500` | 创建失败 |

---

### 4.2 查看我的问卷

```http
GET /api/surveys/mine
```

只返回当前登录用户创建的问卷。

成功响应：

```json
{
  "success": true,
  "data": [
    {
      "_id": "问卷ID",
      "title": "学生信息调查问卷",
      "status": "draft",
      "accessCode": "2b5ddbf18f84",
      "questions": []
    }
  ]
}
```

状态码：

| 状态码 | 说明 |
|---:|---|
| `200` | 查询成功 |
| `401` | 未登录 |
| `500` | 查询失败 |

---

### 4.3 查看问卷详情

```http
GET /api/surveys/:id
```

只能查看自己创建的问卷。

成功响应：

```json
{
  "success": true,
  "data": {
    "_id": "问卷ID",
    "ownerId": "用户ID",
    "title": "学生信息调查问卷",
    "description": "问卷说明",
    "accessCode": "2b5ddbf18f84",
    "allowAnonymous": true,
    "status": "draft",
    "deadline": null,
    "questions": [],
    "jumpRules": []
  }
}
```

状态码：

| 状态码 | 说明 |
|---:|---|
| `200` | 查询成功 |
| `400` | 问卷 ID 无效 |
| `401` | 未登录 |
| `404` | 问卷不存在或无权访问 |

---

### 4.4 修改问卷

```http
PATCH /api/surveys/:id
```

只能修改自己创建且未关闭的问卷。

请求示例：

```json
{
  "title": "修改后的问卷标题",
  "description": "修改后的问卷说明",
  "allowAnonymous": false,
  "deadline": "2026-12-31T23:59:00.000Z"
}
```

允许修改的字段：

- `title`
- `description`
- `allowAnonymous`
- `deadline`

清除截止时间：

```json
{
  "deadline": null
}
```

成功响应：

```json
{
  "success": true,
  "data": {
    "_id": "问卷ID",
    "title": "修改后的问卷标题"
  }
}
```

状态码：

| 状态码 | 说明 |
|---:|---|
| `200` | 修改成功 |
| `400` | 参数格式错误或问卷已关闭 |
| `401` | 未登录 |
| `404` | 问卷不存在或无权访问 |

---

### 4.5 添加题目

```http
POST /api/surveys/:id/questions
```

只有草稿状态的问卷可以添加题目。

#### 单选题

```json
{
  "type": "single",
  "title": "你的性别",
  "description": "请选择一个选项",
  "required": true,
  "options": [
    {
      "label": "男",
      "value": "male"
    },
    {
      "label": "女",
      "value": "female"
    }
  ]
}
```

#### 多选题

```json
{
  "type": "multiple",
  "title": "你喜欢的水果",
  "required": true,
  "options": [
    {
      "label": "苹果",
      "value": "apple"
    },
    {
      "label": "香蕉",
      "value": "banana"
    },
    {
      "label": "西瓜",
      "value": "watermelon"
    }
  ],
  "validation": {
    "minSelections": 1,
    "maxSelections": 2,
    "exactSelections": null
  }
}
```

#### 文本填空题

```json
{
  "type": "text",
  "title": "请进行自我介绍",
  "required": true,
  "validation": {
    "minLength": 2,
    "maxLength": 100
  }
}
```

#### 数字填空题

```json
{
  "type": "number",
  "title": "请输入年龄",
  "required": true,
  "validation": {
    "minValue": 0,
    "maxValue": 120,
    "integerOnly": true
  }
}
```

支持的题目类型：

| 类型 | 说明 |
|---|---|
| `single` | 单选题 |
| `multiple` | 多选题 |
| `text` | 文本填空题 |
| `number` | 数字填空题 |

成功响应：

```json
{
  "success": true,
  "data": {
    "_id": "题目ID",
    "type": "single",
    "title": "你的性别",
    "required": true,
    "order": 0,
    "options": [
      {
        "_id": "选项ID",
        "label": "男",
        "value": "male"
      }
    ]
  }
}
```

状态码：

| 状态码 | 说明 |
|---:|---|
| `201` | 添加成功 |
| `400` | 题目配置错误 |
| `401` | 未登录 |
| `404` | 问卷不存在或无权访问 |

---

### 4.6 添加跳转规则

```http
POST /api/surveys/:id/jump-rules
```

请求：

```json
{
  "sourceQuestionId": "源题目ID",
  "targetQuestionId": "目标题目ID",
  "operator": "equals",
  "expectedValue": "male"
}
```

字段说明：

| 字段 | 类型 | 说明 |
|---|---|---|
| `sourceQuestionId` | ObjectId | 触发跳转的题目 |
| `targetQuestionId` | ObjectId | 跳转目标题目 |
| `operator` | String | 判断运算符 |
| `expectedValue` | Mixed | 期望答案 |

支持的运算符：

| 运算符 | 适用题型 | 说明 |
|---|---|---|
| `equals` | 单选、数字等 | 等于 |
| `contains` | 多选 | 包含某个选项 |
| `greaterThan` | 数字 | 大于 |
| `lessThan` | 数字 | 小于 |
| `greaterOrEqual` | 数字 | 大于等于 |
| `lessOrEqual` | 数字 | 小于等于 |

示例：单选题选择 `male` 时跳转到指定题目。

```json
{
  "sourceQuestionId": "题目1ID",
  "targetQuestionId": "题目5ID",
  "operator": "equals",
  "expectedValue": "male"
}
```

状态码：

| 状态码 | 说明 |
|---:|---|
| `201` | 添加成功 |
| `400` | 题目不存在、题型不匹配或跳转到自身 |
| `401` | 未登录 |
| `404` | 问卷不存在或无权访问 |
| `409` | 相同跳转规则已经存在 |

---

### 4.7 发布问卷

```http
POST /api/surveys/:id/publish
```

发布条件：

- 问卷至少包含一道题目
- 截止时间为空，或晚于当前时间
- 当前用户是问卷创建者

成功响应：

```json
{
  "success": true,
  "message": "问卷发布成功",
  "data": {
    "accessUrl": "/survey/2b5ddbf18f84",
    "survey": {
      "_id": "问卷ID",
      "status": "published",
      "accessCode": "2b5ddbf18f84"
    }
  }
}
```

状态码：

| 状态码 | 说明 |
|---:|---|
| `200` | 发布成功 |
| `400` | 没有题目或截止时间无效 |
| `401` | 未登录 |
| `404` | 问卷不存在或无权访问 |

---

### 4.8 关闭问卷

```http
POST /api/surveys/:id/close
```

只能由问卷创建者操作。

成功响应：

```json
{
  "success": true,
  "message": "问卷已关闭",
  "data": {
    "_id": "问卷ID",
    "status": "closed"
  }
}
```

关闭后：

- 问卷不能继续提交
- 问卷不能继续修改
- 公开访问接口不再返回问卷

状态码：

| 状态码 | 说明 |
|---:|---|
| `200` | 关闭成功 |
| `400` | 关闭失败 |
| `401` | 未登录 |
| `404` | 问卷不存在或无权访问 |

---

## 5. 公开填写接口

以下接口不需要创建者权限。

### 5.1 获取公开问卷

```http
GET /api/surveys/public/:accessCode
```

只有状态为 `published` 且未超过截止时间的问卷可以访问。

成功响应：

```json
{
  "success": true,
  "data": {
    "_id": "问卷ID",
    "title": "学生信息调查问卷",
    "description": "问卷说明",
    "accessCode": "2b5ddbf18f84",
    "allowAnonymous": true,
    "status": "published",
    "deadline": null,
    "questions": [
      {
        "_id": "题目ID",
        "type": "single",
        "title": "你的性别",
        "required": true,
        "order": 0,
        "options": [
          {
            "_id": "选项ID",
            "label": "男",
            "value": "male"
          }
        ]
      }
    ],
    "jumpRules": []
  }
}
```

状态码：

| 状态码 | 说明 |
|---:|---|
| `200` | 获取成功 |
| `400` | 问卷已超过截止时间 |
| `404` | 问卷不存在、未发布或已关闭 |

---

### 5.2 获取下一道题

```http
POST /api/surveys/public/:accessCode/next-question
```

请求：

```json
{
  "currentQuestionId": "当前题目ID",
  "answers": [
    {
      "questionId": "当前题目ID",
      "value": "male"
    }
  ]
}
```

如果当前题目匹配跳转规则，则返回跳转目标题目；否则返回顺序上的下一题。

成功响应：

```json
{
  "success": true,
  "data": {
    "completed": false,
    "question": {
      "_id": "下一题ID",
      "type": "number",
      "title": "请输入年龄",
      "required": true,
      "order": 1
    }
  }
}
```

问卷填写完成时：

```json
{
  "success": true,
  "data": {
    "completed": true,
    "question": null
  }
}
```

状态码：

| 状态码 | 说明 |
|---:|---|
| `200` | 计算成功 |
| `400` | 问卷已过期或计算失败 |
| `404` | 问卷不存在或未发布 |

---

### 5.3 提交问卷

```http
POST /api/responses/:accessCode
```

如果问卷允许匿名填写，可以不携带 JWT。

如果问卷不允许匿名填写，必须携带：

```http
Authorization: Bearer <JWT_TOKEN>
```

请求：

```json
{
  "answers": [
    {
      "questionId": "单选题ID",
      "value": "male"
    },
    {
      "questionId": "多选题ID",
      "value": [
        "apple",
        "banana"
      ]
    },
    {
      "questionId": "文本题ID",
      "value": "这是一段文本答案"
    },
    {
      "questionId": "数字题ID",
      "value": 20
    }
  ]
}
```

提交时会检查：

- 问卷是否存在并已发布
- 问卷是否超过截止时间
- 是否满足匿名填写权限
- 必答题是否填写
- 单选答案是否有效
- 多选答案是否为数组
- 多选答案是否重复
- 多选答案数量是否符合限制
- 文本长度是否符合限制
- 数字是否有效
- 数字是否符合范围
- 数字是否满足整数要求
- 跳过的题目不参与必答校验

成功响应：

```json
{
  "success": true,
  "message": "问卷提交成功",
  "data": {
    "responseId": "回答记录ID",
    "submittedAt": "2026-10-17T10:00:00.000Z"
  }
}
```

状态码：

| 状态码 | 说明 |
|---:|---|
| `201` | 提交成功 |
| `400` | 答案校验失败、问卷已过期或提交失败 |
| `401` | 需要登录、Token 无效或已过期 |
| `404` | 问卷不存在或未发布 |

---

## 6. 统计接口

### 6.1 查看问卷统计

```http
GET /api/stats/:surveyId
```

只有问卷创建者可以查看统计结果。

请求头：

```http
Authorization: Bearer <JWT_TOKEN>
```

成功响应：

```json
{
  "success": true,
  "data": {
    "surveyId": "问卷ID",
    "title": "学生信息调查问卷",
    "totalResponses": 10,
    "statistics": [
      {
        "questionId": "题目ID",
        "title": "你的性别",
        "type": "single",
        "totalAnswers": 10,
        "options": {
          "male": {
            "label": "男",
            "count": 6
          },
          "female": {
            "label": "女",
            "count": 4
          }
        }
      },
      {
        "questionId": "题目ID",
        "title": "你喜欢的水果",
        "type": "multiple",
        "totalAnswers": 8,
        "options": {
          "apple": {
            "label": "苹果",
            "count": 5
          },
          "banana": {
            "label": "香蕉",
            "count": 4
          }
        }
      },
      {
        "questionId": "题目ID",
        "title": "请输入年龄",
        "type": "number",
        "totalAnswers": 10,
        "average": 20.5,
        "values": [
          18,
          19,
          20,
          25
        ]
      },
      {
        "questionId": "题目ID",
        "title": "自我介绍",
        "type": "text",
        "totalAnswers": 8,
        "values": [
          "文本答案一",
          "文本答案二"
        ]
      }
    ]
  }
}
```

统计内容：

- 单选题：每个选项的选择数量
- 多选题：每个选项被选择的次数
- 数字题：有效回答数、平均值、全部数字
- 文本题：有效回答数、全部文本内容
- 整份问卷：总提交次数

状态码：

| 状态码 | 说明 |
|---:|---|
| `200` | 查询成功 |
| `400` | 问卷 ID 无效或查询失败 |
| `401` | 未登录或 Token 无效 |
| `404` | 问卷不存在或当前用户不是创建者 |

---

## 7. 数据模型概览

### 7.1 users 集合

```json
{
  "_id": "ObjectId",
  "username": "testuser",
  "passwordHash": "bcrypt_hash",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### 7.2 surveys 集合

```json
{
  "_id": "ObjectId",
  "ownerId": "ObjectId",
  "title": "问卷标题",
  "description": "问卷说明",
  "accessCode": "访问码",
  "allowAnonymous": true,
  "status": "draft",
  "deadline": null,
  "questions": [],
  "jumpRules": [],
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

`status` 支持：

- `draft`：草稿
- `published`：已发布
- `closed`：已关闭

### 7.3 responses 集合

```json
{
  "_id": "ObjectId",
  "surveyId": "ObjectId",
  "respondentId": null,
  "anonymous": true,
  "answers": [
    {
      "questionId": "ObjectId",
      "value": "答案"
    }
  ],
  "submittedAt": "Date",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

---

## 8. 启动方式

### 8.1 启动 MongoDB

在项目根目录执行：

```powershell
mongod --dbpath .\backend\data\db
```

如果 `mongod` 不在系统环境变量中：

```powershell
& "D:\MongoDB\bin\mongod.exe" --dbpath .\backend\data\db
```

### 8.2 启动后端

```powershell
Set-Location .\backend
node src/server.js
```

后端地址：

```text
http://localhost:3000
```

### 8.3 启动前端

打开新的 PowerShell：

```powershell
Set-Location .\frontend
python -m http.server 5500
```

前端地址：

```text
http://localhost:5500
```

---

## 9. 自动化测试

如果 MongoDB 已经启动：

```powershell
Set-Location .\backend
npm test
```

一键启动 MongoDB、后端并执行测试：

```powershell
Set-Location .\backend
npm run test:all
```

如果 MongoDB 不在系统 PATH 中：

```powershell
Set-Location .\backend
$env:MONGOD_BIN = "D:\MongoDB\bin\mongod.exe"
npm run test:all
```

## 10. 重复填写控制

问卷支持配置同一登录用户是否可以重复提交。

字段：

allowMultipleSubmissions

类型：

Boolean

默认值：

true

含义：

- true：允许同一登录用户多次提交
- false：同一登录用户只能提交一次

创建问卷时设置：

{
  "title": "测试问卷",
  "allowAnonymous": false,
  "allowMultipleSubmissions": false
}

修改问卷时设置：

{
  "allowMultipleSubmissions": false
}

当字段为 false 且当前登录用户已经提交过该问卷时，再次提交返回：

HTTP 409

{
  "success": false,
  "message": "你已经提交过该问卷，不能重复提交"
}

注意：

- 重复填写限制只针对携带有效 JWT 的登录用户
- 匿名用户没有稳定身份标识，因此不执行该限制
- 已有问卷默认允许重复填写，保证历史数据兼容