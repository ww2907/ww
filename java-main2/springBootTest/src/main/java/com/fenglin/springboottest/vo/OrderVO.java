package com.fenglin.springboottest.vo;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

/**
 * 订单展示对象，与前端 OrdersView.vue / OrderView.vue 的订单结构保持一致。
 */
@Data
public class OrderVO {

    private Long id;

    private String orderNo;

    private String restaurantName;

    private BigDecimal totalAmount;

    private Integer itemCount;

    /** 订单状态：0=待支付 1=已支付 2=已完成 3=已取消 */
    private Integer status;

    /** 状态中文文案 */
    private String statusText;

    /** 订单明细 */
    private List<OrderItemVO> items;

    /** 创建时间文案（yyyy-MM-dd HH:mm） */
    private String createdAt;
}
