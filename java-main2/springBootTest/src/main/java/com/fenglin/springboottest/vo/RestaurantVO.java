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

    /** 人均价格（元，取店内菜品均价；无菜品时按分类基准价）——供前端「人均最低」排序 */
    private Integer price;

    /** 距离（米，由 distance 文案解析）——供前端「距离最近」排序 */
    private Integer distanceM;

    /** 起送价（元） */
    private Double minOrder;

    /** 配送费（元） */
    private Double deliveryFee;

    /** 预估送达时间文案（如 30分钟） */
    private String eta;

    /** 营业状态：1=营业中 0=已打烊 */
    private Integer openStatus;

    /** 所属二级业态分类 id（分级分类筛选用） */
    private Long categoryId;
}
