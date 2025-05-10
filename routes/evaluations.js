/**
 * 评价相关路由
 */

const express = require('express');
const router = express.Router();
// const { pool } = require('../server');
const pool = require('../db');  // 直接引入 pool，无循环引用

/**
 * 提交菜品评价
 * @route POST /evaluations
 * @param {Array} evaluations - 评价数组，包含多个评价对象
 */
router.post('/', async (req, res) => {
  try {
    const { evaluations } = req.body;
    
    if (!evaluations || !Array.isArray(evaluations) || evaluations.length === 0) {
      return res.status(400).json({ error: '评价数据格式不正确' });
    }
    
    // 开始事务
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // 获取当前日期
      const today = new Date();
      const evaluationDate = today.toISOString().split('T')[0]; // 格式：YYYY-MM-DD
      
      // 记录成功和失败的评价
      const results = {
        success: [],
        duplicates: []
      };
      
      // 批量插入评价数据
      for (const evaluation of evaluations) {
        const { dishId, companyId, rating, comment, userId } = evaluation;
        
        try {
          // 直接插入评价记录
          await connection.execute(
            'INSERT INTO dish_evaluations (dish_id, company_id, rating, comment, user_id, evaluation_date) VALUES (?, ?, ?, ?, ?, ?)',
            [dishId, companyId, rating, comment, userId, evaluationDate]
          );
          
          // 更新菜品平均评分
          await connection.execute(
            `UPDATE dishes SET rating = (
              SELECT AVG(rating) FROM dish_evaluations WHERE dish_id = ?
            ), rating_count = (
              SELECT COUNT(*) FROM dish_evaluations WHERE dish_id = ?
            ) WHERE id = ?`,
            [dishId, dishId, dishId]
          );
          
          // 记录成功的评价
          results.success.push(dishId);
        } catch (err) {
          // 如果是重复评价错误，记录下来并继续处理其他评价
          if (err.code === 'ER_DUP_ENTRY') {
            results.duplicates.push(dishId);
            console.log(`用户 ${userId} 已经评价过菜品 ${dishId}，跳过此评价`);
          } else {
            // 其他错误则抛出，触发事务回滚
            throw err;
          }
        }
      }
      
      // 提交事务
      await connection.commit();
      
      // 根据结果返回不同的消息
      if (results.success.length > 0 && results.duplicates.length > 0) {
        res.json({ 
          success: true, 
          message: '部分评价提交成功，部分菜品本日已经评价过，请勿重复提交', 
          results: results 
        });
      } else if (results.success.length > 0) {
        res.json({ 
          success: true, 
          message: '评价提交成功', 
          results: results 
        });
      } else {
        res.json({ 
          success: false, 
          message: '所选菜品本日已经评价过，请勿重复提交', 
          results: results 
        });
      }
    } catch (error) {
      // 回滚事务
      await connection.rollback();
      throw error;
    } finally {
      // 释放连接
      connection.release();
    }
  } catch (error) {
    console.error('提交评价失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

/**
 * 检查用户今天是否已经评价过菜品
 * @route GET /evaluations/check
 * @param {Number} dishId - 菜品ID
 * @param {String} userId - 用户ID
 */
router.get('/check', async (req, res) => {
  try {
    const { dishId, userId } = req.query;
    
    if (!dishId || !userId) {
      return res.status(400).json({ error: '参数不完整' });
    }
    
    // 获取当前日期
    const today = new Date();
    const evaluationDate = today.toISOString().split('T')[0]; // 格式：YYYY-MM-DD
    
    // 查询用户今天是否已经评价过该菜品
    const [evaluations] = await pool.execute(
      'SELECT id FROM dish_evaluations WHERE dish_id = ? AND user_id = ? AND evaluation_date = ?',
      [dishId, userId, evaluationDate]
    );
    
    res.json({ 
      hasEvaluated: evaluations.length > 0,
      message: evaluations.length > 0 ? '您今天已经评价过该菜品' : '您今天还未评价该菜品'
    });
  } catch (error) {
    console.error('检查评价状态失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

/**
 * 获取用户最近的评价记录
 * @route GET /evaluations/recent
 * @param {Number} companyId - 公司ID
 * @param {String} userId - 用户ID
 * @param {Number} limit - 限制返回数量
 */
router.get('/recent', async (req, res) => {
  try {
    const { companyId, userId, limit = 5 } = req.query;

    if (!userId) {
      return res.status(400).json({ success: false, message: '用户ID不能为空' });
    }
    
    // 查询用户的评价记录
    // const [evaluations] = await pool.execute(
    //   `SELECT de.id, de.dish_id as dishId, d.name as dishName, de.rating, de.comment, 
    //    de.evaluation_date as date, de.company_id as companyId, c.name as companyName
    //    FROM dish_evaluations de
    //    JOIN dishes d ON de.dish_id = d.id
    //    JOIN companies c ON de.company_id = c.id
    //    WHERE de.user_id = ? ${companyId ? 'AND de.company_id = ?' : ''}
    //    ORDER BY de.evaluation_date DESC, de.id DESC
    //    LIMIT ?`,
    //   companyId ? [userId, companyId, parseInt(limit)] : [userId, parseInt(limit)]
    // );
    const [evaluations] = await pool.execute(
      `SELECT
        de.id,
        de.dish_id AS dishId,
        d.name AS dishName,
        de.rating,
        de.comment,
        de.evaluation_date AS date
      FROM
        dish_evaluations de
      JOIN
        dishes d ON de.dish_id = d.id
      WHERE
        de.user_id = ?
      ORDER BY
        de.evaluation_date DESC,
        de.id DESC
      LIMIT
        ?`,[userId, limit] // 简化参数数组
    );
    
    // 格式化日期
    const formattedEvaluations = evaluations.map(eval => ({
      ...eval,
      date: new Date(eval.date).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-')
    }));
    
    res.json({ success: true, data: formattedEvaluations });
  } catch (error) {
    console.error('获取评价记录失败:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

/**
 * 获取用户所有评价记录（支持分页和日期筛选）
 * @route GET /evaluations/user
 * @param {String} userId - 用户ID
 * @param {Number} companyId - 公司ID（可选）
 * @param {String} startDate - 开始日期（可选，格式：YYYY-MM-DD）
 * @param {String} endDate - 结束日期（可选，格式：YYYY-MM-DD）
 * @param {Number} page - 页码（默认1）
 * @param {Number} pageSize - 每页数量（默认10）
 */
router.get('/user', async (req, res) => {
  try {
    const { userId, companyId, startDate, endDate, page = 1, pageSize = 10 } = req.query;
    
    if (!userId) {
      return res.status(400).json({ success: false, message: '用户ID不能为空' });
    }
    
    // 构建查询条件
    let conditions = ['de.user_id = ?'];
    let params = [userId];
    
    // if (companyId) {
    //   conditions.push('de.company_id = ?');
    //   params.push(companyId);
    // }
    
    if (startDate) {
      conditions.push('de.evaluation_date >= ?');
      params.push(startDate);
    }
    
    if (endDate) {
      conditions.push('de.evaluation_date <= ?');
      params.push(endDate);
    }
    
    const whereClause = conditions.join(' AND ');
    
    // 查询总记录数
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM dish_evaluations de WHERE ${whereClause}`,
      params
    );
    

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / pageSize);
    const offset = (page - 1) * pageSize;
    
    // 简化查询评价记录 - 移除可能不存在的companies表关联
    const queryParams = [...params, String(pageSize), String(offset)];
    //    ${whereClause}
      //     LIMIT ? OFFSET ?`,
      // queryParams
      
    const [evaluations] = await pool.execute(
      `SELECT 
        de.id, 
        de.dish_id as dishId, 
        d.name as dishName, 
        de.rating, 
        de.comment, 
        de.evaluation_date as date, 
        de.company_id as companyId
      FROM 
        dish_evaluations de
      JOIN 
        dishes d ON de.dish_id = d.id
      WHERE 
        ${whereClause}
      ORDER BY 
        de.evaluation_date DESC, 
        de.id DESC
          LIMIT ?  OFFSET ?`,
          queryParams
    );
    
    // 格式化日期
    const formattedEvaluations = evaluations.map(eval => ({
      ...eval,
      date: new Date(eval.date).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-')
    }));
    
    res.json({ 
      success: true, 
      data: {
        data: formattedEvaluations,
        pagination: {
          total,
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          totalPages,
        },
      },
    });
  } catch (error) {
    console.error('获取用户评价记录失败:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

/**
 * 删除评价
 * @route POST /evaluations/delete
 * @param {Number} id - 评价ID
 * @param {String} userId - 用户ID（用于验证权限）
 */
router.post('/delete', async (req, res) => {
  console.log('收到删除评价请求:', req.body);
  try {
    const { id, userId } = req.body;
    
    if (!id || !userId) {
      return res.status(400).json({ success: false, message: '参数不完整' });
    }
    
    // 验证评价是否属于该用户
    const [evaluations] = await pool.execute(
      'SELECT dish_id FROM dish_evaluations WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    
    if (evaluations.length === 0) {
      return res.status(403).json({ success: false, message: '无权删除此评价' });
    }
    
    const dishId = evaluations[0].dish_id;
    
    // 开始事务
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // 删除评价
      await connection.execute('DELETE FROM dish_evaluations WHERE id = ?', [id]);
      
      // 更新菜品平均评分
      await connection.execute(
        `UPDATE dishes SET rating = (
          SELECT AVG(rating) FROM dish_evaluations WHERE dish_id = ?
        ), rating_count = (
          SELECT COUNT(*) FROM dish_evaluations WHERE dish_id = ?
        ) WHERE id = ?`,
        [dishId, dishId, dishId]
      );
      
      // 提交事务
      await connection.commit();
      
      res.json({ success: true, message: '删除成功' });
    } catch (error) {
      // 回滚事务
      await connection.rollback();
      throw error;
    } finally {
      // 释放连接
      connection.release();
    }
  } catch (error) {
    console.error('删除评价失败:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

module.exports = router;