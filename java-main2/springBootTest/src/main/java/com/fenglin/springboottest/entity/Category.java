package com.fenglin.springboottest.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

/**
 * 分类实体，对应数据表 category。
 * 支持「分级分类」：parent_id 为 0 表示一级分类，非 0 表示其所属父分类。
 */
@Data
@TableName("category")
public class Category {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 分类名称 */
    private String name;

    /** 父分类 id；0 表示顶级分类 */
    private Long parentId;

    /** 排序权重 */
    private Integer sortOrder;
}
