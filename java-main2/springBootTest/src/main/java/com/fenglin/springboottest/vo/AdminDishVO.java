package com.fenglin.springboottest.vo;

import lombok.Data;

import java.math.BigDecimal;

/**
 * 后台「菜品管理 / 价格管理」的视图对象（非数据库实体）。
 *
 * 真实数据在 {@code dish} 表（前台菜单同一张表），这里额外摊平了店铺名与分类名，
 * 让后台表格不用再发请求去翻译 id。字段口径与前端
 * {@code shiguang-food-login/src/views/admin/DishManageView.vue} 的表头一一对应。
 */
@Data
public class AdminDishVO {

    /** 菜品主键（dish.id） */
    private Long id;

    /** 所属店铺 id（新增时必填；菜品按店铺隔离） */
    private Long restaurantId;

    /** 所属店铺名称（只读，便于后台辨认） */
    private String restaurantName;

    /** 菜品名称 */
    private String name;

    /** 价格 */
    private BigDecimal price;

    /** 图标 emoji */
    private String emoji;

    /** 所属三级分类 id */
    private Long categoryId;

    /** 分类名称（只读） */
    private String categoryName;

    /** 描述 */
    private String description;

    /** 排序权重 */
    private Integer sort;

    /** 上架状态：1=上架 0=下架 */
    private Integer enabled;
}
