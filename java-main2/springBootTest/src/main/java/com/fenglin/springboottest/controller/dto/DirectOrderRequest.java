package com.fenglin.springboottest.controller.dto;

import lombok.Data;

import java.util.List;

/**
 * 「立即下单」入参（不经过购物车）：
 *   { restaurantId, restaurantName?, account, addressId?, items: DirectOrderItemDTO[] }
 *
 * 与 OrderCreateRequest 的区别只有 items 的口径：
 *   - items 只带 dishId / qty / specText，金额由后端核价，避免前端改价。
 */
@Data
public class DirectOrderRequest {

    /** 店铺 id（必填） */
    private Long restaurantId;

    /** 店铺名称（冗余展示，缺省取店铺表名称） */
    private String restaurantName;

    /** 下单账号 */
    private String account;

    /**
     * 收货地址 id（user_address.id）。
     * 不传则取该账号的默认地址 / 最早一条；都拿不到 → 「请先填写收货地址，再提交订单」。
     */
    private Long addressId;

    /** 本单菜品（至少一项） */
    private List<DirectOrderItemDTO> items;
}
