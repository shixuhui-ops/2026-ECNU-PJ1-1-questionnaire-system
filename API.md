# API 接口文档

基础地址：

    http://localhost:3000/api

需要认证的接口使用：

    Authorization: Bearer <JWT_TOKEN>

## 用户接口

### 注册

    POST /auth/register

请求：

    {
      "username": "testuser",
      "password": "123456"
    }

### 登录

    POST /auth/login

请求：

    {
      "username": "testuser",
      "password": "123456"
    }

## 问卷接口

### 创建问卷

    POST /surveys

请求：

    {
      "title": "测试问卷",
      "description": "问卷说明",
      "allowAnonymous": true
    }

### 添加题目

    POST /surveys/:id/questions

单选题请求：

    {
      "type": "single",
      "title": "你的性别",
      "required": true,
      "options": [
        { "label": "男", "value": "male" },
        { "label": "女", "value": "female" }
      ]
    }

多选题请求：

    {
      "type": "multiple",
      "title": "喜欢的水果",
      "required": true,
      "options": [
        { "label": "苹果", "value": "apple" },
        { "label": "香蕉", "value": "banana" }
      ],
      "validation": {
        "minSelections": 1,
        "maxSelections": 2
      }
    }

数字题请求：

    {
      "type": "number",
      "title": "年龄",
      "required": true,
      "validation": {
        "minValue": 0,
        "maxValue": 120,
        "integerOnly": true
      }
    }

### 添加跳转规则

    POST /surveys/:id/jump-rules

请求：

    {
      "sourceQuestionId": "题目ID",
      "targetQuestionId": "目标题目ID",
      "operator": "equals",
      "expectedValue": "male"
    }

### 发布问卷

    POST /surveys/:id/publish

### 关闭问卷

    POST /surveys/:id/close

## 填写接口

### 获取公开问卷

    GET /surveys/public/:accessCode

### 计算下一题

    POST /surveys/public/:accessCode/next-question

### 提交问卷

    POST /responses/:accessCode

请求：

    {
      "answers": [
        {
          "questionId": "题目ID",
          "value": "答案"
        }
      ]
    }

## 统计接口

### 查看统计结果

    GET /stats/:surveyId

只有问卷创建者可以查看对应问卷的统计结果。