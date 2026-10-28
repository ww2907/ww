package com.fenglin.springboottest.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;

/**
 * 菜品（后台管理用，对应首页「下单点餐」的菜品数据）。
 */
@Data
@TableName("admin_dish")
public class AdminDish {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String name;

    private BigDecimal price;

    private String emoji;

    private Long categoryId;

    private String description;

    private Integer sort;

    private Boolean enabled;
}
