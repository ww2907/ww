package com.fenglin.springboottest.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;

/**
 * 菜品实体，对应数据表 dish（店内美食）。
 */
@Data
@TableName("dish")
public class Dish {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 所属店铺 id */
    private Long restaurantId;

    /** 菜品名称 */
    private String name;

    /** 价格 */
    private BigDecimal price;

    /** 图标 emoji */
    private String emoji;

    /** 描述 */
    private String description;

    /** 排序权重 */
    private Integer sort;
}
