package com.fenglin.springboottest.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.fenglin.springboottest.entity.Order;
import com.fenglin.springboottest.vo.FrequentFoodVO;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

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
}
