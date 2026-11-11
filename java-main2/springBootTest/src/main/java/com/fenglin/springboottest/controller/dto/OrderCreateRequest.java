package com.fenglin.springboottest.controller.dto;

import lombok.Data;

import java.util.List;

/**
 * 创建订单入参，与前端 src/api/order.js 的 createOrder 约定一致：
 *   { restaurantId, restaurantName, account, items: OrderItemDTO[], addressId? }
 */
@Data
public class OrderCreateRequest {

    /** 店铺 id（必填） */
    private Long restaurantId;

    /** 店铺名称（冗余，便于展示；缺省时取店铺表名称） */
    private String restaurantName;

    /** 下单账号（用于关联订单，允许为空） */
    private String account;

    /**
     * 收货地址 id（user_address.id）。
     * 传了就按该地址下单；没传则自动取该账号的默认地址（无默认取最早一条）。
     * 两条路都拿不到地址 → 下单失败（"请先填写收货地址"），即「没填地址无法完成订单」。
     */
    private Long addressId;

    /** 订单明细（至少一项，数量需 > 0） */
    private List<OrderItemDTO> items;
}
