package com.fenglin.springboottest.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.fenglin.springboottest.entity.Dish;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;
import java.util.Map;

/**
 * 菜品表 dish 的通用 Mapper。
 * 后台的菜品管理 / 价格管理 / 统计也走这里——2026-11-16 起后台不再有独立的 admin_dish 表，
 * 否则「后台改价、前台不动」的问题会一直存在。
 */
@Mapper
public interface DishMapper extends BaseMapper<Dish> {

    /** 在售菜品数（enabled = 1） */
    @Select("SELECT COUNT(*) FROM dish WHERE enabled = 1")
    long countOnSale();

    /** 各分类下的菜品数与价格合计（LEFT JOIN 三级分类，按菜品数倒序） */
    @Select("SELECT COALESCE(c.id, 0) AS categoryId, COALESCE(c.name, '未分类') AS categoryName, " +
            "COUNT(d.id) AS dishCount, COALESCE(SUM(d.price), 0) AS sumPrice " +
            "FROM dish d LEFT JOIN category c ON d.category_id = c.id " +
            "GROUP BY c.id, c.name ORDER BY dishCount DESC")
    List<Map<String, Object>> dishByCategory();

    /** 价格区间分布（0-15 / 15-25 / 25-35 / 35-50 / 50+） */
    @Select("SELECT CASE WHEN price < 15 THEN '0-15' WHEN price < 25 THEN '15-25' " +
            "WHEN price < 35 THEN '25-35' WHEN price < 50 THEN '35-50' ELSE '50+' END AS priceRange, " +
            "COUNT(*) AS dishCount FROM dish GROUP BY priceRange")
    List<Map<String, Object>> priceDistribution();
}
