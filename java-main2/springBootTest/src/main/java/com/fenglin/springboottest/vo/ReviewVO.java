package com.fenglin.springboottest.vo;

import lombok.Data;

/**
 * 评价展示对象（用户评价）。
 * 字段命名与前端 RestaurantView.vue 的 reviews 渲染保持一致：
 *   id / user / rating / content / date / avatar
 */
@Data
public class ReviewVO {

    private Long id;
    private String user;
    private Integer rating;
    private String content;
    private String date;
    private String avatar;
}
