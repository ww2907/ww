package com.fenglin.springboottest.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 店铺实体，对应数据表 restaurant。
 */
@Data
@TableName("restaurant")
public class Restaurant {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 店铺名称 */
    private String name;

    /** 图标 emoji */
    private String emoji;

    /** 评分（如 4.8） */
    private BigDecimal rating;

    /** 距离文案（如 320m / 1.1km） */
    private String distance;

    /** 所属分类名称（叶子分类，如 面食） */
    private String cat;

    /** 所属分类 id（关联 category 表，用于分级分类搜索） */
    private Long categoryId;

    /** 简介（前端字段名为 desc） */
    private String description;

    /** 标签，逗号分隔存储（前端展示为数组） */
    private String tags;

    /** 排序权重，越大越靠前 */
    private Integer sort;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
