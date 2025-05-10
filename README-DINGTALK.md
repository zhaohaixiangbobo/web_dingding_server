# 钉钉API集成说明

## 概述

本文档说明了如何在食堂菜单管理系统中集成钉钉API，实现用户认证和信息获取功能。

## 配置步骤

1. 在钉钉开放平台创建应用并获取AppKey和AppSecret
2. 修改配置文件 `config/dingtalk.js`，填入正确的AppKey和AppSecret：

```javascript
module.exports = {
  // 钉钉应用配置
  appKey: 'dinggfzijayjysr0infw', // 替换为实际的应用AppKey
  appSecret: 'FRZ4vx4kL7M7nq2WfHDQAUUdGMQGe81XkSi6Z85ryaldtIN7sb-oY-hS82THvqMx', // 替换为实际的应用AppSecret
  
  // API接口地址
  apiUrls: {
    getToken: 'https://oapi.dingtalk.com/gettoken',
    getUserInfo: 'https://oapi.dingtalk.com/user/getuserinfo',
    getUserDetail: 'https://oapi.dingtalk.com/user/get'
  }
};
```

## 安装依赖

确保已安装axios依赖：

```bash
npm install axios
```

## API接口说明

### 1. 获取用户ID

通过免登授权码获取用户ID。

- **请求方式**：GET
- **URL**：`/dingtalk/getUserId`
- **参数**：
  - `code`：免登授权码（必填）
- **返回示例**：
```json
{
  "errcode": 0,
  "errmsg": "ok",
  "userid": "用户ID",
  "is_sys": true,
  "sys_level": 0
}
```

### 2. 获取用户详情

通过用户ID获取用户详细信息。

- **请求方式**：GET
- **URL**：`/dingtalk/getUserDetail`
- **参数**：
  - `userId`：用户ID（必填）
- **返回示例**：
```json
{
  "errcode": 0,
  "errmsg": "ok",
  "userid": "用户ID",
  "name": "张三",
  "mobile": "13800138000",
  "email": "zhangsan@example.com",
  "avatar": "头像URL"
}
```

### 3. 验证用户并获取用户信息

一站式接口，通过免登授权码验证用户并返回用户详细信息。

- **请求方式**：POST
- **URL**：`/dingtalk/verifyUser`
- **参数**：
  - `code`：免登授权码（必填）
- **返回示例**：
```json
{
  "success": true,
  "user": {
    "errcode": 0,
    "errmsg": "ok",
    "userid": "用户ID",
    "name": "张三",
    "mobile": "13800138000",
    "email": "zhangsan@example.com",
    "avatar": "头像URL"
  }
}
```

## 前端集成示例

```javascript
// 获取钉钉免登授权码
dd.runtime.permission.requestAuthCode({
  corpId: '企业ID', // 企业ID
  onSuccess: function(result) {
    // 获取到授权码后，调用后端接口验证用户
    axios.post('/dingtalk/verifyUser', {
      code: result.code
    }).then(response => {
      if (response.data.success) {
        // 用户验证成功，获取到用户信息
        const userInfo = response.data.user;
        console.log('用户信息:', userInfo);
        // 进行后续操作...
      }
    }).catch(error => {
      console.error('用户验证失败:', error);
    });
  },
  onFail: function(err) {
    console.error('获取授权码失败:', err);
  }
});
```

## 注意事项

1. 确保钉钉应用已正确配置并上线
2. 前端调用钉钉JSAPI时需要先完成鉴权配置
3. access_token会自动缓存，有效期为7200秒（2小时）
4. 生产环境中应妥善保管AppSecret，避免泄露