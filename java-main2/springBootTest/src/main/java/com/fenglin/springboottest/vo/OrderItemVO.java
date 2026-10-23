package com.fenglin.springboottest.vo;

import lombok.Data;

import java.math.BigDecimal;

/**
 * 订单明细展示对象，字段命名与前端 OrdersView.vue / OrderView.vue 的渲染保持一致。
 */
@Data
public class OrderItemVO {

    private String dishName;

    private BigDecimal price;

    private Integer qty;

    private BigDecimal subtotal;
}
