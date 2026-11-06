package com.fenglin.springboottest.vo;

import lombok.Data;

import java.util.List;

/**
 * 菜品展示对象（店内美食）。
 * 字段命名与前端 RestaurantView.vue 的 menu 渲染保持一致：
 *   id / name / price / emoji / desc / specs(规格列表)
 */
@Data
public class DishVO {

    private Long id;
    private String name;
    private Double price;
    private String emoji;
    private String desc;

    /** 规格列表（分量/辣度/加料等），可为空 */
    private List<DishSpecVO> specs;
}
