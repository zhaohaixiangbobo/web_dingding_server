/**
 * 评价统计相关路由
 */

const express = require('express');
const router = express.Router();
const pool = require('../db');


/**
 * 获取评价统计信息
 * @route GET /statistics/evaluation
 * @param {Number} companyId - 公司ID
 */
router.get('/evaluation', async (req, res) => {
  try {
    const { companyId } = req.query;
    
    if (!companyId) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    
    // 不再使用后端缓存，直接查询数据库
    
    // 查询总评价数
    const [totalCountResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM dish_evaluations WHERE company_id = ?',
      [companyId]
    );
    
    // 查询平均评分
    const [avgRatingResult] = await pool.execute(
      'SELECT AVG(rating) as avgRating FROM dish_evaluations WHERE company_id = ?',
      [companyId]
    );
    
    const stats = {
      totalEvaluations: totalCountResult[0].total || 0,
      averageRating: avgRatingResult[0].avgRating ? parseFloat(avgRatingResult[0].avgRating).toFixed(1) : '0.0'
    };
    
    // 不再在后端缓存数据
    
    res.json(stats);
  } catch (error) {
    console.error('获取评价统计信息失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

/**
 * 获取当天最受欢迎的菜品
 * @route GET /statistics/popular/today
 * @param {Number} companyId - 公司ID
 */
router.get('/popular/today', async (req, res) => {
  try {
    const { companyId } = req.query;
    
    if (!companyId) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    
    // 获取当前日期
    const today = new Date().toISOString().split('T')[0]; // 格式：YYYY-MM-DD
    
    // 查询当天评分最高的菜品
    const [popularDish] = await pool.execute(
      `SELECT d.id, d.name, d.image_url as image, AVG(de.rating) as avgRating, 
              COUNT(de.id) as ratingCount, dc.name as category
       FROM dish_evaluations de
       JOIN dishes d ON de.dish_id = d.id
       JOIN dish_categories dc ON d.category_id = dc.id
       WHERE de.company_id = ? AND de.evaluation_date = ?
       GROUP BY d.id
       ORDER BY avgRating DESC, ratingCount DESC
       LIMIT 1`,
      [companyId, today]
    );
    
    if (popularDish.length === 0) {
      return res.json({ message: '今天还没有评价数据' });
    }
    
    // 处理空图片，使用默认图片
    const result = {
      ...popularDish[0],
      image: popularDish[0].image || '/assets/icons/default.png',
      avgRating: parseFloat(popularDish[0].avgRating).toFixed(1)
    };
    
    res.json(result);
  } catch (error) {
    console.error('获取当天最受欢迎菜品失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

/**
 * 获取历史热门菜品排行
 * @route GET /statistics/popular/history
 * @param {Number} companyId - 公司ID
 * @param {Number} limit - 返回数量，默认5个
 */
router.get('/popular/history', async (req, res) => {
  try {
    const { companyId, limit = 5 } = req.query;
    
    if (!companyId) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    

    // 查询历史评分最高的菜品
    const [popularDishes] = await pool.execute(
      `SELECT d.id, d.name, d.image_url as image, d.rating as avgRating, 
              d.rating_count as ratingCount, dc.name as category
       FROM dishes d
       JOIN dish_categories dc ON d.category_id = dc.id
       WHERE d.company_id = ? AND d.rating_count > 0
       ORDER BY d.rating DESC, d.rating_count DESC
       LIMIT ?`,
      [companyId, limit]
    );
    
    // 处理空图片，使用默认图片
    const results = popularDishes.map(dish => ({
      ...dish,
      image: dish.image || '/assets/icons/default.png',
      avgRating: parseFloat(dish.avgRating).toFixed(1)
    }));
        
    res.json(results);
  } catch (error) {
    console.error('获取历史热门菜品排行失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router;