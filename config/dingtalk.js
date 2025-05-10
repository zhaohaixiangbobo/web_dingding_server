/**
 * 钉钉应用配置文件
 */

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