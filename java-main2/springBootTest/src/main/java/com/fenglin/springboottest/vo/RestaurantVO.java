package com.fenglin.springboottest.vo;

import lombok.Data;

import java.util.List;

/**
 * 店铺列表展示对象（首页推荐 / 搜索结果）。
 * 字段命名与前端 src/api/food.js 的约定保持一致：
 *   id / name / emoji / rating / desc / tags(数组) / distance / cat
 */
@Data
public class RestaurantVO {

    private Long id;
    private String name;
    private String emoji;
    private Double rating;
    private String desc;
    private String cat;
    private String distance;
    private List<String> tags;
}
