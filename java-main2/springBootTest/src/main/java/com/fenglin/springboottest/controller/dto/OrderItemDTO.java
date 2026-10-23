package com.fenglin.springboottest.controller.dto;

import lombok.Data;

import java.math.BigDecimal;

/**
 * 下单明细项（前端入参）。
 * 字段命名与前端 src/api/order.js 的 createOrder items 保持一致：
 *   dishId / name / price / qty
 */
@Data
public class OrderItemDTO {

    /** 菜品 id（真实模式下为数字 id，mock 模式下可空） */
    private Long dishId;

    /** 菜品名称 */
    private String name;

    /** 单价 */
    private BigDecimal price;

    /** 数量 */
    private Integer qty;
}
