/**
 * 钉钉API集成相关路由
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');
// 移除对server.js的直接引用，避免循环依赖
// const { pool } = require('../server');

// 导入钉钉应用配置
const DINGTALK_CONFIG = require('../config/dingtalk');

// 缓存access_token
let accessTokenCache = {
  token: '',
  expireTime: 0
};

/**
 * 获取钉钉应用access_token
 * @private
 * @returns {Promise<string>} access_token
 */
async function getAccessToken() {
  const now = Date.now();
  
  // 如果缓存的token未过期，直接返回
  if (accessTokenCache.token && accessTokenCache.expireTime > now) {
    return accessTokenCache.token;
  }
  
  try {
    // 调用钉钉API获取access_token
    const response = await axios.get(DINGTALK_CONFIG.apiUrls.getToken, {
      params: {
        appkey: DINGTALK_CONFIG.appKey,
        appsecret: DINGTALK_CONFIG.appSecret
      }
    });
    
    const { access_token, expires_in } = response.data;
    console.log('access_token:', access_token);
    console.log('expires_in:', expires_in);
    // 更新缓存
    accessTokenCache = {
      token: access_token,
      // 提前5分钟过期，避免临界点问题
      expireTime: now + (expires_in - 300) * 1000
    };
    
    return access_token;
  } catch (error) {
    console.error('获取钉钉access_token失败:', error);
    throw new Error('获取钉钉access_token失败');
  }
}

/**
 * 通过免登码获取用户ID
 * @route GET /dingtalk/getUserId
 * @param {string} code - 免登授权码
 */
router.get('/getUserId', async (req, res) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      return res.status(400).json({ error: '缺少免登授权码' });
    }
    
    const accessToken = await getAccessToken();
    
    // 调用钉钉API获取用户ID
    const response = await axios.get(DINGTALK_CONFIG.apiUrls.getUserInfo, {
      params: {
        access_token: accessToken,
        code
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('获取用户ID失败:', error);
    res.status(500).json({ error: '获取用户ID失败' });
  }
});

/**
 * 获取用户详情
 * @route GET /dingtalk/getUserDetail
 * @param {string} userId - 用户ID
 */
router.get('/getUserDetail', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: '缺少用户ID' });
    }
    
    const accessToken = await getAccessToken();
    
    // 调用钉钉API获取用户详情
    const response = await axios.get(DINGTALK_CONFIG.apiUrls.getUserDetail, {
      params: {
        access_token: accessToken,
        userid: userId
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('获取用户详情失败:', error);
    res.status(500).json({ error: '获取用户详情失败' });
  }
});

/**
 * 验证用户并获取用户信息
 * @route POST /dingtalk/verifyUser
 * @param {string} code - 免登授权码
 */
router.post('/verifyUser', async (req, res) => {
  try {
    const { code } = req.body;
    console.log('执行verifyUser');
    if (!code) {
      return res.status(400).json({ error: '缺少免登授权码' });
    }
    
    // 1. 获取用户ID
    // console.log('获取用户id');

    const accessToken = await getAccessToken();
    const userIdResponse = await axios.get(DINGTALK_CONFIG.apiUrls.getUserInfo, {
      params: {
        access_token: accessToken,
        code
      }
    });
    
    const { userid } = userIdResponse.data;
    // console.log('userid:', userid);

    if (!userid) {
      return res.status(401).json({ error: '用户验证失败' });
    }
    
    // 2. 获取用户详情
    const userDetailResponse = await axios.get(DINGTALK_CONFIG.apiUrls.getUserDetail, {
      params: {
        access_token: accessToken,
        userid
      }
    });
    
    const userDetail = userDetailResponse.data;
    

    console.log('用户信息正在更新');
    // 3. 记录或更新用户信息到数据库
    const pool = require('../db');
    try {
      // 检查用户是否已存在
      const [existingUsers] = await pool.execute(
        'SELECT * FROM app_users WHERE userid = ?',
        [userid]
      );
      
      const now = new Date();
      
      if (existingUsers.length > 0) {
        // 更新现有用户信息
        await pool.execute(
          'UPDATE app_users SET username = ?, avatar = ?, last_login = ? WHERE userid = ?',
          [userDetail.name, userDetail.avatar, now, userid]
        );
        console.log('用户信息已更新:', userid);
      } else {
        // 插入新用户记录
        // 默认使用第一个公司ID，实际应用中可能需要根据部门信息确定公司ID
        const companyId = 1;
        await pool.execute(
          'INSERT INTO app_users (username, company_id, userid, avatar, last_login) VALUES (?, ?, ?, ?, ?)',
          [userDetail.name, companyId, userid, userDetail.avatar, now]
        );
        console.log('新用户已记录:', userid);
      }
    } catch (dbError) {
      console.error('记录用户信息失败:', dbError);
      // 继续处理，不影响用户登录
    }
    
    // 4. 返回用户信息
    res.json({
      success: true,
      code: 0,
      msg: 'success',
      data: userDetail
    });
  } catch (error) {
    console.error('用户验证失败:', error);
    res.status(500).json({ error: '用户验证失败' });
  }
});

module.exports = router;