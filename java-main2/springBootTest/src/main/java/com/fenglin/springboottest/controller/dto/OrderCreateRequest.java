package com.fenglin.springboottest.controller.dto;

import lombok.Data;

import java.util.List;

/**
 * 创建订单入参，与前端 src/api/order.js 的 createOrder 约定一致：
 *   { restaurantId, restaurantName, account, items: OrderItemDTO[] }
 */
@Data
public class OrderCreateRequest {

    /** 店铺 id（必填） */
    private Long restaurantId;

    /** 店铺名称（冗余，便于展示；缺省时取店铺表名称） */
    private String restaurantName;

    /** 下单账号（用于关联订单，允许为空） */
    private String account;

    /** 订单明细（至少一项，数量需 > 0） */
    private List<OrderItemDTO> items;
}
