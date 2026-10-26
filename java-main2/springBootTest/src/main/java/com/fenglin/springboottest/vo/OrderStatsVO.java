package com.fenglin.springboottest.vo;

import lombok.Data;

import java.util.List;

/**
 * 个人中心订单统计：订单次数（按状态分组）+ 常点食物。
 * 对应前端 ProfileView.vue 的「订单次数」与「常点食物」两块。
 */
@Data
public class OrderStatsVO {

    /** 订单总次数 */
    private Integer totalOrders;

    /** 待支付（status=0）次数 */
    private Integer unpaidCount;

    /** 已支付（status=1）次数 */
    private Integer paidCount;

    /** 已完成（status=2）次数 */
    private Integer completedCount;

    /** 已取消（status=3）次数 */
    private Integer cancelledCount;

    /** 常点食物榜单（按累计点购数量倒序，最多 10 条） */
    private List<FrequentFoodVO> frequentFoods;
}
