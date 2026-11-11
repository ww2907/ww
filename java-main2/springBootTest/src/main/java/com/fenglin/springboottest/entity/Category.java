package com.fenglin.springboottest.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

/**
 * 分类实体，对应数据表 category（三级分类）。
 *
 * 分级分类搜索依赖三个字段：
 *   parentId —— 父子关系，0 表示一级分类
 *   level    —— 层级：1=一级（美食）2=二级（面食/快餐…）3=三级（汤面/拌面…）
 *   path     —— 物化路径，形如 /1/2/8/，子树查询统一用 path LIKE '/1/2/%'，可走 idx_path
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

    /** 排序权重（同级内升序） */
    private Integer sortOrder;

    /** 层级：1=一级 2=二级 3=三级 */
    private Integer level;

    /** 物化路径，形如 /1/2/8/ */
    private String path;

    /** 业务编码，供前后端硬编码引用（如 noodle-soup） */
    private String code;

    /** 分类图标 emoji */
    private String icon;

    /** 是否启用：1=启用 0=停用（停用后不出现在分类树与筛选结果中） */
    private Integer enabled;
}
