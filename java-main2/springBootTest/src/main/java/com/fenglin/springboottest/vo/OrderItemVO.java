package com.fenglin.springboottest.vo;

import lombok.Data;

import java.math.BigDecimal;

/**
 * 订单明细展示对象，字段命名与前端 OrdersView.vue / OrderView.vue 的渲染保持一致。
 */
@Data
public class OrderItemVO {

    /** 菜品 id（快照，可为空；「再来一单」据此复用菜品） */
    private Long dishId;

    private String dishName;

    private BigDecimal price;

    private Integer qty;

    private BigDecimal subtotal;
}
