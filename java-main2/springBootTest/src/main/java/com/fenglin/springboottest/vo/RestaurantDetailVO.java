package com.fenglin.springboottest.vo;

import lombok.Data;

import java.util.List;

/**
 * 店铺详情展示对象（店内美食 + 用户评价）。
 * 组合 RestaurantVO 的字段 + menu + reviews + avgRating + reviewCount，
 * 与前端 RestaurantView.vue 的 store 结构保持一致。
 */
@Data
public class RestaurantDetailVO {

    private Long id;
    private String name;
    private String emoji;
    private Double rating;
    private String desc;
    private String cat;
    private String distance;
    private List<String> tags;

    /** 店内美食 */
    private List<DishVO> menu;

    /** 用户评价 */
    private List<ReviewVO> reviews;

    /** 平均评分（由评价动态计算） */
    private Double avgRating;

    /** 评价条数 */
    private Integer reviewCount;
}
