package com.fenglin.springboottest.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.fenglin.springboottest.entity.Order;
import com.fenglin.springboottest.vo.FrequentFoodVO;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/** 订单主表 Mapper */
public interface OrderMapper extends BaseMapper<Order> {

    /**
     * 按账号聚合「常点食物」：join orders 与 order_item，按菜品分组统计累计数量与点购订单数。
     * 列别名与 FrequentFoodVO 字段一一对应（MyBatis 自动按名称映射）。
     */
    @Select("SELECT oi.dish_id AS dishId, oi.dish_name AS dishName, " +
            "SUM(oi.qty) AS totalQty, COUNT(DISTINCT oi.order_id) AS orderTimes, MAX(oi.price) AS price " +
            "FROM order_item oi JOIN orders o ON oi.order_id = o.id " +
            "WHERE o.account = #{account} " +
            "GROUP BY oi.dish_id, oi.dish_name " +
            "ORDER BY totalQty DESC LIMIT #{limit}")
    List<FrequentFoodVO> selectFrequentFoods(@Param("account") String account, @Param("limit") int limit);

    /** 累计订单数 */
    @Select("SELECT COUNT(*) FROM orders")
    long countOrders();

    /** 营业额：已支付(1)+已完成(2) 的订单总额 */
    @Select("SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE status IN (1, 2)")
    BigDecimal sumGmv();

    /** 今日订单数 */
    @Select("SELECT COUNT(*) FROM orders WHERE DATE(created_at) = CURDATE()")
    long countTodayOrders();

    /** 今日营业额：今日已支付+已完成的订单总额 */
    @Select("SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE status IN (1, 2) AND DATE(created_at) = CURDATE()")
    BigDecimal sumTodayGmv();

    /** 近 14 天订单趋势（按天聚合数量与营业额） */
    @Select("SELECT DATE(created_at) AS orderDate, COUNT(*) AS orderCount, COALESCE(SUM(total_amount), 0) AS gmv " +
            "FROM orders WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 13 DAY) " +
            "GROUP BY DATE(created_at) ORDER BY orderDate")
    List<Map<String, Object>> orderTrendRaw();

    /** 热销菜品 Top5（按累计点购数量倒序） */
    @Select("SELECT oi.dish_name AS dishName, SUM(oi.qty) AS qty, COALESCE(SUM(oi.subtotal), 0) AS amount " +
            "FROM order_item oi JOIN orders o ON oi.order_id = o.id " +
            "GROUP BY oi.dish_name ORDER BY qty DESC LIMIT 5")
    List<Map<String, Object>> topDishesRaw();
}
