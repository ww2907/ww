package com.fenglin.springboottest.controller.dto;

import lombok.Data;

/**
 * 「立即下单」（跳过购物车直接下单）的明细项入参。
 *
 * 与 OrderItemDTO 的区别：
 *   - 这里只传 dishId + qty + specText，**不传价格**；
 *     单价由后端按 dish 表的基础价 + 规格加价重新计算，前端传的金额不作数。
 */
@Data
public class DirectOrderItemDTO {

    /** 菜品 id（dish.id，必填） */
    private Long dishId;

    /** 数量（需 > 0） */
    private Integer qty;

    /** 规格文案（如「大份 / 微辣 / 加蛋」，可空；后端据此在 dish.specs 里匹配加价） */
    private String specText;
}
