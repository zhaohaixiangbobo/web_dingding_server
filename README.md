# 食堂菜单管理系统后端服务

这是食堂菜单管理系统的后端服务，提供菜品数据和评价功能的API接口。

## 功能特点

- 提供菜品列表API，支持按公司、日期和餐次筛选
- 提供菜品评价提交API，支持批量提交评价
- 自动计算菜品平均评分

## 安装与运行

### 前提条件

- Node.js 14.0 或更高版本
- MySQL 5.7 或更高版本

### 安装步骤

1. 克隆或下载代码到本地

2. 安装依赖
   ```bash
   cd web_dingding_server
   npm install
   ```

3. 配置数据库
   - 创建数据库并导入 `database_schema.sql` 文件
   - 修改 `server.js` 中的数据库连接配置

4. 启动服务
   ```bash
   npm start
   ```
   或者使用开发模式（自动重启）：
   ```bash
   npm run dev
   ```

## API 接口说明

### 获取菜品列表

- **URL**: `/dishes`
- **方法**: GET
- **参数**:
  - `companyId`: 公司ID（必填）
  - `date`: 日期，格式：YYYY-MM-DD（必填）
  - `mealType`: 餐次，可选值：breakfast, lunch（默认：lunch）

### 提交菜品评价

- **URL**: `/evaluations`
- **方法**: POST
- **参数**:
  - `evaluations`: 评价数组，包含多个评价对象
    - `dishId`: 菜品ID
    - `companyId`: 公司ID
    - `rating`: 评分（1-5）
    - `comment`: 评价内容（可选）

## 前端修改说明

1. 将模拟数据替换为真实API调用
2. 优化UI界面，包括：
   - 将早餐/午餐选择改为下拉列表形式
   - 调整日期选择为下拉框
   - 优化菜品类别显示
   - 改进菜品内容排版

## 注意事项

- 确保数据库已正确配置并运行
- 前端API请求地址需要与后端服务地址一致