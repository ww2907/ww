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

    /** 规格 JSON 字符串：[{name,type,options:[{label,price}]}]，可为空 */
    private String specs;

    /**
     * 所属三级分类 id（分级分类搜索用）。
     * 店铺本身只挂二级业态，顾客选到三级品类时，靠这个字段反查「有该品类菜品的店铺」。
     */
    private Long categoryId;
}
