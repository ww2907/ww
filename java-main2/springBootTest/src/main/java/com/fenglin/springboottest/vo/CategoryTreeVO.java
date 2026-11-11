package com.fenglin.springboottest.vo;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

/**
 * 分级分类树节点（前端级联筛选直接消费这个结构）。
 *
 * 一棵树三层：
 *   L1 美食
 *    └─ L2 面食 / 快餐 / 甜点 / 饮品 / 轻食 / 火锅
 *        └─ L3 汤面 / 拌面 / 馄饨抄手 / 粥粉小食 …
 *
 * 计数口径：restaurantCount 与 dishCount 都是「含子孙分类后」的汇总值，
 * 即点一级分类看到的数量，等于把整棵树里所有店铺 / 菜品加起来去重后的数量。
 */
@Data
public class CategoryTreeVO {

    /** 分类 id（前端筛选传 categoryId 用这个） */
    private Long id;

    /** 分类名称 */
    private String name;

    /** 层级：1/2/3 */
    private Integer level;

    /** 物化路径，形如 /1/2/8/ */
    private String path;

    /** 业务编码，如 noodle-soup */
    private String code;

    /** 图标 emoji */
    private String icon;

    /** 同级排序权重 */
    private Integer sortOrder;

    /** 该分类及其子孙分类下命中的店铺数（去重） */
    private Integer restaurantCount;

    /** 该分类及其子孙分类下的菜品数 */
    private Integer dishCount;

    /** 子分类（三级树：L3 节点为空数组） */
    private List<CategoryTreeVO> children = new ArrayList<>();
}
