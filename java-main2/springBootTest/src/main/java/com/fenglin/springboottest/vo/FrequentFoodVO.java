package com.fenglin.springboottest.vo;

import lombok.Data;

import java.math.BigDecimal;

/**
 * 常点食物展示对象：按账号聚合「订单明细」得出，用于「我的」页面的常点食物榜单。
 * 字段命名与前端 ProfileView.vue 的渲染保持一致。
 */
@Data
public class FrequentFoodVO {

    /** 菜品 id（游客单可能为 null） */
    private Long dishId;

    /** 菜品名称（快照） */
    private String dishName;

    /** 累计点购数量 */
    private Integer totalQty;

    /** 点过该菜品的订单数（去重） */
    private Integer orderTimes;

    /** 最近一次单价（快照） */
    private BigDecimal price;
}
