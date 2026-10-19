package com.fenglin.springboottest.vo;

import lombok.Data;

/**
 * 菜品展示对象（店内美食）。
 * 字段命名与前端 RestaurantView.vue 的 menu 渲染保持一致：
 *   id / name / price / emoji / desc
 */
@Data
public class DishVO {

    private Long id;
    private String name;
    private Double price;
    private String emoji;
    private String desc;
}
