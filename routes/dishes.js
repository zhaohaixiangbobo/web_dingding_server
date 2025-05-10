/**
 * 菜品相关路由
 */

const express = require('express');
const router = express.Router();
// const { pool } = require('../server');
const pool = require('../db');  // 直接引入 pool，无循环引用

/**
 * 获取菜品列表
 * @route GET /dishes
 * @param {number} companyId - 公司ID
 * @param {string} date - 日期，格式：YYYY-MM-DD
 * @param {string} mealType - 餐次，可选值：breakfast, lunch
 */
router.get('/', async (req, res) => {
  try {
    const { companyId, date, mealType = 'lunch' } = req.query;
    // console.log("companyId, date, mealType");
    // console.log(companyId, date, mealType);
    if (!companyId || !date) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    
    // 查询指定日期、公司和餐次的菜品
    const [rows] = await pool.execute(`
      SELECT d.id, d.name, dc.name as category, d.image_url as image, d.rating, 
             (SELECT COUNT(*) FROM dish_evaluations WHERE dish_id = d.id) as ratingCount
      FROM dishes d
      JOIN dish_categories dc ON d.category_id = dc.id
      JOIN menu_items mi ON mi.dish_id = d.id
      JOIN daily_menus dm ON mi.daily_menu_id = dm.id
      WHERE d.company_id = ?
      AND dm.menu_date = ?
      AND mi.meal_type = ?
    `, [companyId, date, mealType]);
    
    // console.log('查询结果:', [rows]);
    // 处理空图片，使用默认图片
    const dishes = rows.map(dish => ({
      ...dish,
      image: dish.image || '/assets/icons/default.png',
      // price: parseFloat((Math.random() * 20 + 5).toFixed(1)) // 模拟价格数据
    }));
    
    res.json(dishes);
  } catch (error) {
    console.error('获取菜品列表失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router;