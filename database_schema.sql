-- 食堂菜单管理系统数据库设计
-- MySQL 数据库

-- 创建数据库
CREATE DATABASE IF NOT EXISTS shitang_menu DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE shitang_menu;

-- 公司表
CREATE TABLE IF NOT EXISTS companies (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL COMMENT '公司名称',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY (name)
) COMMENT='公司信息表';

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL COMMENT '用户名',
    password VARCHAR(255) NOT NULL COMMENT '密码（加密存储）',
    real_name VARCHAR(50) COMMENT '真实姓名',
    company_id INT NOT NULL COMMENT '所属公司ID',
    role ENUM('admin', 'manager') NOT NULL DEFAULT 'manager' COMMENT '角色：admin-超级管理员，manager-公司管理员',
    last_login TIMESTAMP NULL COMMENT '最后登录时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id),
    UNIQUE KEY (username)
) COMMENT='用户表';

-- 菜品分类表
CREATE TABLE IF NOT EXISTS dish_categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL COMMENT '分类名称',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY (name)
) COMMENT='菜品分类表';

-- 菜品表
CREATE TABLE IF NOT EXISTS dishes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL COMMENT '菜品名称',
    category_id INT COMMENT '分类ID',
    image_url VARCHAR(255) COMMENT '图片URL',
    company_id INT NOT NULL COMMENT '所属公司ID',
    rating FLOAT DEFAULT 0 COMMENT '评分',
    rating_count INT DEFAULT 0 COMMENT '评分人数',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES dish_categories(id),
    FOREIGN KEY (company_id) REFERENCES companies(id),
    UNIQUE KEY (name, company_id)
) COMMENT='菜品表';

-- 周菜单表
CREATE TABLE IF NOT EXISTS weekly_menus (
    id INT PRIMARY KEY AUTO_INCREMENT,
    company_id INT NOT NULL COMMENT '所属公司ID',
    week_start_date DATE NOT NULL COMMENT '周开始日期',
    week_end_date DATE NOT NULL COMMENT '周结束日期',
    created_by INT NOT NULL COMMENT '创建人ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    UNIQUE KEY (company_id, week_start_date)
) COMMENT='周菜单表';

-- 每日菜单表
CREATE TABLE IF NOT EXISTS daily_menus (
    id INT PRIMARY KEY AUTO_INCREMENT,
    weekly_menu_id INT NOT NULL COMMENT '所属周菜单ID',
    menu_date DATE NOT NULL COMMENT '菜单日期',
    day_of_week TINYINT NOT NULL COMMENT '星期几（1-7）',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (weekly_menu_id) REFERENCES weekly_menus(id),
    UNIQUE KEY (weekly_menu_id, menu_date)
) COMMENT='每日菜单表';

-- 菜单项表（每日菜单中包含的具体菜品）
CREATE TABLE IF NOT EXISTS menu_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    daily_menu_id INT NOT NULL COMMENT '所属每日菜单ID',
    dish_id INT NOT NULL COMMENT '菜品ID',
    meal_type ENUM('breakfast', 'lunch') NOT NULL COMMENT '餐次：早餐、午餐',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (daily_menu_id) REFERENCES daily_menus(id),
    FOREIGN KEY (dish_id) REFERENCES dishes(id),
    UNIQUE KEY (daily_menu_id, dish_id, meal_type)
) COMMENT='菜单项表';

-- 前端用户表
CREATE TABLE IF NOT EXISTS app_users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL COMMENT '姓名',
    company_id INT NOT NULL COMMENT '所属公司ID',
    userid VARCHAR(50) COMMENT '钉钉uid',
    avatar VARCHAR(255) COMMENT '头像URL',
    last_login TIMESTAMP NULL COMMENT '最后登录时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id),
    UNIQUE KEY (userid)
) COMMENT='前端用户表';

-- -- 菜品评分记录表
-- CREATE TABLE IF NOT EXISTS dish_ratings (
--     id INT PRIMARY KEY AUTO_INCREMENT,
--     user_id INT NOT NULL COMMENT '用户ID',
--     dish_id INT NOT NULL COMMENT '菜品ID',
--     rating FLOAT NOT NULL COMMENT '评分（1-5分）',
--     company_id INT NOT NULL COMMENT '公司ID',
--     comment TEXT COMMENT '评价内容',
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
--     FOREIGN KEY (user_id) REFERENCES app_users(id),
--     FOREIGN KEY (dish_id) REFERENCES dishes(id),
--     FOREIGN KEY (company_id) REFERENCES companies(id),
--     UNIQUE KEY (user_id, dish_id)
-- ) COMMENT='菜品评分记录表';


-- 菜品评价表
CREATE TABLE IF NOT EXISTS dish_evaluations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    dish_id INT NOT NULL COMMENT '菜品ID',
    company_id INT NOT NULL COMMENT '公司ID',
    user_id VARCHAR(50) NOT NULL COMMENT '评价用户ID',
    rating FLOAT COMMENT '评分',
    comment TEXT COMMENT '评价内容',
    evaluation_date DATE NOT NULL COMMENT '评价日期',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (dish_id) REFERENCES dishes(id),
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (user_id) REFERENCES app_users(userid),
    UNIQUE KEY (user_id, dish_id,evaluation_date)
) COMMENT='菜品评价表';

-- 初始化公司数据
INSERT INTO companies (name) VALUES 
('市局'),
('营销中心'),
('物流中心'),
('一公司'),
('二公司'),
('三公司'),
('西青分公司'),
('东丽分公司'),
('津南分公司'),
('北辰分公司'),
('滨海分公司'),
('宝坻分公司'),
('蓟州分公司'),
('宁河分公司'),
('静海分公司'),
('武清分公司');

-- 初始化菜品分类
INSERT INTO dish_categories (name) VALUES 
('主食'),
('副食'),
('小菜'),
('汤粥'),
('热菜'),
('小吃'),
('水果');

-- 创建超级管理员账号
INSERT INTO users (username, password, real_name, company_id, role) VALUES 
('admin', MD5('admin123'), '系统管理员', 1, 'admin');

-- 为每个公司创建一个管理员账号
INSERT INTO users (username, password, real_name, company_id, role) VALUES 
('shiju', MD5('123456'), '市局管理员', 1, 'manager'),
('yingxiao', MD5('123456'), '营销中心管理员', 2, 'manager'),
('wuliu', MD5('123456'), '物流中心管理员', 3, 'manager'),
('yigongsi', MD5('123456'), '一公司管理员', 4, 'manager'),
('ergongsi', MD5('123456'), '二公司管理员', 5, 'manager'),
('sangongsi', MD5('123456'), '三公司管理员', 6, 'manager'),
('xiqing', MD5('123456'), '西青分公司管理员', 7, 'manager'),
('dongli', MD5('123456'), '东丽分公司管理员', 8, 'manager'),
('jinnan', MD5('123456'), '津南分公司管理员', 9, 'manager'),
('beichen', MD5('123456'), '北辰分公司管理员', 10, 'manager'),
('binhai', MD5('123456'), '滨海分公司管理员', 11, 'manager'),
('baodi', MD5('123456'), '宝坻分公司管理员', 12, 'manager'),
('jizhou', MD5('123456'), '蓟州分公司管理员', 13, 'manager'),
('ninghe', MD5('123456'), '宁河分公司管理员', 14, 'manager'),
('jinghai', MD5('123456'), '静海分公司管理员', 15, 'manager'),
('wuqing', MD5('123456'), '武清分公司管理员', 16, 'manager');